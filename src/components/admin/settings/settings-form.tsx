"use client";

import {
  useActionState,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
  type SVGProps,
} from "react";
import { Button, FormMessage, Heading, Text, TextField } from "@/components/ui";
import { BuildingIcon, GlobeIcon, PhoneIcon } from "@/components/ui/icons";
import { CONTACT } from "@/content/dm";
import type { ActionResult } from "@/lib/result";
import type { SettingsMutated } from "@/app/admin/(painel)/configuracoes/actions";
import { SOCIAL_PLATFORMS, type Social } from "@/features/settings/domain/settings-schema";

const SOCIAL_LABEL: Record<(typeof SOCIAL_PLATFORMS)[number], string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
};

export type SettingsFormValues = {
  legalName: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  social: Social;
};

type Props = {
  action: (
    prevState: ActionResult<SettingsMutated> | null,
    formData: FormData,
  ) => Promise<ActionResult<SettingsMutated>>;
  initial: SettingsFormValues;
};

type TabId = "empresa" | "redes" | "contato";
type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const TABS: { id: TabId; label: string; Icon: Icon; editable: boolean; fields: string[] }[] = [
  {
    id: "empresa",
    label: "Empresa",
    Icon: BuildingIcon,
    editable: true,
    fields: ["legalName", "cnpj"],
  },
  { id: "redes", label: "Redes sociais", Icon: GlobeIcon, editable: true, fields: ["social"] },
  { id: "contato", label: "Contato", Icon: PhoneIcon, editable: false, fields: [] },
];

function Panel({
  id,
  active,
  title,
  description,
  children,
}: {
  id: TabId;
  active: TabId;
  title: string;
  description: string;
  children: ReactNode;
}) {
  // `hidden` só esconde: os campos continuam dentro do <form> e são enviados junto.
  return (
    <div
      id={`painel-${id}`}
      role="tabpanel"
      aria-labelledby={`aba-${id}`}
      hidden={active !== id}
      tabIndex={0}
      className="outline-none"
    >
      <Heading as="h2" variant="h3">
        {title}
      </Heading>
      <Text size="sm" tone="secondary" className="mt-xs max-w-reading">
        {description}
      </Text>
      <div className="mt-xl space-y-lg">{children}</div>
    </div>
  );
}

/**
 * Dados reais da DM (linha única, docs/03 parte 7). Todo campo é opcional de propósito: o que
 * fica em branco some da tela pública e do JSON-LD, nunca é preenchido com placeholder.
 */
