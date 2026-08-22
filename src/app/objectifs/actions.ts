"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  PRIORITE_OPTIONS,
  STATUT_OBJECTIF_OPTIONS,
} from "@/lib/catalog";
import {
  allocateCreateCode,
  assertNomUnique, nextCode
} from "@/lib/codes";
import { optDate, optInt, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import {
  etatFromIntent,
  markSectionRedaction,
  parseSaveIntent,
} from "@/lib/section-redaction";
import { sectionDraftHref, sectionEditHref, sectionSavedHref } from "@/lib/section-nav";
import { getCurrentUser } from "@/lib/session";

const STATUTS = new Set(STATUT_OBJECTIF_OPTIONS.map((o) => o.value));
const PRIORITES = new Set(PRIORITE_OPTIONS.map((o) => o.value));

function revalidateObjectif(id: string) {
  revalidateApp([`/objectifs/${id}`, `/objectifs/${id}/modifier`, "/unite"]);
}

export async function createObjectif(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const fallback = "/objectifs/nouveau";
  const intitule = str(formData, "intitule");
  if (!intitule) {
    redirectWithError(fallback, "L’intitulé de l’objectif est obligatoire.");
  }

  const nomErr = await assertNomUnique("OBJECTIF", intitule, uniteId);
  if (nomErr) redirectWithError(fallback, nomErr);

  const annee = optInt(formData, "annee") ?? new Date().getFullYear();
  const statut = str(formData, "statut") || "EN_COURS";
  const priorite = str(formData, "priorite") || "MOYENNE";
  if (!STATUTS.has(statut as "EN_COURS") || !PRIORITES.has(priorite as "MOYENNE")) {
    redirectWithError(fallback, "Statut ou priorité invalide.");
  }

  const responsableId = str(formData, "responsableId") || current.id;
  const resp = await prisma.utilisateur.findFirst({
    where: { id: responsableId, uniteId, actif: true },
  });
  if (!resp) redirectWithError(fallback, "Responsable introuvable.");

const allocated = await allocateCreateCode(
    "OBJECTIF",
    uniteId,
    optStr(formData, "code"),
  );
  if (!allocated.ok) {
    redirectWithError("/objectifs/nouveau", allocated.error);
  }

    const objectif = await prisma.objectif.create({
    data: {
      code: allocated.code,
      uniteId,
      intitule,
      description: optStr(formData, "description"),
      cible: optStr(formData, "cible"),
      progression: Math.min(100, Math.max(0, optInt(formData, "progression") ?? 0)),
      annee,
      responsableId,
      statut: statut as "EN_COURS",
      priorite: priorite as "MOYENNE",
      dateEcheance: optDate(formData, "dateEcheance"),
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateObjectif(objectif.id);
  redirectWithOk(`/objectifs/${objectif.id}`, "cree");
}

export async function updateObjectif(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/unite", "Identifiant manquant.");

  const existing = await prisma.objectif.findUnique({ where: { id } });
  if (!existing || existing.uniteId !== current.uniteId) {
    redirectWithError("/unite", "Objectif introuvable.");
  }

  const sectionKey = optStr(formData, "sectionKey") ?? "INFOS_GENERALES";
  const intent = parseSaveIntent(formData);
  const base = `/objectifs/${id}`;
  const editFallback = sectionEditHref(base, sectionKey);

  if (sectionKey === "INFOS_GENERALES") {
    const intitule = str(formData, "intitule");
    if (!intitule) {
      redirectWithError(editFallback, "L’intitulé est obligatoire.");
    }
    const nomErr = await assertNomUnique(
      "OBJECTIF",
      intitule,
      existing.uniteId,
      id,
    );
    if (nomErr) redirectWithError(editFallback, nomErr);

    const annee = optInt(formData, "annee") ?? existing.annee;
    const statut = str(formData, "statut") || "EN_COURS";
    const priorite = str(formData, "priorite") || "MOYENNE";
    if (!STATUTS.has(statut as "EN_COURS") || !PRIORITES.has(priorite as "MOYENNE")) {
      redirectWithError(editFallback, "Statut ou priorité invalide.");
    }

    const responsableId = str(formData, "responsableId") || current.id;
    const resp = await prisma.utilisateur.findFirst({
      where: { id: responsableId, uniteId: existing.uniteId, actif: true },
    });
    if (!resp) redirectWithError(editFallback, "Responsable introuvable.");

    await prisma.objectif.update({
      where: { id },
      data: {
        intitule,
        description: optStr(formData, "description"),
        cible: optStr(formData, "cible"),
        progression: Math.min(
          100,
          Math.max(0, optInt(formData, "progression") ?? existing.progression),
        ),
        annee,
        responsableId,
        statut: statut as "EN_COURS",
        priorite: priorite as "MOYENNE",
        dateEcheance: optDate(formData, "dateEcheance"),
        modifieParId: current.id,
      },
    });
  } else if (sectionKey === "ELEMENTS_ASSOCIES") {
    await prisma.objectif.update({
      where: { id },
      data: { modifieParId: current.id },
    });
  }

  await markSectionRedaction({
    uniteId: existing.uniteId,
    typeObjet: "OBJECTIF",
    objetId: id,
    sectionKey,
    etat: etatFromIntent(intent),
    modifieParId: current.id,
    bumpVersion: intent === "finaliser",
  });

  revalidateObjectif(id);
  redirectWithOk(
    intent === "brouillon"
      ? sectionDraftHref(base, sectionKey)
      : sectionSavedHref(base, sectionKey),
    intent === "brouillon" ? "brouillon" : "modifie",
  );
}

export async function deleteObjectif(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/unite", "Identifiant manquant.");

  const existing = await prisma.objectif.findUnique({ where: { id } });
  if (!existing || existing.uniteId !== current.uniteId) {
    redirectWithError("/unite", "Objectif introuvable.");
  }

  await prisma.lienObjet.deleteMany({
    where: {
      uniteId: existing.uniteId,
      OR: [
        { typeA: "OBJECTIF", idA: id },
        { typeB: "OBJECTIF", idB: id },
      ],
    },
  });
  await prisma.objectif.delete({ where: { id } });
  revalidateApp(["/unite"]);
  redirect("/unite?ok=supprime");
}
