"use server";

import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  CRITICITE_CONTINUITE_OPTIONS,
  UNITE_DUREE_CONTINUITE_OPTIONS,
} from "@/lib/catalog";
import { optDate, optInt, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { sectionEditHref, sectionSavedHref } from "@/lib/section-nav";
import { getCurrentUser } from "@/lib/session";

const CRITS = new Set<string>(
  CRITICITE_CONTINUITE_OPTIONS.map((o) => o.value),
);
const UNITES = new Set<string>(
  UNITE_DUREE_CONTINUITE_OPTIONS.map((o) => o.value),
);

function parseDuree(
  formData: FormData,
  valKey: string,
  unitKey: string,
): { valeur: number | null; unite: "HEURES" | "JOURS" | null } {
  const valeur = optInt(formData, valKey);
  const unite = optStr(formData, unitKey);
  if (valeur == null && !unite) return { valeur: null, unite: null };
  if (valeur == null || !unite || !UNITES.has(unite)) {
    return { valeur: null, unite: null };
  }
  return { valeur, unite: unite as "HEURES" };
}

export async function upsertProcessusContinuité(formData: FormData) {
  const current = await getCurrentUser();
  const processusId = str(formData, "processusId");
  if (!processusId) redirectWithError("/processus", "Identifiant manquant.");
  const base = `/processus/${processusId}`;
  const editFallback = sectionEditHref(base, "CONTINUITE");

  const processus = await prisma.processus.findUnique({
    where: { id: processusId },
  });
  if (!processus || processus.uniteId !== current.uniteId) {
    redirectWithError("/processus", "Processus introuvable.");
  }

  const criticiteRaw = optStr(formData, "criticite");
  if (criticiteRaw && !CRITS.has(criticiteRaw)) {
    redirectWithError(editFallback, "Criticité invalide.");
  }

  const mtpd = parseDuree(formData, "mtpdValeur", "mtpdUnite");
  const rto = parseDuree(formData, "rtoValeur", "rtoUnite");
  const rpo = parseDuree(formData, "rpoValeur", "rpoUnite");

  const data = {
    criticite: (criticiteRaw as
      | "FAIBLE"
      | "MODEREE"
      | "ELEVEE"
      | "CRITIQUE"
      | null) ?? null,
    consequencesInterruption: optStr(formData, "consequencesInterruption"),
    mtpdValeur: mtpd.valeur,
    mtpdUnite: mtpd.unite,
    rtoValeur: rto.valeur,
    rtoUnite: rto.unite,
    rpoValeur: rpo.valeur,
    rpoUnite: rpo.unite,
    periodesCritiques: optStr(formData, "periodesCritiques"),
    modeDegradeMesures: optStr(formData, "modeDegradeMesures"),
    commentaire: optStr(formData, "commentaire"),
    dateDerniereRevue: optDate(formData, "dateDerniereRevue"),
    dateProchaineRevue: optDate(formData, "dateProchaineRevue"),
    modifieParId: current.id,
  };

  await prisma.processusContinuité.upsert({
    where: { processusId },
    create: { processusId, ...data },
    update: data,
  });

  revalidateApp([base]);
  redirectWithOk(sectionSavedHref(base, "CONTINUITE"), "continuite");
}

/** Formalise une revue sans exiger de changement de valeurs. */
export async function marquerRevueContinuité(formData: FormData) {
  const current = await getCurrentUser();
  const processusId = str(formData, "processusId");
  if (!processusId) redirectWithError("/processus", "Identifiant manquant.");
  const base = `/processus/${processusId}`;

  const processus = await prisma.processus.findUnique({
    where: { id: processusId },
  });
  if (!processus || processus.uniteId !== current.uniteId) {
    redirectWithError("/processus", "Processus introuvable.");
  }

  const now = new Date();
  await prisma.processusContinuité.upsert({
    where: { processusId },
    create: {
      processusId,
      dateDerniereRevue: now,
      commentaire:
        "Analyse revue — aucun changement nécessaire (premier enregistrement).",
      modifieParId: current.id,
    },
    update: {
      dateDerniereRevue: now,
      commentaire: optStr(formData, "commentaire") ?? undefined,
      modifieParId: current.id,
    },
  });

  // Si commentaire fourni pour la revue
  const commentaireRevue = optStr(formData, "commentaireRevue");
  if (commentaireRevue) {
    await prisma.processusContinuité.update({
      where: { processusId },
      data: {
        commentaire: commentaireRevue,
        dateDerniereRevue: now,
        modifieParId: current.id,
      },
    });
  }

  revalidateApp([base]);
  redirectWithOk(sectionSavedHref(base, "CONTINUITE"), "revue");
}

export async function addProcessusDependance(formData: FormData) {
  const current = await getCurrentUser();
  const processusId = str(formData, "processusId");
  const dependDeId = str(formData, "dependDeId");
  const base = `/processus/${processusId}`;
  const href = `${base}?edit=CONTINUITE`;
  if (!processusId || !dependDeId) {
    redirectWithError(href || "/processus", "Identifiant manquant.");
  }
  if (processusId === dependDeId) {
    redirectWithError(href, "Un processus ne peut pas dépendre de lui-même.");
  }

  const [prc, dep] = await Promise.all([
    prisma.processus.findUnique({ where: { id: processusId } }),
    prisma.processus.findFirst({
      where: { id: dependDeId, uniteId: current.uniteId, archive: false },
    }),
  ]);
  if (!prc || prc.uniteId !== current.uniteId) {
    redirectWithError("/processus", "Processus introuvable.");
  }
  if (!dep) redirectWithError(href, "Processus amont introuvable.");

  await prisma.processusDependance.upsert({
    where: {
      processusId_dependDeId: { processusId, dependDeId },
    },
    create: {
      processusId,
      dependDeId,
      commentaire: optStr(formData, "commentaire"),
    },
    update: {},
  });

  revalidateApp([base, `/processus/${dependDeId}`]);
  redirectWithOk(href, "dependance");
}

export async function removeProcessusDependance(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const processusId = str(formData, "processusId");
  const href = `/processus/${processusId}?edit=CONTINUITE`;
  if (!id || !processusId) {
    redirectWithError("/processus", "Identifiant manquant.");
  }

  const lien = await prisma.processusDependance.findUnique({
    where: { id },
    include: { processus: true },
  });
  if (
    !lien ||
    lien.processusId !== processusId ||
    lien.processus.uniteId !== current.uniteId
  ) {
    redirectWithError("/processus", "Dépendance introuvable.");
  }

  await prisma.processusDependance.delete({ where: { id } });
  revalidateApp([`/processus/${processusId}`, `/processus/${lien.dependDeId}`]);
  redirectWithOk(href, "dependance");
}
