export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'player';
}

export interface AuthResponse {
  token: string;
  user: User;
}
