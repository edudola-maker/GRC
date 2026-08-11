"use server";

import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import { assertNomUnique } from "@/lib/codes";
import { optInt, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import {
  etatFromIntent,
  markSectionRedaction,
  parseSaveIntent,
} from "@/lib/section-redaction";
import { sectionDraftHref, sectionEditHref, sectionSavedHref } from "@/lib/section-nav";
import { getCurrentUser } from "@/lib/session";

function revalidateUnite() {
  revalidateApp(["/unite"]);
}

export async function updateUnite(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id || id !== current.uniteId) {
    redirectWithError("/unite", "Unité introuvable.");
  }

  const existing = await prisma.unite.findUnique({ where: { id } });
  if (!existing) redirectWithError("/unite", "Unité introuvable.");

  const sectionKey = optStr(formData, "sectionKey") ?? "VUE_ENSEMBLE";
  const intent = parseSaveIntent(formData);
  const base = "/unite";
  const editFallback = sectionEditHref(base, sectionKey);

  if (sectionKey === "VUE_ENSEMBLE") {
    const nom = str(formData, "nom");
    if (!nom) {
      redirectWithError(editFallback, "Le nom de l’unité est obligatoire.");
    }
    const nomErr = await assertNomUnique("UNITE", nom, id, id);
    if (nomErr) redirectWithError(editFallback, nomErr);

    const responsableId = optStr(formData, "responsableId");
    const adjointId = optStr(formData, "adjointId");

    if (responsableId) {
      const r = await prisma.utilisateur.findFirst({
        where: { id: responsableId, uniteId: id, actif: true },
      });
      if (!r) {
        redirectWithError(editFallback, "Responsable introuvable dans l’unité.");
      }
    }
    if (adjointId) {
      const a = await prisma.utilisateur.findFirst({
        where: { id: adjointId, uniteId: id, actif: true },
      });
      if (!a) {
        redirectWithError(editFallback, "Adjoint introuvable dans l’unité.");
      }
    }

    await prisma.unite.update({
      where: { id },
      data: {
        nom,
        description: optStr(formData, "description"),
        responsableId,
        adjointId,
        actif: str(formData, "actif") !== "0",
      },
    });
  } else if (
    sectionKey === "OBJECTIFS" ||
    sectionKey === "EQUIPE" ||
    sectionKey === "PROCESSUS" ||
    sectionKey === "ELEMENTS_ASSOCIES" ||
    sectionKey === "PILOTAGE" ||
    sectionKey === "ATTRIBUTIONS"
  ) {
    // Agrégations / listes — marquage rédaction seulement.
  }

  await markSectionRedaction({
    uniteId: id,
    typeObjet: "UNITE",
    objetId: id,
    sectionKey,
    etat: etatFromIntent(intent),
    modifieParId: current.id,
    bumpVersion: intent === "finaliser",
  });

  revalidateUnite();
  redirectWithOk(
    intent === "brouillon"
      ? sectionDraftHref(base, sectionKey)
      : sectionSavedHref(base, sectionKey),
    intent === "brouillon" ? "brouillon" : "modifie",
  );
}

async function assertAttributionOfCurrentUnite(id: string, uniteId: string) {
  return prisma.uniteAttribution.findFirst({
    where: { id, uniteId },
  });
}

/** Créer une attribution / mission institutionnelle. */
export async function createAttribution(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const base = "/unite";
  const sectionKey = optStr(formData, "sectionKey") ?? "ATTRIBUTIONS";
  const editFallback = sectionEditHref(base, sectionKey);

  const titre = str(formData, "titre");
  if (!titre) {
    redirectWithError(editFallback, "Le titre de l’attribution est obligatoire.");
  }

  const maxOrdre = await prisma.uniteAttribution.aggregate({
    where: { uniteId },
    _max: { ordre: true },
  });
  const ordre = (maxOrdre._max.ordre ?? -1) + 1;

  await prisma.uniteAttribution.create({
    data: {
      uniteId,
      titre,
      description: optStr(formData, "description"),
      ordre,
      actif: true,
    },
  });

  await markSectionRedaction({
    uniteId,
    typeObjet: "UNITE",
    objetId: uniteId,
    sectionKey: "ATTRIBUTIONS",
    etat: "BROUILLON",
    modifieParId: current.id,
  });

  revalidateUnite();
  redirectWithOk(sectionDraftHref(base, "ATTRIBUTIONS"), "cree");
}

/** Mettre à jour une attribution. */
export async function updateAttribution(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const base = "/unite";
  const sectionKey = optStr(formData, "sectionKey") ?? "ATTRIBUTIONS";
  const editFallback = sectionEditHref(base, sectionKey);

  const id = str(formData, "id");
  if (!id) redirectWithError(editFallback, "Identifiant manquant.");

  const existing = await assertAttributionOfCurrentUnite(id, uniteId);
  if (!existing) {
    redirectWithError(editFallback, "Attribution introuvable.");
  }

  const titre = str(formData, "titre");
  if (!titre) {
    redirectWithError(editFallback, "Le titre de l’attribution est obligatoire.");
  }

  const ordre = optInt(formData, "ordre");
  const actifRaw = optStr(formData, "actif");

  await prisma.uniteAttribution.update({
    where: { id },
    data: {
      titre,
      description: optStr(formData, "description"),
      ...(ordre != null ? { ordre } : {}),
      actif: actifRaw === "1" || actifRaw === "on",
    },
  });

  await markSectionRedaction({
    uniteId,
    typeObjet: "UNITE",
    objetId: uniteId,
    sectionKey: "ATTRIBUTIONS",
    etat: "BROUILLON",
    modifieParId: current.id,
  });

  revalidateUnite();
  redirectWithOk(sectionDraftHref(base, "ATTRIBUTIONS"), "modifie");
}

/** Soft-delete : actif = false. */
export async function deleteAttribution(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const base = "/unite";
  const editFallback = sectionEditHref(base, "ATTRIBUTIONS");

  const id = str(formData, "id");
  if (!id) redirectWithError(editFallback, "Identifiant manquant.");

  const existing = await assertAttributionOfCurrentUnite(id, uniteId);
  if (!existing) {
    redirectWithError(editFallback, "Attribution introuvable.");
  }

  await prisma.uniteAttribution.update({
    where: { id },
    data: { actif: false },
  });

  await markSectionRedaction({
    uniteId,
    typeObjet: "UNITE",
    objetId: uniteId,
    sectionKey: "ATTRIBUTIONS",
    etat: "BROUILLON",
    modifieParId: current.id,
  });

  revalidateUnite();
  redirectWithOk(sectionSavedHref(base, "ATTRIBUTIONS"), "modifie");
}

/** Réordonner simplement (ordre = index). */
export async function reorderAttributions(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const base = "/unite";
  const editFallback = sectionEditHref(base, "ATTRIBUTIONS");

  const idsRaw = str(formData, "ids");
  if (!idsRaw) redirectWithError(editFallback, "Ordre manquant.");
  const ids = idsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const existing = await prisma.uniteAttribution.findMany({
    where: { uniteId, id: { in: ids } },
    select: { id: true },
  });
  if (existing.length !== ids.length) {
    redirectWithError(editFallback, "Attribution introuvable.");
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.uniteAttribution.update({
        where: { id },
        data: { ordre: index },
      }),
    ),
  );

  revalidateUnite();
  redirectWithOk(sectionDraftHref(base, "ATTRIBUTIONS"), "modifie");
}
