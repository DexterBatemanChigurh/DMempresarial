import { randomInt } from "node:crypto";

// Sem caracteres ambíguos (0/O, 1/l/I) para facilitar a digitação de senhas temporárias.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const MIN_PASSWORD_LENGTH = 12;

export function generatePassword(length = 24): string {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}
