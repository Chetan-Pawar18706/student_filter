# QuizForge

Full-stack quiz website built with Angular, Node.js, Express, and MongoDB.

## Features
- User registration and login with JWT authentication
- Admin and player roles
- Admin quiz builder with dynamic questions and options
- Published quiz listing and quiz attempt flow
- Automatic scoring and attempt history
- Admin overview with recent attempts

## Project Structure
- `backend/` Express API with MongoDB models and auth middleware
- `frontend/` Angular standalone app with routing, guards, and dashboard pages

## Backend Setup
1. Open `backend/`
2. Install packages: `npm install`
3. Copy `.env.example` to `.env`
4. Update `MONGODB_URI` and `JWT_SECRET`
5. Create admin user: `npm run seed:admin`
6. Start server: `npm run dev`

Server runs on `http://localhost:5000`

## Frontend Setup
1. Open `frontend/`
2. Install packages: `npm install`
3. Start Angular app: `npm start`

Frontend runs on `http://localhost:4200`

## API Highlights
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/quizzes`
- `POST /api/quizzes` admin only
- `POST /api/attempts/:quizId/submit`
- `GET /api/attempts/me/history`
- `GET /api/attempts/admin/overview` admin only

## Notes
- Frontend API base URL is currently hardcoded to `http://localhost:5000/api`
- MongoDB must be running locally or accessible via the URI in `.env`
- Dependency installation and build verification were not run in this workspace because network access is restricted
