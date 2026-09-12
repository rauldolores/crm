import type { ColumnaTablero } from "../../components/maquetas";

/**
 * Modelo de contenido de una página de industria.
 *
 * Cada página se genera a partir de un objeto de este tipo: la plantilla es
 * una sola (app/industrias/[slug]/page.tsx) y el contenido cambia por
 * completo. Agregar una industria nueva es escribir un archivo aquí y
 * registrarlo en index.ts — sin tocar componentes ni rutas.
 */

export type Enlace = { nombre: string; href?: string };

export type PuntoDeDolor = { titulo: string; texto: string };

export type MomentoDelDia = {
  hora: string;
  titulo: string;
  narrativa: string;
  conVinqulia: string;
};

export type FilaProblemaSolucion = {
  problema: string;
  solucion: string;
  beneficio: string;
};

export type CasoDeUso = {
  titulo: string;
  texto: string;
  /** Nombre de la funcionalidad real del producto que lo hace posible. */
  funcionalidad: string;
};

export type CasoPractico = {
  escenario: string;
  inicial: string[];
  conVinqulia: string[];
  /** Aclaración obligatoria: los números son ilustrativos, no datos reales. */
  notaSimulacion: string;
};

export type Beneficio = { titulo: string; resultado: string };

export type Objecion = { pregunta: string; respuesta: string };

export type OportunidadFutura = { titulo: string; texto: string };

export type Seo = {
  keywordPrincipal: string;
  keywordsSecundarias: string[];
  longTail: string[];
  terminosRelacionados: string[];
  intencionComercial: string;
  intencionInformativa: string;
  paginasFuturas: string[];
};

export type Industria = {
  slug: string;
  /** Nombre en plural, como aparece en el menú. */
  nombre: string;
  /** Descripción de una línea para el menú y el hub. */
  resumen: string;
  /** Icono de lucide, por nombre (ver iconosDeIndustria). */
  icono: string;
  /** Ejemplos de empresas de esta industria, para la maqueta del tablero. */
  tablero: { columnas: ColumnaTablero[]; montoEnJuego: number; titulo: string };
  hero: {
    eyebrow: string;
    titulo: string;
    subtitulo: string;
    ctaPrincipal: string;
    puntos: string[];
  };
  problema: {
    titulo: string;
    intro: string;
    puntos: PuntoDeDolor[];
  };
  dia: {
    titulo: string;
    intro: string;
    momentos: MomentoDelDia[];
  };
  problemaSolucion: FilaProblemaSolucion[];
  casosDeUso: CasoDeUso[];
  casoPractico: CasoPractico;
  paraQuien: { si: string[]; no: string[] };
  beneficios: Beneficio[];
  comparacion: { titulo: string; tradicional: string[]; conVinqulia: string[] };
  objeciones: Objecion[];
  faq: { pregunta: string; respuesta: string }[];
  oportunidadesFuturas: OportunidadFutura[];
  cta: { eyebrow: string; titulo: string; subtitulo: string; boton: string };
  seo: Seo;
};
