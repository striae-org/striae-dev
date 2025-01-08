import type { LinksFunction } from "@remix-run/cloudflare";
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

/*
export const headers: HeadersFunction = () => ({
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-src 'self' https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
  ].join("; "),
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
});
*/

export const links: LinksFunction = () => [
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
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex flex-col min-h-screen">
        <MobileWarning />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <html lang="en">
        <head>
          <title>{`${error.status} ${error.statusText}`}</title>
          <Meta />
          <Links />
        </head>
        <body className="flex flex-col min-h-screen">
          <MobileWarning />
          <main className="flex-grow">
            <div className={styles.errorContainer}>
              <h1 className={styles.errorTitle}>{error.status}</h1>
              <p className={styles.errorMessage}>{error.statusText}</p>
              <Link to="/" className={styles.errorLink}>Return Home</Link>
            </div>
          </main>
          <Footer />
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>Oops! Something went wrong</title>
        <Meta />
        <Links />
      </head>
      <body className="flex flex-col min-h-screen">
        <MobileWarning />
        <main className="flex-grow">
          <div className={styles.errorContainer}>
            <h1 className={styles.errorTitle}>500</h1>
            <p className={styles.errorMessage}>Something went wrong. Please try again later.</p>
            <Link to="/" className={styles.errorLink}>Return Home</Link>
          </div>
        </main>
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}