import type { MetadataRoute } from "next";

import { INDUSTRIAS } from "../content/industrias";
import { URL_SITIO } from "../lib/sitio";

/**
 * Sitemap generado desde el registro de contenido: la portada, el hub de
 * industrias y una entrada por industria publicada. Al añadir una industria
 * nueva, su URL entra aquí sola.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();

  const paginas: MetadataRoute.Sitemap = [
    {
      url: URL_SITIO + "/",
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: URL_SITIO + "/industrias",
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  for (const industria of INDUSTRIAS) {
    paginas.push({
      url: URL_SITIO + "/industrias/" + industria.slug,
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return paginas;
}
