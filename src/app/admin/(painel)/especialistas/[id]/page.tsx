import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Heading, FormMessage } from "@/components/ui";
import { SpecialistForm } from "@/components/admin/specialists/specialist-form";
import { SpecialistStatusPanel } from "@/components/admin/specialists/specialist-status-panel";
import {
  getSpecialistForEditForRoute,
  getSpecialistPhotoForRoute,
} from "@/features/people/application/specialist-crud";
import { loadSpecialistFormOptionsForRoute } from "@/features/people/application/specialist-form-options";
import {
  availableSpecialistTransitions,
  type SpecialistStatus,
} from "@/features/people/application/specialist-service";
import { AppError } from "@/lib/errors";
import { can } from "@/server/permissions";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { updateSpecialistAction } from "../actions";

export const metadata: Metadata = { title: "Editar especialista" };

export default async function EditSpecialistPage({ params }: { params: Promise<{ id: string }> }) {
  const { actor } = await requireAdminSession();
  const { id } = await params;

  let found;
  try {
    found = await getSpecialistForEditForRoute(actor, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    if (error instanceof AppError) {
      return (
        <>
          <Heading as="h1" variant="h1">
            Editar especialista
          </Heading>
          <FormMessage tone="error" className="mt-xl">
            {error.publicMessage}
          </FormMessage>
        </>
      );
    }
    throw error;
  }

  const { specialist, solutionIds, categoryIds } = found;
  const [options, photo] = await Promise.all([
    loadSpecialistFormOptionsForRoute(),
    specialist.photoMediaId
      ? getSpecialistPhotoForRoute(specialist.photoMediaId)
      : Promise.resolve(null),
  ]);

  const status = specialist.status as SpecialistStatus;
  const targets = availableSpecialistTransitions(actor, status);
  const canDelete = can(actor, "specialist:manage");

  return (
    <>
      <Heading as="h1" variant="h1">
        {specialist.name}
      </Heading>

      <div className="mt-xl grid gap-2xl lg:grid-cols-[1fr_320px]">
        <div className="max-w-reading">
          <SpecialistForm
            key={specialist.version}
            mode="edit"
            action={updateSpecialistAction}
            options={options}
            specialistId={specialist.id}
            version={specialist.version}
            initial={{
              name: specialist.name,
              roleTitle: specialist.roleTitle ?? "",
              summary: specialist.summary ?? "",
              bio: specialist.bio,
              photoMediaId: specialist.photoMediaId,
              photoUrl: photo?.url ?? null,
              photoAlt: photo?.alt ?? "",
              kind: specialist.kind as "TEAM" | "GUEST",
              seoTitle: specialist.seoTitle ?? "",
              seoDescription: specialist.seoDescription ?? "",
              solutionIds,
              categoryIds,
            }}
          />
        </div>
        <div>
          <SpecialistStatusPanel
            specialistId={specialist.id}
            status={status}
            version={specialist.version}
            targets={targets}
            canDelete={canDelete}
          />
        </div>
      </div>
    </>
  );
}
