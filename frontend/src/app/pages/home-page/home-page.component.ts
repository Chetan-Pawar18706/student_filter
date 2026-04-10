import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="home-hero panel">
      <div class="home-hero-copy">
        <span class="eyebrow">Quiz Platform</span>
        <h1>Simple online quiz system for admins and students</h1>
        <p>
          Create quizzes, activate them when ready, let users attempt them with a real exam-style interface,
          and track results from one dashboard.
        </p>

        <div class="home-actions">
          <a class="primary-button" [routerLink]="authService.isAuthenticated() ? '/dashboard' : '/register'">
            {{ authService.isAuthenticated() ? 'Open Dashboard' : 'Get Started' }}
          </a>
          <a class="secondary-button" routerLink="/login" *ngIf="!authService.isAuthenticated()">Login</a>
        </div>
      </div>

      <div class="home-summary">
        <div class="home-summary-card">
          <strong>Admin</strong>
          <p>Create, edit, publish, and manage quizzes directly from dashboard.</p>
        </div>
        <div class="home-summary-card">
          <strong>User</strong>
          <p>Attempt quizzes with timer, palette navigation, and score history.</p>
        </div>
        <div class="home-summary-card">
          <strong>System</strong>
          <p>Tracks attempts, results, and quiz status in one place.</p>
        </div>
      </div>
    </section>

    <section class="home-strip">
      <article class="panel home-strip-card">
        <h3>Fast Quiz Access</h3>
        <p>Open dashboard, pick a quiz, and start without unnecessary steps.</p>
      </article>
      <article class="panel home-strip-card">
        <h3>Exam Style UI</h3>
        <p>Question palette, timer, review state, and structured navigation are already built in.</p>
      </article>
      <article class="panel home-strip-card">
        <h3>Admin Control</h3>
        <p>Activate or deactivate quizzes any time depending on availability.</p>
      </article>
    </section>
  `,
  styles: [
    `
      .home-hero {
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.9fr);
        gap: 1.5rem;
        align-items: center;
        padding: 2rem;
      }

      .home-hero-copy h1 {
        margin: 0.45rem 0 1rem;
        font-size: clamp(2.3rem, 4.8vw, 4.4rem);
        line-height: 1.02;
      }

      .home-hero-copy p,
      .home-summary-card p,
      .home-strip-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
      }

      .home-actions {
        display: flex;
        gap: 0.9rem;
        flex-wrap: wrap;
        margin-top: 1.5rem;
      }

      .home-summary {
        display: grid;
        gap: 1rem;
      }

      .home-summary-card {
        padding: 1.15rem 1.2rem;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.64);
        border: 1px solid rgba(31, 41, 51, 0.08);
      }

      .home-summary-card strong,
      .home-strip-card h3 {
        display: block;
        margin-bottom: 0.45rem;
      }

      .home-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }

      .home-strip-card {
        min-height: 170px;
      }

      @media (max-width: 900px) {
        .home-hero,
        .home-strip {
          grid-template-columns: 1fr;
        }

        .home-hero {
          padding: 1.4rem;
        }
      }
    `
  ]
})
export class HomePageComponent {
  readonly authService = inject(AuthService);
}
