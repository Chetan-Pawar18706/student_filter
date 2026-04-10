import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Quiz } from '../../core/models/quiz.model';
import { AuthService } from '../../core/services/auth.service';
import { QuizService } from '../../core/services/quiz.service';

interface QuestionUiState {
  visited: boolean;
  answered: boolean;
  markedForReview: boolean;
  submittedWithoutAnswer: boolean;
}

@Component({
  selector: 'app-quiz-play-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="exam-shell" *ngIf="quiz(); else loadingState">
      <ng-container *ngIf="!result(); else resultState">
        <header class="exam-topbar">
          <div class="topbar-block topbar-candidate">
            <span class="topbar-label">Candidate Name</span>
            <strong>{{ candidateName() }}</strong>
          </div>
          <div class="topbar-block topbar-title">
            <span class="topbar-label">Exam Name</span>
            <h1>{{ quiz()!.title }}</h1>
                <span class="eyebrow">{{ quiz()!.category }} | {{ quiz()!.difficulty }}</span>
          </div>
          <div class="topbar-block topbar-actions">
            <div class="timer-chip">{{ formattedTimeLeft() }}</div>
            <button class="secondary-button palette-toggle" type="button" (click)="togglePalette()">
              {{ isPaletteOpen() ? 'Hide' : 'Show' }} Question Palette
            </button>
          </div>
        </header>

        <div class="exam-layout" [class.exam-layout-full]="!isPaletteOpen()">
          <aside class="palette-panel" [class.palette-panel-hidden]="!isPaletteOpen()">
            <div class="palette-header">
              <div>
                <span class="eyebrow">Question Palette</span>
                <p>Jump to any question and track progress live.</p>
              </div>
              <button class="ghost-button palette-close" type="button" (click)="togglePalette()">Close</button>
            </div>

            <div class="palette-grid">
              <button
                *ngFor="let question of quiz()!.questions; let index = index"
                type="button"
                class="palette-button"
                [ngClass]="paletteClass(index)"
                [class.is-current]="index === currentQuestionIndex()"
                [disabled]="!canAccessQuestion(index)"
                (click)="goToQuestion(index)"
              >
                {{ index + 1 }}
              </button>
            </div>

            <div class="palette-legend">
              <div class="legend-row"><span class="legend-swatch legend-answered"></span> Answered</div>
              <div class="legend-row"><span class="legend-swatch legend-not-answered"></span> Not Answered</div>
              <div class="legend-row"><span class="legend-swatch legend-review"></span> Marked for Review</div>
              <div class="legend-row"><span class="legend-swatch legend-unvisited"></span> Unvisited</div>
              <div class="legend-row"><span class="legend-swatch legend-visited"></span> Visited</div>
            </div>
          </aside>

          <section class="question-panel">
            <div class="question-meta">
              <div>
            
                <h2>Question {{ currentQuestionIndex() + 1 }} of {{ totalQuestions() }}</h2>
              </div>
              <div class="status-chip" [ngClass]="paletteClass(currentQuestionIndex())">
                {{ currentStatusLabel() }}
              </div>
            </div>

            <article class="question-card" *ngIf="currentQuestion() as question">
              <p class="question-text">{{ question.questionText }}</p>
              <p class="marking-hint">Correct: +{{ question.points }} marks | Wrong answer: -{{ question.negativePoints || 0 }} marks</p>
              <div class="options-list">
                <label
                  *ngFor="let option of question.options"
                  class="option-card"
                  [class.option-selected]="selectedOptionId(question._id!) === option._id"
                >
                  <input
                    type="radio"
                    [name]="question._id!"
                    [value]="option._id"
                    [checked]="selectedOptionId(question._id!) === option._id"
                    (change)="selectOption(question._id!, option._id!)"
                  />
                  <span>{{ option.text }}</span>
                </label>
              </div>
            </article>

            <footer class="question-controls">
              <button class="ghost-button" type="button" (click)="goPrevious()" [disabled]="currentQuestionIndex() === 0">
                Previous
              </button>
              <button class="danger-button" type="button" (click)="clearResponse()">Clear Response</button>
              <button class="primary-button" type="button" (click)="saveAndNext()">
                {{ isLastQuestion() ? 'Save' : 'Save & Next' }}
              </button>
              <button class="secondary-button" type="button" (click)="markForReviewAndNext()">
                {{ reviewButtonLabel() }}
              </button>
            </footer>

            <div class="submit-row">
              <button class="primary-button submit-button" type="button" (click)="submitQuiz()" [disabled]="isSubmitting()">
                {{ isSubmitting() ? 'Submitting...' : 'Submit Exam' }}
              </button>
            </div>
          </section>
        </div>
      </ng-container>
    </section>

    <ng-template #resultState>
      <section class="panel result-panel">
        <span class="eyebrow">Result</span>
        <h2>{{ result()!.percentage }}%</h2>
        <p>You scored {{ result()!.score }} out of {{ result()!.maxScore }}.</p>
        
        <div class="result-breakdown">
          <div class="result-stat">
            <span class="result-label">Correct</span>
            <strong class="result-value result-correct">{{ (result()?.correctCount) ?? 0 }}</strong>
          </div>
          <div class="result-stat">
            <span class="result-label">Wrong</span>
            <strong class="result-value result-wrong">{{ (result()?.wrongCount) ?? 0 }}</strong>
          </div>
          <div class="result-stat">
            <span class="result-label">Skipped</span>
            <strong class="result-value result-skipped">{{ (result()?.skippedCount) ?? 0 }}</strong>
          </div>
        </div>
        
        <!-- <p class="muted">Negative marking is included in this score.</p> -->
      </section>
    </ng-template>

    <ng-template #loadingState>
      <section class="panel"><p class="muted">Loading quiz...</p></section>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .exam-shell {
        display: grid;
        gap: 1rem;
      }

      .exam-topbar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) auto;
        gap: 1rem;
        align-items: center;
        padding: 1rem 1.25rem;
        border-radius: 24px;
        background: rgba(255, 250, 244, 0.92);
        border: 1px solid rgba(31, 41, 51, 0.08);
        box-shadow: 0 20px 50px rgba(58, 40, 27, 0.12);
      }

      .topbar-block {
        display: grid;
        gap: 0.25rem;
      }

      .topbar-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--muted);
        font-weight: 700;
      }

      .topbar-title {
        text-align: center;
      }

      .topbar-title h1 {
        margin: 0;
        font-size: clamp(1.3rem, 2.8vw, 2.2rem);
        line-height: 1.1;
      }

      .topbar-actions {
        justify-items: end;
      }

      .timer-chip {
        padding: 0.8rem 1rem;
        border-radius: 16px;
        background: #1f2933;
        color: #fff;
        font-weight: 700;
        letter-spacing: 0.08em;
        min-width: 120px;
        text-align: center;
      }

      .palette-toggle,
      .palette-close,
      .submit-button {
        white-space: nowrap;
      }

      .exam-layout {
        display: grid;
        grid-template-columns: minmax(240px, 20%) minmax(0, 1fr);
        gap: 1rem;
        align-items: start;
      }

      .palette-panel,
      .question-panel,
      .result-panel {
        background: rgba(255, 250, 244, 0.9);
        border: 1px solid rgba(31, 41, 51, 0.08);
        box-shadow: 0 20px 50px rgba(58, 40, 27, 0.12);
        border-radius: 24px;
      }

      .palette-panel {
        display: grid;
        gap: 1.25rem;
        padding: 1.25rem;
        position: sticky;
        top: 1rem;
      }

      .palette-panel-hidden {
        display: none;
      }

      .exam-layout-full {
        grid-template-columns: minmax(0, 1fr);
      }

      .palette-header,
      .question-meta,
      .question-controls,
      .submit-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .palette-header p {
        margin: 0.3rem 0 0;
        color: var(--muted);
        font-size: 0.95rem;
      }

      .palette-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .palette-button {
        min-height: 52px;
        border-radius: 14px;
        border: 1px solid rgba(31, 41, 51, 0.12);
        font-weight: 700;
        color: #1f2933;
        background: #d5d9de;
      }

      .palette-button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .palette-button.is-current {
        outline: 3px solid #1f2933;
        outline-offset: 2px;
      }

      .status-unvisited,
      .legend-unvisited {
        background: #c6ccd4;
      }

      .status-visited,
      .legend-visited {
        background: #6aa9ff;
      }

      .status-not-answered,
      .legend-not-answered {
        background: #ef6b63;
        color: #fff;
      }

      .status-answered,
      .legend-answered {
        background: #58b368;
        color: #fff;
      }

      .status-review,
      .legend-review {
        background: #f4c74d;
      }

      .palette-legend {
        display: grid;
        gap: 0.65rem;
        font-size: 0.95rem;
      }

      .legend-row {
        display: flex;
        align-items: center;
        gap: 0.65rem;
      }

      .legend-swatch {
        width: 18px;
        height: 18px;
        border-radius: 6px;
        border: 1px solid rgba(31, 41, 51, 0.12);
      }

      .question-panel,
      .result-panel {
        display: grid;
        gap: 1.5rem;
        padding: 1.5rem;
      }

      .question-meta h2,
      .result-panel h2 {
        margin: 0.35rem 0 0;
      }

      .status-chip {
        padding: 0.6rem 0.9rem;
        border-radius: 999px;
        font-weight: 700;
      }

      .question-card {
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid rgba(31, 41, 51, 0.08);
      }

      .question-text {
        margin: 0;
        font-size: 1.2rem;
        line-height: 1.6;
      }

      .marking-hint {
        margin: -0.35rem 0 0;
        color: var(--muted);
        font-weight: 600;
      }

      .options-list {
        display: grid;
        gap: 0.85rem;
      }

      .option-card {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 0.85rem;
        padding: 1rem;
        border-radius: 16px;
        border: 1px solid rgba(31, 41, 51, 0.12);
        background: rgba(255, 255, 255, 0.92);
        cursor: pointer;
        transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
      }

      .option-card:hover {
        transform: translateY(-1px);
        border-color: rgba(239, 124, 83, 0.5);
      }

      .option-card.option-selected {
        border-color: var(--accent);
        box-shadow: 0 10px 24px rgba(239, 124, 83, 0.18);
      }

      .option-card input {
        width: 18px;
        height: 18px;
        margin: 0;
      }

      .result-panel {
        max-width: 520px;
      }

      .result-breakdown {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin: 1.5rem 0;
        padding: 1.25rem;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 16px;
      }

      .result-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .result-label {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
        font-weight: 600;
      }

      .result-value {
        font-size: 1.75rem;
        font-weight: 800;
      }

      .result-correct {
        color: #58b368;
      }

      .result-wrong {
        color: #ef6b63;
      }

      .result-skipped {
        color: #6aa9ff;
      }

      @media (max-width: 1024px) {
        .exam-topbar,
        .exam-layout {
          grid-template-columns: 1fr;
        }

        .topbar-title {
          text-align: left;
        }

        .topbar-actions {
          justify-items: start;
        }

        .palette-panel {
          position: static;
        }



      }

      @media (max-width: 640px) {
        .exam-topbar,
        .palette-panel,
        .question-panel,
        .result-panel,
        .question-card {
          padding: 1rem;
          border-radius: 20px;
        }

        .question-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        .question-controls button,
        .submit-row button,
        .palette-toggle {
          width: 100%;
        }
      }
    `
  ]
})
export class QuizPlayPageComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly quizService = inject(QuizService);
  private readonly authService = inject(AuthService);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  readonly quiz = signal<Quiz | null>(null);
  readonly result = signal<{ score: number; maxScore: number; percentage: number; correctCount: number; wrongCount: number; skippedCount: number; submittedAt: string } | null>(null);
  readonly isSubmitting = signal(false);
  readonly timeLeftInSeconds = signal(0);
  readonly currentQuestionIndex = signal(0);
  readonly isPaletteOpen = signal(true);
  readonly answers = signal<Record<string, string>>({});
  readonly questionStates = signal<QuestionUiState[]>([]);
  readonly candidateName = computed(() => this.authService.currentUser()?.name ?? 'Candidate');
  readonly totalQuestions = computed(() => this.quiz()?.questions.length ?? 0);
  readonly currentQuestion = computed(() => this.quiz()?.questions[this.currentQuestionIndex()] ?? null);
  readonly isLastQuestion = computed(() => this.currentQuestionIndex() === this.totalQuestions() - 1);
  readonly reviewButtonLabel = computed(() => {
    const isMarked = this.questionStates()[this.currentQuestionIndex()]?.markedForReview;
    if (isMarked) {
      return 'Remove Review Mark';
    }

    return this.isLastQuestion() ? 'Mark for Review' : 'Mark for Review & Next';
  });
  readonly formattedTimeLeft = computed(() => {
    const totalSeconds = Math.max(this.timeLeftInSeconds(), 0);
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  });
  readonly currentStatusLabel = computed(() => this.statusLabel(this.currentQuestionIndex()));

  constructor() {
    const quizId = this.route.snapshot.paramMap.get('id');
    if (!quizId) {
      return;
    }

    this.quizService.getQuizById(quizId).subscribe((response) => {
      const loadedQuiz = response.quiz;
      this.quiz.set(loadedQuiz);
      this.answers.set({});
      this.questionStates.set(
        loadedQuiz.questions.map((_, index) => ({
          visited: index === 0,
          answered: false,
          markedForReview: false,
          submittedWithoutAnswer: false
        }))
      );
      this.currentQuestionIndex.set(0);
      this.startTimer(loadedQuiz.durationInMinutes);
    });
  }

  togglePalette(): void {
    this.isPaletteOpen.update((isOpen) => !isOpen);
  }

  selectOption(questionId: string, optionId: string): void {
    this.answers.update((answers) => ({ ...answers, [questionId]: optionId }));
    this.updateQuestionState(this.currentQuestionIndex(), (state) => ({
      ...state,
      visited: true,
      answered: true,
      submittedWithoutAnswer: false
    }));
  }

  clearResponse(): void {
    const questionId = this.currentQuestion()?._id;
    if (!questionId) {
      return;
    }

    this.answers.update((answers) => {
      const updatedAnswers = { ...answers };
      delete updatedAnswers[questionId];
      return updatedAnswers;
    });

    this.updateQuestionState(this.currentQuestionIndex(), (state) => ({
      ...state,
      visited: true,
      answered: false,
      submittedWithoutAnswer: false
    }));
  }

  goPrevious(): void {
    if (this.currentQuestionIndex() === 0) {
      return;
    }

    this.finalizeCurrentQuestion();
    this.setCurrentQuestion(this.currentQuestionIndex() - 1);
  }

  saveAndNext(): void {
    this.finalizeCurrentQuestion();
    if (!this.isLastQuestion()) {
      this.setCurrentQuestion(this.currentQuestionIndex() + 1);
    }
  }

  markForReviewAndNext(): void {
    const questionId = this.currentQuestion()?._id ?? '';
    const hasAnswer = Boolean(this.selectedOptionId(questionId));

    this.updateQuestionState(this.currentQuestionIndex(), (state) => ({
      ...state,
      visited: true,
      markedForReview: !state.markedForReview,
      answered: hasAnswer,
      submittedWithoutAnswer: !hasAnswer
    }));

    if (!this.isLastQuestion()) {
      this.setCurrentQuestion(this.currentQuestionIndex() + 1);
    }
  }

  goToQuestion(index: number): void {
    if (index === this.currentQuestionIndex() || !this.canAccessQuestion(index)) {
      return;
    }

    this.finalizeCurrentQuestion();
    this.setCurrentQuestion(index);
  }

  selectedOptionId(questionId: string): string | undefined {
    return this.answers()[questionId];
  }

  canAccessQuestion(index: number): boolean {
    if (index <= this.currentQuestionIndex()) {
      return true;
    }

    return this.questionStates()
      .slice(0, index)
      .every((state) => state.visited);
  }

  paletteClass(index: number): string {
    const state = this.questionStates()[index];
    if (!state) {
      return 'status-unvisited';
    }

    if (state.markedForReview) {
      return 'status-review';
    }

    if (state.answered) {
      return 'status-answered';
    }

    if (!state.visited) {
      return 'status-unvisited';
    }

    if (state.submittedWithoutAnswer) {
      return 'status-not-answered';
    }

    return 'status-visited';
  }

  submitQuiz(): void {
    if (!this.quiz() || this.result() || this.isSubmitting()) {
      return;
    }

    this.finalizeCurrentQuestion();
    this.clearTimer();
    this.isSubmitting.set(true);

    const answers = this.quiz()!.questions.map((question) => ({
      questionId: question._id ?? '',
      selectedOptionId: this.selectedOptionId(question._id ?? '') || null
    }));

    this.quizService.submitAttempt(this.quiz()!._id, answers as { questionId: string; selectedOptionId: string | null }[]).subscribe({
      next: (response) => {
        this.result.set(response.attempt);
        this.isSubmitting.set(false);
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private setCurrentQuestion(index: number): void {
    this.currentQuestionIndex.set(index);
    this.updateQuestionState(index, (state) => ({
      ...state,
      visited: true
    }));
  }

  private finalizeCurrentQuestion(): void {
    const questionId = this.currentQuestion()?._id;
    const hasAnswer = Boolean(questionId && this.selectedOptionId(questionId));

    this.updateQuestionState(this.currentQuestionIndex(), (state) => ({
      ...state,
      visited: true,
      answered: hasAnswer,
      submittedWithoutAnswer: !hasAnswer && !state.markedForReview
    }));
  }

  private updateQuestionState(index: number, updater: (state: QuestionUiState) => QuestionUiState): void {
    this.questionStates.update((states) =>
      states.map((state, stateIndex) => (stateIndex === index ? updater(state) : state))
    );
  }

  private statusLabel(index: number): string {
    const paletteClass = this.paletteClass(index);
    if (paletteClass === 'status-review') {
      return 'Marked for Review';
    }
    if (paletteClass === 'status-answered') {
      return 'Answered';
    }
    if (paletteClass === 'status-not-answered') {
      return 'Not Answered';
    }
    if (paletteClass === 'status-visited') {
      return 'Visited';
    }
    return 'Unvisited';
  }

  private startTimer(durationInMinutes: number): void {
    this.clearTimer();
    const totalSeconds = Math.max(Math.floor(durationInMinutes * 60), 0);
    this.timeLeftInSeconds.set(totalSeconds);

    if (totalSeconds === 0) {
      this.submitQuiz();
      return;
    }

    this.timerInterval = setInterval(() => {
      const updatedSeconds = this.timeLeftInSeconds() - 1;
      this.timeLeftInSeconds.set(updatedSeconds);

      if (updatedSeconds <= 0) {
        this.submitQuiz();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}



