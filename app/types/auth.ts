export interface CloudflareContext {
  cloudflare: {
    env: {
      R2_KEY_SECRET: string;
    };
  };
}

export interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  permitted: boolean;
  createdAt: string;
  uid: string;
}