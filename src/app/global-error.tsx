"use client";

import "./globals.css";

// Substitui o layout raiz quando ele próprio falha: precisa do próprio <html>, <body> e CSS.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="grid min-h-screen place-items-center bg-surface px-md font-sans text-text">
        <title>Erro · DM Empresarial</title>
        <main className="max-w-reading">
          <p className="text-label font-semibold tracking-[0.12em] uppercase">DM Empresarial</p>
          <h1 className="mt-sm font-serif text-h1 font-medium">Algo deu errado</h1>
          <p className="mt-md text-text-secondary">
            O site não conseguiu carregar agora. Tente de novo em instantes.
          </p>
          <div className="mt-xl flex flex-wrap items-center gap-md">
            <button
              type="button"
              onClick={() => retry()}
              className="min-h-11 rounded-control bg-action px-lg font-semibold text-action-contrast hover:bg-action-hover"
            >
              Tentar de novo
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="inline-flex min-h-11 items-center text-link underline">
              Ir para a Home
            </a>
          </div>
          {error.digest ? (
            <p className="mt-lg text-caption text-text-secondary">Código: {error.digest}</p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
