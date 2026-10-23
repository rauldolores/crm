import { describe, expect, test } from "vitest";

import {
  elegirProyecto,
  leerProyectos,
  proyectoPorDireccion,
  type ProyectosDeOrganizacion,
} from "./proyectos";

const KONTROLIA = {
  value: "kontrolia",
  label: "Kontrolia",
  email: "hola@kontrolia.io",
  fromName: null,
};
const ADUANIAX = {
  value: "aduaniax",
  label: "AduaniaX",
  email: "hola@aduaniax.com",
  fromName: "AduaniaX",
};
const FAQTURIA = {
  value: "faqturia",
  label: "Faqturia",
  email: null,
  fromName: null,
};

const ORG: ProyectosDeOrganizacion = {
  proyectos: [KONTROLIA, ADUANIAX, FAQTURIA],
  predeterminado: "kontrolia",
};

describe("elegirProyecto", () => {
  test("sale del único proyecto de la empresa", () => {
    expect(elegirProyecto(ORG, { deLaEmpresa: ["aduaniax"] })).toEqual({
      tipo: "proyecto",
      proyecto: ADUANIAX,
    });
  });

  test("con varios proyectos, a mano se pregunta", () => {
    expect(
      elegirProyecto(ORG, {
        deLaEmpresa: ["aduaniax", "faqturia"],
        puedePreguntar: true,
      }),
    ).toEqual({ tipo: "preguntar", opciones: [ADUANIAX, FAQTURIA] });
  });

  test("con varios y sin nadie a quien preguntar, el predeterminado", () => {
    expect(
      elegirProyecto(ORG, { deLaEmpresa: ["aduaniax", "faqturia"] }),
    ).toEqual({ tipo: "proyecto", proyecto: KONTROLIA });
  });

  test("lo que eligió quien envía manda sobre todo lo demás", () => {
    expect(
      elegirProyecto(ORG, {
        elegido: "faqturia",
        fijo: ["aduaniax"],
        deLaEmpresa: ["aduaniax"],
      }),
    ).toEqual({ tipo: "proyecto", proyecto: FAQTURIA });
  });

  test("la plantilla o la conversación mandan sobre la empresa", () => {
    expect(
      elegirProyecto(ORG, {
        fijo: [null, "aduaniax"],
        deLaEmpresa: ["aduaniax", "faqturia"],
        puedePreguntar: true,
      }),
    ).toEqual({ tipo: "proyecto", proyecto: ADUANIAX });
  });

  test("una empresa sin proyectos usa el predeterminado", () => {
    expect(elegirProyecto(ORG, { deLaEmpresa: [] })).toEqual({
      tipo: "proyecto",
      proyecto: KONTROLIA,
    });
  });

  test("un proyecto que ya no existe se ignora", () => {
    expect(
      elegirProyecto(ORG, { elegido: "borrado", deLaEmpresa: ["borrado"] }),
    ).toEqual({ tipo: "proyecto", proyecto: KONTROLIA });
  });

  test("una organización sin proyectos no elige ninguno", () => {
    expect(
      elegirProyecto(
        { proyectos: [], predeterminado: null },
        { deLaEmpresa: ["x"] },
      ),
    ).toEqual({ tipo: "proyecto", proyecto: null });
  });
});

describe("leerProyectos", () => {
  test("normaliza direcciones y descarta lo que no es un proyecto", () => {
    expect(
      leerProyectos({
        projects: [
          { value: "a", label: "A", email: " Hola@A.com " },
          { label: "sin value" },
          null,
        ],
        defaultProject: "a",
      }),
    ).toEqual({
      proyectos: [{ value: "a", label: "A", email: "hola@a.com", fromName: null }],
      predeterminado: "a",
    });
  });

  test("si el predeterminado no existe, toma el primero", () => {
    expect(
      leerProyectos({
        projects: [{ value: "a", label: "A" }],
        defaultProject: "zz",
      }).predeterminado,
    ).toBe("a");
  });

  test("sin configuración, sin proyectos", () => {
    expect(leerProyectos(undefined)).toEqual({
      proyectos: [],
      predeterminado: null,
    });
  });
});

describe("proyectoPorDireccion", () => {
  test("el correo es del proyecto cuya dirección lo recibió", () => {
    expect(
      proyectoPorDireccion(ORG.proyectos, ["otra@x.com", "Hola@AduaniaX.com"]),
    ).toEqual(ADUANIAX);
    expect(proyectoPorDireccion(ORG.proyectos, ["otra@x.com"])).toBeNull();
  });
});
