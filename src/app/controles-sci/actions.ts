"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  FREQUENCE_CONTROLE_OPTIONS,
  STATUT_CONTROLE_OPTIONS,
  TACHE_STATUTS_CLOS,
} from "@/lib/catalog";
import { nextControleDate } from "@/lib/dates";
import { optDate, optStr, str } from "@/lib/form";
import { startOfToday } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { getCurrentUser } from "@/lib/session";

const STATUTS = new Set<string>(STATUT_CONTROLE_OPTIONS.map((o) => o.value));
const FREQUENCES = new Set<string>(
  FREQUENCE_CONTROLE_OPTIONS.map((o) => o.value),
);

async function assertResponsable(id: string) {
  return prisma.utilisateur.findFirst({ where: { id, actif: true } });
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Logique de réalisation / validation :
 * - dateDerniereRealisation = today si absente
 * - dateProchaineEcheance = nextControleDate(...)
 * - statut REALISE + valideParId / dateValidation
 * - tâche de suivi SCI si fréquence non ponctuelle, échéance calculée,
 *   et aucune tâche ouverte déjà présente pour la même échéance
 */
async function applyRealisationLogic(opts: {
  controleId: string;
  nom: string;
  frequence: string;
  responsableId: string;
  dateDerniereRealisation: Date | null | undefined;
  userId: string;
}): Promise<{
  dateDerniereRealisation: Date;
  dateProchaineEcheance: Date | null;
}> {
  const dateDerniereRealisation =
    opts.dateDerniereRealisation ?? startOfToday();
  const dateProchaineEcheance = nextControleDate(
    dateDerniereRealisation,
    opts.frequence,
  );

  if (opts.frequence !== "PONCTUELLE" && dateProchaineEcheance) {
    const openTasks = await prisma.tache.findMany({
      where: {
        controleSCIId: opts.controleId,
        statut: { notIn: [...TACHE_STATUTS_CLOS] },
        dateEcheance: { not: null },
      },
      select: { dateEcheance: true },
    });
    const exists = openTasks.some(
      (t) => t.dateEcheance && sameDay(t.dateEcheance, dateProchaineEcheance),
    );
    if (!exists) {
      await prisma.tache.create({
        data: {
          titre: `Contrôle SCI : ${opts.nom}`,
          description: `Prochaine réalisation du contrôle « ${opts.nom} ».`,
          responsableId: opts.responsableId,
          controleSCIId: opts.controleId,
          dateEcheance: dateProchaineEcheance,
          statut: "A_FAIRE",
          priorite: "MOYENNE",
          categorie: "SCI",
          creeParId: opts.userId,
          modifieParId: opts.userId,
        },
      });
    }
  }

  return { dateDerniereRealisation, dateProchaineEcheance };
}

export async function createControle(formData: FormData) {
  const current = await getCurrentUser();
  const fallback = "/controles-sci/nouveau";
  const nom = str(formData, "nom");
  if (!nom) {
    redirectWithError(fallback, "Le nom du contrôle est obligatoire.");
  }

  const processusConcerne = str(formData, "processusConcerne");
  if (!processusConcerne) {
    redirectWithError(fallback, "Le processus concerné est obligatoire.");
  }

  const frequence = str(formData, "frequence") || "TRIMESTRIELLE";
  if (!FREQUENCES.has(frequence)) {
    redirectWithError(fallback, "Fréquence invalide.");
  }

  const statut = str(formData, "statut") || "A_REALISER";
  if (!STATUTS.has(statut)) {
    redirectWithError(fallback, "Statut invalide.");
  }

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  let dateDerniereRealisation = optDate(formData, "dateDerniereRealisation");
  let dateProchaineEcheance = optDate(formData, "dateProchaineEcheance");

  const controle = await prisma.controleSCI.create({
    data: {
      nom,
      description: optStr(formData, "description"),
      processusConcerne,
      responsableId,
      frequence: frequence as "TRIMESTRIELLE",
      dateDerniereRealisation,
      dateProchaineEcheance,
      statut: statut as "A_REALISER",
      commentaires: optStr(formData, "commentaires"),
      archive: false,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  if (statut === "REALISE") {
    const applied = await applyRealisationLogic({
      controleId: controle.id,
      nom,
      frequence,
      responsableId,
      dateDerniereRealisation,
      userId: current.id,
    });
    await prisma.controleSCI.update({
      where: { id: controle.id },
      data: {
        statut: "REALISE",
        dateDerniereRealisation: applied.dateDerniereRealisation,
        dateProchaineEcheance: applied.dateProchaineEcheance,
        valideParId: current.id,
        dateValidation: new Date(),
        modifieParId: current.id,
      },
    });
  }

  revalidateApp([`/controles-sci/${controle.id}`]);
  redirectWithOk(`/controles-sci/${controle.id}`, "cree");
}

export async function updateControle(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) {
    redirectWithError("/controles-sci", "Identifiant contrôle manquant.");
  }

  const existing = await prisma.controleSCI.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/controles-sci", "Contrôle introuvable.");
  }

  const fallback = `/controles-sci/${id}/modifier`;
  const nom = str(formData, "nom");
  if (!nom) {
    redirectWithError(fallback, "Le nom du contrôle est obligatoire.");
  }

  const processusConcerne = str(formData, "processusConcerne");
  if (!processusConcerne) {
    redirectWithError(fallback, "Le processus concerné est obligatoire.");
  }

  const frequence = str(formData, "frequence") || existing.frequence;
  if (!FREQUENCES.has(frequence)) {
    redirectWithError(fallback, "Fréquence invalide.");
  }

  const statut = str(formData, "statut") || existing.statut;
  if (!STATUTS.has(statut)) {
    redirectWithError(fallback, "Statut invalide.");
  }

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  let dateDerniereRealisation =
    optDate(formData, "dateDerniereRealisation") ??
    existing.dateDerniereRealisation;
  let dateProchaineEcheance =
    optDate(formData, "dateProchaineEcheance") ??
    existing.dateProchaineEcheance;

  const becomingRealise =
    statut === "REALISE" && existing.statut !== "REALISE";

  if (becomingRealise) {
    const applied = await applyRealisationLogic({
      controleId: id,
      nom,
      frequence,
      responsableId,
      dateDerniereRealisation,
      userId: current.id,
    });
    dateDerniereRealisation = applied.dateDerniereRealisation;
    dateProchaineEcheance = applied.dateProchaineEcheance;
  }

  await prisma.controleSCI.update({
    where: { id },
    data: {
      nom,
      description: optStr(formData, "description"),
      processusConcerne,
      responsableId,
      frequence: frequence as "TRIMESTRIELLE",
      dateDerniereRealisation,
      dateProchaineEcheance,
      statut: statut as "A_REALISER",
      commentaires: optStr(formData, "commentaires"),
      modifieParId: current.id,
      ...(becomingRealise
        ? { valideParId: current.id, dateValidation: new Date() }
        : {}),
    },
  });

  revalidateApp([`/controles-sci/${id}`, `/controles-sci/${id}/modifier`]);
  redirectWithOk(`/controles-sci/${id}`, "modifie");
}

export async function validerControle(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) {
    redirectWithError("/controles-sci", "Identifiant contrôle manquant.");
  }

  const existing = await prisma.controleSCI.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/controles-sci", "Contrôle introuvable.");
  }

  if (existing.archive) {
    redirectWithError(
      `/controles-sci/${id}`,
      "Impossible de valider un contrôle archivé.",
    );
  }

  if (existing.statut === "REALISE") {
    redirectWithError(`/controles-sci/${id}`, "Ce contrôle est déjà réalisé.");
  }

  const applied = await applyRealisationLogic({
    controleId: id,
    nom: existing.nom,
    frequence: existing.frequence,
    responsableId: existing.responsableId,
    dateDerniereRealisation: existing.dateDerniereRealisation,
    userId: current.id,
  });

  await prisma.controleSCI.update({
    where: { id },
    data: {
      statut: "REALISE",
      dateDerniereRealisation: applied.dateDerniereRealisation,
      dateProchaineEcheance: applied.dateProchaineEcheance,
      valideParId: current.id,
      dateValidation: new Date(),
      modifieParId: current.id,
    },
  });

  revalidateApp([`/controles-sci/${id}`]);
  redirectWithOk(`/controles-sci/${id}`, "realise");
}

