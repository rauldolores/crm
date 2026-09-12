import type { MetadataRoute } from "next";

import { URL_SITIO } from "../lib/sitio";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // El endpoint de captación no aporta nada al índice y no debe rastrearse.
        disallow: ["/api/"],
      },
    ],
    sitemap: URL_SITIO + "/sitemap.xml",
    host: URL_SITIO,
  };
}
