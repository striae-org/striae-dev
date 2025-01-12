import { User } from 'firebase/auth';

export interface UserData {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  permitted: boolean;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: string;
}

export interface CloudflareContext {
  cloudflare: {
    env: {
      SL_API_KEY: string;
      CFT_PUBLIC_KEY: string;
      CFT_SECRET_KEY: string;  
      R2_KEY_SECRET: string;
    };
  };
}

export type ActionType = 'auth' | 'sidebar' | 'annotations' | 'user';

export type LoaderType = 'auth' | 'sidebar' | 'annotations';

export interface CustomLoaderArgs {
  request: Request;
  context: CloudflareContext;
  user?: User | null;
}

export interface UserActionData {
  success: boolean;
  error?: string;
  data?: UserData;
}