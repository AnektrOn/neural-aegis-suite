/** Prefix values that spreadsheets would treat as formulas so they render as plain text. */
export function neutralizeCsvFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
