"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  CATEGORIE_TACHE_OPTIONS,
  PRIORITE_OPTIONS,
  STATUT_TACHE_OPTIONS,
} from "@/lib/catalog";
import { optDate, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { getCurrentUser } from "@/lib/session";

const STATUTS = new Set<string>(STATUT_TACHE_OPTIONS.map((o) => o.value));
const PRIORITES = new Set<string>(PRIORITE_OPTIONS.map((o) => o.value));
const CATEGORIES = new Set<string>(CATEGORIE_TACHE_OPTIONS.map((o) => o.value));

function revalidateTacheViews(
  id?: string,
  links?: {
    projetId?: string | null;
    conseilId?: string | null;
    controleSCIId?: string | null;
    auditId?: string | null;
    documentId?: string | null;
  },
) {
  const extra: string[] = [];
  if (id) {
    extra.push(`/taches/${id}`, `/taches/${id}/modifier`);
  }
  if (links?.projetId) extra.push(`/projets/${links.projetId}`);
  if (links?.conseilId) extra.push(`/conseils/${links.conseilId}`);
  if (links?.controleSCIId) {
    extra.push(`/controles-sci/${links.controleSCIId}`);
  }
  if (links?.auditId) extra.push(`/audits/${links.auditId}`);
  if (links?.documentId) extra.push(`/documents/${links.documentId}`);
  revalidateApp(extra);
}

async function recordHistory(
  tacheId: string,
  userId: string,
  changes: Array<{ champ: string; avant: string | null; apres: string | null }>,
) {
  const rows = changes.filter((c) => (c.avant ?? "") !== (c.apres ?? ""));
  if (rows.length === 0) return;
  await prisma.historiqueTache.createMany({
    data: rows.map((c) => ({
      tacheId,
      modifieParId: userId,
      champModifie: c.champ,
      ancienneValeur: c.avant,
      nouvelleValeur: c.apres,
    })),
  });
}

async function assertResponsable(id: string) {
  return prisma.utilisateur.findFirst({ where: { id, actif: true } });
}

async function assertProjetOptional(projetId: string | null) {
  if (!projetId) return true;
  const projet = await prisma.projet.findFirst({
    where: { id: projetId, archive: false },
  });
  return Boolean(projet);
}

async function assertOptionalLinks(links: {
  conseilId: string | null;
  controleSCIId: string | null;
  auditId: string | null;
  documentId: string | null;
  recommandationId: string | null;
}) {
  if (links.conseilId) {
    const c = await prisma.conseil.findUnique({
      where: { id: links.conseilId },
    });
    if (!c) return "Conseil lié introuvable.";
  }
  if (links.controleSCIId) {
    const c = await prisma.controleSCI.findUnique({
      where: { id: links.controleSCIId },
    });
    if (!c) return "Contrôle SCI lié introuvable.";
  }
  if (links.auditId) {
    const a = await prisma.audit.findUnique({ where: { id: links.auditId } });
    if (!a) return "Audit lié introuvable.";
  }
  if (links.documentId) {
    const d = await prisma.document.findUnique({
      where: { id: links.documentId },
    });
    if (!d) return "Document lié introuvable.";
  }
  if (links.recommandationId) {
    const r = await prisma.recommandation.findUnique({
      where: { id: links.recommandationId },
    });
    if (!r) return "Recommandation liée introuvable.";
  }
  return null;
}

function readLinks(formData: FormData) {
  return {
    conseilId: optStr(formData, "conseilId"),
    controleSCIId: optStr(formData, "controleSCIId"),
    auditId: optStr(formData, "auditId"),
    documentId: optStr(formData, "documentId"),
    recommandationId: optStr(formData, "recommandationId"),
  };
}

function validationPatchForStatut(
  currentId: string,
  ancienStatut: string,
  nouveauStatut: string,
) {
  const patch: {
    soumisParId?: string | null;
    dateSoumission?: Date | null;
    valideParId?: string | null;
    dateValidation?: Date | null;
  } = {};

  if (nouveauStatut === "A_VALIDER" && ancienStatut !== "A_VALIDER") {
    patch.soumisParId = currentId;
    patch.dateSoumission = new Date();
    patch.valideParId = null;
    patch.dateValidation = null;
  }
  if (nouveauStatut === "TERMINE" && ancienStatut === "A_VALIDER") {
    patch.valideParId = currentId;
    patch.dateValidation = new Date();
  }
  return patch;
}

export async function createTache(formData: FormData) {
  const current = await getCurrentUser();
  const titre = str(formData, "titre");
  const fallback = "/taches/nouvelle";

  if (!titre) {
    redirectWithError(fallback, "Le titre de la tâche est obligatoire.");
  }

  const statut = str(formData, "statut") || "A_FAIRE";
  const priorite = str(formData, "priorite") || "MOYENNE";
  const categorie = str(formData, "categorie") || "AUTRE";
  if (!STATUTS.has(statut) || !PRIORITES.has(priorite) || !CATEGORIES.has(categorie)) {
    redirectWithError(fallback, "Statut, priorité ou catégorie invalide.");
  }

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  const projetId = optStr(formData, "projetId");
  if (!(await assertProjetOptional(projetId))) {
    redirectWithError(
      fallback,
      "Projet introuvable ou archivé. Choisissez un projet actif.",
    );
  }

  const links = readLinks(formData);
  const linkError = await assertOptionalLinks(links);
  if (linkError) redirectWithError(fallback, linkError);

  const dateEcheance = optDate(formData, "dateEcheance");

  const tache = await prisma.tache.create({
    data: {
      titre,
      description: optStr(formData, "description"),
      responsableId,
      projetId,
      ...links,
      dateEcheance,
      statut: statut as "A_FAIRE",
      priorite: priorite as "MOYENNE",
      categorie: categorie as "AUTRE",
      commentaires: optStr(formData, "commentaires"),
      creeParId: current.id,
      modifieParId: current.id,
      ...validationPatchForStatut(current.id, "A_FAIRE", statut),
    },
  });

  revalidateTacheViews(tache.id, { projetId, ...links });
  redirectWithOk(`/taches/${tache.id}`, "cree");
}

export async function updateTache(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/taches", "Identifiant tâche manquant.");

  const existing = await prisma.tache.findUnique({ where: { id } });
  if (!existing) redirectWithError("/taches", "Tâche introuvable.");

  const titre = str(formData, "titre");
  if (!titre) {
    redirectWithError(
      `/taches/${id}/modifier`,
      "Le titre de la tâche est obligatoire.",
    );
  }

  const statut = str(formData, "statut") || "A_FAIRE";
  const priorite = str(formData, "priorite") || "MOYENNE";
  const categorie = str(formData, "categorie") || "AUTRE";
  if (!STATUTS.has(statut) || !PRIORITES.has(priorite) || !CATEGORIES.has(categorie)) {
    redirectWithError(
      `/taches/${id}/modifier`,
      "Statut, priorité ou catégorie invalide.",
    );
  }

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(`/taches/${id}/modifier`, "Responsable introuvable.");
  }

  const projetId = optStr(formData, "projetId");
  if (projetId && projetId !== existing.projetId) {
    if (!(await assertProjetOptional(projetId))) {
      redirectWithError(
        `/taches/${id}/modifier`,
        "Projet introuvable ou archivé.",
      );
    }
  }

  const links = readLinks(formData);
  const linkError = await assertOptionalLinks(links);
  if (linkError) {
    redirectWithError(`/taches/${id}/modifier`, linkError);
  }

  const dateEcheance = optDate(formData, "dateEcheance");

  await prisma.tache.update({
    where: { id },
    data: {
      titre,
      description: optStr(formData, "description"),
      responsableId,
      projetId,
      ...links,
      dateEcheance,
      statut: statut as "A_FAIRE",
      priorite: priorite as "MOYENNE",
      categorie: categorie as "AUTRE",
      commentaires: optStr(formData, "commentaires"),
      modifieParId: current.id,
      ...validationPatchForStatut(current.id, existing.statut, statut),
    },
  });

  const [avantResp, apresResp, avantProjet, apresProjet] = await Promise.all([
    prisma.utilisateur.findUnique({ where: { id: existing.responsableId } }),
    prisma.utilisateur.findUnique({ where: { id: responsableId } }),
    existing.projetId
      ? prisma.projet.findUnique({ where: { id: existing.projetId } })
      : Promise.resolve(null),
    projetId
      ? prisma.projet.findUnique({ where: { id: projetId } })
      : Promise.resolve(null),
  ]);

  await recordHistory(id, current.id, [
    { champ: "titre", avant: existing.titre, apres: titre },
    { champ: "statut", avant: existing.statut, apres: statut },
    { champ: "priorite", avant: existing.priorite, apres: priorite },
    { champ: "categorie", avant: existing.categorie, apres: categorie },
    {
      champ: "responsable",
      avant: avantResp?.nom ?? existing.responsableId,
      apres: apresResp?.nom ?? responsableId,
    },
    {
      champ: "projet",
      avant: avantProjet?.nom ?? existing.projetId,
      apres: apresProjet?.nom ?? projetId,
    },
    {
      champ: "dateEcheance",
      avant: existing.dateEcheance?.toISOString() ?? null,
      apres: dateEcheance?.toISOString() ?? null,
    },
  ]);

  revalidateTacheViews(id, {
    projetId: projetId ?? existing.projetId,
    conseilId: links.conseilId ?? existing.conseilId,
    controleSCIId: links.controleSCIId ?? existing.controleSCIId,
    auditId: links.auditId ?? existing.auditId,
    documentId: links.documentId ?? existing.documentId,
  });
  redirectWithOk(`/taches/${id}`, "modifie");
}

