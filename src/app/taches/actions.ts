"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  CATEGORIE_TACHE_OPTIONS,
  PRIORITE_OPTIONS,
  STATUT_TACHE_OPTIONS,
} from "@/lib/catalog";
import { optDate, optFloat, optStr, str } from "@/lib/form";
import { safeRetourPath } from "@/lib/navigation-retour";
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
    missionId?: string | null;
    documentId?: string | null;
  },
) {
  const extra: string[] = [];
  if (id) {
    extra.push(`/taches/${id}`, `/taches/${id}?edit=INFOS_GENERALES`);
  }
  if (links?.projetId) extra.push(`/projets/${links.projetId}`);
  if (links?.conseilId) extra.push(`/conseils/${links.conseilId}`);
  if (links?.controleSCIId) {
    extra.push(`/controles-sci/${links.controleSCIId}`);
  }
  if (links?.missionId) extra.push(`/missions/${links.missionId}`);
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
  missionId: string | null;
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
  if (links.missionId) {
    const a = await prisma.mission.findUnique({ where: { id: links.missionId } });
    if (!a) return "Mission liée introuvable.";
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
    missionId: optStr(formData, "missionId") ?? optStr(formData, "auditId"),
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
  if (nouveauStatut === "TERMINE") {
    patch.valideParId = currentId;
    patch.dateValidation = new Date();
  }
  return patch;
}

export async function createTache(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
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

  const dateDebut = optDate(formData, "dateDebut");
  const dateEcheance = optDate(formData, "dateEcheance");
  const chargeJours = optFloat(formData, "chargeJours");
  const retour = safeRetourPath(optStr(formData, "retour"), "");

  const tache = await prisma.tache.create({
    data: {
      uniteId,
      titre,
      description: optStr(formData, "description"),
      responsableId,
      projetId,
      ...links,
      dateDebut,
      dateEcheance,
      chargeJours,
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
  const detail = retour
    ? `/taches/${tache.id}?retour=${encodeURIComponent(retour)}`
    : `/taches/${tache.id}`;
  redirectWithOk(detail, "cree");
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
      `/taches/${id}?edit=INFOS_GENERALES`,
      "Le titre de la tâche est obligatoire.",
    );
  }

  const statut = str(formData, "statut") || "A_FAIRE";
  const priorite = str(formData, "priorite") || "MOYENNE";
  const categorie = str(formData, "categorie") || "AUTRE";
  if (!STATUTS.has(statut) || !PRIORITES.has(priorite) || !CATEGORIES.has(categorie)) {
    redirectWithError(
      `/taches/${id}?edit=INFOS_GENERALES`,
      "Statut, priorité ou catégorie invalide.",
    );
  }

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(`/taches/${id}?edit=INFOS_GENERALES`, "Responsable introuvable.");
  }

  const projetId = optStr(formData, "projetId");
  if (projetId && projetId !== existing.projetId) {
    if (!(await assertProjetOptional(projetId))) {
      redirectWithError(
        `/taches/${id}?edit=INFOS_GENERALES`,
        "Projet introuvable ou archivé.",
      );
    }
  }

  const links = readLinks(formData);
  const linkError = await assertOptionalLinks(links);
  if (linkError) {
    redirectWithError(`/taches/${id}?edit=INFOS_GENERALES`, linkError);
  }

  const dateDebut = optDate(formData, "dateDebut");
  const dateEcheance = optDate(formData, "dateEcheance");
  const chargeJours = optFloat(formData, "chargeJours");
  const retour = safeRetourPath(optStr(formData, "retour"), "");

  await prisma.tache.update({
    where: { id },
    data: {
      titre,
      description: optStr(formData, "description"),
      responsableId,
      projetId,
      ...links,
      dateDebut,
      dateEcheance,
      chargeJours,
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
      champ: "dateDebut",
      avant: existing.dateDebut?.toISOString() ?? null,
      apres: dateDebut?.toISOString() ?? null,
    },
    {
      champ: "dateEcheance",
      avant: existing.dateEcheance?.toISOString() ?? null,
      apres: dateEcheance?.toISOString() ?? null,
    },
    {
      champ: "chargeJours",
      avant: existing.chargeJours != null ? String(existing.chargeJours) : null,
      apres: chargeJours != null ? String(chargeJours) : null,
    },
    {
      champ: "commentaires",
      avant: existing.commentaires,
      apres: optStr(formData, "commentaires"),
    },
  ]);

  revalidateTacheViews(id, {
    projetId: projetId ?? existing.projetId,
    conseilId: links.conseilId ?? existing.conseilId,
    controleSCIId: links.controleSCIId ?? existing.controleSCIId,
    missionId: links.missionId ?? existing.missionId,
    documentId: links.documentId ?? existing.documentId,
  });
  const detail = retour
    ? `/taches/${id}?retour=${encodeURIComponent(retour)}`
    : `/taches/${id}`;
  redirectWithOk(detail, "modifie");
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

function checklistEditHref(tacheId: string) {
  return `/taches/${tacheId}?edit=CHECKLIST`;
}

/** Cocher / décocher une étape — autorisé en consultation (exécution). */
export async function toggleTacheChecklistItem(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const tacheId = str(formData, "tacheId");
  if (!id || !tacheId) redirectWithError("/taches", "Identifiant manquant.");

  const item = await prisma.tacheChecklistItem.findFirst({
    where: { id, tacheId },
  });
  if (!item) redirectWithError(`/taches/${tacheId}`, "Étape introuvable.");

  const fait = formData.get("fait") === "1";
  await prisma.tacheChecklistItem.update({
    where: { id },
    data: {
      fait,
      faitParId: fait ? current.id : null,
      faitLe: fait ? new Date() : null,
    },
  });
  await prisma.tache.update({
    where: { id: tacheId },
    data: { modifieParId: current.id },
  });

  revalidateTacheViews(tacheId);
  redirectWithOk(`/taches/${tacheId}`, "checklist");
}

export async function addTacheChecklistItem(formData: FormData) {
  const current = await getCurrentUser();
  const tacheId = str(formData, "tacheId");
  if (!tacheId) redirectWithError("/taches", "Identifiant manquant.");

  const tache = await prisma.tache.findUnique({ where: { id: tacheId } });
  if (!tache) redirectWithError("/taches", "Tâche introuvable.");

  const libelle = str(formData, "libelle");
  if (!libelle) {
    redirectWithError(checklistEditHref(tacheId), "Libellé d’étape obligatoire.");
  }

  const max = await prisma.tacheChecklistItem.aggregate({
    where: { tacheId },
    _max: { ordre: true },
  });
  await prisma.tacheChecklistItem.create({
    data: {
      tacheId,
      libelle,
      ordre: (max._max.ordre ?? -1) + 1,
    },
  });
  await prisma.tache.update({
    where: { id: tacheId },
    data: { modifieParId: current.id },
  });

  revalidateTacheViews(tacheId);
  redirectWithOk(checklistEditHref(tacheId), "etape");
}

export async function updateTacheChecklistItem(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const tacheId = str(formData, "tacheId");
  if (!id || !tacheId) redirectWithError("/taches", "Identifiant manquant.");

  const item = await prisma.tacheChecklistItem.findFirst({
    where: { id, tacheId },
  });
  if (!item) redirectWithError(`/taches/${tacheId}`, "Étape introuvable.");

  const libelle = str(formData, "libelle");
  if (!libelle) {
    redirectWithError(checklistEditHref(tacheId), "Libellé d’étape obligatoire.");
  }

  await prisma.tacheChecklistItem.update({ where: { id }, data: { libelle } });
  await prisma.tache.update({
    where: { id: tacheId },
    data: { modifieParId: current.id },
  });

  revalidateTacheViews(tacheId);
  redirectWithOk(checklistEditHref(tacheId), "etape");
}

export async function deleteTacheChecklistItem(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const tacheId = str(formData, "tacheId");
  if (!id || !tacheId) redirectWithError("/taches", "Identifiant manquant.");

  const item = await prisma.tacheChecklistItem.findFirst({
    where: { id, tacheId },
  });
  if (!item) redirectWithError(`/taches/${tacheId}`, "Étape introuvable.");

  await prisma.tacheChecklistItem.delete({ where: { id } });
  const rest = await prisma.tacheChecklistItem.findMany({
    where: { tacheId },
    orderBy: { ordre: "asc" },
  });
  await prisma.$transaction(
    rest.map((e, i) =>
      prisma.tacheChecklistItem.update({
        where: { id: e.id },
        data: { ordre: i },
      }),
    ),
  );
  await prisma.tache.update({
    where: { id: tacheId },
    data: { modifieParId: current.id },
  });

  revalidateTacheViews(tacheId);
  redirectWithOk(checklistEditHref(tacheId), "etape");
}

export async function moveTacheChecklistItem(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const tacheId = str(formData, "tacheId");
  const direction = str(formData, "direction");
  if (!id || !tacheId) redirectWithError("/taches", "Identifiant manquant.");

  const items = await prisma.tacheChecklistItem.findMany({
    where: { tacheId },
    orderBy: { ordre: "asc" },
  });
  const index = items.findIndex((e) => e.id === id);
  if (index < 0) {
    redirectWithError(checklistEditHref(tacheId), "Étape introuvable.");
  }
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= items.length) {
    redirect(checklistEditHref(tacheId));
  }

  const a = items[index]!;
  const b = items[swapWith]!;
  await prisma.$transaction([
    prisma.tacheChecklistItem.update({
      where: { id: a.id },
      data: { ordre: b.ordre },
    }),
    prisma.tacheChecklistItem.update({
      where: { id: b.id },
      data: { ordre: a.ordre },
    }),
  ]);
  await prisma.tache.update({
    where: { id: tacheId },
    data: { modifieParId: current.id },
  });

  revalidateTacheViews(tacheId);
  redirectWithOk(checklistEditHref(tacheId), "etape");
}

/** Terminer rapidement une tâche depuis le backlog */
export async function completeTacheRapide(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const retour = str(formData, "retour") || "/backlog";

  if (!id) redirectWithError(retour, "Identifiant tâche manquant.");

  const existing = await prisma.tache.findUnique({ where: { id } });
  if (!existing) redirectWithError(retour, "Tâche introuvable.");

  await prisma.tache.update({
    where: { id },
    data: {
      statut: "TERMINE",
      modifieParId: current.id,
      ...validationPatchForStatut(current.id, existing.statut, "TERMINE"),
    },
  });

  await recordHistory(id, current.id, [
    { champ: "statut", avant: existing.statut, apres: "TERMINE" },
  ]);

  revalidateTacheViews(id, existing);
  redirectWithOk(retour, "statut");
}
