/**
 * Círculo com os valores da DM escritos em volta (página Sobre). Os nomes vêm do CMS
 * (`about.values`) e se dividem em dois anéis: o de fora na cor do texto, o de dentro em
 * terracota. Decorativo para leitor de tela: a lista de valores logo abaixo na página diz o mesmo
 * de forma linear.
 */
const VIEW = 500;
const CENTER = VIEW / 2;
const RINGS = [
  { radius: 210, maxFont: 16.5, tracking: 0.25, className: "fill-text font-medium" },
  { radius: 160, maxFont: 19, tracking: 0.16, className: "fill-terracota font-bold" },
] as const;

/** Caminho circular que começa às 9 horas e corre no sentido horário (texto de pé no topo). */
function circlePath(r: number): string {
  return `M ${CENTER},${CENTER} m -${r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0`;
}

/**
 * Texto do anel: nomes em caixa alta separados por "•", com um "•" também na emenda. Frase curta
 * se repete até cobrir boa parte da volta (senão as letras ficam espalhadas demais), como num
 * selo circular.
 */
function ringText(names: string[], circumference: number, charWidth: number): string {
  const once = `${names.map((n) => n.trim().toUpperCase()).join(" • ")} • `;
  let text = once;
  // Aceita encolher a fonte até ~15% para caber mais uma volta da frase.
  for (let i = 0; i < 4 && (text + once).length * charWidth <= circumference * 1.15; i++) {
    text += once;
  }
  return text;
}

export function ValuesCircle({ names }: { names: string[] }) {
  // O anel de fora é maior, então recebe a metade maior da lista.
  const split = names.length === 1 ? 1 : Math.ceil(names.length / 2);
  const groups = [names.slice(0, split), names.slice(split)];

  return (
    <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[500px]">
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="absolute inset-0 size-full">
        <circle cx={CENTER} cy={CENTER} r={230} className="fill-none stroke-border" />
        <circle cx={CENTER} cy={CENTER} r={190} className="fill-none stroke-border" />
        {RINGS.map((ring, i) => {
          const group = groups[i];
          if (!group || group.length === 0) return null;
          // Ocupa a volta inteira: o espaçamento entre letras se ajusta ao comprimento do
          // círculo, e a fonte encolhe se a frase for longa demais para caber sem encavalar.
          const circumference = 2 * Math.PI * ring.radius;
          // Largura média de uma letra maiúscula (~0,7 em) mais o espaçamento entre letras.
          const advance = 0.7 + ring.tracking;
          const text = ringText(group, circumference, ring.maxFont * advance);
          const fontSize = Math.min(ring.maxFont, circumference / (text.length * advance));
          const id = `anel-valores-${i}`;
          return (
            <g key={id}>
              <defs>
                <path id={id} d={circlePath(ring.radius)} />
              </defs>
              <text
                className={`font-sans ${ring.className}`}
                style={{ fontSize, letterSpacing: `${ring.tracking}em` }}
                textLength={circumference - 2}
                lengthAdjust="spacing"
              >
                <textPath href={`#${id}`}>{text}</textPath>
              </text>
            </g>
          );
        })}
      </svg>

      <div
        data-tone="dark"
        className="absolute top-1/2 left-1/2 flex aspect-square w-[44%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-text"
      >
        <span className="font-serif text-[clamp(2.5rem,7vw,4.5rem)] leading-none font-medium">
          DM
        </span>
      </div>
    </div>
  );
}
