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

export type ActionType = 'sidebar' | 'annotations';