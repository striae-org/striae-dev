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
  { rel: 'manifest', href: '/manifest.json' },
  { rel: 'icon', href: '/favicon.ico' },
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'shortcut_icon', href: '/shortcut.png', type: 'image/png', sizes: '64x64' },
  { rel: 'apple-touch-icon', href: '/icon-256.png', sizes: '256x256' },
];

interface DocumentProps {
  children: React.ReactNode;
  title?: string;
}

function Document({ children, title }: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {title && <title>{title}</title>}
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

export function Layout({ children }: { children: React.ReactNode }) {
  return <Document>{children}</Document>;
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <Document title={`${error.status} ${error.statusText}`}>
        <div className={styles.errorContainer}>
          <h1 className={styles.errorTitle}>{error.status}</h1>
          <p className={styles.errorMessage}>{error.statusText}</p>
          <Link to="/" className={styles.errorLink}>Return Home</Link>
        </div>
      </Document>
    );
  }

  return (
    <Document title="Oops! Something went wrong">
      <div className={styles.errorContainer}>
        <h1 className={styles.errorTitle}>500</h1>
        <p className={styles.errorMessage}>Something went wrong. Please try again later.</p>
        <Link to="/" className={styles.errorLink}>Return Home</Link>
      </div>
    </Document>
  );
}