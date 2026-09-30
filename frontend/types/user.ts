export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id: string;
  organization_name: string;
  avatar_initials?: string;
  department?: string;
}

export interface AuthSession {
  user: User;
  token?: string;
  login_time: string;
}
