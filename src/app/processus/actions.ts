"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  NIVEAU_CONFIDENTIALITE_OPTIONS,
  STATUT_PROCESSUS_OPTIONS,
} from "@/lib/catalog";
import { assertNomUnique, nextCode } from "@/lib/codes";
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
import { serializeTags } from "@/lib/tags";

const STATUTS = new Set(STATUT_PROCESSUS_OPTIONS.map((o) => o.value));
const NIVEAUX_CONF = new Set<string>(
  NIVEAU_CONFIDENTIALITE_OPTIONS.map((o) => o.value),
);

function parseLpd(formData: FormData) {
  const niveau = optStr(formData, "niveauConfidentialite") ?? "INTERNE";
  return {
    contientDonneesPersonnelles:
      str(formData, "contientDonneesPersonnelles") === "1",
    niveauConfidentialite: (NIVEAUX_CONF.has(niveau)
      ? niveau
      : "INTERNE") as "INTERNE",
  };
}

function revalidateProcessus(id: string) {
  revalidateApp([`/processus/${id}`, `/processus/${id}/modifier`]);
}

export async function createProcessus(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const fallback = "/processus/nouveau";
  const nom = str(formData, "nom");
  if (!nom) redirectWithError(fallback, "Le nom du processus est obligatoire.");

  const statut = str(formData, "statut") || "ACTIF";
  if (!STATUTS.has(statut as "ACTIF" | "SUSPENDU")) {
    redirectWithError(fallback, "Statut invalide.");
  }

  const nomErr = await assertNomUnique("PROCESSUS", nom, uniteId);
  if (nomErr) redirectWithError(fallback, nomErr);

  const responsableId = str(formData, "responsableId") || current.id;
  const lpd = parseLpd(formData);
  const processus = await prisma.processus.create({
    data: {
      code: await nextCode("PROCESSUS", uniteId),
      uniteId,
      nom,
      description: optStr(formData, "description"),
      tags: serializeTags(optStr(formData, "tags")),
      responsableId,
      statut: statut as "ACTIF",
      reference: optStr(formData, "reference"),
      contientDonneesPersonnelles: lpd.contientDonneesPersonnelles,
      niveauConfidentialite: lpd.niveauConfidentialite,
      archive: false,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateProcessus(processus.id);
  redirectWithOk(`/processus/${processus.id}`, "cree");
}

export async function updateProcessus(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/processus", "Identifiant manquant.");

  const existing = await prisma.processus.findUnique({ where: { id } });
  if (!existing) redirectWithError("/processus", "Processus introuvable.");

  const sectionKey = optStr(formData, "sectionKey") ?? "INFOS_GENERALES";
  const intent = parseSaveIntent(formData);
  const base = `/processus/${id}`;
  const editFallback = sectionEditHref(base, sectionKey);

  if (sectionKey === "INFOS_GENERALES") {
    const nom = str(formData, "nom");
    if (!nom) {
      redirectWithError(editFallback, "Le nom du processus est obligatoire.");
    }
    const statut = str(formData, "statut") || "ACTIF";
    if (!STATUTS.has(statut as "ACTIF" | "SUSPENDU")) {
      redirectWithError(editFallback, "Statut invalide.");
    }
    const nomErr = await assertNomUnique(
      "PROCESSUS",
      nom,
      existing.uniteId,
      id,
    );
    if (nomErr) redirectWithError(editFallback, nomErr);

    const responsableId = str(formData, "responsableId") || current.id;
    await prisma.processus.update({
      where: { id },
      data: {
        nom,
        description: optStr(formData, "description"),
        reference: optStr(formData, "reference"),
        responsableId,
        statut: statut as "ACTIF",
        modifieParId: current.id,
      },
    });
  } else if (sectionKey === "LPD") {
    const lpd = parseLpd(formData);
    await prisma.processus.update({
      where: { id },
      data: {
        contientDonneesPersonnelles: lpd.contientDonneesPersonnelles,
        niveauConfidentialite: lpd.niveauConfidentialite,
        tags: serializeTags(optStr(formData, "tags")),
        modifieParId: current.id,
      },
    });
  } else if (sectionKey === "ETAPES" || sectionKey === "ELEMENTS_ASSOCIES") {
    await prisma.processus.update({
      where: { id },
      data: { modifieParId: current.id },
    });
  }

  await markSectionRedaction({
    uniteId: existing.uniteId,
    typeObjet: "PROCESSUS",
    objetId: id,
    sectionKey,
    etat: etatFromIntent(intent),
    modifieParId: current.id,
    bumpVersion: intent === "finaliser",
  });

  revalidateProcessus(id);
  redirectWithOk(
    intent === "brouillon"
      ? sectionDraftHref(base, sectionKey)
      : sectionSavedHref(base, sectionKey),
    intent === "brouillon" ? "brouillon" : "modifie",
  );
}

async function markEtapesBrouillon(processusId: string, userId: string, uniteId: string) {
  await markSectionRedaction({
    uniteId,
    typeObjet: "PROCESSUS",
    objetId: processusId,
    sectionKey: "ETAPES",
    etat: "BROUILLON",
    modifieParId: userId,
  });
}

export async function addProcessusEtape(formData: FormData) {
  const current = await getCurrentUser();
  const processusId = str(formData, "processusId");
  if (!processusId) redirectWithError("/processus", "Identifiant manquant.");

  const processus = await prisma.processus.findUnique({
    where: { id: processusId },
  });
  if (!processus) redirectWithError("/processus", "Processus introuvable.");
  if (processus.archive) {
    redirectWithError(`/processus/${processusId}`, "Processus archivé.");
  }

  const etapesHref = sectionDraftHref(`/processus/${processusId}`, "ETAPES");
  const libelle = str(formData, "libelle");
  if (!libelle) {
    redirectWithError(etapesHref, "Libellé d’étape obligatoire.");
  }

  const max = await prisma.processusEtape.aggregate({
    where: { processusId },
    _max: { ordre: true },
  });
  await prisma.processusEtape.create({
    data: {
      processusId,
      libelle,
      ordre: (max._max.ordre ?? -1) + 1,
    },
  });
  await markEtapesBrouillon(processusId, current.id, processus.uniteId);
  revalidateProcessus(processusId);
  redirectWithOk(etapesHref, "etape");
}

export async function updateProcessusEtape(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const processusId = str(formData, "processusId");
  if (!id || !processusId) {
    redirectWithError("/processus", "Identifiant manquant.");
  }
  const etape = await prisma.processusEtape.findFirst({
    where: { id, processusId },
    include: { processus: true },
  });
  if (!etape) redirectWithError(`/processus/${processusId}`, "Étape introuvable.");

  const etapesHref = sectionDraftHref(`/processus/${processusId}`, "ETAPES");
  const libelle = str(formData, "libelle");
  if (!libelle) {
    redirectWithError(etapesHref, "Libellé d’étape obligatoire.");
  }
  await prisma.processusEtape.update({ where: { id }, data: { libelle } });
  await markEtapesBrouillon(processusId, current.id, etape.processus.uniteId);
  revalidateProcessus(processusId);
  redirectWithOk(etapesHref, "etape");
}

export async function deleteProcessusEtape(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const processusId = str(formData, "processusId");
  if (!id || !processusId) {
    redirectWithError("/processus", "Identifiant manquant.");
  }
  const etape = await prisma.processusEtape.findFirst({
    where: { id, processusId },
    include: { processus: true },
  });
  if (!etape) redirectWithError(`/processus/${processusId}`, "Étape introuvable.");

  await prisma.processusEtape.delete({ where: { id } });
  // Réordonner
  const rest = await prisma.processusEtape.findMany({
    where: { processusId },
    orderBy: { ordre: "asc" },
  });
  await prisma.$transaction(
    rest.map((e, i) =>
      prisma.processusEtape.update({ where: { id: e.id }, data: { ordre: i } }),
    ),
  );
  await markEtapesBrouillon(processusId, current.id, etape.processus.uniteId);
  revalidateProcessus(processusId);
  redirectWithOk(sectionDraftHref(`/processus/${processusId}`, "ETAPES"), "etape");
}

export async function moveProcessusEtape(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const processusId = str(formData, "processusId");
  const direction = str(formData, "direction");
  if (!id || !processusId) {
    redirectWithError("/processus", "Identifiant manquant.");
  }

  const etapes = await prisma.processusEtape.findMany({
    where: { processusId },
    orderBy: { ordre: "asc" },
    include: { processus: true },
  });
  const etapesHref = sectionDraftHref(`/processus/${processusId}`, "ETAPES");
  const index = etapes.findIndex((e) => e.id === id);
  if (index < 0) {
    redirectWithError(etapesHref, "Étape introuvable.");
  }
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= etapes.length) {
    redirect(etapesHref);
  }

  const a = etapes[index]!;
  const b = etapes[swapWith]!;
  await prisma.$transaction([
    prisma.processusEtape.update({
      where: { id: a.id },
      data: { ordre: b.ordre },
    }),
    prisma.processusEtape.update({
      where: { id: b.id },
      data: { ordre: a.ordre },
    }),
  ]);
  await markEtapesBrouillon(processusId, current.id, a.processus.uniteId);
  revalidateProcessus(processusId);
  redirectWithOk(etapesHref, "etape");
}

export async function archiveProcessus(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/processus", "Identifiant manquant.");
  await prisma.processus.update({
    where: { id },
    data: { archive: true, modifieParId: current.id },
  });
  revalidateProcessus(id);
  redirectWithOk(`/processus/${id}`, "archive");
}

export async function unarchiveProcessus(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/processus", "Identifiant manquant.");
  await prisma.processus.update({
    where: { id },
    data: { archive: false, modifieParId: current.id },
  });
  revalidateProcessus(id);
  redirectWithOk(`/processus/${id}`, "desarchive");
}

export async function deleteProcessus(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/processus", "Identifiant manquant.");
  await prisma.processus.delete({ where: { id } });
  revalidateApp();
  redirect("/processus?ok=supprime");
}
