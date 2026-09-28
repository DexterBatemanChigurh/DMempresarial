"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import { LandmarkIcon, SlidersIcon, TargetIcon, WalletCardsIcon } from "@/components/ui/icons";

/**
 * "O que fazemos": quatro frentes em volta de uma roda. Passar o mouse (ou focar pelo teclado,
 * ou tocar) num ícone ou num card acende o par correspondente. Texto e paleta definidos pelo
 * usuário; a paleta vive em globals.css (`--color-roda-*`).
 */
type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type Accent = "teal" | "blue";

type Service = {
  id: number;
  title: string;
  short: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  position: Position;
  accent: Accent;
};

const SERVICES: Service[] = [
  {
    id: 1,
    title: "Recuperação de crédito",
    short:
      "Negociamos diretamente com os bancos para reorganizar dívidas, alongar prazos e devolver fôlego financeiro ao negócio.",
    Icon: LandmarkIcon,
    position: "top-left",
    accent: "teal",
  },
  {
    id: 2,
    title: "Reorganização de dívidas",
    short:
      "Mapeamento de tudo que a empresa deve, prioridades de pagamento e um plano compatível com o caixa real.",
    Icon: WalletCardsIcon,
    position: "top-right",
    accent: "blue",
  },
  {
    id: 3,
    title: "Consultoria estratégica",
    short:
      "Identificamos o que está travando o crescimento e montamos um plano de ação com prazo e responsável.",
    Icon: TargetIcon,
    position: "bottom-left",
    accent: "blue",
  },
  {
    id: 4,
    title: "Reestruturação de gestão",
    short:
      "Reorganizamos processos, estrutura e indicadores para recuperar o controle da operação.",
    Icon: SlidersIcon,
    position: "bottom-right",
    accent: "teal",
  },
];

const ACCENT_TEXT: Record<Accent, string> = {
  teal: "text-roda-turquesa",
  blue: "text-roda-azul",
};

const ICON_POSITION: Record<Position, string> = {
  "top-left": "top-[8%] left-[8%] max-[600px]:top-[7%] max-[600px]:left-[4%]",
  "top-right": "top-[8%] right-[8%] max-[600px]:top-[7%] max-[600px]:right-[4%]",
  "bottom-left": "bottom-[8%] left-[8%] max-[600px]:bottom-[7%] max-[600px]:left-[4%]",
  "bottom-right": "bottom-[8%] right-[8%] max-[600px]:bottom-[7%] max-[600px]:right-[4%]",
};

// Abaixo de 900px as colunas somem (`contents`) e os cards seguem a roda na ordem 01 → 04.
const CARD_ORDER: Record<number, string> = {
  1: "max-[900px]:order-2",
  2: "max-[900px]:order-3",
  3: "max-[900px]:order-4",
  4: "max-[900px]:order-5",
};

const LEFT = SERVICES.filter((s) => s.position.endsWith("left"));
const RIGHT = SERVICES.filter((s) => s.position.endsWith("right"));

