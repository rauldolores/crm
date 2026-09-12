/**
 * Diagrama del recorrido de un lead dentro de Vinqulia, dibujado en SVG.
 *
 * Cinco etapas conectadas por flechas cuyo trazo se desplaza (clase
 * animar-trazo, definida en globals.css). Se dibuja con atributos numéricos
 * calculados para que las posiciones no dependan de cadenas de plantilla.
 *
 * En pantallas estrechas el diagrama no se encoge hasta ser ilegible: el
 * contenedor permite desplazarlo en horizontal.
 */

const ANCHO_NODO = 200;
const PASO = 256;
const X_INICIAL = 20;
const Y_NODO = 86;
const ALTO_NODO = 128;

const PASOS = [
  {
    numero: 1,
    titulo: "Llega el lead",
    linea1: "Formulario web, WhatsApp",
    linea2: "o correo entrante",
  },
  {
    numero: 2,
    titulo: "Contacto y empresa",
    linea1: "Se crean solos, con todo",
    linea2: "su historial",
  },
  {
    numero: 3,
    titulo: "Oportunidad",
    linea1: "Entra al pipeline en",
    linea2: "la etapa que le toca",
  },
  {
    numero: 4,
    titulo: "Seguimiento",
    linea1: "Tareas, reglas y",
    linea2: "conversaciones",
  },
  {
    numero: 5,
    titulo: "Cierre y medición",
    linea1: "Informes de conversión",
    linea2: "y motivos de pérdida",
  },
];

const COLOR = {
  tinta: "#171717",
  suave: "#737373",
  borde: "#f0cfc9",
  marca: "#b23b2e",
  flecha: "#dc8570",
};

export function DiagramaProceso() {
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox="0 0 1280 300"
        role="img"
        aria-label="Recorrido de un lead: llega por formulario, WhatsApp o correo; se crean el contacto y la empresa; entra como oportunidad en el pipeline; se le da seguimiento con tareas y conversaciones; y se cierra y mide con informes."
        className="h-auto w-full min-w-[980px]"
      >
        <defs>
          <linearGradient id="fondo-nodo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fdf7f6" />
          </linearGradient>
          <linearGradient id="insignia" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b23b2e" />
            <stop offset="100%" stopColor="#8f2e24" />
          </linearGradient>
        </defs>

        {/* Halo inferior: separa el diagrama del fondo sin usar un recuadro. */}
        <ellipse cx="640" cy="252" rx="540" ry="42" fill={COLOR.marca} opacity="0.05" />

        {PASOS.map((paso, indice) => {
          const x = X_INICIAL + indice * PASO;
          const esUltimo = indice === PASOS.length - 1;
          return (
            <g key={paso.numero}>
              {/* Conector hacia el nodo siguiente */}
              {!esUltimo && (
                <g>
                  <line
                    x1={x + ANCHO_NODO + 8}
                    y1={Y_NODO + ALTO_NODO / 2}
                    x2={x + ANCHO_NODO + 44}
                    y2={Y_NODO + ALTO_NODO / 2}
                    stroke={COLOR.flecha}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="7 7"
                    className="animar-trazo"
                  />
                  <polygon
                    points={[
                      [x + ANCHO_NODO + 44, Y_NODO + ALTO_NODO / 2 - 6].join(","),
                      [x + ANCHO_NODO + 56, Y_NODO + ALTO_NODO / 2].join(","),
                      [x + ANCHO_NODO + 44, Y_NODO + ALTO_NODO / 2 + 6].join(","),
                    ].join(" ")}
                    fill={COLOR.flecha}
                  />
                </g>
              )}

              {/* Nodo */}
              <rect
                x={x}
                y={Y_NODO}
                width={ANCHO_NODO}
                height={ALTO_NODO}
                rx="18"
                fill="url(#fondo-nodo)"
                stroke={COLOR.borde}
                strokeWidth="1.5"
              />

              {/* Insignia con el número de paso */}
              <circle
                cx={x + 40}
                cy={Y_NODO + 38}
                r="19"
                fill="url(#insignia)"
              />
              <text
                x={x + 40}
                y={Y_NODO + 44}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                fill="#ffffff"
              >
                {paso.numero}
              </text>

              {/* Título */}
              <text
                x={x + 70}
                y={Y_NODO + 44}
                fontSize="15.5"
                fontWeight="600"
                fill={COLOR.tinta}
              >
                {paso.titulo}
              </text>

              {/* Descripción */}
              <text x={x + 24} y={Y_NODO + 82} fontSize="12.5" fill={COLOR.suave}>
                {paso.linea1}
              </text>
              <text x={x + 24} y={Y_NODO + 102} fontSize="12.5" fill={COLOR.suave}>
                {paso.linea2}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
