import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Attempt } from '../models/Attempt.js';
import { Quiz } from '../models/Quiz.js';

const router = express.Router();

router.post('/:quizId/submit', requireAuth, requireRole('player', 'admin'), async (req, res, next) => {
  try {
    const { answers } = req.body;
    const quiz = await Quiz.findById(req.params.quizId);

    if (!quiz || !quiz.isPublished) {
      return res.status(404).json({ message: 'Quiz not available.' });
    }

    const answerMap = new Map((answers || []).map((answer) => [String(answer.questionId), answer.selectedOptionId]));
    const evaluatedAnswers = [];
    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    quiz.questions.forEach((question) => {
      maxScore += question.points;
      const selectedOptionId = answerMap.get(String(question._id));
      const correctOption = question.options.find((option) => option.isCorrect);
      const isCorrect = selectedOptionId && correctOption ? String(correctOption._id) === String(selectedOptionId) : false;
      const hasAttempted = Boolean(selectedOptionId);
      const negativeMarks = Number(question.negativePoints) || 0;
      const pointsAwarded = isCorrect ? question.points : hasAttempted ? -negativeMarks : 0;
      score += pointsAwarded;

      // Count results
      if (isCorrect) {
        correctCount++;
      } else if (hasAttempted) {
        wrongCount++;
      } else {
        skippedCount++;
      }

      if (selectedOptionId) {
        evaluatedAnswers.push({
          questionId: question._id,
          selectedOptionId,
          isCorrect,
          pointsAwarded
        });
      }
    });

    const percentage = maxScore === 0 ? 0 : Number(((score / maxScore) * 100).toFixed(2));

    const attempt = await Attempt.create({
      user: req.user._id,
      quiz: quiz._id,
      answers: evaluatedAnswers,
      score,
      maxScore,
      percentage,
      correctCount,
      wrongCount,
      skippedCount
    });

    res.status(201).json({
      attempt: {
        id: attempt._id,
        score,
        maxScore,
        percentage,
        correctCount,
        wrongCount,
        skippedCount,
        submittedAt: attempt.submittedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me/history', requireAuth, async (req, res, next) => {
  try {
    const attempts = await Attempt.find({ user: req.user._id })
      .populate('quiz', 'title category difficulty')
      .select('_id score maxScore percentage correctCount wrongCount skippedCount submittedAt quiz user')
      .sort({ submittedAt: -1 });

    // Ensure all attempts have required fields with fallbacks
    const formattedAttempts = attempts.map((attempt) => ({
      _id: attempt._id,
      score: attempt.score || 0,
      maxScore: attempt.maxScore || 0,
      percentage: attempt.percentage || 0,
      correctCount: attempt.correctCount || 0,
      wrongCount: attempt.wrongCount || 0,
      skippedCount: attempt.skippedCount || 0,
      submittedAt: attempt.submittedAt,
      quiz: {
        title: attempt.quiz?.title || 'Unknown Quiz',
        category: attempt.quiz?.category || 'N/A',
        difficulty: attempt.quiz?.difficulty || 'N/A'
      }
    }));

    res.json({ attempts: formattedAttempts });
  } catch (error) {
    console.error('Error in /me/history:', error);
    next(error);
  }
});

router.get('/admin/overview', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const [totalAttempts, totalQuizzes, recentAttempts] = await Promise.all([
      Attempt.countDocuments(),
      Quiz.countDocuments(),
      Attempt.find()
        .populate('user', 'name email')
        .populate('quiz', 'title category difficulty')
        .select('_id score maxScore percentage correctCount wrongCount skippedCount submittedAt user quiz')
        .sort({ submittedAt: -1 })
        .limit(10)
    ]);

    // Transform recentAttempts to match the expected frontend structure
    // Filter out attempts with missing user or quiz data
    const formattedAttempts = recentAttempts
      .filter((attempt) => attempt.user && attempt.quiz) // Skip if user or quiz is missing
      .map((attempt) => ({
        _id: attempt._id,
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        correctCount: attempt.correctCount || 0,
        wrongCount: attempt.wrongCount || 0,
        skippedCount: attempt.skippedCount || 0,
        submittedAt: attempt.submittedAt,
        user: {
          _id: attempt.user._id,
          name: attempt.user.name || 'Unknown User'
        },
        quiz: {
          _id: attempt.quiz._id,
          title: attempt.quiz.title || 'Unknown Quiz',
          category: attempt.quiz.category || 'N/A',
          difficulty: attempt.quiz.difficulty || 'N/A'
        }
      }));

    res.json({
      metrics: {
        totalAttempts,
        totalQuizzes
      },
      recentAttempts: formattedAttempts
    });
  } catch (error) {
    console.error('Error in /admin/overview:', error);
    next(error);
  }
});

// Delete all attempts for a student (must come before generic /:id)
router.delete('/user/:userId', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await Attempt.deleteMany({ user: req.params.userId });

    res.json({ message: `${result.deletedCount} attempt(s) deleted successfully.`, deletedCount: result.deletedCount });
  } catch (error) {
    next(error);
  }
});

// Delete all attempts for a quiz (must come before generic /:id)
router.delete('/quiz/:quizId', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await Attempt.deleteMany({ quiz: req.params.quizId });

    res.json({ message: `${result.deletedCount} attempt(s) deleted successfully.`, deletedCount: result.deletedCount });
  } catch (error) {
    next(error);
  }
});

// Delete a single attempt (must come last)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const attempt = await Attempt.findByIdAndDelete(req.params.id);

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }

    res.json({ message: 'Attempt deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
