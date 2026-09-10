import { describe, expect, it } from "vitest";

import { camposDeFusion, rellenarCampos, tokenDeCampo } from "./camposDeFusion";

describe("camposDeFusion", () => {
  it("ofrece los campos fijos aunque la organización no tenga personalizados", () => {
    const campos = camposDeFusion({});

    expect(campos.map((c) => c.clave)).toContain("contacto.nombre");
    expect(campos.map((c) => c.clave)).toContain("empresa.nombre");
    expect(campos.map((c) => c.clave)).toContain("oportunidad.nombre");
  });

  it("ofrece los campos del contrato para los correos de renovación", () => {
    // «Tu plan {{contrato.nombre}} se renueva el {{contrato.renueva_el}}» es
    // el correo que motiva el disparador por fecha del módulo Clientes.
    const claves = camposDeFusion({}).map((c) => c.clave);

    expect(claves).toContain("contrato.nombre");
    expect(claves).toContain("contrato.renueva_el");
    expect(claves).toContain("contrato.importe");
  });

  it("suma los campos personalizados con el prefijo de su entidad", () => {
    // El caso real: el enlace del diagnóstico vive en un campo personalizado
    // del contacto y hay que poder meterlo en el correo.
    const campos = camposDeFusion({
      contacto: [{ value: "diagnostico", label: "Diagnóstico", type: "text" }],
    });

    const diagnostico = campos.find(
      (c) => c.clave === "contacto.campo.diagnostico",
    );
    expect(diagnostico).toBeDefined();
    expect(diagnostico?.etiqueta).toBe("Diagnóstico");
    expect(diagnostico?.entidad).toBe("contacto");
  });
});

describe("tokenDeCampo", () => {
  it("envuelve la clave como se escribe en la plantilla", () => {
    expect(tokenDeCampo("contacto.nombre")).toBe("{{contacto.nombre}}");
  });
});

describe("rellenarCampos", () => {
  it("sustituye los tokens por sus valores", () => {
    const resultado = rellenarCampos(
      "Hola {{contacto.nombre}}, de {{empresa.nombre}}",
      { "contacto.nombre": "Ana", "empresa.nombre": "Acme" },
    );

    expect(resultado).toBe("Hola Ana, de Acme");
  });

  it("tolera espacios dentro de las llaves", () => {
    expect(
      rellenarCampos("Hola {{ contacto.nombre }}", {
        "contacto.nombre": "Ana",
      }),
    ).toBe("Hola Ana");
  });

  it("deja vacío un campo conocido pero sin valor, no el token", () => {
    // Al destinatario le llegaría «Hola {{contacto.nombre}}», que es peor
    // que un saludo escueto.
    const resultado = rellenarCampos("Hola {{contacto.nombre}}", {
      "contacto.nombre": null,
    });

    expect(resultado).toBe("Hola ");
  });

  it("deja intacto un token que no existe, para que se note al revisar", () => {
    const resultado = rellenarCampos("Hola {{contacto.inventado}}", {
      "contacto.nombre": "Ana",
    });

    expect(resultado).toBe("Hola {{contacto.inventado}}");
  });

  it("sustituye todas las apariciones del mismo campo", () => {
    expect(
      rellenarCampos("{{contacto.nombre}} y {{contacto.nombre}}", {
        "contacto.nombre": "Ana",
      }),
    ).toBe("Ana y Ana");
  });

  it("convierte los números a texto", () => {
    expect(
      rellenarCampos("Importe: {{oportunidad.importe}}", {
        "oportunidad.importe": 45000,
      }),
    ).toBe("Importe: 45000");
  });
});
