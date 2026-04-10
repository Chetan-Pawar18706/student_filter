import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Quiz } from '../../core/models/quiz.model';
import { QuizService } from '../../core/services/quiz.service';

type EditorOption = {
  text: string;
  isCorrect?: boolean;
};

type EditorQuestion = {
  questionText: string;
  explanation: string;
  points: number;
  negativePoints: number;
  options: EditorOption[];
};

@Component({
  selector: 'app-quiz-editor-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="panel editor-page">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Admin Builder</span>
          <h1>{{ quizId() ? 'Edit quiz' : 'Create a new quiz' }}</h1>
        </div>
        <button class="secondary-button" type="button" (click)="addQuestion()">Add Question</button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="editor-form">
        <div class="grid-two">
          <label>
            Title
            <input type="text" formControlName="title" />
          </label>
          <label>
            Slug
            <input type="text" formControlName="slug" placeholder="javascript-basics-test" />
          </label>
          <label>
            Category
            <input type="text" formControlName="category" />
          </label>
          <label>
            Difficulty
            <select formControlName="difficulty">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </label>
          <label>
            Duration (minutes)
            <input type="number" formControlName="durationInMinutes" min="1" />
          </label>
          <label class="checkbox-row">
            <input type="checkbox" formControlName="isPublished" />
            Publish immediately
          </label>
        </div>

        <label>
          Description
          <textarea rows="4" formControlName="description"></textarea>
        </label>

        <div formArrayName="questions" class="stack">
          <article class="question-card" *ngFor="let question of questionForms.controls; let questionIndex = index" [formGroupName]="questionIndex">
            <div class="section-heading">
              <h2>Question {{ questionIndex + 1 }}</h2>
              <button class="danger-button" type="button" (click)="removeQuestion(questionIndex)" [disabled]="questionForms.length === 1">
                Remove
              </button>
            </div>

            <label>
              Question Text
              <input type="text" formControlName="questionText" />
            </label>
            <label>
              Explanation
              <textarea rows="3" formControlName="explanation"></textarea>
            </label>
            <label>
              Points
              <input type="number" formControlName="points" min="1" />
            </label>
            <label>
              Negative Marking
              <input type="number" formControlName="negativePoints" min="0" step="0.25" />
            </label>

            <p class="muted">Each question must have exactly 4 options.</p>
            <div formArrayName="options" class="stack">
              <div class="option-builder" *ngFor="let option of getOptions(questionIndex).controls; let optionIndex = index" [formGroupName]="optionIndex">
                <input type="text" formControlName="text" [placeholder]="'Option ' + (optionIndex + 1)" />
                <label class="checkbox-row">
                  <input type="radio" [checked]="option.value.isCorrect" (change)="setCorrectOption(questionIndex, optionIndex)" />
                  Correct
                </label>
              </div>
            </div>
            
          </article>
        </div>
        <button class="secondary-button" type="button" (click)="addQuestion()">Add Question</button>
        <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
        <button class="primary-button" type="submit" [disabled]="form.invalid || saving() || loadingQuiz()">
          {{ saving() ? 'Saving...' : quizId() ? 'Update Quiz' : 'Save Quiz' }}
        </button>
      </form>
    </section>
  `
})
export class QuizEditorPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly quizService = inject(QuizService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly errorMessage = signal('');
  readonly saving = signal(false);
  readonly loadingQuiz = signal(false);
  readonly quizId = signal<string | null>(this.route.snapshot.paramMap.get('id'));

  readonly form = this.formBuilder.group({
    title: ['', Validators.required],
    slug: ['', Validators.required],
    description: ['', Validators.required],
    category: ['', Validators.required],
    difficulty: ['Beginner', Validators.required],
    durationInMinutes: [15, [Validators.required, Validators.min(1)]],
    isPublished: [true],
    questions: this.formBuilder.array([this.createQuestionGroup()])
  });

  constructor() {
    const id = this.quizId();
    if (id) {
      this.loadQuiz(id);
    }
  }

  get questionForms() {
    return this.form.controls.questions as FormArray;
  }

  createQuestionGroup(question?: Partial<EditorQuestion>) {
    const sourceOptions = question?.options ?? [];
    const normalizedOptions = Array.from({ length: 4 }, (_, index) => ({
      text: sourceOptions[index]?.text ?? '',
      isCorrect: sourceOptions[index]?.isCorrect ?? false
    }));

    const firstCorrectIndex = normalizedOptions.findIndex((option) => option.isCorrect);
    const correctIndex = firstCorrectIndex >= 0 ? firstCorrectIndex : 0;

    const options = normalizedOptions.map((option, index) => ({
      text: option.text,
      isCorrect: index === correctIndex
    }));

    return this.formBuilder.group({
      questionText: [question?.questionText ?? '', Validators.required],
      explanation: [question?.explanation ?? ''],
      points: [question?.points ?? 1, [Validators.required, Validators.min(1)]],
      negativePoints: [question?.negativePoints ?? 0, [Validators.required, Validators.min(0)]],
      options: this.formBuilder.array(options.map((option) => this.createOptionGroup(option.text, option.isCorrect)))
    });
  }

  createOptionGroup(text = '', isCorrect = false) {
    return this.formBuilder.group({
      text: [text, Validators.required],
      isCorrect: [isCorrect]
    });
  }

  getOptions(questionIndex: number) {
    return this.questionForms.at(questionIndex).get('options') as FormArray;
  }

  addQuestion() {
    this.questionForms.push(this.createQuestionGroup());
  }

  removeQuestion(questionIndex: number) {
    if (this.questionForms.length > 1) {
      this.questionForms.removeAt(questionIndex);
    }
  }

  setCorrectOption(questionIndex: number, optionIndex: number) {
    this.getOptions(questionIndex).controls.forEach((control, index) => {
      control.patchValue({ isCorrect: index === optionIndex });
    });
  }

  private loadQuiz(id: string) {
    this.loadingQuiz.set(true);

    this.quizService.getQuizById(id).subscribe({
      next: ({ quiz }) => {
        this.loadingQuiz.set(false);
        this.form.patchValue({
          title: quiz.title,
          slug: quiz.slug,
          description: quiz.description,
          category: quiz.category,
          difficulty: quiz.difficulty,
          durationInMinutes: quiz.durationInMinutes,
          isPublished: quiz.isPublished
        });

        this.questionForms.clear();
        quiz.questions.forEach((question) => this.questionForms.push(this.createQuestionGroup(question)));

        if (!quiz.questions.length) {
          this.questionForms.push(this.createQuestionGroup());
        }
      },
      error: (error: any) => {
        this.loadingQuiz.set(false);
        this.errorMessage.set(error.error?.message ?? 'Unable to load quiz.');
      }
    });
  }

  submit() {
    this.errorMessage.set('');
    this.saving.set(true);

    const rawValue = this.form.getRawValue();
    const hasInvalidCorrectAnswer = rawValue.questions.some(
      (question) => question.options.filter((option) => option.isCorrect).length !== 1
    );

    if (hasInvalidCorrectAnswer) {
      this.saving.set(false);
      this.errorMessage.set('Each question must have exactly one correct option.');
      return;
    }

    const hasInvalidNegativeMarking = rawValue.questions.some(
      (question) => Number(question.negativePoints) > Number(question.points)
    );

    if (hasInvalidNegativeMarking) {
      this.saving.set(false);
      this.errorMessage.set('Negative marking cannot be greater than question points.');
      return;
    }

    const payload: Partial<Quiz> = {
      ...rawValue,
      difficulty: rawValue.difficulty as Quiz['difficulty'],
      questions: rawValue.questions.map((question) => ({
        questionText: question.questionText,
        explanation: question.explanation,
        points: question.points,
        negativePoints: question.negativePoints,
        options: question.options.map((option) => ({
          text: option.text,
          isCorrect: option.isCorrect
        }))
      }))
    };

    const id = this.quizId();
    const request = id ? this.quizService.updateQuiz(id, payload) : this.quizService.createQuiz(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigateByUrl('/dashboard');
      },
      error: (error: any) => {
        this.saving.set(false);
        this.errorMessage.set(error.error?.message ?? 'Unable to save quiz.');
      }
    });
  }
}

