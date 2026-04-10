import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    selectedOptionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    pointsAwarded: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true
    },
    answers: {
      type: [answerSchema],
      default: []
    },
    score: {
      type: Number,
      required: true
    },
    maxScore: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    correctCount: {
      type: Number,
      default: 0
    },
    wrongCount: {
      type: Number,
      default: 0
    },
    skippedCount: {
      type: Number,
      default: 0
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export const Attempt = mongoose.model('Attempt', attemptSchema);
