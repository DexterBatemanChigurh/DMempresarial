import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import type { Executor } from "@/db/client";
import { testimonials } from "@/db/schema";
import type { TestimonialSource, TestimonialStatus } from "../domain/proof";

export type PublicTestimonial = {
  id: string;
  authorName: string;
  authorDetail: string | null;
  quote: string;
  rating: number | null;
  source: TestimonialSource;
  givenAt: Date | null;
};

export type TestimonialForAdmin = PublicTestimonial & {
  position: number;
  status: TestimonialStatus;
  version: number;
  updatedAt: Date;
};

const publicColumns = {
  id: testimonials.id,
  authorName: testimonials.authorName,
  authorDetail: testimonials.authorDetail,
  quote: testimonials.quote,
  rating: testimonials.rating,
  source: testimonials.source,
  givenAt: testimonials.givenAt,
};

/** Só `PUBLISHED`, na ordem escolhida pela DM. */
export async function listPublishedTestimonials(executor: Executor): Promise<PublicTestimonial[]> {
  return executor
    .select(publicColumns)
    .from(testimonials)
    .where(eq(testimonials.status, "PUBLISHED"))
    .orderBy(asc(testimonials.position), desc(testimonials.givenAt));
}

export async function listTestimonialsForAdmin(executor: Executor): Promise<TestimonialForAdmin[]> {
  const rows = await executor
    .select({
      ...publicColumns,
      position: testimonials.position,
      status: testimonials.status,
      version: testimonials.version,
      updatedAt: testimonials.updatedAt,
    })
    .from(testimonials)
    .orderBy(asc(testimonials.position), desc(testimonials.createdAt));
  return rows as TestimonialForAdmin[];
}

export async function findTestimonialForAdmin(
  executor: Executor,
  id: string,
): Promise<TestimonialForAdmin | null> {
  const [row] = await executor
    .select({
      ...publicColumns,
      position: testimonials.position,
      status: testimonials.status,
      version: testimonials.version,
      updatedAt: testimonials.updatedAt,
    })
    .from(testimonials)
    .where(eq(testimonials.id, id))
    .limit(1);
  return (row as TestimonialForAdmin | undefined) ?? null;
}
