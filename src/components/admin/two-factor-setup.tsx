"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button, CheckboxField, FormMessage, Heading, Text, TextField } from "@/components/ui";
import { authClient } from "./auth-client";
import { twoFactorErrorMessage } from "./auth-messages";

type Enrollment = { totpURI: string; backupCodes: string[] };

/** Segredo em texto (para digitar no app quando não dá para ler o QR), tirado do URI otpauth. */
function secretFromUri(uri: string): string {
  try {
    return new URL(uri).searchParams.get("secret") ?? "";
  } catch {
    return "";
  }
}

export function TwoFactorSetup({ enabled, next }: { enabled: boolean; next: string }) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // O QR é gerado no navegador (o segredo não passa por outro serviço) e só quando necessário.
  useEffect(() => {
    if (!enrollment) return;
    let cancelled = false;
    import("qrcode").then(({ toDataURL }) =>
      toDataURL(enrollment.totpURI, { margin: 1, width: 220 }).then((url) => {
        if (!cancelled) setQr(url);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [enrollment]);

  if (enabled) {
    return (
      <FormMessage tone="success" title="Verificação em duas etapas ativa.">
        Ao entrar, você informa o código do app autenticador.
      </FormMessage>
    );
  }

  async function onStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setPending(true);
    setError(null);
    const { data, error: failure } = await authClient.twoFactor.enable({ password });
    setPending(false);
    // `method: "otp"` (código por e-mail) não é usado aqui; só o TOTP devolve QR e backup.
    if (failure || !data || data.method !== "totp") {
      setError(
        failure?.status === 429
          ? "Muitas tentativas. Aguarde alguns minutos."
          : "Senha incorreta. Confira e tente de novo.",
      );
      return;
    }
    setEnrollment({ totpURI: data.totpURI, backupCodes: data.backupCodes });
  }

  async function onConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "").trim();
    setPending(true);
    setError(null);
    const { error: failure } = await authClient.twoFactor.verifyTotp({ code });
    setPending(false);
    if (failure) return setError(twoFactorErrorMessage(failure));
    router.replace(next);
    router.refresh();
  }

  if (!enrollment) {
    return (
      <form onSubmit={onStart} className="max-w-narrow space-y-lg" noValidate>
        <Text tone="secondary">
          Vamos ativar a verificação em duas etapas. Você vai precisar de um app autenticador no
          celular (como o Google Authenticator, Microsoft Authenticator ou Authy).
        </Text>
        {error ? <FormMessage tone="error">{error}</FormMessage> : null}
        <TextField
          id="password"
          name="password"
          label="Sua senha atual"
          type="password"
          autoComplete="current-password"
          hint="Pedimos a senha para confirmar que é você."
          required
        />
        <Button type="submit" loading={pending} loadingLabel="Preparando…">
          Continuar
        </Button>
      </form>
    );
  }

  const secret = secretFromUri(enrollment.totpURI);
  return (
    <div className="max-w-narrow space-y-xl">
      <section aria-labelledby="passo-qr" className="space-y-md">
        <Heading as="h2" variant="h3" id="passo-qr">
          1. Escaneie o QR Code
        </Heading>
        <Text tone="secondary">
          Abra o app autenticador e adicione uma conta escaneando o código.
        </Text>
        {qr ? (
          // QR gerado no navegador (data URL): next/image não se aplica.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} width={220} height={220} alt="QR Code para cadastrar o app autenticador" />
        ) : (
          <Text tone="muted" size="caption">
            Gerando o QR Code…
          </Text>
        )}
        <Text size="caption" tone="secondary">
          Sem câmera? Digite esta chave no app:{" "}
          <code className="font-mono break-all">{secret}</code>
        </Text>
      </section>

      <section aria-labelledby="passo-backup" className="space-y-md">
        <Heading as="h2" variant="h3" id="passo-backup">
          2. Guarde os códigos de backup
        </Heading>
        <Text tone="secondary">
          Se perder o celular, cada código abaixo permite entrar uma única vez.{" "}
          <strong>Eles não serão mostrados de novo.</strong> Guarde em local seguro.
        </Text>
        <ul className="grid grid-cols-2 gap-xs font-mono text-body-sm">
          {enrollment.backupCodes.map((code) => (
            <li key={code} className="border border-border px-sm py-xs">
              {code}
            </li>
          ))}
        </ul>
        <CheckboxField id="saved" checked={saved} onChange={(e) => setSaved(e.target.checked)}>
          Guardei os códigos de backup em um lugar seguro.
        </CheckboxField>
      </section>

      <form onSubmit={onConfirm} className="space-y-lg" noValidate>
        <Heading as="h2" variant="h3">
          3. Confirme com um código
        </Heading>
        {error ? <FormMessage tone="error">{error}</FormMessage> : null}
        <TextField
          id="code"
          name="code"
          label="Código do app autenticador"
          hint="Os 6 números que aparecem no app."
          inputMode="numeric"
          autoComplete="one-time-code"
          required
        />
        <Button type="submit" loading={pending} loadingLabel="Verificando…" disabled={!saved}>
          Ativar verificação em duas etapas
        </Button>
        {!saved ? (
          <Text size="caption" tone="secondary">
            Marque que guardou os códigos de backup para continuar.
          </Text>
        ) : null}
      </form>
    </div>
  );
}
