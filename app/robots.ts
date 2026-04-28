import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/og"],
        disallow: [
          "/api/account/",
          "/api/cron/",
          "/api/data/",
          "/api/email/",
          "/api/partners/",
          "/api/squads/",
          "/api/streak/",
          "/api/stripe/",
          "/callback",
          "/settings",
          "/onboarding",
        ],
      },
    ],
    sitemap: "https://lomoura.com/sitemap.xml",
    host: "https://lomoura.com",
  };
}