export async function archiveControle(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) {
    redirectWithError("/controles-sci", "Identifiant contrôle manquant.");
  }

  const existing = await prisma.controleSCI.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/controles-sci", "Contrôle introuvable.");
  }

  await prisma.controleSCI.update({
    where: { id },
    data: { archive: true, modifieParId: current.id },
  });

  revalidateApp([`/controles-sci/${id}`]);
  redirectWithOk(`/controles-sci/${id}`, "archive");
}

export async function unarchiveControle(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) {
    redirectWithError("/controles-sci", "Identifiant contrôle manquant.");
  }

  const existing = await prisma.controleSCI.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/controles-sci", "Contrôle introuvable.");
  }

  await prisma.controleSCI.update({
    where: { id },
    data: { archive: false, modifieParId: current.id },
  });

  revalidateApp([`/controles-sci/${id}`]);
  redirectWithOk(`/controles-sci/${id}`, "desarchive");
}

export async function deleteControle(formData: FormData) {
  const id = str(formData, "id");
  if (!id) {
    redirectWithError("/controles-sci", "Identifiant contrôle manquant.");
  }

  const existing = await prisma.controleSCI.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/controles-sci", "Contrôle introuvable.");
  }

  await prisma.controleSCI.delete({ where: { id } });
  revalidateApp();
  redirect("/controles-sci?ok=supprime");
}

