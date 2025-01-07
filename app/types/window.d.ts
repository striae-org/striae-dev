interface Window {
    localStorage: Storage;
    prompt(message?: string): string | null;
    location: Location;
  }

interface CustomWindow extends Window {
  localStorage: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  };
  prompt(message?: string): string | null;
  location: {
    href: string;
  };
}

declare let window: CustomWindow;