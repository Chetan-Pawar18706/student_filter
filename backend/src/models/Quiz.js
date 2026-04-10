import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true
    },
    options: {
      type: [optionSchema],
      validate: {
        validator(options) {
          return options.length === 4 && options.filter((option) => option.isCorrect).length === 1;
        },
        message: 'Each question must have exactly 4 options and exactly 1 correct option.'
      }
    },
    explanation: {
      type: String,
      default: ''
    },
    points: {
      type: Number,
      default: 1,
      min: 1
    },
    negativePoints: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator(value) {
          if (this.points) {
            return value <= this.points;
          }
          return true;
        },
        message: 'Negative marking cannot be greater than question points.'
      }
    }
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner'
    },
    durationInMinutes: {
      type: Number,
      required: true,
      min: 1
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator(questions) {
          return questions.length > 0;
        },
        message: 'Quiz must contain at least one question.'
      }
    }
  },
  { timestamps: true }
);

export const Quiz = mongoose.model('Quiz', quizSchema);
