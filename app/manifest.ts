import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "lomoura",
    short_name: "lomoura",
    description:
      "A focused operating system for daily missions, habit streaks, revenue tracking, goals, and accountability.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0B0B0F",
    theme_color: "#0B0B0F",
    categories: ["productivity", "business", "utilities"],
    icons: [
      {
        src: "/lomoura-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/lomoura-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "64x64",
        type: "image/svg+xml",
      },
    ],
  };
}
