import { describe, expect, it } from "vitest";

import {
  COLOR_PRINCIPAL_POR_DEFECTO,
  envolverEnPlantilla,
} from "./plantillaBase";

const contenido = "<p>Hola {{contacto.nombre}}</p>";

describe("envolverEnPlantilla", () => {
  it("arma el correo sobre tablas, que es lo que entiende Outlook", () => {
    const html = envolverEnPlantilla({ contenidoHtml: contenido });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('role="presentation"');
    expect(html).toContain("<table");
  });

  it("mete los estilos EN LÍNEA en el contenido del editor", () => {
    // Una hoja de estilos no sobrevive: Gmail recorta <style> y Outlook la
    // ignora. Sin esto el correo llega como texto plano.
    const html = envolverEnPlantilla({ contenidoHtml: contenido });

    expect(html).toMatch(/<p style="[^"]*font-size:16px/);
  });

  it("respeta un estilo que ya traiga la etiqueta", () => {
    const html = envolverEnPlantilla({
      contenidoHtml: '<p style="color:red;">Hola</p>',
    });

    expect(html).toContain('<p style="color:red;">');
  });

  it("pinta el logo en la cabecera cuando se sube uno", () => {
    const html = envolverEnPlantilla({
      contenidoHtml: contenido,
      logoUrl: "https://cdn.example.com/logo.png",
    });

    expect(html).toContain('src="https://cdn.example.com/logo.png"');
  });

  it("no deja un hueco de cabecera si no hay logo", () => {
    const html = envolverEnPlantilla({ contenidoHtml: contenido });

    expect(html).not.toContain("<img");
  });

  it("usa el color elegido en los títulos y el botón", () => {
    const html = envolverEnPlantilla({
      contenidoHtml: "<h2>Título</h2>",
      colorPrincipal: "#ff6600",
      ctaTexto: "Empezar",
      ctaUrl: "https://ejemplo.com",
    });

    expect(html).toContain("#ff6600");
    expect(html).toContain('bgcolor="#ff6600"');
  });

  it("ignora un color que no sea un color, para no colar nada en el style", () => {
    const html = envolverEnPlantilla({
      contenidoHtml: contenido,
      colorPrincipal: "red;background:url(javascript:alert(1))",
    });

    expect(html).not.toContain("javascript:");
    expect(html).toContain(COLOR_PRINCIPAL_POR_DEFECTO);
  });

  it("arma el botón con tabla y bgcolor, no con un enlace suelto", () => {
    // Un <a> con background en CSS pierde el fondo en Outlook.
    const html = envolverEnPlantilla({
      contenidoHtml: contenido,
      ctaTexto: "Agendar demo",
      ctaUrl: "https://ejemplo.com/demo",
    });

    expect(html).toContain("Agendar demo");
    expect(html).toContain('href="https://ejemplo.com/demo"');
    expect(html).toContain("bgcolor=");
  });

  it("no pinta botón si falta el texto o la dirección", () => {
    const soloTexto = envolverEnPlantilla({
      contenidoHtml: contenido,
      ctaTexto: "Agendar",
    });

    expect(soloTexto).not.toContain("bgcolor=");
  });

  it("escapa el texto del botón para no romper el HTML", () => {
    const html = envolverEnPlantilla({
      contenidoHtml: contenido,
      ctaTexto: "<script>alert(1)</script>",
      ctaUrl: "https://ejemplo.com",
    });

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("quita del contenido lo que nunca debe viajar en un correo", () => {
    const html = envolverEnPlantilla({
      contenidoHtml:
        '<p>Hola</p><script>alert(1)</script><img src="x" onerror="alert(1)">',
    });

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("onerror");
  });

  it("deja intactos los campos de fusión, que se sustituyen después", () => {
    const html = envolverEnPlantilla({ contenidoHtml: contenido });

    expect(html).toContain("{{contacto.nombre}}");
  });
});
