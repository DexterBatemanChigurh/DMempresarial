import "server-only";
import type { Database } from "@/db/client";
import {
  listPublishedTestimonials,
  type PublicTestimonial,
} from "../infrastructure/proof-repository";

export type { PublicTestimonial } from "../infrastructure/proof-repository";

/** Leitura pública de depoimentos: só `PUBLISHED`, sem sessão. */
export async function listPublicTestimonials({
  db,
}: {
  db: Database;
}): Promise<PublicTestimonial[]> {
  return listPublishedTestimonials(db);
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";
import { cacheLife, cacheTag } from "next/cache";

export async function listPublicTestimonialsForRoute() {
  "use cache";
  cacheTag("testimonials");
  cacheLife("days");
  return listPublicTestimonials({ db: getDb() });
}
