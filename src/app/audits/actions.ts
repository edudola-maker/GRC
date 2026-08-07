"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  STATUT_AUDIT_OPTIONS,
  STATUT_RECO_OPTIONS,
} from "@/lib/catalog";
import { assertNomUnique, nextCode } from "@/lib/codes";
import { optDate, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { getCurrentUser } from "@/lib/session";
import { serializeTags } from "@/lib/tags";

const STATUTS_AUDIT = new Set<string>(
  STATUT_AUDIT_OPTIONS.map((o) => o.value),
);
const STATUTS_RECO = new Set<string>(STATUT_RECO_OPTIONS.map((o) => o.value));

async function assertResponsable(id: string) {
  return prisma.utilisateur.findFirst({ where: { id, actif: true } });
}

export async function createAudit(formData: FormData) {
  const current = await getCurrentUser();
  const fallback = "/audits/nouveau";
  const titre = str(formData, "titre");
  if (!titre) {
    redirectWithError(fallback, "Le titre de l'audit est obligatoire.");
  }

  const statut = str(formData, "statut") || "PLANIFIE";
  if (!STATUTS_AUDIT.has(statut)) {
    redirectWithError(fallback, "Statut invalide.");
  }

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  const nomErr = await assertNomUnique("AUDIT", titre);
  if (nomErr) redirectWithError(fallback, nomErr);

  const audit = await prisma.audit.create({
    data: {
      code: await nextCode("AUDIT"),
      titre,
      perimetre: optStr(formData, "perimetre"),
      taxinomie: optStr(formData, "taxinomie"),
      tags: serializeTags(optStr(formData, "tags")),
      responsableId,
      dateDebut: optDate(formData, "dateDebut"),
      dateFin: optDate(formData, "dateFin"),
      statut: statut as "PLANIFIE",
      commentaires: optStr(formData, "commentaires"),
      archive: false,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  const documentId = optStr(formData, "documentId");
  if (documentId) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (doc) {
      await prisma.auditDocument.create({
        data: { auditId: audit.id, documentId },
      });
    }
  }

  revalidateApp([`/audits/${audit.id}`]);
  redirectWithOk(`/audits/${audit.id}`, "cree");
}

export async function updateAudit(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/audits", "Identifiant audit manquant.");

  const existing = await prisma.audit.findUnique({ where: { id } });
  if (!existing) redirectWithError("/audits", "Audit introuvable.");

  const titre = str(formData, "titre");
  if (!titre) {
    redirectWithError(
      `/audits/${id}/modifier`,
      "Le titre de l'audit est obligatoire.",
    );
  }

  const statut = str(formData, "statut") || "PLANIFIE";
  if (!STATUTS_AUDIT.has(statut)) {
    redirectWithError(`/audits/${id}/modifier`, "Statut invalide.");
  }

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(`/audits/${id}/modifier`, "Responsable introuvable.");
  }

  await prisma.audit.update({
    where: { id },
    data: {
      titre,
      perimetre: optStr(formData, "perimetre"),
      taxinomie: optStr(formData, "taxinomie"),
      tags: serializeTags(optStr(formData, "tags")),
      responsableId,
      dateDebut: optDate(formData, "dateDebut"),
      dateFin: optDate(formData, "dateFin"),
      statut: statut as "PLANIFIE",
      commentaires: optStr(formData, "commentaires"),
      modifieParId: current.id,
    },
  });

  revalidateApp([`/audits/${id}`, `/audits/${id}/modifier`]);
  redirectWithOk(`/audits/${id}`, "modifie");
}

export async function archiveAudit(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/audits", "Identifiant audit manquant.");

  const existing = await prisma.audit.findUnique({ where: { id } });
  if (!existing) redirectWithError("/audits", "Audit introuvable.");

  await prisma.audit.update({
    where: { id },
    data: { archive: true, modifieParId: current.id },
  });

  revalidateApp([`/audits/${id}`]);
  redirectWithOk(`/audits/${id}`, "archive");
}

export async function unarchiveAudit(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/audits", "Identifiant audit manquant.");

  const existing = await prisma.audit.findUnique({ where: { id } });
  if (!existing) redirectWithError("/audits", "Audit introuvable.");

  await prisma.audit.update({
    where: { id },
    data: { archive: false, modifieParId: current.id },
  });

  revalidateApp([`/audits/${id}`]);
  redirectWithOk(`/audits/${id}`, "desarchive");
}

export async function deleteAudit(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/audits", "Identifiant audit manquant.");

  const existing = await prisma.audit.findUnique({ where: { id } });
  if (!existing) redirectWithError("/audits", "Audit introuvable.");

  await prisma.audit.delete({ where: { id } });
  revalidateApp();
  redirect("/audits?ok=supprime");
}

export async function createRecommandation(formData: FormData) {
  const auditId = str(formData, "auditId");
  if (!auditId) redirectWithError("/audits", "Identifiant audit manquant.");

  const audit = await prisma.audit.findUnique({ where: { id: auditId } });
  if (!audit) redirectWithError("/audits", "Audit introuvable.");

  const titre = str(formData, "titre");
  if (!titre) {
    redirectWithError(
      `/audits/${auditId}`,
      "Le titre de la recommandation est obligatoire.",
    );
  }

  const statut = str(formData, "statut") || "OUVERTE";
  if (!STATUTS_RECO.has(statut)) {
    redirectWithError(`/audits/${auditId}`, "Statut de recommandation invalide.");
  }

  const responsableId = optStr(formData, "responsableId");
  if (responsableId && !(await assertResponsable(responsableId))) {
    redirectWithError(`/audits/${auditId}`, "Responsable introuvable.");
  }

  const current = await getCurrentUser();
  const reco = await prisma.recommandation.create({
    data: {
      auditId,
      titre,
      description: optStr(formData, "description"),
      responsableId,
      dateEcheance: optDate(formData, "dateEcheance"),
      statut: statut as "OUVERTE",
      commentaires: optStr(formData, "commentaires"),
    },
  });

  if (str(formData, "creerTache") === "1") {
    await prisma.tache.create({
      data: {
        titre: `Reco : ${titre}`,
        description: optStr(formData, "description"),
        responsableId: responsableId ?? audit.responsableId,
        auditId,
        recommandationId: reco.id,
        dateEcheance: optDate(formData, "dateEcheance"),
        statut: "A_FAIRE",
        priorite: "MOYENNE",
        categorie: "AUDIT",
        creeParId: current.id,
        modifieParId: current.id,
      },
    });
  }

  revalidateApp([`/audits/${auditId}`]);
  redirectWithOk(`/audits/${auditId}`, "reco");
}

export async function updateRecommandation(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/audits", "Identifiant recommandation manquant.");

  const existing = await prisma.recommandation.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/audits", "Recommandation introuvable.");
  }

  const titre = str(formData, "titre");
  if (!titre) {
    redirectWithError(
      `/audits/${existing.auditId}`,
      "Le titre de la recommandation est obligatoire.",
    );
  }

  const statut = str(formData, "statut") || "OUVERTE";
  if (!STATUTS_RECO.has(statut)) {
    redirectWithError(
      `/audits/${existing.auditId}`,
      "Statut de recommandation invalide.",
    );
  }

  const responsableId = optStr(formData, "responsableId");
  if (responsableId && !(await assertResponsable(responsableId))) {
    redirectWithError(
      `/audits/${existing.auditId}`,
      "Responsable introuvable.",
    );
  }

  await prisma.recommandation.update({
    where: { id },
    data: {
      titre,
      description: optStr(formData, "description"),
      responsableId,
      dateEcheance: optDate(formData, "dateEcheance"),
      statut: statut as "OUVERTE",
      commentaires: optStr(formData, "commentaires"),
    },
  });

  revalidateApp([`/audits/${existing.auditId}`]);
  redirectWithOk(`/audits/${existing.auditId}`, "modifie");
}

export async function deleteRecommandation(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/audits", "Identifiant recommandation manquant.");

  const existing = await prisma.recommandation.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/audits", "Recommandation introuvable.");
  }

  const auditId = existing.auditId;
  await prisma.recommandation.delete({ where: { id } });
  revalidateApp([`/audits/${auditId}`]);
  redirectWithOk(`/audits/${auditId}`, "supprime");
}

