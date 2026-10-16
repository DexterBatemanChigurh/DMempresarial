"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Container, Heading, Section, SectionLabel } from "@/components/ui";
import { TESTIMONIALS } from "@/content/dm";
import { cn } from "@/lib/cn";

/**
 * Depoimentos em vídeo (YouTube, verticais). Nada do YouTube é carregado antes do clique: a capa
 * é uma imagem local e o iframe (domínio youtube-nocookie) só entra quando o visitante dá play.
 *
 * No desktop, ao rolar até a seção, os cards chegam empilhados como um leque de cartas e se abrem
 * lado a lado acompanhando a rolagem (animação guiada pela rolagem em globals.css, classe
 * `depoimentos-leque`). Sem suporte no navegador ou com movimento reduzido, aparecem já abertos.
 * Com mais de 4 vídeos, o desktop também vira carrossel (setas ‹ › e deslize), sem o leque. No
 * celular é sempre carrossel.
 */
/** Quantos cards cabem lado a lado no desktop; acima disso, carrossel. */
const VISIBLE_DESKTOP = 4;
/** Sem vídeos cadastrados: em desenvolvimento a área aparece com cards "em breve" (para ver o
 * espaço); em produção a seção não aparece, para o visitante nunca ver algo inacabado. */
const PLACEHOLDER_COUNT = 4;
const CARD_CLASS = "w-[78%] max-w-[280px] shrink-0 snap-center lg:w-[260px] lg:snap-start";
const PLAY_PATH = "M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z";

export function VideoTestimonials() {
  const [playing, setPlaying] = useState<string | null>(null);
  const items = TESTIMONIALS.items;
  const showPlaceholders = items.length === 0 && process.env.NODE_ENV !== "production";
  const count = items.length > 0 ? items.length : PLACEHOLDER_COUNT;
  const isCarousel = count > VISIBLE_DESKTOP;
  const middle = (count - 1) / 2;
  const lequeStyle = (i: number) => {
    const offset = i - middle;
    return {
      "--leque-x": `${-offset * 100}%`,
      "--leque-r": `${offset * 7}deg`,
      zIndex: count - Math.abs(Math.round(offset)),
    } as CSSProperties;
  };

  // Setas do carrossel: rolam um card por vez e se desligam nas pontas.
  const listRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const updateEdges = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setEdges({
      start: list.scrollLeft <= 4,
      end: list.scrollLeft + list.clientWidth >= list.scrollWidth - 4,
    });
  }, []);
  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);
  const scrollByCard = (direction: 1 | -1) => {
    const list = listRef.current;
    const card = list?.firstElementChild as HTMLElement | null;
    if (!list || !card) return;
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    const step = card.offsetWidth + gap;
    // Alvo pelo índice do card (não pela posição atual): cliques rápidos durante a animação
    // não se perdem.
    const target = (Math.round(list.scrollLeft / step) + direction) * step;
    list.scrollTo({ left: target, behavior: "smooth" });
  };

  if (items.length === 0 && !showPlaceholders) return null;

  return (
    <Section
      tone="muted"
      spacing="loose"
      aria-labelledby="home-depoimentos"
      className="overflow-x-clip"
    >
      <Container>
        <SectionLabel>{TESTIMONIALS.label}</SectionLabel>
        <div className="mt-md flex items-end justify-between gap-lg">
          <Heading as="h2" variant="h2" id="home-depoimentos">
            {TESTIMONIALS.heading}
          </Heading>
          {isCarousel ? (
            <div className="hidden shrink-0 gap-sm lg:flex">
              <ArrowButton direction={-1} disabled={edges.start} onClick={() => scrollByCard(-1)} />
              <ArrowButton direction={1} disabled={edges.end} onClick={() => scrollByCard(1)} />
            </div>
          ) : null}
        </div>

        <ul
          ref={listRef}
          onScroll={updateEdges}
          className={cn(
            "-mx-md mt-3xl flex snap-x snap-mandatory scroll-px-md gap-lg overflow-x-auto px-md pb-sm [scrollbar-width:none]",
            // O leque inclina os cards; num carrossel isso desloca o "encaixe" da rolagem lateral,
            // então ele só existe na fileira fixa (até 4 vídeos).
            !isCarousel && "depoimentos-leque",
            isCarousel
              ? "lg:-mx-sm lg:scroll-px-sm lg:px-sm lg:pt-sm lg:pb-sm"
              : "lg:mx-0 lg:justify-center lg:overflow-visible lg:px-0 lg:pb-0",
          )}
        >
          {items.length === 0
            ? Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
                <li key={i} style={lequeStyle(i)} className={CARD_CLASS}>
                  <div className="relative flex aspect-[9/16] flex-col items-center justify-center gap-md rounded-[16px] bg-roda-marinho shadow-lg">
                    <span
                      aria-hidden="true"
                      className="flex size-16 items-center justify-center rounded-full border-2 border-roda-branco/40 text-roda-branco/40"
                    >
                      <svg viewBox="0 0 24 24" className="ml-1 size-7 fill-current">
                        <path d={PLAY_PATH} />
                      </svg>
                    </span>
                    <span className="font-sans text-body-sm text-roda-branco/70">
                      Vídeo em breve
                    </span>
                  </div>
                  <p className="mt-md">
                    <span className="block font-display font-bold text-text">
                      Depoimento de cliente
                    </span>
                    <span className="block font-sans text-body-sm text-text-secondary">
                      Em breve
                    </span>
                  </p>
                </li>
              ))
            : null}
          {items.map((item, i) => {
            const isPlaying = playing === item.youtubeId;
            return (
              <li key={item.youtubeId} style={lequeStyle(i)} className={CARD_CLASS}>
                <figure>
                  <div className="relative aspect-[9/16] overflow-hidden rounded-[16px] bg-roda-marinho shadow-lg">
                    {isPlaying ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1&rel=0&playsinline=1`}
                        title={`Depoimento de ${item.name}, ${item.company}`}
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        className="absolute inset-0 size-full"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPlaying(item.youtubeId)}
                        aria-label={`Assistir depoimento de ${item.name}, ${item.company}`}
                        className="group absolute inset-0 cursor-pointer focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-action"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.cover}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-roda-marinho/75 via-transparent to-transparent"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-action text-action-contrast shadow-lg transition-transform group-hover:scale-110 motion-reduce:transition-none"
                        >
                          <svg viewBox="0 0 24 24" className="ml-1 size-7 fill-current">
                            <path d={PLAY_PATH} />
                          </svg>
                        </span>
                        {item.quote ? (
                          <span className="absolute inset-x-0 bottom-0 p-md text-left font-display text-body-sm font-bold text-roda-branco">
                            “{item.quote}”
                          </span>
                        ) : null}
                      </button>
                    )}
                  </div>
                  <figcaption className="mt-md">
                    <span className="block font-display font-bold text-text">{item.name}</span>
                    <span className="block font-sans text-body-sm text-text-secondary">
                      {item.company}
                    </span>
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 1 | -1;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 1 ? "Próximos depoimentos" : "Depoimentos anteriores"}
      className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-border-strong text-text transition-colors hover:bg-text hover:text-surface disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("size-5 fill-none stroke-current stroke-2", direction === -1 && "rotate-180")}
      >
        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
