"use client";

import { useState, type CSSProperties } from "react";
import { Container, Heading, Section, SectionLabel } from "@/components/ui";
import { TESTIMONIALS } from "@/content/dm";

/**
 * Depoimentos em vídeo (YouTube, verticais). Nada do YouTube é carregado antes do clique: a capa
 * é uma imagem local e o iframe (domínio youtube-nocookie) só entra quando o visitante dá play.
 *
 * No desktop, ao rolar até a seção, os cards chegam empilhados como um leque de cartas e se abrem
 * lado a lado acompanhando a rolagem (animação guiada pela rolagem em globals.css, classe
 * `depoimentos-leque`). Sem suporte no navegador ou com movimento reduzido, aparecem já abertos.
 */
/** Sem vídeos cadastrados, a área aparece com cards "em breve" (nenhum nome inventado). */
const PLACEHOLDER_COUNT = 4;
const CARD_CLASS = "w-[78%] max-w-[280px] shrink-0 snap-center lg:w-[260px]";
const PLAY_PATH = "M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z";

export function VideoTestimonials() {
  const [playing, setPlaying] = useState<string | null>(null);
  const items = TESTIMONIALS.items;
  const count = items.length > 0 ? items.length : PLACEHOLDER_COUNT;
  const middle = (count - 1) / 2;
  const lequeStyle = (i: number) => {
    const offset = i - middle;
    return {
      "--leque-x": `${-offset * 100}%`,
      "--leque-r": `${offset * 7}deg`,
      zIndex: count - Math.abs(Math.round(offset)),
    } as CSSProperties;
  };

  return (
    <Section
      tone="muted"
      spacing="loose"
      aria-labelledby="home-depoimentos"
      className="overflow-x-clip"
    >
      <Container>
        <SectionLabel>{TESTIMONIALS.label}</SectionLabel>
        <Heading as="h2" variant="h2" id="home-depoimentos" className="mt-md">
          {TESTIMONIALS.heading}
        </Heading>

        <ul className="depoimentos-leque -mx-md mt-3xl flex snap-x snap-mandatory gap-lg overflow-x-auto px-md pb-sm [scrollbar-width:none] lg:mx-0 lg:justify-center lg:overflow-visible lg:px-0 lg:pb-0">
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