export async function addPreuve(formData: FormData) {
  const current = await getCurrentUser();
  const controleSCIId = str(formData, "controleSCIId");
  const documentId = str(formData, "documentId");
  const fallback = controleSCIId
    ? `/controles-sci/${controleSCIId}`
    : "/controles-sci";

  if (!controleSCIId) {
    redirectWithError("/controles-sci", "Identifiant contrôle manquant.");
  }
  if (!documentId) {
    redirectWithError(fallback, "Sélectionnez un document comme preuve.");
  }

  const controle = await prisma.controleSCI.findUnique({
    where: { id: controleSCIId },
  });
  if (!controle) {
    redirectWithError("/controles-sci", "Contrôle introuvable.");
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });
  if (!document) {
    redirectWithError(fallback, "Document introuvable.");
  }

  const existing = await prisma.controleDocument.findUnique({
    where: {
      controleSCIId_documentId: { controleSCIId, documentId },
    },
  });
  if (existing) {
    redirectWithError(fallback, "Ce document est déjà lié comme preuve.");
  }

  await prisma.controleDocument.create({
    data: {
      controleSCIId,
      documentId,
      typeLien: "preuve",
    },
  });

  await prisma.controleSCI.update({
    where: { id: controleSCIId },
    data: { modifieParId: current.id },
  });

  revalidateApp([`/controles-sci/${controleSCIId}`]);
  redirectWithOk(`/controles-sci/${controleSCIId}`, "preuve");
}

export async function removePreuve(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const controleSCIId = str(formData, "controleSCIId");
  const fallback = controleSCIId
    ? `/controles-sci/${controleSCIId}`
    : "/controles-sci";

  if (!id) {
    redirectWithError(fallback, "Identifiant de preuve manquant.");
  }

  const lien = await prisma.controleDocument.findUnique({ where: { id } });
  if (!lien) {
    redirectWithError(fallback, "Preuve introuvable.");
  }

  await prisma.controleDocument.delete({ where: { id } });

  await prisma.controleSCI.update({
    where: { id: lien.controleSCIId },
    data: { modifieParId: current.id },
  });

  revalidateApp([`/controles-sci/${lien.controleSCIId}`]);
  redirectWithOk(`/controles-sci/${lien.controleSCIId}`, "modifie");
}

export async function createTacheDepuisControle(formData: FormData) {
  const current = await getCurrentUser();
  const controleSCIId = str(formData, "controleSCIId");
  if (!controleSCIId) {
    redirectWithError("/controles-sci", "Identifiant contrôle manquant.");
  }

  const controle = await prisma.controleSCI.findUnique({
    where: { id: controleSCIId },
  });
  if (!controle) {
    redirectWithError("/controles-sci", "Contrôle introuvable.");
  }

  const tache = await prisma.tache.create({
    data: {
      titre: `Contrôle SCI : ${controle.nom}`,
      description: controle.description,
      responsableId: controle.responsableId,
      controleSCIId: controle.id,
      dateEcheance: controle.dateProchaineEcheance,
      statut: "A_FAIRE",
      priorite: "MOYENNE",
      categorie: "SCI",
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateApp([`/controles-sci/${controleSCIId}`, `/taches/${tache.id}`]);
  redirectWithOk(`/controles-sci/${controleSCIId}`, "tache");
}
