import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AttemptHistory, Quiz } from '../models/quiz.model';

const API_URL = 'http://localhost:5000/api';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly http = inject(HttpClient);

  getPublishedQuizzes() {
    return this.http.get<{ quizzes: Quiz[] }>(`${API_URL}/quizzes`);
  }

  getAllQuizzes() {
    return this.http.get<{ quizzes: Quiz[] }>(`${API_URL}/quizzes?scope=all`);
  }

  getQuizById(id: string) {
    return this.http.get<{ quiz: Quiz }>(`${API_URL}/quizzes/${id}`);
  }

  createQuiz(payload: Partial<Quiz>) {
    return this.http.post<{ quiz: Quiz }>(`${API_URL}/quizzes`, payload);
  }

  updateQuiz(id: string, payload: Partial<Quiz>) {
    return this.http.patch<{ quiz: Quiz }>(`${API_URL}/quizzes/${id}`, payload);
  }

  submitAttempt(quizId: string, answers: { questionId: string; selectedOptionId: string | null }[]) {
    return this.http.post<{ attempt: { id: string; score: number; maxScore: number; percentage: number; correctCount: number; wrongCount: number; skippedCount: number; submittedAt: string } }>(
      `${API_URL}/attempts/${quizId}/submit`,
      { answers }
    );
  }

  getAttemptHistory() {
    return this.http.get<{ attempts: AttemptHistory[] }>(`${API_URL}/attempts/me/history`);
  }

  getAdminOverview() {
    return this.http.get<{
      metrics: { totalAttempts: number; totalQuizzes: number };
      recentAttempts: Array<{
        _id: string;
        score: number;
        maxScore: number;
        percentage: number;
        correctCount?: number;
        wrongCount?: number;
        skippedCount?: number;
        submittedAt: string;
        user: { _id: string; name: string };
        quiz: { _id: string; title: string; category: string; difficulty: string };
      }>;
    }>(`${API_URL}/attempts/admin/overview`);
  }

  deleteQuiz(id: string) {
    return this.http.delete<{ message: string }>(`${API_URL}/quizzes/${id}`);
  }

  deleteAttempt(id: string) {
    return this.http.delete<{ message: string; deletedCount: number }>(`${API_URL}/attempts/${id}`);
  }

  deleteStudentAttempts(userId: string) {
    return this.http.delete<{ message: string; deletedCount: number }>(`${API_URL}/attempts/user/${userId}`);
  }

  deleteQuizAttempts(quizId: string) {
    return this.http.delete<{ message: string; deletedCount: number }>(`${API_URL}/attempts/quiz/${quizId}`);
  }
}