export async function createTacheDepuisAudit(formData: FormData) {
  const current = await getCurrentUser();
  const auditId = str(formData, "auditId") || str(formData, "id");
  if (!auditId) {
    redirectWithError("/audits", "Identifiant audit manquant.");
  }

  const audit = await prisma.audit.findUnique({ where: { id: auditId } });
  if (!audit) redirectWithError("/audits", "Audit introuvable.");

  const tache = await prisma.tache.create({
    data: {
      titre: `Audit : ${audit.titre}`,
      description: audit.perimetre,
      responsableId: audit.responsableId,
      auditId: audit.id,
      dateEcheance: audit.dateFin,
      statut: "A_FAIRE",
      priorite: "MOYENNE",
      categorie: "AUDIT",
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateApp([`/audits/${audit.id}`, `/taches/${tache.id}`]);
  redirectWithOk(`/taches/${tache.id}`, "tache");
}

export async function createTacheDepuisReco(formData: FormData) {
  const current = await getCurrentUser();
  const recommandationId =
    str(formData, "recommandationId") || str(formData, "id");
  if (!recommandationId) {
    redirectWithError("/audits", "Identifiant recommandation manquant.");
  }

  const reco = await prisma.recommandation.findUnique({
    where: { id: recommandationId },
    include: { audit: true },
  });
  if (!reco) redirectWithError("/audits", "Recommandation introuvable.");

  const tache = await prisma.tache.create({
    data: {
      titre: `Reco : ${reco.titre}`,
      description: reco.description,
      responsableId:
        reco.responsableId ?? reco.audit.responsableId ?? current.id,
      auditId: reco.auditId,
      recommandationId: reco.id,
      dateEcheance: reco.dateEcheance,
      statut: "A_FAIRE",
      priorite: "MOYENNE",
      categorie: "AUDIT",
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateApp([`/audits/${reco.auditId}`, `/taches/${tache.id}`]);
  redirectWithOk(`/taches/${tache.id}`, "tache");
}

export async function linkDocument(formData: FormData) {
  const auditId = str(formData, "auditId");
  const documentId = str(formData, "documentId");
  if (!auditId) redirectWithError("/audits", "Identifiant audit manquant.");
  if (!documentId) {
    redirectWithError(`/audits/${auditId}`, "Sélectionnez un document.");
  }

  const [audit, document] = await Promise.all([
    prisma.audit.findUnique({ where: { id: auditId } }),
    prisma.document.findUnique({ where: { id: documentId } }),
  ]);
  if (!audit) redirectWithError("/audits", "Audit introuvable.");
  if (!document) {
    redirectWithError(`/audits/${auditId}`, "Document introuvable.");
  }

  const existing = await prisma.auditDocument.findUnique({
    where: {
      auditId_documentId: { auditId, documentId },
    },
  });
  if (existing) {
    redirectWithError(
      `/audits/${auditId}`,
      "Ce document est déjà lié à l'audit.",
    );
  }

  await prisma.auditDocument.create({
    data: { auditId, documentId },
  });

  revalidateApp([`/audits/${auditId}`, `/documents/${documentId}`]);
  redirectWithOk(`/audits/${auditId}`, "lien");
}
