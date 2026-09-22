import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Heading, FormMessage } from "@/components/ui";
import { SolutionForm } from "@/components/admin/solutions/solution-form";
import { SolutionStatusPanel } from "@/components/admin/solutions/solution-status-panel";
import { getSolutionForEditForRoute } from "@/features/catalog/application/solution-crud";
import {
  availableSolutionTransitions,
  type SolutionStatus,
} from "@/features/catalog/application/solution-service";
import { AppError } from "@/lib/errors";
import { can } from "@/server/permissions";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { updateSolutionAction } from "../actions";

export const metadata: Metadata = { title: "Editar solução" };

export default async function EditSolutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { actor } = await requireAdminSession();
  const { id } = await params;

  let found;
  try {
    found = await getSolutionForEditForRoute(actor, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    if (error instanceof AppError) {
      return (
        <>
          <Heading as="h1" variant="h1">
            Editar solução
          </Heading>
          <FormMessage tone="error" className="mt-xl">
            {error.publicMessage}
          </FormMessage>
        </>
      );
    }
    throw error;
  }

  const { solution, items } = found;
  const status = solution.status as SolutionStatus;
  const targets = availableSolutionTransitions(actor, status);
  const canDelete = can(actor, "solution:manage");

  const byKind = (kind: "SITUATION" | "STEP" | "GOAL") =>
    items.filter((item) => item.kind === kind).map(({ title, body }) => ({ title, body }));

  return (
    <>
      <Heading as="h1" variant="h1">
        {solution.title}
      </Heading>

      <div className="mt-xl grid gap-2xl lg:grid-cols-[1fr_320px]">
        <div className="max-w-reading">
          <SolutionForm
            key={solution.version}
            mode="edit"
            action={updateSolutionAction}
            solutionId={solution.id}
            version={solution.version}
            initial={{
              type: solution.type as "CONSULTORIA" | "SERVICO",
              title: solution.title,
              summary: solution.summary,
              context: solution.context,
              approach: solution.approach,
              isFeatured: solution.isFeatured,
              seoTitle: solution.seoTitle ?? "",
              seoDescription: solution.seoDescription ?? "",
              situations: byKind("SITUATION"),
              steps: byKind("STEP"),
              goals: byKind("GOAL"),
            }}
          />
        </div>
        <div>
          <SolutionStatusPanel
            solutionId={solution.id}
            status={status}
            version={solution.version}
            targets={targets}
            canDelete={canDelete}
          />
        </div>
      </div>
    </>
  );
}
