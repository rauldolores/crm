import { beforeEach, describe, expect, it, vi } from "vitest";

import { telefonoParaWhatsapp } from "@/lib/whatsapp/telefono";

import { contactoParaWhatsapp } from "./contacto";

const ORGANIZACION = "org-1";

const { getServiceClient } = vi.hoisted(() => ({
  getServiceClient: vi.fn(),
}));

vi.mock("../supabase-service", () => ({ getServiceClient }));

/** La ficha que devolvería la base: .from().select().eq().maybeSingle() */
const fichaEnLaBase = (contacto: unknown) => {
  const maybeSingle = vi.fn().mockResolvedValue({ data: contacto });
  getServiceClient.mockReturnValue({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  });
};

const contacto = (phone_jsonb: unknown, organization_id = ORGANIZACION) => ({
  id: 7,
  organization_id,
  sales_id: 3,
  phone_jsonb,
});

beforeEach(() => {
  getServiceClient.mockReset();
});

describe("telefonoParaWhatsapp", () => {
  it("elige el teléfono marcado como móvil aunque no sea el primero", () => {
    expect(
      telefonoParaWhatsapp([
        { number: "5511112222", type: "Work" },
        { number: "5533334444", type: "Mobile" },
      ]),
    ).toEqual({ numero: "5533334444", esMovil: true });
  });

  it("sin móvil marcado usa el primero y lo dice, para que el diálogo avise", () => {
    expect(
      telefonoParaWhatsapp([
        { number: "5511112222", type: "Work" },
        { number: "5533334444", type: "Home" },
      ]),
    ).toEqual({ numero: "5511112222", esMovil: false });
  });

  it("no elige un móvil sin número", () => {
    expect(
      telefonoParaWhatsapp([
        { number: "", type: "Mobile" },
        { number: "5511112222", type: "Work" },
      ]),
    ).toEqual({ numero: "5511112222", esMovil: false });
  });

  it("devuelve null si no hay ningún teléfono con número", () => {
    expect(telefonoParaWhatsapp([])).toBeNull();
    expect(telefonoParaWhatsapp(null)).toBeNull();
    expect(telefonoParaWhatsapp([{ number: "   ", type: "Mobile" }])).toBeNull();
  });
});

describe("contactoParaWhatsapp", () => {
  it("envía al móvil de la ficha", async () => {
    fichaEnLaBase(
      contacto([
        { number: "5511112222", type: "Work" },
        { number: "5533334444", type: "Mobile" },
      ]),
    );

    expect(await contactoParaWhatsapp(ORGANIZACION, 7)).toEqual({
      ok: true,
      id: 7,
      salesId: 3,
      telefono: "5533334444",
    });
  });

  it("sin móvil, al primer teléfono, como antes", async () => {
    fichaEnLaBase(contacto([{ number: "5511112222", type: "Work" }]));

    const resultado = await contactoParaWhatsapp(ORGANIZACION, 7);

    expect(resultado.ok && resultado.telefono).toBe("5511112222");
  });

  it("explica que no hay teléfono", async () => {
    fichaEnLaBase(contacto([]));

    expect(await contactoParaWhatsapp(ORGANIZACION, 7)).toEqual({
      ok: false,
      estado: 400,
      mensaje: "Este contacto no tiene un teléfono registrado.",
    });
  });

  it("un contacto de otra organización responde «no encontrado»", async () => {
    fichaEnLaBase(contacto([{ number: "5511112222" }], "otra-org"));

    const resultado = await contactoParaWhatsapp(ORGANIZACION, 7);

    expect(resultado.ok === false && resultado.estado).toBe(404);
  });

  it("rechaza un id que no es un número sin consultar la base", async () => {
    const resultado = await contactoParaWhatsapp(ORGANIZACION, "abc");

    expect(resultado.ok === false && resultado.estado).toBe(400);
    expect(getServiceClient).not.toHaveBeenCalled();
  });
});
