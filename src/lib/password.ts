import { randomInt } from "node:crypto";

export { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "./password-policy.ts";

// Sem caracteres ambíguos (0/O, 1/l/I) para facilitar a digitação de senhas temporárias.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassword(length = 24): string {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}
