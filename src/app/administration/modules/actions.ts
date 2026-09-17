"use server";

import { revalidatePath } from "next/cache";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import type { CleModule } from "@/generated/prisma/client";
import { MODULE_CATALOG } from "@/lib/modules";
import { getOrgContext } from "@/lib/organisation";
import { assertAdministrateur } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { str } from "@/lib/form";

export async function toggleOrganisationModule(formData: FormData) {
  await assertAdministrateur();
  const ctx = await getOrgContext();
  const fallback = "/administration/modules";
  const module = str(formData, "module") as CleModule;
  const actif = str(formData, "actif") === "1";

  if (!MODULE_CATALOG.some((m) => m.cle === module)) {
    redirectWithError(fallback, "Module inconnu.");
  }

  await prisma.organisationModule.upsert({
    where: {
      organisationId_module: {
        organisationId: ctx.organisationId,
        module,
      },
    },
    create: {
      organisationId: ctx.organisationId,
      module,
      actif,
    },
    update: { actif },
  });

  revalidatePath("/", "layout");
  revalidatePath("/administration/modules");
  redirectWithOk(fallback, actif ? "module_active" : "module_desactive");
}
