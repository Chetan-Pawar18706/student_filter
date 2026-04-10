export interface QuizOption {
  _id?: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  _id?: string;
  questionText: string;
  options: QuizOption[];
  explanation: string;
  points: number;
  negativePoints: number;
}

export interface Quiz {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  durationInMinutes: number;
  isPublished: boolean;
  questions: QuizQuestion[];
  createdBy?: {
    name: string;
    email?: string;
  };
}

export interface AttemptHistory {
  _id: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  submittedAt: string;
  quiz: {
    title: string;
    category: string;
    difficulty: string;
  };
}
