// Cria o primeiro administrador do painel. Uso (a senha NUNCA vai na linha de comando):
//   BOOTSTRAP_ADMIN_EMAIL=pessoa@exemplo.com npm run admin:bootstrap
// Sem BOOTSTRAP_ADMIN_PASSWORD, gera uma senha aleatória e a mostra UMA vez.
import { createFirstAdmin, generatePassword } from "./lib/admin-bootstrap.mts";

const adminUrl = process.env.DATABASE_URL_ADMIN;
const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
if (!adminUrl || !email) {
  console.error("Defina DATABASE_URL_ADMIN e BOOTSTRAP_ADMIN_EMAIL.");
  process.exit(1);
}
const name = process.env.BOOTSTRAP_ADMIN_NAME ?? "Administrador";
const provided = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const password = provided ?? generatePassword();

try {
  await createFirstAdmin(adminUrl, { email, name, password });
  console.log(`Administrador criado: ${email.trim().toLowerCase()}`);
  if (!provided) {
    console.log(`Senha inicial (mostrada só agora, guarde-a): ${password}`);
  }
  console.log("No primeiro acesso, configure o 2FA (obrigatório) e troque a senha.");
} catch (error) {
  console.error(`Falha: ${error instanceof Error ? error.message : "erro desconhecido"}`);
  process.exitCode = 1;
}
