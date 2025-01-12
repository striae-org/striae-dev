import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
  Link
} from "@remix-run/react";
import Footer from "~/components/footer/footer";
import MobileWarning from "~/components/mobile/mobile-warning";
import "./tailwind.css";
import styles from '~/styles/error.module.css';
import { auth } from "./services/firebase";
import { AuthContext } from "./contexts/auth.context";
import { User } from 'firebase/auth';
import { useEffect, useState } from 'react';

export const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: 'manifest', href: '/manifest.json' },
  { rel: 'icon', href: '/favicon.ico' },
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'shortcut_icon', href: '/shortcut.png', type: 'image/png', sizes: '64x64' },
  { rel: 'apple-touch-icon', href: '/icon-256.png', sizes: '256x256' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const error = useRouteError();

  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setUser(user);
    });
  }, []);

  if (error) {
    if (isRouteErrorResponse(error)) {
      return (
        <html lang="en">
          <head>
            <title>{`${error.status} ${error.statusText}`}</title>
            <Meta />
            <Links />
          </head>
          <body className="flex flex-col min-h-screen">
            <div className={styles.errorContainer}>
              <h1 className={styles.errorTitle}>{error.status}</h1>
              <p className={styles.errorMessage}>{error.statusText}</p>
              <Link to="/" className={styles.errorLink}>Return Home</Link>
            </div>
            <Scripts />
          </body>
        </html>
      );
    }
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex flex-col min-h-screen w-screen max-w-full overflow-x-hidden">
        <AuthContext.Provider value={{ user, setUser }}>
          <MobileWarning />
          <main className="flex-grow w-full">
            <Outlet />
          </main>
          <Footer />
          <ScrollRestoration />
          <Scripts />
        </AuthContext.Provider>
      </body>
    </html>
  );
}