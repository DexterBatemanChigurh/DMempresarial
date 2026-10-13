// Política de senha ÚNICA (Better Auth, bootstrap do primeiro admin e mensagens do painel).
// Isomórfica: o formulário de troca de senha (cliente) também a lê. Mínimo de 12 porque o painel
// não tem segundo fator; máximo alto (NIST 800-63B: aceitar ao menos 64) para não barrar
// gerenciadores de senha — o teto só evita abuso de CPU no hash.
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;
