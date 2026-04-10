import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell">
      <header class="topbar">
        <a routerLink="/" class="brand">QuizForge</a>
        <nav class="nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a *ngIf="isAuthenticated()" routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a *ngIf="isAdmin()" routerLink="/admin/quizzes/new" routerLinkActive="active">Create Quiz</a>
          <a *ngIf="!isAuthenticated()" routerLink="/login" routerLinkActive="active">Login</a>
          <a *ngIf="!isAuthenticated()" routerLink="/register" routerLinkActive="active">Register</a>
          <button *ngIf="isAuthenticated()" type="button" class="ghost-button" (click)="logout()">Logout</button>
        </nav>
      </header>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent {
  private readonly authService = inject(AuthService);

  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly isAdmin = computed(() => this.authService.isAdmin());

  logout() {
    this.authService.logout();
  }
}
