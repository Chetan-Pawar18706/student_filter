import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse, User } from '../models/auth.model';

const API_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'quizforge_token';
const USER_KEY = 'quizforge_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly currentUser = signal<User | null>(this.readStoredUser());
  readonly isAuthenticated = computed(() => Boolean(this.token()));
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  register(payload: { name: string; email: string; password: string }) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, payload).pipe(
      tap((response) => this.persistAuth(response))
    );
  }

  login(payload: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, payload).pipe(
      tap((response) => this.persistAuth(response))
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigateByUrl('/');
  }

  private persistAuth(response: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.token.set(response.token);
    this.currentUser.set(response.user);
  }

  private readStoredUser(): User | null {
    const rawUser = localStorage.getItem(USER_KEY);
    return rawUser ? (JSON.parse(rawUser) as User) : null;
  }
}
