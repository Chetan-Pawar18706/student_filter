import { Routes } from '@angular/router';
import { AuthPageComponent } from './pages/auth-page/auth-page.component';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { QuizEditorPageComponent } from './pages/quiz-editor-page/quiz-editor-page.component';
import { QuizPlayPageComponent } from './pages/quiz-play-page/quiz-play-page.component';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'login', component: AuthPageComponent, data: { mode: 'login' } },
  { path: 'register', component: AuthPageComponent, data: { mode: 'register' } },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [authGuard] },
  { path: 'quiz/:id', component: QuizPlayPageComponent, canActivate: [authGuard] },
  { path: 'admin/quizzes/new', component: QuizEditorPageComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/quizzes/:id/edit', component: QuizEditorPageComponent, canActivate: [authGuard, adminGuard] },
  { path: '**', redirectTo: '' }
];

