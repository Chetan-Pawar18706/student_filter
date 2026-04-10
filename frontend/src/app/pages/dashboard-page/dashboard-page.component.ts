import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AttemptHistory, Quiz } from '../../core/models/quiz.model';
import { QuizService } from '../../core/services/quiz.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <section class="dashboard-hero panel" [class.dashboard-hero-admin]="authService.isAdmin()" [class.dashboard-hero-player]="!authService.isAdmin()">
      <div class="dashboard-hero-copy">
        <span class="eyebrow">Dashboard</span>
        <h1>{{ authService.currentUser()?.name }}, ready for the next {{ authService.isAdmin() ? 'publish cycle' : 'quiz' }}?</h1>
        <p>
          {{
            authService.isAdmin()
              ? 'Manage your quiz inventory, monitor live activity, and keep the platform ready for candidates.'
              : 'Pick your next quiz, track your performance, and continue improving with each attempt.'
          }}
        </p>
      </div>

      <div class="dashboard-hero-actions">
        <a *ngIf="authService.isAdmin()" class="primary-button" routerLink="/admin/quizzes/new">Create New Quiz</a>
        <a *ngIf="!authService.isAdmin() && featuredQuiz()" class="primary-button" [routerLink]="['/quiz', featuredQuiz()!._id]">
          Start Featured Quiz
        </a>
        <div class="dashboard-badges">
          <span>{{ quizzes().length }} {{ authService.isAdmin() ? 'total quizzes' : 'available quizzes' }}</span>
          <span *ngIf="!authService.isAdmin()">{{ attempts().length }} attempts</span>
          <span *ngIf="authService.isAdmin()">{{ adminMetrics().totalAttempts }} total attempts</span>
          <span *ngIf="authService.isAdmin()">{{ publishedQuizCount() }} published</span>
          <span *ngIf="!authService.isAdmin()">Best {{ bestScore() }}%</span>
        </div>
      </div>
    </section>

    <section class="dashboard-stats" *ngIf="!authService.isAdmin(); else adminStats">
      <article class="metric-card dashboard-stat-card dashboard-stat-card-player">
        <span>Available Quizzes</span>
        <strong>{{ quizzes().length }}</strong>
        <p>Fresh quizzes ready to attempt.</p>
      </article>
      <article class="metric-card dashboard-stat-card dashboard-stat-card-player">
        <span>Total Attempts</span>
        <strong>{{ attempts().length }}</strong>
        <p>Your completed quiz submissions.</p>
      </article>
      <article class="metric-card dashboard-stat-card dashboard-stat-card-player">
        <span>Best Score</span>
        <strong>{{ bestScore() }}%</strong>
        <p>Your top performance so far.</p>
      </article>
      <article class="metric-card dashboard-stat-card dashboard-stat-card-player">
        <span>Latest Score</span>
        <strong>{{ latestScore() }}%</strong>
        <p>Your most recent submitted quiz result.</p>
      </article>
    </section>

    <ng-template #adminStats>
      <section class="dashboard-stats dashboard-stats-admin">
        <article class="metric-card dashboard-stat-card dashboard-stat-card-accent">
          <span>Total Quizzes</span>
          <strong>{{ adminMetrics().totalQuizzes }}</strong>
          <p>Full quiz library under your control.</p>
        </article>
        <article class="metric-card dashboard-stat-card">
          <span>Published</span>
          <strong>{{ publishedQuizCount() }}</strong>
          <p>Currently visible to users.</p>
        </article>
        <article class="metric-card dashboard-stat-card">
          <span>Drafts</span>
          <strong>{{ draftQuizCount() }}</strong>
          <p>Quizzes waiting to be published.</p>
        </article>
        <article class="metric-card dashboard-stat-card">
          <span>Total Attempts</span>
          <strong>{{ adminMetrics().totalAttempts }}</strong>
          <p>All submissions across the platform.</p>
        </article>
      </section>
    </ng-template>

    <section class="dashboard-grid dashboard-grid-admin" *ngIf="authService.isAdmin(); else playerGrid">
      <article class="panel dashboard-panel dashboard-panel-wide dashboard-panel-highlight">
        <div class="dashboard-panel-header">
          <div>
            <span class="eyebrow">Operations</span>
            <h2>Admin Control Panel</h2>
            <p class="dashboard-panel-note">Quick actions and live publishing visibility from one place.</p>
          </div>
        </div>

        <div class="admin-action-grid">
          <a class="admin-action-card admin-action-card-primary" routerLink="/admin/quizzes/new">
            <span class="admin-action-kicker">Action</span>
            <strong>Create Quiz</strong>
            <p>Start a fresh quiz with timer, questions, answer key, and scoring.</p>
          </a>
          <div class="admin-action-card">
            <span class="admin-action-kicker">Status</span>
            <strong>Publishing Overview</strong>
            <p>{{ publishedQuizCount() }} published and {{ draftQuizCount() }} draft quizzes in the library.</p>
          </div>
          <div class="admin-action-card">
            <span class="admin-action-kicker">Live Feed</span>
            <strong>Latest Activity</strong>
            <p>{{ latestAttemptSummary() }}</p>
          </div>
        </div>
      </article>

      <article class="panel dashboard-panel dashboard-panel-library">
        <div class="dashboard-panel-header">
          <div>
            <span class="eyebrow">Quiz Zone</span>
            <h2>Quiz Library</h2>
            <p class="dashboard-panel-note">Preview, edit, activate, or deactivate any quiz directly from here.</p>
          </div>
          <span class="dashboard-counter">{{ quizzes().length }}</span>
        </div>

        <p class="error" *ngIf="actionError()">{{ actionError() }}</p>

        <div class="dashboard-quiz-list" *ngIf="quizzes().length; else noQuizState">
          <div class="quiz-card dashboard-quiz-card dashboard-quiz-card-admin" *ngFor="let quiz of quizzes()">
            <div class="dashboard-quiz-main">
              <div>
                <h3>{{ quiz.title }}</h3>
                <p>{{ quiz.description || 'No description added for this quiz yet.' }}</p>
              </div>
              <div class="quiz-meta">
                <span>Category: {{ quiz.category }}</span>
                <span>Level: {{ quiz.difficulty }}</span>
                <span>Duration: {{ quiz.durationInMinutes }} min</span>
                <span>Questions: {{ quiz.questions.length }}</span>
                <span class="status-badge" [class.status-live]="quiz.isPublished">{{ quiz.isPublished ? 'Published' : 'Draft' }}</span>
              </div>
            </div>
            <div class="quiz-actions quiz-actions-admin">
              <button class="secondary-button" type="button" (click)="toggleQuizStatus(quiz)" [disabled]="togglingQuizId() === quiz._id">
                {{ togglingQuizId() === quiz._id ? 'Updating...' : quiz.isPublished ? 'Deactivate' : 'Activate' }}
              </button>
              <a class="primary-button" [routerLink]="['/quiz', quiz._id]">Preview Quiz</a>
              <a class="ghost-button" [routerLink]="['/admin/quizzes', quiz._id, 'edit']">Edit Quiz</a>
              <button class="danger-button" type="button" (click)="deleteQuiz(quiz)" [disabled]="deletingQuizId() === quiz._id">
                {{ deletingQuizId() === quiz._id ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>

        <ng-template #noQuizState>
          <div class="dashboard-empty">
            <h3>No quizzes available yet</h3>
            <p class="muted">Once quizzes are added, they will appear here.</p>
          </div>
        </ng-template>
      </article>

      <article class="panel dashboard-panel dashboard-panel-activity">
        <div class="dashboard-panel-header">
          <div>
            <span class="eyebrow">Activity</span>
            <h2>Recent Attempts</h2>
            <p class="dashboard-panel-note">Latest candidate submissions and score snapshots.</p>
          </div>
        </div>

        <div class="attempt-search" *ngIf="recentAttempts().length">
          <input 
            type="text" 
            placeholder="Search by student name, exam name, category, level, or date..." 
            [value]="adminAttemptSearchQuery()"
            (input)="onSearchChange($event, false)"
            class="search-input"
          />
          <div class="search-actions">
            <span class="search-count">{{ filteredRecentAttempts().length }} of {{ recentAttempts().length }}</span>
            <button type="button" class="search-apply-btn" (click)="applySearch(false)">
              Apply
            </button>
            <button type="button" class="search-clear-btn" (click)="clearSearch(false)" [disabled]="!appliedAdminAttemptSearchQuery()">
              Clear
            </button>
          </div>
        </div>

        <div class="dashboard-history-list" *ngIf="recentAttempts().length; else noAdminAttemptsState">
          <div *ngFor="let item of filteredRecentAttempts()" class="attempt-row dashboard-history-row dashboard-history-row-admin">
            <div class="attempt-info">
              <strong>{{ item.quiz.title }}</strong>
              <span>{{ item.user.name }}</span>
            </div>
            <div class="dashboard-history-meta">
              <span class="score-pill">{{ item.percentage }}%</span>
              <div class="attempt-breakdown">
                  <span class="breakdown-item breakdown-correct">✓ {{ item.correctCount }}</span>
                  <span class="breakdown-item breakdown-wrong">✕ {{ item.wrongCount }}</span>
                  <span class="breakdown-item breakdown-skipped">- {{ item.skippedCount }}</span>
                </div>
              <span class="muted">{{ formatDate(item.submittedAt) }}</span>
            </div>
            <button class="danger-button" type="button" (click)="deleteAttempt(item._id)" [disabled]="deletingAttemptId() === item._id" class="attempt-delete-btn">
              {{ deletingAttemptId() === item._id ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>

        <ng-template #noAdminAttemptsState>
          <div class="dashboard-empty">
            <h3>No attempts recorded yet</h3>
            <p class="muted">Attempt activity will start appearing here once users submit quizzes.</p>
          </div>
        </ng-template>
      </article>
    </section>

    <ng-template #playerGrid>
      <section class="dashboard-grid dashboard-grid-player">
        <article class="panel dashboard-panel dashboard-panel-wide dashboard-panel-highlight dashboard-panel-player-focus" *ngIf="featuredQuiz() as quiz; else playerEmptyHighlight">
          <div class="dashboard-panel-header">
            <div>
              <span class="eyebrow">Recommended</span>
              <h2>{{ quiz.title }}</h2>
              <p class="dashboard-panel-note">Start from this quiz if you want a quick next attempt.</p>
            </div>
            <span class="dashboard-counter">{{ quiz.questions.length }} Q</span>
          </div>

          <div class="player-focus-grid">
            <div class="player-focus-copy">
              <p>{{ quiz.description || 'No description added for this quiz yet.' }}</p>
              <div class="quiz-meta player-meta">
                <span>Category: {{ quiz.category }}</span>
                <span>Level: {{ quiz.difficulty }}</span>
                <span>Duration: {{ quiz.durationInMinutes }} min</span>
              </div>
            </div>
            <div class="player-focus-actions">
              <a class="primary-button" [routerLink]="['/quiz', quiz._id]">Start Quiz</a>
              <span class="player-focus-note">Best score: {{ bestScore() }}% • Latest score: {{ latestScore() }}%</span>
            </div>
          </div>
        </article>

        <ng-template #playerEmptyHighlight>
          <article class="panel dashboard-panel dashboard-panel-wide dashboard-empty">
            <h3>No quizzes available yet</h3>
            <p class="muted">Once quizzes are published, they will appear here for users.</p>
          </article>
        </ng-template>

        <article class="panel dashboard-panel dashboard-panel-player-list">
          <div class="dashboard-panel-header">
            <div>
              <span class="eyebrow">Quiz Zone</span>
              <h2>Available Quizzes</h2>
              <p class="dashboard-panel-note">Choose a quiz based on topic, level, time, and total questions.</p>
            </div>
            <span class="dashboard-counter">{{ quizzes().length }}</span>
          </div>

          <div class="dashboard-quiz-list dashboard-quiz-list-player" *ngIf="quizzes().length; else noPlayerQuizState">
            <div class="quiz-card dashboard-quiz-card dashboard-quiz-card-player" *ngFor="let quiz of quizzes()">
              <div class="dashboard-quiz-main">
                <div>
                  <h3>{{ quiz.title }}</h3>
                  <p>{{ quiz.description || 'No description added for this quiz yet.' }}</p>
                </div>
                <div class="quiz-meta">
                  <span>Category: {{ quiz.category }}</span>
                  <span>Level: {{ quiz.difficulty }}</span>
                  <span>Duration: {{ quiz.durationInMinutes }} min</span>
                  <span>Questions: {{ quiz.questions.length }}</span>
                </div>
              </div>
              <div class="quiz-actions quiz-actions-player">
                <a class="primary-button" [routerLink]="['/quiz', quiz._id]">Start Quiz</a>
              </div>
            </div>
          </div>

          <ng-template #noPlayerQuizState>
            <div class="dashboard-empty">
              <h3>No quizzes available yet</h3>
              <p class="muted">Once quizzes are added, they will appear here.</p>
            </div>
          </ng-template>
        </article>

        <article class="panel dashboard-panel dashboard-panel-player-history">
          <div class="dashboard-panel-header">
            <div>
              <span class="eyebrow">Performance</span>
              <h2>Your Attempt History</h2>
              <p class="dashboard-panel-note">Review your previous scores and keep track of improvement.</p>
            </div>
          </div>

          <div class="attempt-search" *ngIf="attempts().length">
            <input 
              type="text" 
              placeholder="Search by exam name, category, level, or date..." 
              [value]="attemptSearchQuery()"
              (input)="onSearchChange($event, true)"
              class="search-input"
            />
            <div class="search-actions">
              <span class="search-count">{{ filteredAttempts().length }} of {{ attempts().length }}</span>
              <button type="button" class="search-apply-btn" (click)="applySearch(true)">
                Apply
              </button>
              <button type="button" class="search-clear-btn" (click)="clearSearch(true)" [disabled]="!appliedAttemptSearchQuery()">
                Clear
              </button>
            </div>
          </div>

          <div class="dashboard-history-list" *ngIf="attempts().length; else noAttemptsState">
            <div *ngFor="let attempt of filteredAttempts()" class="attempt-row dashboard-history-row dashboard-history-row-player">
              <div class="attempt-info">
                <strong>{{ attempt.quiz.title }}</strong>
                <span>{{ attempt.quiz.category }} • {{ attempt.quiz.difficulty }}</span>
              </div>
              <div class="dashboard-history-meta">
                <span class="score-pill">{{ attempt.score }}/{{ attempt.maxScore }} ({{ attempt.percentage }}%)</span>
                <div class="attempt-breakdown">
                  <span class="breakdown-item breakdown-correct">✓ {{ attempt.correctCount }}</span>
                  <span class="breakdown-item breakdown-wrong">✕ {{ attempt.wrongCount }}</span>
                  <span class="breakdown-item breakdown-skipped">- {{ attempt.skippedCount }}</span>
                </div>
                <span class="muted">{{ formatDate(attempt.submittedAt) }}</span>
              </div>
            </div>
          </div>

          <ng-template #noAttemptsState>
            <div class="dashboard-empty">
              <h3>No attempts yet</h3>
              <p class="muted">Start a quiz to see your scores and progress here.</p>
            </div>
          </ng-template>
        </article>
      </section>
    </ng-template>
  `,
  styles: [
    `
      .dashboard-hero,
      .dashboard-panel,
      .dashboard-stat-card,
      .dashboard-empty,
      .dashboard-quiz-card,
      .dashboard-history-row,
      .admin-action-card {
        border-radius: 26px;
      }

      .dashboard-hero {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.8fr);
        gap: 1.5rem;
        align-items: center;
        margin-bottom: 1.5rem;
      }

      .dashboard-hero-admin {
        background: linear-gradient(135deg, rgba(255, 250, 244, 0.96), rgba(247, 236, 220, 0.95));
      }

      .dashboard-hero-player {
        background: linear-gradient(135deg, rgba(255, 251, 245, 0.98), rgba(244, 248, 242, 0.9));
      }

      .dashboard-hero-copy h1,
      .dashboard-panel-header h2 {
        margin: 0.35rem 0 0.75rem;
      }

      .dashboard-hero-copy p,
      .dashboard-stat-card p,
      .dashboard-empty p,
      .dashboard-quiz-card p,
      .admin-action-card p,
      .dashboard-panel-note,
      .player-focus-note {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }

      .dashboard-hero-actions {
        display: grid;
        gap: 1rem;
        justify-items: end;
      }

      .dashboard-badges {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .dashboard-badges span,
      .dashboard-counter,
      .status-badge {
        padding: 0.55rem 0.85rem;
        border-radius: 999px;
        background: rgba(31, 41, 51, 0.08);
        font-weight: 600;
      }

      .status-live {
        background: rgba(11, 139, 97, 0.14);
        color: var(--success);
      }

      .dashboard-stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .dashboard-stat-card {
        background: rgba(255, 250, 244, 0.92);
        min-height: 170px;
      }

      .dashboard-stat-card-player {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(247, 242, 234, 0.92));
      }

      .dashboard-stat-card-accent {
        background: linear-gradient(180deg, rgba(239, 124, 83, 0.16), rgba(255, 250, 244, 0.92));
      }

      .dashboard-stat-card span {
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.78rem;
        font-weight: 700;
      }

      .dashboard-stat-card strong {
        display: block;
        margin: 0.45rem 0;
        font-size: 2.2rem;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1.5rem;
      }

      .dashboard-grid-admin {
        grid-template-columns: minmax(0, 1.45fr) minmax(340px, 0.95fr);
        align-items: start;
      }

      .dashboard-grid-player {
        grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
        align-items: start;
      }

      .dashboard-panel {
        display: grid;
        gap: 1.25rem;
        padding: 1.6rem;
      }

      .dashboard-panel-highlight {
        background: linear-gradient(180deg, rgba(255, 249, 240, 0.98), rgba(255, 255, 255, 0.74));
      }

      .dashboard-panel-player-focus {
        background: linear-gradient(140deg, rgba(255, 249, 239, 0.98), rgba(241, 248, 240, 0.86));
      }

      .dashboard-panel-library,
      .dashboard-panel-player-list,
      .dashboard-panel-player-history,
      .dashboard-panel-activity {
        display: grid;
        grid-template-columns: 1fr;
        auto-rows: max-content;
        gap: 1rem;
        align-content: start;
      }

      .attempt-search {
        display: grid;
        grid-template-columns: 1fr auto auto auto;
        gap: 0.75rem;
        align-items: center;
        padding: 0.75rem 0;
        margin-bottom: 0.5rem;
        border-bottom: 1px solid rgba(31, 41, 51, 0.08);
      }

      .search-actions {
        display: contents;
      }

      .search-input {
        padding: 0.6rem 0.9rem;
        border: 1px solid rgba(31, 41, 51, 0.12);
        border-radius: 12px;
        font-size: 0.95rem;
        background: rgba(255, 255, 255, 0.8);
        font-family: inherit;
      }

      .search-input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(239, 124, 83, 0.1);
      }

      .search-count {
        font-size: 0.85rem;
        color: var(--muted);
        font-weight: 600;
        white-space: nowrap;
      }

      .search-clear-btn {
        padding: 0.5rem 0.85rem;
        border: 1px solid rgba(31, 41, 51, 0.15);
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        background: rgba(31, 41, 51, 0.05);
        color: var(--muted);
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;
      }

      .search-clear-btn:hover:not(:disabled) {
        background: rgba(31, 41, 51, 0.1);
        border-color: rgba(31, 41, 51, 0.2);
        color: var(--text);
      }

      .search-clear-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .search-apply-btn {
        padding: 0.5rem 0.85rem;
        border: 1px solid var(--accent);
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        background: rgba(239, 124, 83, 0.15);
        color: var(--accent);
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;
      }

      .search-apply-btn:hover {
        background: rgba(239, 124, 83, 0.25);
        border-color: var(--accent);
      }

      .search-apply-btn:active {
        transform: scale(0.98);
      }

      .dashboard-history-list {
        overflow-y: auto;
        display: grid;
        gap: 0.5rem;
        padding-right: 0.5rem;
        max-height: 400px;
      }

      .dashboard-history-list::-webkit-scrollbar {
        width: 6px;
      }

      .dashboard-history-list::-webkit-scrollbar-track {
        background: rgba(31, 41, 51, 0.05);
        border-radius: 10px;
      }

      .dashboard-history-list::-webkit-scrollbar-thumb {
        background: rgba(31, 41, 51, 0.2);
        border-radius: 10px;
      }

      .dashboard-history-list::-webkit-scrollbar-thumb:hover {
        background: rgba(31, 41, 51, 0.3);
      }

      .dashboard-panel-wide {
        grid-column: 1 / -1;
      }

      .dashboard-panel-header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
        flex-wrap: wrap;
        padding-bottom: 0.4rem;
        border-bottom: 1px solid rgba(31, 41, 51, 0.08);
      }

      .admin-action-grid,
      .dashboard-quiz-list,
      .dashboard-history-list,
      .player-focus-grid {
        display: grid;
        gap: 1rem;
      }

      .admin-action-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .player-focus-grid {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
      }

      .player-focus-copy {
        display: grid;
        gap: 1rem;
      }

      .player-focus-actions {
        display: grid;
        gap: 0.75rem;
        justify-items: end;
      }

      .player-meta {
        justify-content: flex-start;
      }

      .admin-action-card {
        display: grid;
        gap: 0.6rem;
        padding: 1.25rem;
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid rgba(31, 41, 51, 0.08);
        min-height: 168px;
      }

      .admin-action-card-primary {
        background: linear-gradient(160deg, rgba(239, 124, 83, 0.18), rgba(255, 255, 255, 0.78));
      }

      .admin-action-kicker {
        font-size: 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--accent-dark);
        font-weight: 700;
      }

      .dashboard-quiz-list-player {
        gap: 1.1rem;
      }

      .dashboard-quiz-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 1rem;
        align-items: center;
        padding: 1.25rem;
        background: rgba(255, 255, 255, 0.68);
      }

      .dashboard-quiz-card-admin {
        border: 1px solid rgba(31, 41, 51, 0.08);
      }

      .dashboard-quiz-card-player {
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(31, 41, 51, 0.08);
      }

      .dashboard-quiz-main {
        display: grid;
        gap: 0.9rem;
      }

      .dashboard-quiz-card h3,
      .dashboard-empty h3,
      .admin-action-card strong {
        margin: 0 0 0.45rem;
      }

      .quiz-actions-admin,
      .quiz-actions-player {
        display: grid;
        gap: 0.65rem;
      }

      .quiz-actions-admin {
        justify-items: end;
      }

      .quiz-actions-admin > *,
      .quiz-actions-player > * {
        min-width: 140px;
      }

      .dashboard-history-row {
        justify-content: space-between;
        padding: 1rem 1.1rem;
        background: rgba(255, 255, 255, 0.64);
        border: 1px solid rgba(31, 41, 51, 0.08);
      }

      .dashboard-history-row-admin {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 1rem;
        min-height: 125px;
        align-items: center;
      }

      .dashboard-history-row-player {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 1rem;
      
        min-height: 125px;
        align-items: center;
      }

      .attempt-info {
        display: grid;
        gap: 0.25rem;
      }

      .dashboard-history-row strong,
      .dashboard-history-row span {
        display: block;
      }

      .dashboard-history-meta {
        display: grid;
        gap: 0.45rem;
        justify-items: end;
        white-space: nowrap;
      }

      .attempt-delete-btn {
        white-space: nowrap;
        padding: 0.5rem 1rem !important;
      }

      .attempt-breakdown {
        display: flex;
        gap: 0.75rem;
        font-size: 0.9rem;
        font-weight: 600;
      }

      .breakdown-item {
        padding: 0.35rem 0.65rem;
        border-radius: 8px;
        white-space: nowrap;
      }

      .breakdown-correct {
        background: rgba(88, 179, 104, 0.15);
        color: #58b368;
      }

      .breakdown-wrong {
        background: rgba(239, 107, 99, 0.15);
        color: #ef6b63;
      }

      .breakdown-skipped {
        background: rgba(106, 169, 255, 0.15);
        color: #6aa9ff;
      }

      .dashboard-empty {
        display: grid;
        place-items: center;
        text-align: center;
        min-height: 220px;
        background: rgba(255, 255, 255, 0.5);
        border: 1px dashed rgba(31, 41, 51, 0.14);
      }

      @media (max-width: 1180px) {
        .dashboard-hero,
        .dashboard-stats,
        .admin-action-grid,
        .dashboard-grid-player {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .dashboard-grid-admin {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 900px) {
        .dashboard-hero,
        .dashboard-stats,
        .admin-action-grid,
        .dashboard-grid,
        .dashboard-quiz-card,
        .player-focus-grid {
          grid-template-columns: 1fr;
        }

        .dashboard-hero-actions,
        .dashboard-history-meta,
        .quiz-actions-admin,
        .player-focus-actions {
          justify-items: start;
        }

        .dashboard-badges {
          justify-content: flex-start;
        }

        .quiz-actions-admin > *,
        .quiz-actions-player > * {
          width: 100%;
        }
      }

      @media (max-width: 640px) {
        .dashboard-panel,
        .dashboard-hero,
        .dashboard-stat-card,
        .dashboard-empty,
        .dashboard-quiz-card,
        .dashboard-history-row,
        .admin-action-card {
          padding: 1.1rem;
          border-radius: 22px;
        }

        .dashboard-stats,
        .admin-action-grid,
        .dashboard-grid,
        .dashboard-grid-player {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class DashboardPageComponent {
  readonly authService = inject(AuthService);
  private readonly quizService = inject(QuizService);

  readonly quizzes = signal<Quiz[]>([]);
  readonly attempts = signal<AttemptHistory[]>([]);
  readonly attemptSearchQuery = signal('');
  readonly appliedAttemptSearchQuery = signal('');
  readonly adminAttemptSearchQuery = signal('');
  readonly appliedAdminAttemptSearchQuery = signal('');
  readonly adminMetrics = signal({ totalAttempts: 0, totalQuizzes: 0 });
  readonly recentAttempts = signal<Array<{
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
  }>>([]);
  readonly togglingQuizId = signal<string | null>(null);
  readonly deletingQuizId = signal<string | null>(null);
  readonly deletingAttemptId = signal<string | null>(null);
  readonly actionError = signal('');
  readonly featuredQuiz = computed(() => this.quizzes()[0] ?? null);
  readonly publishedQuizCount = computed(() => this.quizzes().filter((quiz) => quiz.isPublished).length);
  readonly draftQuizCount = computed(() => this.quizzes().filter((quiz) => !quiz.isPublished).length);
  readonly bestScore = computed(() => (this.attempts().length ? Math.max(...this.attempts().map((attempt) => attempt.percentage)) : 0));
  readonly latestScore = computed(() => (this.attempts()[0]?.percentage ?? 0));
  readonly averageScore = computed(() => {
    if (!this.attempts().length) {
      return 0;
    }

    const total = this.attempts().reduce((sum, attempt) => sum + attempt.percentage, 0);
    return Math.round(total / this.attempts().length);
  });
  readonly latestAttemptSummary = computed(() => {
    const latest = this.recentAttempts()[0];
    if (!latest) {
      return 'No recent submissions yet.';
    }

    return `${latest.user.name} scored ${latest.percentage}% in ${latest.quiz.title}.`;
  });

  readonly filteredAttempts = computed(() => {
    const query = this.appliedAttemptSearchQuery().toLowerCase().trim();
    if (!query) {
      return this.attempts();
    }

    return this.attempts().filter((attempt) => {
      if (!attempt || !attempt.quiz) {
        return false;
      }
      
      try {
        const quizTitle = (attempt.quiz.title || '').toLowerCase();
        const category = (attempt.quiz.category || '').toLowerCase();
        const difficulty = (attempt.quiz.difficulty || '').toLowerCase();
        
        const attemptDate = new Date(attempt.submittedAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).toLowerCase();
        
        // Search in title, category, difficulty, and date
        return quizTitle.includes(query) || 
               category.includes(query) || 
               difficulty.includes(query) || 
               attemptDate.includes(query);
      } catch (error) {
        console.error('Error filtering attempt:', error);
        return false;
      }
    });
  });

  readonly filteredRecentAttempts = computed(() => {
    const query = this.appliedAdminAttemptSearchQuery().toLowerCase().trim();
    if (!query) {
      return this.recentAttempts();
    }

    return this.recentAttempts().filter((attempt) => {
      if (!attempt || !attempt.quiz || !attempt.user) {
        console.warn('Attempt missing required fields:', attempt);
        return false;
      }

      try {
        const quizTitle = (attempt.quiz.title || '').toLowerCase();
        const studentName = (attempt.user.name || '').toLowerCase();
        const category = (attempt.quiz.category || '').toLowerCase();
        const difficulty = (attempt.quiz.difficulty || '').toLowerCase();
        
        // Format date the same way it's displayed
        const attemptDate = new Date(attempt.submittedAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).toLowerCase();
        
        // Log for debugging (remove in production)
        if (quizTitle.includes(query) || studentName.includes(query) || 
            category.includes(query) || difficulty.includes(query) || 
            attemptDate.includes(query)) {
          console.log('Match found - Title:', quizTitle, 'Name:', studentName, 'Date:', attemptDate);
        }
        
        return quizTitle.includes(query) || 
               studentName.includes(query) || 
               category.includes(query) || 
               difficulty.includes(query) || 
               attemptDate.includes(query);
      } catch (error) {
        console.error('Error filtering recent attempt:', error, attempt);
        return false;
      }
    });
  });

  constructor() {
    if (this.authService.isAdmin()) {
      this.quizService.getAllQuizzes().subscribe((response) => this.quizzes.set(response.quizzes));
      this.quizService.getAdminOverview().subscribe((response) => {
        this.adminMetrics.set(response.metrics);
        this.recentAttempts.set(response.recentAttempts);
      });
    } else {
      this.quizService.getPublishedQuizzes().subscribe((response) => this.quizzes.set(response.quizzes));
      this.quizService.getAttemptHistory().subscribe((response) => this.attempts.set(response.attempts));
    }
  }

  toggleQuizStatus(quiz: Quiz): void {
    if (!quiz._id || this.togglingQuizId()) {
      return;
    }

    this.actionError.set('');
    this.togglingQuizId.set(quiz._id);

    this.quizService.updateQuiz(quiz._id, { isPublished: !quiz.isPublished }).subscribe({
      next: ({ quiz: updatedQuiz }) => {
        this.quizzes.update((quizzes) => quizzes.map((item) => (item._id === updatedQuiz._id ? updatedQuiz : item)));
        this.togglingQuizId.set(null);
      },
      error: (error: any) => {
        this.actionError.set(error.error?.message ?? 'Unable to update quiz status.');
        this.togglingQuizId.set(null);
      }
    });
  }

  deleteQuiz(quiz: Quiz): void {
    if (!quiz._id || this.deletingQuizId() || !confirm(`Are you sure you want to delete "${quiz.title}"? This action cannot be undone.`)) {
      return;
    }

    this.actionError.set('');
    this.deletingQuizId.set(quiz._id);

    this.quizService.deleteQuiz(quiz._id).subscribe({
      next: () => {
        this.quizzes.update((quizzes) => quizzes.filter((item) => item._id !== quiz._id));
        this.deletingQuizId.set(null);
      },
      error: (error: any) => {
        this.actionError.set(error.error?.message ?? 'Unable to delete quiz.');
        this.deletingQuizId.set(null);
      }
    });
  }

  deleteAttempt(attemptId: string): void {
    if (!attemptId || this.deletingAttemptId() || !confirm('Are you sure you want to delete this attempt? This action cannot be undone.')) {
      return;
    }

    this.actionError.set('');
    this.deletingAttemptId.set(attemptId);

    this.quizService.deleteAttempt(attemptId).subscribe({
      next: () => {
        // Update student attempts (player view)
        this.attempts.update((attempts) => attempts.filter((item) => item._id !== attemptId));
        
        // Update admin recent attempts (admin view)
        this.recentAttempts.update((attempts) => attempts.filter((item) => item._id !== attemptId));
        
        // Update metrics
        this.adminMetrics.update((metrics) => ({
          ...metrics,
          totalAttempts: Math.max(0, metrics.totalAttempts - 1)
        }));
        
        this.deletingAttemptId.set(null);
      },
      error: (error: any) => {
        this.actionError.set(error.error?.message ?? 'Unable to delete attempt.');
        this.deletingAttemptId.set(null);
      }
    });
  }

  onSearchChange(event: Event, isStudentSearch: boolean): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    if (isStudentSearch) {
      this.attemptSearchQuery.set(value);
    } else {
      this.adminAttemptSearchQuery.set(value);
    }
  }

  applySearch(isStudentSearch: boolean): void {
    try {
      if (isStudentSearch) {
        const searchValue = this.attemptSearchQuery().trim();
        
        // Debug logging
        console.log('=== STUDENT SEARCH DEBUG ===');
        console.log('Search query entered:', searchValue);
        console.log('Total attempts available:', this.attempts().length);
        if (this.attempts().length > 0) {
          console.log('First attempt structure:', this.attempts()[0]);
        }
        console.log('All attempts:', this.attempts());
        
        this.appliedAttemptSearchQuery.set(searchValue);
        
        console.log('Query now set to:', this.appliedAttemptSearchQuery());
        console.log('Filtered results count:', this.filteredAttempts().length);
        console.log('Filtered results:', this.filteredAttempts());
        console.log('=== END STUDENT SEARCH DEBUG ===\n');
      } else {
        const searchValue = this.adminAttemptSearchQuery().trim();
        
        // Debug logging
        console.log('=== ADMIN SEARCH DEBUG ===');
        console.log('Search query entered:', searchValue);
        console.log('Total recent attempts available:', this.recentAttempts().length);
        if (this.recentAttempts().length > 0) {
          console.log('First recent attempt structure:', this.recentAttempts()[0]);
          console.log('Quiz data in first attempt:', this.recentAttempts()[0].quiz);
          console.log('User data in first attempt:', this.recentAttempts()[0].user);
        }
        console.log('All recent attempts:', this.recentAttempts());
        
        this.appliedAdminAttemptSearchQuery.set(searchValue);
        
        console.log('Query now set to:', this.appliedAdminAttemptSearchQuery());
        console.log('Filtered results count:', this.filteredRecentAttempts().length);
        console.log('Filtered results:', this.filteredRecentAttempts());
        console.log('=== END ADMIN SEARCH DEBUG ===\n');
      }
    } catch (error) {
      console.error('Error in applySearch:', error);
    }
  }

  clearSearch(isStudentSearch: boolean): void {
    if (isStudentSearch) {
      this.attemptSearchQuery.set('');
      this.appliedAttemptSearchQuery.set('');
    } else {
      this.adminAttemptSearchQuery.set('');
      this.appliedAdminAttemptSearchQuery.set('');
    }
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}