export function SettingsForm({ action, initial }: Props) {
  const [state, formAction, pending] = useActionState<
    ActionResult<SettingsMutated> | null,
    FormData
  >(action, null);
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  // Campos controlados: o React limpa o <form> depois de cada envio; sem isso, um erro de
  // validação apagaria o que a pessoa acabou de digitar.
  const [values, setValues] = useState<Record<string, string>>(() => ({
    legalName: initial.legalName,
    cnpj: initial.cnpj,
    ...Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [`social_${p}`, initial.social[p] ?? ""])),
  }));
  const bind = (name: string) => ({
    value: values[name] ?? "",
    onChange: (event: { target: { value: string } }) =>
      setValues((prev) => ({ ...prev, [name]: event.target.value })),
  });

  const [active, setActive] = useState<TabId>("empresa");
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    empresa: null,
    redes: null,
    contato: null,
  });
  const tabsWithError = TABS.filter((t) => t.fields.some((f) => fieldErrors?.[f]?.length)).map(
    (t) => t.id,
  );

  // Erro num campo de outra aba: leva a pessoa até ele, uma vez por resultado de envio (ajuste
  // durante a renderização, o padrão do React para reagir a um valor novo sem efeito).
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (tabsWithError[0]) setActive(tabsWithError[0]);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: TABS.length - 1,
    };
    const target = keys[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = TABS[(target + TABS.length) % TABS.length]!;
    setActive(next.id);
    tabRefs.current[next.id]?.focus();
  }

  const current = TABS.find((t) => t.id === active)!;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Seções das configurações"
        className="flex flex-wrap gap-x-lg border-b border-border"
      >
        {TABS.map((tab, index) => {
          const selected = tab.id === active;
          const hasError = tabsWithError.includes(tab.id);
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              id={`aba-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`painel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={`-mb-px flex min-h-11 items-center gap-xs border-b-2 font-sans text-sm font-semibold whitespace-nowrap transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                selected
                  ? "border-action text-text"
                  : "border-transparent text-text-secondary hover:text-text"
              }`}
            >
              <tab.Icon aria-hidden="true" className="size-5 shrink-0" />
              {tab.label}
              {hasError ? (
                <span className="flex items-center text-danger">
                  <span aria-hidden="true" className="size-2 rounded-full bg-current" />
                  <span className="sr-only"> (há um erro nesta seção)</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <form action={formAction} className="mt-xl max-w-reading">
        {/* Não aparecem na tela (vivem em src/content/dm.ts), mas a ação ainda grava estas
            colunas: reenviar o valor atual evita que salvar apague o que está no banco. */}
        <input type="hidden" name="address" value={initial.address} />
        <input type="hidden" name="phone" value={initial.phone} />
        <input type="hidden" name="email" value={initial.email} />
        <input type="hidden" name="whatsapp" value={initial.whatsapp} />

        <Panel
          id="empresa"
          active={active}
          title="Dados da empresa"
          description="Aparecem no rodapé do site (linha de copyright) e na identificação da empresa para buscadores."
        >
          <TextField
            id="legalName"
            label="Razão social"
            {...bind("legalName")}
            error={fieldErrors?.legalName?.[0]}
          />
          <TextField id="cnpj" label="CNPJ" {...bind("cnpj")} error={fieldErrors?.cnpj?.[0]} />
        </Panel>

        <Panel
          id="redes"
          active={active}
          title="Redes sociais"
          description="Cada link preenchido vira um ícone no rodapé do site. Em branco, o ícone não aparece."
        >
          {SOCIAL_PLATFORMS.map((platform) => (
            <TextField
              key={platform}
              id={`social_${platform}`}
              label={SOCIAL_LABEL[platform]}
              inputMode="url"
              hint="URL completa, começando com https://"
              {...bind(`social_${platform}`)}
            />
          ))}
          {fieldErrors?.social ? (
            <FormMessage tone="error">{fieldErrors.social[0]}</FormMessage>
          ) : null}
        </Panel>

        <Panel
          id="contato"
          active={active}
          title="Contato do site"
          description="Aparecem em Contato, no rodapé e no botão do WhatsApp. Ficam fixos no código: para mudar, edite src/content/dm.ts."
        >
          <dl className="border-t border-border">
            {[
              ["Telefone", CONTACT.phone],
              ["WhatsApp", CONTACT.whatsapp],
              ["E-mail", CONTACT.email],
              ["Endereço", CONTACT.address],
              ["Horário", CONTACT.hours],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-border py-sm">
                <dt className="font-sans text-caption font-semibold text-text-secondary">
                  {label}
                </dt>
                <dd className="mt-2xs font-sans text-body-sm break-words text-text">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        {current.editable ? (
          <div className="mt-2xl flex flex-col-reverse gap-md border-t border-border pt-lg sm:flex-row sm:items-center sm:justify-end">
            <div className="min-w-0 flex-1">
              {state && !state.ok ? (
                <FormMessage tone="error">{state.error.message}</FormMessage>
              ) : null}
              {state?.ok ? <FormMessage tone="success">Alterações salvas.</FormMessage> : null}
            </div>
            <Button type="submit" loading={pending} loadingLabel="Salvando…">
              Salvar alterações
            </Button>
          </div>
        ) : null}
      </form>
    </div>
  );
}