export function ServicesWheel() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section
      aria-labelledby="home-o-que-fazemos"
      className="relative w-full overflow-hidden bg-roda-branco px-[6vw] py-[110px] text-roda-marinho max-[600px]:px-[22px] max-[600px]:py-[75px]"
    >
      <div className="mb-[45px] max-w-[860px]">
        <p className="flex items-center gap-[12px] font-sans text-[13px] font-bold tracking-[0.14em] uppercase">
          <span aria-hidden="true" className="block h-[2px] w-8 bg-roda-turquesa" />O que fazemos
        </p>
        <h2
          id="home-o-que-fazemos"
          className="mt-[18px] mb-[14px] font-serif text-[clamp(32px,4vw,52px)] leading-[1.05] font-medium tracking-[-0.035em] max-[600px]:text-[34px]"
        >
          Quatro frentes, aplicadas na ordem <br className="max-[600px]:hidden" />
          que o seu caso exigir.
        </h2>
        <p className="max-w-[600px] font-sans text-[17px] leading-[1.65] text-roda-texto max-[600px]:text-[15px]">
          Começamos sempre por entender o caixa antes de propor qualquer coisa.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-[1450px] grid-cols-[minmax(250px,1fr)_minmax(500px,620px)_minmax(250px,1fr)] items-center gap-[35px] max-[1150px]:grid-cols-[220px_minmax(430px,520px)_220px] max-[1150px]:gap-[10px] max-[900px]:grid-cols-1 max-[900px]:gap-[35px]">
        <Column services={LEFT} active={active} setActive={setActive} />

        <div className="relative mx-auto aspect-square w-full max-w-[620px] max-[900px]:order-1 max-[900px]:w-[min(90vw,580px)] max-[600px]:w-full">
          <svg viewBox="0 0 600 600" aria-hidden="true" className="absolute inset-0 size-full">
            <circle cx="300" cy="300" r="220" className="fill-none stroke-roda-linha" />
            <circle cx="300" cy="300" r="168" className="fill-none stroke-roda-linha-suave" />
            <line x1="300" y1="80" x2="300" y2="520" className="stroke-roda-raio" />
            <line x1="80" y1="300" x2="520" y2="300" className="stroke-roda-raio" />
            <line x1="145" y1="145" x2="455" y2="455" className="stroke-roda-raio opacity-55" />
            <line x1="455" y1="145" x2="145" y2="455" className="stroke-roda-raio opacity-55" />
            <circle
              cx="145"
              cy="145"
              r="4"
              className="fill-roda-turquesa stroke-roda-branco stroke-3"
            />
            <circle
              cx="455"
              cy="145"
              r="4"
              className="fill-roda-azul stroke-roda-branco stroke-3"
            />
            <circle
              cx="145"
              cy="455"
              r="4"
              className="fill-roda-azul stroke-roda-branco stroke-3"
            />
            <circle
              cx="455"
              cy="455"
              r="4"
              className="fill-roda-turquesa stroke-roda-branco stroke-3"
            />
          </svg>

          {/* Centro com o aro de duas cores. Sem arquivo de logo no projeto ainda: o nome em
              serifa ocupa o lugar dela. */}
          <div className="absolute top-1/2 left-1/2 flex aspect-square w-[52%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-roda-branco/95 shadow-roda-centro ring-1 ring-roda-linha ring-inset before:absolute before:-inset-[2px] before:-rotate-[25deg] before:rounded-full before:border-2 before:border-transparent before:border-t-roda-turquesa before:border-r-roda-azul max-[600px]:w-[48%]">
            <p className="text-center font-serif text-[clamp(1.4rem,3.2vw,2.6rem)] leading-[1.05] font-medium">
              DM
              <br />
              Empresarial
            </p>
          </div>

          {SERVICES.map(({ id, title, Icon, position, accent }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                aria-label={title}
                aria-pressed={isActive}
                onMouseEnter={() => setActive(id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(id)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(isActive ? null : id)}
                className={`absolute flex size-[90px] cursor-pointer flex-col items-center justify-center rounded-full transition-transform duration-300 ease-standard focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-roda-azul motion-reduce:transition-none max-[600px]:size-[65px] ${ACCENT_TEXT[accent]} ${ICON_POSITION[position]} ${isActive ? "scale-[1.08]" : "hover:scale-[1.08]"}`}
              >
                <span className="absolute -top-[17px] -left-1 font-sans text-[13px] font-bold">
                  0{id}
                </span>
                <span
                  className={`flex size-[72px] items-center justify-center rounded-full bg-roda-branco text-roda-marinho ring-inset transition-shadow duration-300 motion-reduce:transition-none max-[600px]:size-[55px] ${isActive ? "shadow-roda-icone-ativo ring-2 ring-roda-marinho" : "shadow-roda-icone ring-1 ring-roda-linha"}`}
                >
                  <Icon strokeWidth={1.7} className="size-[31px] max-[600px]:size-[23px]" />
                </span>
              </button>
            );
          })}
        </div>

        <Column services={RIGHT} active={active} setActive={setActive} />
      </div>
    </section>
  );
}

function Column({
  services,
  active,
  setActive,
}: {
  services: Service[];
  active: number | null;
  setActive: (id: number | null) => void;
}) {
  return (
    <div
      className={`flex h-[600px] flex-col justify-between max-[1150px]:h-[520px] max-[900px]:contents`}
    >
      {services.map((service) => (
        <article
          key={service.id}
          onMouseEnter={() => setActive(service.id)}
          onMouseLeave={() => setActive(null)}
          className={`relative max-w-[390px] ${CARD_ORDER[service.id]} transition-transform duration-[350ms] ease-standard motion-reduce:transition-none max-[900px]:max-w-full ${active === service.id ? "-translate-y-1" : "hover:-translate-y-1"}`}
        >
          <p
            aria-hidden="true"
            className={`mb-3 flex items-center gap-[10px] font-sans text-[15px] font-bold ${ACCENT_TEXT[service.accent]}`}
          >
            0{service.id}
            <span className="block h-px w-8 bg-current" />
          </p>
          <h3 className="mb-[13px] font-sans text-[22px] leading-[1.12] font-bold tracking-[-0.015em] text-roda-marinho uppercase max-[1150px]:text-[18px] max-[600px]:text-[20px]">
            {service.title}
          </h3>
          <p className="max-w-[380px] font-sans text-[15px] leading-[1.65] text-roda-texto-card max-[1150px]:text-[14px] max-[600px]:text-[15px]">
            {service.short}
          </p>
        </article>
      ))}
    </div>
  );
}
