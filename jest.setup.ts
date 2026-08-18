import "@testing-library/jest-dom";

/**
 * jsdom no implementa estas APIs y varios componentes de la interfaz las usan.
 * Sin ellas, las pruebas fallan por el entorno y no por el codigo.
 */
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

if (!window.matchMedia) {
  window.matchMedia = ((consulta: string) => ({
    matches: false,
    media: consulta,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
