import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BarraNavegacion } from "../../../components/BarraNavegacion";
import { PieDePagina } from "../../../components/PieDePagina";
import { PlantillaIndustria } from "../../../components/industrias/PlantillaIndustria";
import { INDUSTRIAS, industriaPorSlug } from "../../../content/industrias";
import { metaDescripcion, urlAbsoluta } from "../../../lib/sitio";

/**
 * Página de industria: una sola ruta dinámica para todas.
 *
 * El contenido vive en content/industrias/*; aquí solo se resuelve el slug,
 * se generan los metadatos y los datos estructurados, y se entrega el objeto a
 * la plantilla. Agregar una industria es añadir un archivo de contenido y
 * registrarlo: no se toca esta ruta.
 */

type Contexto = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return INDUSTRIAS.map((industria) => ({ slug: industria.slug }));
}

export async function generateMetadata({
  params,
}: Contexto): Promise<Metadata> {
  const { slug } = await params;
  const industria = industriaPorSlug(slug);

  if (!industria) {
    return { title: "Industria no encontrada | Vinqulia" };
  }

  const url = urlAbsoluta("/industrias/" + industria.slug);
  const descripcion = metaDescripcion(
    industria.hero.subtitulo + " " + industria.resumen,
  );
  const titulo = industria.seo.keywordPrincipal + " | Vinqulia";

  return {
    title: titulo,
    description: descripcion,
    keywords: [
      industria.seo.keywordPrincipal,
      ...industria.seo.keywordsSecundarias,
      ...industria.seo.longTail,
    ],
    alternates: { canonical: url },
    openGraph: {
      title: titulo,
      description: descripcion,
      url,
      siteName: "Vinqulia",
      locale: "es_MX",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
    },
  };
}

export default async function PaginaIndustria({ params }: Contexto) {
  const { slug } = await params;
  const industria = industriaPorSlug(slug);

  if (!industria) notFound();

  const url = urlAbsoluta("/industrias/" + industria.slug);

  // Datos estructurados: migas, preguntas frecuentes y la ficha del producto.
  const datosEstructurados = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: urlAbsoluta("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: "Industrias",
          item: urlAbsoluta("/industrias"),
        },
        { "@type": "ListItem", position: 3, name: industria.nombre, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: industria.faq.map((pregunta) => ({
        "@type": "Question",
        name: pregunta.pregunta,
        acceptedAnswer: { "@type": "Answer", text: pregunta.respuesta },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Vinqulia",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: industria.hero.subtitulo,
      url,
      audience: { "@type": "BusinessAudience", name: industria.nombre },
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }}
      />

      <BarraNavegacion />
      <main>
        <PlantillaIndustria industria={industria} />
      </main>
      <PieDePagina />
    </>
  );
}
