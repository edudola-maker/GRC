"use server";

import { revalidatePath } from "next/cache";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import { optStr, str } from "@/lib/form";
import { getOrgContext } from "@/lib/organisation";
import { assertAdministrateur, isResponsableOuAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function updateOrganisationStrategie(formData: FormData) {
  const user = await getCurrentUser();
  if (!isResponsableOuAdmin(user)) {
    redirectWithError("/strategie", "Droits insuffisants.");
  }
  const ctx = await getOrgContext();
  const mission = optStr(formData, "mission");
  const vision = optStr(formData, "vision");

  await prisma.organisation.update({
    where: { id: ctx.organisationId },
    data: { mission, vision },
  });

  revalidatePath("/strategie");
  revalidatePath("/");
  redirectWithOk("/strategie", "strategie_enregistree");
}

export async function createAxeStrategique(formData: FormData) {
  const user = await getCurrentUser();
  if (!isResponsableOuAdmin(user)) {
    redirectWithError("/strategie", "Droits insuffisants.");
  }
  const ctx = await getOrgContext();
  const titre = str(formData, "titre");
  if (!titre) redirectWithError("/strategie", "Titre d’axe obligatoire.");

  const count = await prisma.axeStrategique.count({
    where: { organisationId: ctx.organisationId },
  });
  const code = `AXE-${String(count + 1).padStart(4, "0")}`;

  await prisma.axeStrategique.create({
    data: {
      organisationId: ctx.organisationId,
      code,
      titre,
      description: optStr(formData, "description"),
      periode: optStr(formData, "periode"),
      responsableId: optStr(formData, "responsableId"),
      ordre: count,
      statut: "ACTIF",
    },
  });

  revalidatePath("/strategie");
  redirectWithOk("/strategie", "axe_cree");
}

export async function updateAxeStrategique(formData: FormData) {
  const user = await getCurrentUser();
  if (!isResponsableOuAdmin(user)) {
    redirectWithError("/strategie", "Droits insuffisants.");
  }
  const ctx = await getOrgContext();
  const id = str(formData, "id");
  const axe = await prisma.axeStrategique.findFirst({
    where: { id, organisationId: ctx.organisationId },
  });
  if (!axe) redirectWithError("/strategie", "Axe introuvable.");

  await prisma.axeStrategique.update({
    where: { id },
    data: {
      titre: str(formData, "titre") || axe.titre,
      description: optStr(formData, "description"),
      periode: optStr(formData, "periode"),
      responsableId: optStr(formData, "responsableId"),
      statut: str(formData, "statut") || axe.statut,
    },
  });

  revalidatePath("/strategie");
  redirectWithOk("/strategie", "axe_modifie");
}

/** Réservé admin — désactivation douce. */
export async function archiveAxeStrategique(formData: FormData) {
  await assertAdministrateur();
  const ctx = await getOrgContext();
  const id = str(formData, "id");
  const axe = await prisma.axeStrategique.findFirst({
    where: { id, organisationId: ctx.organisationId },
  });
  if (!axe) redirectWithError("/strategie", "Axe introuvable.");
  await prisma.axeStrategique.update({
    where: { id },
    data: { statut: "ARCHIVE" },
  });
  revalidatePath("/strategie");
  redirectWithOk("/strategie", "axe_archive");
}