export async function updateTacheRapide(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const champ = str(formData, "champ");
  const valeur = str(formData, "valeur");

  if (!id) redirectWithError("/taches", "Identifiant tâche manquant.");

  const existing = await prisma.tache.findUnique({ where: { id } });
  if (!existing) redirectWithError("/taches", "Tâche introuvable.");

  if (champ === "statut") {
    if (!STATUTS.has(valeur)) {
      redirectWithError(`/taches/${id}`, "Statut invalide.");
    }
    await prisma.tache.update({
      where: { id },
      data: {
        statut: valeur as "A_FAIRE",
        modifieParId: current.id,
        ...validationPatchForStatut(current.id, existing.statut, valeur),
      },
    });
    await recordHistory(id, current.id, [
      { champ: "statut", avant: existing.statut, apres: valeur },
    ]);
    revalidateTacheViews(id, existing);
    redirectWithOk(`/taches/${id}`, "statut");
  }

  if (champ === "priorite") {
    if (!PRIORITES.has(valeur)) {
      redirectWithError(`/taches/${id}`, "Priorité invalide.");
    }
    await prisma.tache.update({
      where: { id },
      data: {
        priorite: valeur as "MOYENNE",
        modifieParId: current.id,
      },
    });
    await recordHistory(id, current.id, [
      { champ: "priorite", avant: existing.priorite, apres: valeur },
    ]);
    revalidateTacheViews(id, existing);
    redirectWithOk(`/taches/${id}`, "priorite");
  }

  if (champ === "responsableId") {
    if (!(await assertResponsable(valeur))) {
      redirectWithError(`/taches/${id}`, "Responsable introuvable.");
    }
    const [avantUser, apresUser] = await Promise.all([
      prisma.utilisateur.findUnique({ where: { id: existing.responsableId } }),
      prisma.utilisateur.findUnique({ where: { id: valeur } }),
    ]);
    await prisma.tache.update({
      where: { id },
      data: {
        responsableId: valeur,
        modifieParId: current.id,
      },
    });
    await recordHistory(id, current.id, [
      {
        champ: "responsable",
        avant: avantUser?.nom ?? existing.responsableId,
        apres: apresUser?.nom ?? valeur,
      },
    ]);
    revalidateTacheViews(id, existing);
    redirectWithOk(`/taches/${id}`, "responsable");
  }

  redirectWithError(`/taches/${id}`, "Action non reconnue.");
}

export async function deleteTache(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/taches", "Identifiant tâche manquant.");

  const existing = await prisma.tache.findUnique({ where: { id } });
  if (!existing) redirectWithError("/taches", "Tâche introuvable.");

  await prisma.tache.delete({ where: { id } });

  revalidateTacheViews(undefined, existing);
  redirect("/taches?ok=supprime");
}
