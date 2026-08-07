"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  PRIORITE_OPTIONS,
  STATUT_PROJET_OPTIONS,
} from "@/lib/catalog";
import { assertNomUnique, nextCode } from "@/lib/codes";
import { optDate, optInt, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { getCurrentUser } from "@/lib/session";
import { serializeTags } from "@/lib/tags";

const STATUTS = new Set<string>(STATUT_PROJET_OPTIONS.map((o) => o.value));
const PRIORITES = new Set<string>(PRIORITE_OPTIONS.map((o) => o.value));

function revalidateProjetViews(id?: string) {
  const extra: string[] = [];
  if (id) {
    extra.push(`/projets/${id}`, `/projets/${id}/modifier`);
  }
  revalidateApp(extra);
}

async function assertResponsable(id: string) {
  const user = await prisma.utilisateur.findFirst({
    where: { id, actif: true },
  });
  if (!user) {
    return null;
  }
  return user;
}

export async function createProjet(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const nom = str(formData, "nom");
  if (!nom) {
    redirectWithError("/projets/nouveau", "Le nom du projet est obligatoire.");
  }

  const statut = str(formData, "statut") || "IDEE";
  const priorite = str(formData, "priorite") || "MOYENNE";
  if (!STATUTS.has(statut) || !PRIORITES.has(priorite)) {
    redirectWithError("/projets/nouveau", "Statut ou priorité invalide.");
  }

  const nomErr = await assertNomUnique("PROJET", nom, uniteId);
  if (nomErr) redirectWithError("/projets/nouveau", nomErr);

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError("/projets/nouveau", "Responsable introuvable.");
  }

  const avancement = Math.min(
    100,
    Math.max(0, optInt(formData, "avancement") ?? 0),
  );

  const projet = await prisma.projet.create({
    data: {
      code: await nextCode("PROJET", uniteId),
      uniteId,
      nom,
      description: optStr(formData, "description"),
      taxinomie: optStr(formData, "taxinomie"),
      tags: serializeTags(optStr(formData, "tags")),
      responsableId,
      dateDebut: optDate(formData, "dateDebut"),
      dateEcheance: optDate(formData, "dateEcheance"),
      statut: statut as "IDEE",
      priorite: priorite as "MOYENNE",
      avancement,
      commentaires: optStr(formData, "commentaires"),
      archive: false,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateProjetViews(projet.id);
  redirectWithOk(`/projets/${projet.id}`, "cree");
}

export async function updateProjet(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const id = str(formData, "id");
  if (!id) {
    redirectWithError("/projets", "Identifiant projet manquant.");
  }

  const existing = await prisma.projet.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/projets", "Projet introuvable.");
  }

  const nom = str(formData, "nom");
  if (!nom) {
    redirectWithError(
      `/projets/${id}/modifier`,
      "Le nom du projet est obligatoire.",
    );
  }

  const statut = str(formData, "statut") || "IDEE";
  const priorite = str(formData, "priorite") || "MOYENNE";
  if (!STATUTS.has(statut) || !PRIORITES.has(priorite)) {
    redirectWithError(`/projets/${id}/modifier`, "Statut ou priorité invalide.");
  }

  const nomErr = await assertNomUnique("PROJET", nom, uniteId, id);
  if (nomErr) redirectWithError(`/projets/${id}/modifier`, nomErr);

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(`/projets/${id}/modifier`, "Responsable introuvable.");
  }

  const avancement = Math.min(
    100,
    Math.max(0, optInt(formData, "avancement") ?? 0),
  );

  await prisma.projet.update({
    where: { id },
    data: {
      nom,
      description: optStr(formData, "description"),
      taxinomie: optStr(formData, "taxinomie"),
      tags: serializeTags(optStr(formData, "tags")),
      responsableId,
      dateDebut: optDate(formData, "dateDebut"),
      dateEcheance: optDate(formData, "dateEcheance"),
      statut: statut as "IDEE",
      priorite: priorite as "MOYENNE",
      avancement,
      commentaires: optStr(formData, "commentaires"),
      modifieParId: current.id,
    },
  });

  revalidateProjetViews(id);
  redirectWithOk(`/projets/${id}`, "modifie");
}

export async function archiveProjet(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/projets", "Identifiant projet manquant.");

  const existing = await prisma.projet.findUnique({ where: { id } });
  if (!existing) redirectWithError("/projets", "Projet introuvable.");

  await prisma.projet.update({
    where: { id },
    data: { archive: true, modifieParId: current.id },
  });

  revalidateProjetViews(id);
  redirectWithOk(`/projets/${id}`, "archive");
}

export async function unarchiveProjet(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/projets", "Identifiant projet manquant.");

  const existing = await prisma.projet.findUnique({ where: { id } });
  if (!existing) redirectWithError("/projets", "Projet introuvable.");

  await prisma.projet.update({
    where: { id },
    data: { archive: false, modifieParId: current.id },
  });

  revalidateProjetViews(id);
  redirectWithOk(`/projets/${id}`, "desarchive");
}

export async function deleteProjet(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/projets", "Identifiant projet manquant.");

  const existing = await prisma.projet.findUnique({ where: { id } });
  if (!existing) redirectWithError("/projets", "Projet introuvable.");

  // Les tâches liées passent en indépendantes (onDelete: SetNull)
  await prisma.projet.delete({ where: { id } });

  revalidateProjetViews();
  redirect("/projets?ok=supprime");
}

export async function createJalon(formData: FormData) {
  const projetId = str(formData, "projetId");
  if (!projetId) redirectWithError("/projets", "Identifiant projet manquant.");

  const projet = await prisma.projet.findUnique({ where: { id: projetId } });
  if (!projet) redirectWithError("/projets", "Projet introuvable.");
  if (projet.archive) {
    redirectWithError(`/projets/${projetId}`, "Projet archivé.");
  }

  const nom = str(formData, "nom");
  if (!nom) {
    redirectWithError(`/projets/${projetId}`, "Le nom du jalon est obligatoire.");
  }

  await prisma.jalon.create({
    data: {
      projetId,
      nom,
      dateEcheance: optDate(formData, "dateEcheance"),
    },
  });

  revalidateProjetViews(projetId);
  redirectWithOk(`/projets/${projetId}`, "jalon");
}

export async function toggleJalon(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/projets", "Identifiant jalon manquant.");

  const jalon = await prisma.jalon.findUnique({ where: { id } });
  if (!jalon) redirectWithError("/projets", "Jalon introuvable.");

  const atteint = !jalon.atteint;
  await prisma.jalon.update({
    where: { id },
    data: {
      atteint,
      dateAtteinte: atteint ? new Date() : null,
    },
  });

  revalidateProjetViews(jalon.projetId);
  redirectWithOk(`/projets/${jalon.projetId}`, "jalon");
}

export async function deleteJalon(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/projets", "Identifiant jalon manquant.");

  const jalon = await prisma.jalon.findUnique({ where: { id } });
  if (!jalon) redirectWithError("/projets", "Jalon introuvable.");

  await prisma.jalon.delete({ where: { id } });
  revalidateProjetViews(jalon.projetId);
  redirectWithOk(`/projets/${jalon.projetId}`, "supprime");
}

export async function linkProjetDocument(formData: FormData) {
  const projetId = str(formData, "projetId");
  const documentId = str(formData, "documentId");
  if (!projetId) redirectWithError("/projets", "Identifiant projet manquant.");
  if (!documentId) {
    redirectWithError(`/projets/${projetId}`, "Sélectionnez un document.");
  }

  const [projet, document] = await Promise.all([
    prisma.projet.findUnique({ where: { id: projetId } }),
    prisma.document.findUnique({ where: { id: documentId } }),
  ]);
  if (!projet) redirectWithError("/projets", "Projet introuvable.");
  if (!document) {
    redirectWithError(`/projets/${projetId}`, "Document introuvable.");
  }

  await prisma.projetDocument.upsert({
    where: { projetId_documentId: { projetId, documentId } },
    update: {},
    create: { projetId, documentId },
  });

  revalidateProjetViews(projetId);
  redirectWithOk(`/projets/${projetId}`, "lien");
}

export async function unlinkProjetDocument(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/projets", "Lien manquant.");
  const link = await prisma.projetDocument.findUnique({ where: { id } });
  if (!link) redirectWithError("/projets", "Lien introuvable.");
  await prisma.projetDocument.delete({ where: { id } });
  revalidateProjetViews(link.projetId);
  redirectWithOk(`/projets/${link.projetId}`, "supprime");
}

export async function setProjetMembres(formData: FormData) {
  const projetId = str(formData, "projetId");
  if (!projetId) redirectWithError("/projets", "Identifiant projet manquant.");

  const projet = await prisma.projet.findUnique({ where: { id: projetId } });
  if (!projet) redirectWithError("/projets", "Projet introuvable.");

  const membreIds = formData
    .getAll("membreIds")
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  await prisma.$transaction([
    prisma.projetMembre.deleteMany({ where: { projetId } }),
    ...(membreIds.length > 0
      ? [
          prisma.projetMembre.createMany({
            data: membreIds.map((utilisateurId) => ({
              projetId,
              utilisateurId,
            })),
          }),
        ]
      : []),
  ]);

  revalidateProjetViews(projetId);
  redirectWithOk(`/projets/${projetId}`, "modifie");
}
