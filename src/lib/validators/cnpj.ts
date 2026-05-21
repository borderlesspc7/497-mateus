/** Remove tudo que não for dígito. */
export function stripCnpjDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 14);
}

/** Formata 14 dígitos como 00.000.000/0000-00 */
export function formatCnpj(digits: string): string {
  const d = stripCnpjDigits(digits);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

function calcCnpjCheckDigit(base: string, weights: number[]): number {
  const sum = base
    .split("")
    .reduce((acc, digit, index) => acc + Number(digit) * weights[index]!, 0);
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

/** Valida CNPJ (14 dígitos + dígitos verificadores). Rejeita sequências repetidas. */
export function isValidCnpj(value: string): boolean {
  const digits = stripCnpjDigits(value);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const base12 = digits.slice(0, 12);
  const d1 = calcCnpjCheckDigit(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calcCnpjCheckDigit(`${base12}${d1}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return digits === `${base12}${d1}${d2}`;
}

export function validateCnpjOrThrow(value: string): string {
  const digits = stripCnpjDigits(value);
  if (digits.length !== 14) {
    throw new Error("Informe um CNPJ completo com 14 dígitos.");
  }
  if (!isValidCnpj(digits)) {
    throw new Error("CNPJ inválido. Verifique os números informados.");
  }
  return digits;
}
