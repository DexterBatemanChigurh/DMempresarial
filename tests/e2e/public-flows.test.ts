import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function checkA11y(page: import("@playwright/test").Page) {
  const builder = new AxeBuilder({ page });
  const results = await builder.analyze();
  if (results.violations.length > 0) {
    const details = results.violations
      .map((v) => `${v.id}: ${v.description} (${v.nodes.length} nodes)`)
      .join("\n");
    throw new Error(`Acessibilidade falhou:\n${details}`);
  }
}

test.describe("Navegação pública", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Home carrega e tem título", async ({ page }) => {
    await expect(page).toHaveTitle(/DM Empresarial/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Menu navega para Sobre", async ({ page }) => {
    await page.getByRole("link", { name: /sobre/i }).click();
    await expect(page).toHaveURL(/.*sobre/);
    await expect(page.locator("h1")).toContainText(/sobre/i);
  });

  test("Menu navega para Soluções", async ({ page }) => {
    await page.getByRole("link", { name: /soluções/i }).click();
    await expect(page).toHaveURL(/.*solucoes/);
    await expect(page.locator("h1")).toContainText(/soluções/i);
  });

  test("Menu navega para Blog", async ({ page }) => {
    await page.getByRole("link", { name: /blog/i }).click();
    await expect(page).toHaveURL(/.*blog/);
    await expect(page.locator("h1")).toContainText(/blog/i);
  });

  test("Menu navega para Contato", async ({ page }) => {
    await page.getByRole("link", { name: /contato/i }).click();
    await expect(page).toHaveURL(/.*contato/);
    await expect(page.locator("h1")).toContainText(/contato/i);
  });

  test("Menu navega para Depoimentos", async ({ page }) => {
    await page.getByRole("link", { name: /depoimentos/i }).click();
    await expect(page).toHaveURL(/.*depoimentos/);
    await expect(page.locator("h1")).toContainText(/depoimentos/i);
  });
});

test.describe("Acessibilidade (WCAG 2.2 AA)", () => {
  test("Home passa no axe-core", async ({ page }) => {
    await page.goto("/");
    await checkA11y(page);
  });

  test("Sobre passa no axe-core", async ({ page }) => {
    await page.goto("/sobre");
    await checkA11y(page);
  });

  test("Soluções passa no axe-core", async ({ page }) => {
    await page.goto("/solucoes");
    await checkA11y(page);
  });

  test("Blog passa no axe-core", async ({ page }) => {
    await page.goto("/blog");
    await checkA11y(page);
  });

  test("Contato passa no axe-core", async ({ page }) => {
    await page.goto("/contato");
    await checkA11y(page);
  });

  test("Depoimentos passa no axe-core", async ({ page }) => {
    await page.goto("/depoimentos");
    await checkA11y(page);
  });
});

test.describe("Formulário de contato", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contato");
  });

  test("Valida campos obrigatórios", async ({ page }) => {
    await page.getByRole("button", { name: /enviar/i }).click();
    await expect(page.getByText(/informe seu nome/i)).toBeVisible();
    await expect(page.getByText(/e-mail inválido/i)).toBeVisible();
    await expect(page.getByText(/escreva sua mensagem/i)).toBeVisible();
    await expect(page.getByText(/é preciso aceitar/i)).toBeVisible();
  });

  test("Envia formulário válido (honeypot vazio)", async ({ page }) => {
    await page.fill('[name="name"]', "João Teste");
    await page.fill('[name="email"]', "joao@teste.example.test");
    await page.fill('[name="message"]', "Preciso de ajuda com gestão financeira da empresa.");
    await page.check('[name="consent"]');
    await page.getByRole("button", { name: /enviar/i }).click();
    await expect(page.getByText(/enviado com sucesso/i)).toBeVisible({ timeout: 10000 });
  });

  test("Honeypot preenchido não envia", async ({ page }) => {
    await page.fill('[name="name"]', "Bot");
    await page.fill('[name="email"]', "bot@teste.example.test");
    await page.fill('[name="message"]', "spam spam spam");
    await page.check('[name="consent"]');
    await page.fill('[name="honeypot"]', "sou um robô");
    await page.getByRole("button", { name: /enviar/i }).click();
    await expect(page.getByText(/enviado com sucesso/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Newsletter double-opt-in", () => {
  test("Inscrição cria status PENDING", async ({ page }) => {
    await page.goto("/");
    await page.fill('[name="email"]', `news-${Date.now()}@teste.example.test`);
    await page.check('[name="consent"]');
    await page.getByRole("button", { name: /inscrever/i }).click();
    await expect(page.getByText(/verifique seu e-mail/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Admin - redirecionamento sem sessão", () => {
  test("Acesso a /admin redireciona para login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/.*admin\/login/);
  });
});

test.describe("404 e páginas legais", () => {
  test("Página inexistente mostra 404 personalizada", async ({ page }) => {
    await page.goto("/pagina-que-nao-existe");
    await expect(page.locator("h1")).toContainText(/não encontrada/i);
  });

  test("Política de privacidade carrega", async ({ page }) => {
    await page.goto("/politica-de-privacidade");
    await expect(page.locator("h1")).toContainText(/privacidade/i);
  });

  test("Termos de uso carrega", async ({ page }) => {
    await page.goto("/termos-de-uso");
    await expect(page.locator("h1")).toContainText(/termos/i);
  });
});
