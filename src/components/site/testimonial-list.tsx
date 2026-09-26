import type { PublicTestimonial } from "@/features/proof/application/public-proof";

/**
 * Lista de depoimentos reais (docs/01 §20). A nota vira texto para leitor de tela ("Nota 5 de
 * 5"); as estrelas são só ornamento. A data mostra mês e ano: a origem (Google) informa datas
 * aproximadas, e um dia exato seria precisão inventada.
 */
const SOURCE_LABEL = { GOOGLE: "Avaliação no Google", MANUAL: "Depoimento enviado à DM" } as const;

const monthYear = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function TestimonialList({ items }: { items: PublicTestimonial[] }) {
  return (
    <ul className="grid grid-cols-1 gap-xl md:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => (
        <li key={t.id}>
          <figure className="flex h-full flex-col rounded-control border border-border bg-surface-raised p-lg">
            {t.rating ? (
              <p className="mb-sm font-sans text-body-sm text-text">
                <span aria-hidden="true">{"★".repeat(t.rating)}</span>
                <span className="sr-only">Nota {t.rating} de 5</span>
              </p>
            ) : null}
            <blockquote className="flex-1 font-serif text-article text-text">
              <p>&ldquo;{t.quote}&rdquo;</p>
            </blockquote>
            <figcaption className="mt-md font-sans text-body-sm text-text-secondary">
              <cite className="font-semibold text-text not-italic">{t.authorName}</cite>
              {t.authorDetail ? <span>, {t.authorDetail}</span> : null}
              <span className="mt-2xs block text-caption">
                {SOURCE_LABEL[t.source]}
                {t.givenAt ? (
                  <>
                    {" · "}
                    <time dateTime={t.givenAt.toISOString().slice(0, 7)}>
                      {monthYear.format(t.givenAt)}
                    </time>
                  </>
                ) : null}
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
