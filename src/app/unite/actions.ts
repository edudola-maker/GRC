"use server";

import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import { assertNomUnique } from "@/lib/codes";
import { optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import {
  etatFromIntent,
  markSectionRedaction,
  parseSaveIntent,
} from "@/lib/section-redaction";
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
  const editFallback = `/unite?edit=${sectionKey}`;

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
    sectionKey === "ACTIVITE" ||
    sectionKey === "EQUIPE" ||
    sectionKey === "PROCESSUS" ||
    sectionKey === "ELEMENTS_ASSOCIES" ||
    sectionKey === "PILOTAGE"
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
    intent === "brouillon" ? editFallback : "/unite",
    intent === "brouillon" ? "brouillon" : "modifie",
  );
}
