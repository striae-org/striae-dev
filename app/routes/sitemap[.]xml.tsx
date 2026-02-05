import type { LoaderFunction } from "@remix-run/cloudflare";

export const loader: LoaderFunction = async ({ context }) => {
  const baseUrl = "https://www.striae.org";
  
  // Dynamic routes
  const dynamicRoutes = [
    { path: "/", changefreq: "weekly", priority: 1.0 },    
    { path: "/privacy", changefreq: "yearly", priority: 0.5 },
    { path: "/terms", changefreq: "yearly", priority: 0.5 },
    { path: "/security", changefreq: "yearly", priority: 0.5 },
    { path: "/support", changefreq: "quarterly", priority: 0.6 },
    { path: "/bugs", changefreq: "monthly", priority: 0.6 },
  ];

  // Static public files
  const staticRoutes = [
    { path: "/docs/striae-white-paper.pdf", changefreq: "yearly", priority: 0.7 },
    
    // Developer guides
    { path: "/guides/developers/README.md", changefreq: "monthly", priority: 0.7 },
    { path: "/guides/developers/PROJECT_OVERVIEW.md", changefreq: "quarterly", priority: 0.6 },
    { path: "/guides/developers/INSTALLATION.md", changefreq: "monthly", priority: 0.6 },
    { path: "/guides/developers/ENV_SETUP.md", changefreq: "monthly", priority: 0.6 },
    { path: "/guides/developers/ARCHITECTURE.md", changefreq: "monthly", priority: 0.6 },
    { path: "/guides/developers/DEVELOPMENT_PROTOCOL.md", changefreq: "monthly", priority: 0.6 },
    { path: "/guides/developers/API_REFERENCE.md", changefreq: "monthly", priority: 0.6 },
    { path: "/guides/developers/COMPONENT_GUIDE.md", changefreq: "monthly", priority: 0.6 },
    { path: "/guides/developers/SECURITY.md", changefreq: "monthly", priority: 0.6 },
    { path: "/guides/developers/ERROR_HANDLING.md", changefreq: "monthly", priority: 0.6 },
    { path: "/guides/developers/AUDIT_TRAIL.md", changefreq: "monthly", priority: 0.6 },
    
    // User guides - Getting Started
    { path: "/guides/users/getting-started/striae-a-firearms-examiners-comparison-companion.md", changefreq: "quarterly", priority: 0.8 },
    { path: "/guides/users/getting-started/how-to-log-into-striae.md", changefreq: "quarterly", priority: 0.7 },
    { path: "/guides/users/getting-started/code-of-responsible-use.md", changefreq: "yearly", priority: 0.6 },
    
    // User guides - Case Management
    { path: "/guides/users/case-management/striae-case-management.md", changefreq: "quarterly", priority: 0.7 },
    
    // User guides - Annotating & Printing
    { path: "/guides/users/annotating-printing/striae-image-annotation-and-pdf-generation-guide.md", changefreq: "quarterly", priority: 0.7 },
    { path: "/guides/users/annotating-printing/box-annotations.md", changefreq: "quarterly", priority: 0.6 },
    
    // User guides - Confirmations
    { path: "/guides/users/confirmations/confirmations-guide.md", changefreq: "quarterly", priority: 0.6 },
    
    // User guides - Audit Trail
    { path: "/guides/users/audit-trail/audit-trail-user-guide.md", changefreq: "quarterly", priority: 0.6 },
    
    // User guides - FAQs
    { path: "/guides/users/faqs/striae-frequently-asked-questions.md", changefreq: "quarterly", priority: 0.6 },
    
    // Release notes - Stable
    { path: "/release-notes/RELEASE_NOTES_v1.0.5.md", changefreq: "monthly", priority: 0.5 },
    { path: "/release-notes/RELEASE_NOTES_v1.0.4.md", changefreq: "monthly", priority: 0.5 },
    { path: "/release-notes/RELEASE_NOTES_v1.0.3.md", changefreq: "monthly", priority: 0.4 },
    { path: "/release-notes/RELEASE_NOTES_v1.0.2.md", changefreq: "monthly", priority: 0.4 },
    { path: "/release-notes/RELEASE_NOTES_v1.0.1.md", changefreq: "monthly", priority: 0.4 },
    { path: "/release-notes/RELEASE_NOTES_v1.0.0.md", changefreq: "monthly", priority: 0.4 },
    
    // Release notes - Beta
    { path: "/release-notes/RELEASE_NOTES_v0.9.28-beta.md", changefreq: "monthly", priority: 0.3 },
    { path: "/release-notes/RELEASE_NOTES_v0.9.24-beta.md", changefreq: "monthly", priority: 0.3 },
    { path: "/release-notes/RELEASE_NOTES_v0.9.22a-beta.md", changefreq: "monthly", priority: 0.3 },
    { path: "/release-notes/RELEASE_NOTES_v0.9.22-beta.md", changefreq: "monthly", priority: 0.3 },
    { path: "/release-notes/RELEASE_NOTES_v0.9.20-beta.md", changefreq: "monthly", priority: 0.3 },
    { path: "/release-notes/RELEASE_NOTES_v0.9.18-beta.md", changefreq: "monthly", priority: 0.3 },
    { path: "/release-notes/RELEASE_NOTES_v0.9.17a-beta.md", changefreq: "monthly", priority: 0.3 },
    { path: "/release-notes/RELEASE_NOTES_v0.9.17-beta.md", changefreq: "monthly", priority: 0.3 },
    { path: "/release-notes/RELEASE_NOTES_v0.9.15.1-beta.md", changefreq: "monthly", priority: 0.3 },
    { path: "/release-notes/RELEASE_NOTES_v0.9.15-beta.md", changefreq: "monthly", priority: 0.3 },
    { path: "/release-notes/RELEASE_NOTES_v0.9.10-beta.md", changefreq: "monthly", priority: 0.3 },
    { path: "/release-notes/RELEASE_NOTES_v0.9.06-beta.md", changefreq: "monthly", priority: 0.3 },
    { path: "/release-notes/RELEASE_NOTES_BETA_SEPT_2025.md", changefreq: "monthly", priority: 0.3 },
  ];

  const allRoutes = [...dynamicRoutes, ...staticRoutes];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `
  <url>
    <loc>${baseUrl}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join("")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
