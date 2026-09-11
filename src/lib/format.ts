/**
 * Utility functions for formatting values in the UI.
 */

export function formatPriceRange(min: number, max: number): string {
  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

  return `${formatter.format(min)} – ${formatter.format(max)}`;
}
