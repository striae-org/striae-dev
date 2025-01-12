import { RemixBrowser } from "@remix-run/react";
import { startTransition } from "react";
import { hydrateRoot } from "react-dom/client";

if (process.env.NODE_ENV === 'production') {
  console.log('Hydration disabled');
} else {
  startTransition(() => {
    hydrateRoot(
      document,
      <RemixBrowser />
    );
  });
}
