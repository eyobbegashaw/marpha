export interface AuthUser {
  id: string;
  organization_id: string | null;
  branch_id: string | null;
  role: string;
  role_id: string;
  email: string;
  first_name: string;
  last_name: string;
  language_preference: 'en' | 'am';
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      language?: 'en' | 'am';
    }
  }
}
