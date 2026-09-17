/**
 * Vuelta a la raíz con recarga completa tras cambiar de organización: todo
 * lo cargado era de la anterior. En su propio módulo para poder sustituirlo
 * en pruebas sin navegar de verdad.
 */
export const recargarEnLaRaiz = (): void => {
  window.location.href = "/";
};
