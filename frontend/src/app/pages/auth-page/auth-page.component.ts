import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-layout">
      <div class="panel auth-card">
        <span class="eyebrow">{{ mode() === 'login' ? 'Welcome back' : 'Create account' }}</span>
        <h1>{{ mode() === 'login' ? 'Login' : 'Register ' }}</h1>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
          <label *ngIf="mode() === 'register'">
            Name
            <input type="text" formControlName="name" placeholder="Your full name" />
          </label>

          <label>
            Email
            <input type="email" formControlName="email" placeholder="you@example.com" />
          </label>

          <label>
            Password
            <input type="password" formControlName="password" placeholder="Minimum 6 characters" />
          </label>

          <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
          <button class="primary-button" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Please wait...' : mode() === 'login' ? 'Login' : 'Create account' }}
          </button>
        </form>

        <p class="switch-link">
          {{ mode() === 'login' ? 'Need an account?' : 'Already registered?' }}
          <a [routerLink]="mode() === 'login' ? '/register' : '/login'">
            {{ mode() === 'login' ? 'Register' : 'Login' }}
          </a>
        </p>
      </div>
    </section>
  `
})
export class AuthPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'register'>((this.route.snapshot.data['mode'] as 'login' | 'register') ?? 'login');
  readonly errorMessage = signal('');
  readonly loading = signal(false);

  readonly form = this.formBuilder.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit() {
    this.errorMessage.set('');
    this.loading.set(true);

    const request =
      this.mode() === 'login'
        ? this.authService.login({
            email: this.form.value.email ?? '',
            password: this.form.value.password ?? ''
          })
        : this.authService.register({
            name: this.form.value.name ?? '',
            email: this.form.value.email ?? '',
            password: this.form.value.password ?? ''
          });

    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/dashboard');
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.message ?? 'Request failed.');
      }
    });
  }
}
