import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
//import { visualizer } from "rollup-plugin-visualizer";

declare module "@remix-run/cloudflare" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  server: {
    port: 7777,
  },
  build: {
    // Set chunk size warning limit higher since we're using dynamic imports for large libs (default: 500)
    chunkSizeWarningLimit: 500,
    minify: true,
  },
  plugins: [
    remixCloudflareDevProxy(),
    remix({      
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths()
    //visualizer({ open: true, filename: 'dist/states.html' })
  ],
});
