import express from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Quiz } from '../models/Quiz.js';

const router = express.Router();

function sanitizeQuizForPlayers(quiz) {
  const data = quiz.toObject ? quiz.toObject() : quiz;

  return {
    ...data,
    questions: data.questions.map((question) => ({
      _id: question._id,
      questionText: question.questionText,
      explanation: question.explanation,
      points: question.points,
      negativePoints: question.negativePoints ?? 0,
      options: question.options.map((option) => ({
        _id: option._id,
        text: option.text
      }))
    }))
  };
}

router.get('/', async (req, res, next) => {
  try {
    const showAll = req.query.scope === 'all' && req.user?.role === 'admin';
    const filter = showAll ? {} : { isPublished: true };

    const quizzes = await Quiz.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ quizzes });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };

    if (req.user?.role !== 'admin') {
      filter.isPublished = true;
    }

    const quiz = await Quiz.findOne(filter).populate('createdBy', 'name');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const payload = req.user?.role === 'admin' ? quiz : sanitizeQuizForPlayers(quiz);
    res.json({ quiz: payload });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }
    next(error);
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const slug = req.body.slug?.trim().toLowerCase();

    const quiz = await Quiz.create({
      ...req.body,
      slug,
      createdBy: req.user._id
    });

    res.status(201).json({ quiz });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Slug already exists.' });
    }
    next(error);
  }
});

router.patch('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    // Update basic fields
    if (req.body.title !== undefined) quiz.title = req.body.title;
    if (req.body.slug !== undefined) quiz.slug = req.body.slug.trim().toLowerCase();
    if (req.body.description !== undefined) quiz.description = req.body.description;
    if (req.body.category !== undefined) quiz.category = req.body.category;
    if (req.body.difficulty !== undefined) quiz.difficulty = req.body.difficulty;
    if (req.body.durationInMinutes !== undefined) quiz.durationInMinutes = req.body.durationInMinutes;
    if (typeof req.body.isPublished === 'boolean') quiz.isPublished = req.body.isPublished;

    // Update questions array - clear and rebuild to ensure proper subdocument recognition
    if (Array.isArray(req.body.questions)) {
      quiz.questions = [];
      req.body.questions.forEach((question) => {
        quiz.questions.push({
          questionText: question.questionText,
          explanation: question.explanation,
          points: question.points,
          negativePoints: question.negativePoints || 0,
          options: question.options.map((option) => ({
            text: option.text,
            isCorrect: option.isCorrect
          }))
        });
      });
    }

    await quiz.save();
    res.json({ quiz });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Slug already exists.' });
    }
    next(error);
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    res.json({ message: 'Quiz deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
