import { hayClasificador, preguntarAlClasificador } from "./clasificador";

/**
 * Filtro de spam para los formularios públicos, con el modelo de decisión.
 *
 * El campo señuelo de la propia ruta caza a los bots tontos y el límite por
 * ventana corta las inundaciones; lo que se cuela es el spam escrito para
 * parecer un lead («posicionamos tu web en Google»), que hoy acaba en la
 * lista de contactos del cliente como si fuera trabajo.
 *
 * Falla hacia DEJAR PASAR, siempre: sin clave, con la API caída o ante una
 * respuesta rara, el envío se guarda. Perder un cliente real por un fallo
 * nuestro es mucho peor que colar un spam, que se descarta en dos segundos.
 */

// Alto a propósito: solo se descarta lo que el modelo ve clarísimo. La duda
// se queda en el CRM, que es donde una persona puede juzgarla.
const UMBRAL = 0.9;

export interface EnvioDeFormulario {
  nombre: string;
  correo: string;
  empresa: string;
  texto: string;
}

export async function pareceSpam(envio: EnvioDeFormulario): Promise<boolean> {
  if (!hayClasificador()) return false;

  const resultado = await preguntarAlClasificador(envio, {
    spam: {
      type: "noul",
      instructions:
        "Este formulario de contacto lo ha rellenado un bot o alguien enviando publicidad no solicitada",
      criteria: {
        true: "Publicidad no solicitada, ofertas de SEO o de marketing masivo, enlaces sospechosos, texto sin sentido o con datos claramente falsos",
        false:
          "Una persona real interesada en el producto o pidiendo ayuda, aunque escriba poco, con prisa o con faltas de ortografía",
      },
    },
  });
  if (!resultado.ok) return false;

  const probabilidad = resultado.respuestas?.spam?.noul;
  return typeof probabilidad === "number" && probabilidad >= UMBRAL;
}
