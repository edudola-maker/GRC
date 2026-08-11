"use server";

import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import { optDate, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { sectionSavedHref } from "@/lib/section-nav";
import { getCurrentUser } from "@/lib/session";

function planHref(missionId: string) {
  return `/missions/${missionId}/planification`;
}

export async function addMissionObjectif(formData: FormData) {
  await getCurrentUser();
  const missionId = str(formData, "missionId");
  const libelle = str(formData, "libelle");
  if (!missionId) redirectWithError("/missions", "Mission manquante.");
  if (!libelle) redirectWithError(planHref(missionId), "Libellé obligatoire.");

  const max = await prisma.missionObjectif.aggregate({
    where: { missionId },
    _max: { ordre: true },
  });
  await prisma.missionObjectif.create({
    data: {
      missionId,
      libelle,
      description: optStr(formData, "description"),
      ordre: (max._max.ordre ?? -1) + 1,
    },
  });
  revalidateApp([planHref(missionId)]);
  redirectWithOk(sectionSavedHref(planHref(missionId), "PLANIFICATION"), "1");
}

export async function deleteMissionObjectif(formData: FormData) {
  const id = str(formData, "id");
  const missionId = str(formData, "missionId");
  if (!id || !missionId) redirectWithError("/missions", "Identifiant manquant.");
  await prisma.missionObjectif.delete({ where: { id } });
  revalidateApp([planHref(missionId)]);
  redirectWithOk(sectionSavedHref(planHref(missionId), "PLANIFICATION"), "supprime");
}

export async function addMissionRisque(formData: FormData) {
  await getCurrentUser();
  const missionId = str(formData, "missionId");
  const titre = str(formData, "titre");
  if (!missionId) redirectWithError("/missions", "Mission manquante.");
  if (!titre) redirectWithError(planHref(missionId), "Titre obligatoire.");

  const max = await prisma.missionRisque.aggregate({
    where: { missionId },
    _max: { ordre: true },
  });
  await prisma.missionRisque.create({
    data: {
      missionId,
      titre,
      description: optStr(formData, "description"),
      risqueId: optStr(formData, "risqueId"),
      ordre: (max._max.ordre ?? -1) + 1,
    },
  });
  revalidateApp([planHref(missionId)]);
  redirectWithOk(sectionSavedHref(planHref(missionId), "PLANIFICATION"), "1");
}

export async function deleteMissionRisque(formData: FormData) {
  const id = str(formData, "id");
  const missionId = str(formData, "missionId");
  if (!id || !missionId) redirectWithError("/missions", "Identifiant manquant.");
  await prisma.missionRisque.delete({ where: { id } });
  revalidateApp([planHref(missionId)]);
  redirectWithOk(sectionSavedHref(planHref(missionId), "PLANIFICATION"), "supprime");
}

export async function addMissionDocumentation(formData: FormData) {
  await getCurrentUser();
  const missionId = str(formData, "missionId");
  const documentAttendu = str(formData, "documentAttendu");
  if (!missionId) redirectWithError("/missions", "Mission manquante.");
  if (!documentAttendu) {
    redirectWithError(planHref(missionId), "Document attendu obligatoire.");
  }

  const max = await prisma.missionDocumentation.aggregate({
    where: { missionId },
    _max: { ordre: true },
  });
  await prisma.missionDocumentation.create({
    data: {
      missionId,
      documentAttendu,
      interlocuteur: optStr(formData, "interlocuteur"),
      dateDemandee: optDate(formData, "dateDemandee") ?? new Date(),
      statut: "DEMANDE",
      ordre: (max._max.ordre ?? -1) + 1,
    },
  });
  revalidateApp([planHref(missionId)]);
  redirectWithOk(sectionSavedHref(planHref(missionId), "PLANIFICATION"), "1");
}

export async function updateMissionDocumentationStatut(formData: FormData) {
  const id = str(formData, "id");
  const missionId = str(formData, "missionId");
  const statut = str(formData, "statut");
  if (!id || !missionId) redirectWithError("/missions", "Identifiant manquant.");
  if (!["DEMANDE", "RECU", "ANALYSE"].includes(statut)) {
    redirectWithError(planHref(missionId), "Statut invalide.");
  }
  await prisma.missionDocumentation.update({
    where: { id },
    data: {
      statut: statut as "DEMANDE",
      dateRecue:
        statut === "RECU" || statut === "ANALYSE"
          ? (optDate(formData, "dateRecue") ?? new Date())
          : null,
    },
  });
  revalidateApp([planHref(missionId)]);
  redirectWithOk(sectionSavedHref(planHref(missionId), "PLANIFICATION"), "modifie");
}

export async function deleteMissionDocumentation(formData: FormData) {
  const id = str(formData, "id");
  const missionId = str(formData, "missionId");
  if (!id || !missionId) redirectWithError("/missions", "Identifiant manquant.");
  await prisma.missionDocumentation.delete({ where: { id } });
  revalidateApp([planHref(missionId)]);
  redirectWithOk(sectionSavedHref(planHref(missionId), "PLANIFICATION"), "supprime");
}
