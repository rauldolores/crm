import {
  ErrorDeConector,
  type ConectorDeProductos,
  type CredencialesDeConector,
  type ProductoExterno,
  type ResultadoDePrueba,
} from "./tipos";

/**
 * Shopify como catálogo de productos, por la Admin API REST con el token de
 * una aplicación personalizada de la tienda (Configuración → Aplicaciones →
 * Desarrollar aplicaciones). Es el camino que no necesita registrar una app
 * pública ni guardar secretos de plataforma: cada organización trae su
 * propio token, con permiso solo de lectura de productos.
 */

const VERSION_DE_API = "2025-07";
const TIEMPO_MAXIMO = 15_000;

interface VarianteDeShopify {
  id: number;
  title: string;
  sku: string | null;
  price: string;
}

interface ProductoDeShopify {
  id: number;
  title: string;
  body_html: string | null;
  status: string;
  variants: VarianteDeShopify[];
  images?: { src: string }[];
}

/** «mitienda.myshopify.com», acepte lo que acepte la persona al pegarlo. */
export const normalizarDominio = (valor: string): string =>
  valor
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

const sinHtml = (html: string | null): string | null => {
  if (!html) return null;
  const texto = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return texto || null;
};

/**
 * Cada variante es un producto para el CRM: es lo que tiene SKU y precio.
 * Con una sola variante («Default Title») el nombre es el del producto;
 * con varias, «Producto — Variante».
 */
export const productosDeShopify = (
  productos: ProductoDeShopify[],
  moneda: string,
): ProductoExterno[] =>
  productos.flatMap((producto) => {
    const imagen = producto.images?.[0]?.src ?? null;
    const descripcion = sinHtml(producto.body_html);
    const activo = producto.status === "active";
    const unica =
      producto.variants.length === 1 ||
      producto.variants.every((v) => v.title === "Default Title");
    return producto.variants.map((variante) => ({
      externalId: `${producto.id}:${variante.id}`,
      sku: variante.sku?.trim() || null,
      name: unica ? producto.title : `${producto.title} — ${variante.title}`,
      description: descripcion,
      unitPrice: Number(variante.price) || 0,
      currency: moneda,
      active: activo,
      imageUrl: imagen,
    }));
  });

/** El enlace «next» de la cabecera Link de Shopify, si lo hay. */
export const siguientePagina = (link: string | null): string | null => {
  if (!link) return null;
  const parte = link
    .split(",")
    .find((trozo) => /rel="next"/.test(trozo));
  const url = parte?.match(/<([^>]+)>/)?.[1];
  return url ?? null;
};

export class ConectorShopify implements ConectorDeProductos {
  readonly familia = "products" as const;
  private readonly dominio: string;
  private readonly token: string;

  constructor(credenciales: CredencialesDeConector) {
    this.dominio = normalizarDominio(credenciales.settings.shop_domain ?? "");
    this.token = credenciales.secret;
    if (!/^[a-z0-9-]+\.myshopify\.com$/.test(this.dominio)) {
      throw new ErrorDeConector(
        "La dirección de la tienda debe ser la que termina en .myshopify.com.",
        400,
      );
    }
  }

  private async pedir<T>(url: string): Promise<{ datos: T; link: string | null }> {
    let respuesta: Response;
    try {
      respuesta = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": this.token,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(TIEMPO_MAXIMO),
      });
    } catch {
      throw new ErrorDeConector(
        "No se pudo hablar con Shopify. Revisa la dirección de la tienda.",
      );
    }
    if (respuesta.status === 401 || respuesta.status === 403) {
      throw new ErrorDeConector(
        "Shopify rechazó el token. Comprueba que lo copiaste completo y que la aplicación tiene el permiso read_products.",
        401,
      );
    }
    if (respuesta.status === 404) {
      throw new ErrorDeConector(
        "Shopify no encuentra esa tienda. Revisa la dirección (termina en .myshopify.com).",
        404,
      );
    }
    if (!respuesta.ok) {
      throw new ErrorDeConector(
        `Shopify respondió con un error (${respuesta.status}). Inténtalo de nuevo en un momento.`,
      );
    }
    return {
      datos: (await respuesta.json()) as T,
      link: respuesta.headers.get("link"),
    };
  }

  private url(ruta: string): string {
    return `https://${this.dominio}/admin/api/${VERSION_DE_API}/${ruta}`;
  }

  private async tienda(): Promise<{ name: string; currency: string }> {
    const { datos } = await this.pedir<{
      shop: { name: string; currency: string };
    }>(this.url("shop.json?fields=name,currency"));
    return datos.shop;
  }

  async probar(): Promise<ResultadoDePrueba> {
    try {
      const tienda = await this.tienda();
      const { datos } = await this.pedir<{ count: number }>(
        this.url("products/count.json"),
      );
      return {
        ok: true,
        detalle: `Conectado con «${tienda.name}»: ${datos.count} productos en ${tienda.currency}.`,
      };
    } catch (error) {
      return {
        ok: false,
        mensaje:
          error instanceof ErrorDeConector
            ? error.message
            : "No se pudo comprobar la conexión con Shopify.",
      };
    }
  }

  async listarProductos(): Promise<ProductoExterno[]> {
    const tienda = await this.tienda();
    const todos: ProductoDeShopify[] = [];
    let siguiente: string | null = this.url(
      "products.json?limit=250&fields=id,title,body_html,status,variants,images",
    );
    // Shopify pagina por cursor en la cabecera Link; 40 páginas son 10,000
    // productos, más que de sobra para una pyme y un tope por si acaso.
    for (let pagina = 0; siguiente && pagina < 40; pagina++) {
      const { datos, link } = await this.pedir<{
        products: ProductoDeShopify[];
      }>(siguiente);
      todos.push(...datos.products);
      siguiente = siguientePagina(link);
    }
    return productosDeShopify(todos, tienda.currency);
  }
}
