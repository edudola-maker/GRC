"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  PRIORITE_OPTIONS,
  STATUT_PROJET_OPTIONS,
} from "@/lib/catalog";
import {
  allocateCreateCode,
  assertCodeUnique,
  assertNomUnique,
  normalizeCode,
} from "@/lib/codes";
import { optDate, optInt, optStr, str } from "@/lib/form";
import {
  diffChamps,
  enregistrerModifications,
} from "@/lib/historique";
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
import { setTachePrerequis } from "@/lib/tache-dependances";

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
  return prisma.utilisateur.findFirst({ where: { id, actif: true } });
}

export async function createProjet(formData: FormData) {
  const current = await getCurrentUser();
  const fallback = "/projets/nouveau";
  const uniteId = optStr(formData, "uniteId") || current.uniteId;
  const unite = await prisma.unite.findFirst({
    where: { id: uniteId, actif: true },
  });
  if (!unite) redirectWithError(fallback, "Unité responsable invalide.");

  const nom = str(formData, "nom");
  if (!nom) {
    redirectWithError(fallback, "Le nom du projet est obligatoire.");
  }

  const statut = str(formData, "statut") || "IDEE";
  const priorite = str(formData, "priorite") || "MOYENNE";
  if (!STATUTS.has(statut) || !PRIORITES.has(priorite)) {
    redirectWithError(fallback, "Statut ou priorité invalide.");
  }

  const nomErr = await assertNomUnique("PROJET", nom, uniteId);
  if (nomErr) redirectWithError(fallback, nomErr);

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  const avancement = Math.min(
    100,
    Math.max(0, optInt(formData, "avancement") ?? 0),
  );

  const allocated = await allocateCreateCode(
    "PROJET",
    uniteId,
    optStr(formData, "code"),
  );
  if (!allocated.ok) {
    redirectWithError(fallback, allocated.error);
  }

  const projet = await prisma.projet.create({
    data: {
      code: allocated.code,
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
      reflexion: optStr(formData, "reflexion"),
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
  const id = str(formData, "id");
  if (!id) {
    redirectWithError("/projets", "Identifiant projet manquant.");
  }

  const existing = await prisma.projet.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/projets", "Projet introuvable.");
  }

  const sectionKey = optStr(formData, "sectionKey") ?? "INFOS_GENERALES";
  const intent = parseSaveIntent(formData);
  const base = `/projets/${id}`;
  const editFallback = sectionEditHref(base, sectionKey);

  if (sectionKey === "INFOS_GENERALES") {
    const nom = str(formData, "nom");
    if (!nom) {
      redirectWithError(editFallback, "Le nom du projet est obligatoire.");
    }

    const uniteId = optStr(formData, "uniteId") || existing.uniteId;
    const unite = await prisma.unite.findFirst({
      where: { id: uniteId, actif: true },
    });
    if (!unite) redirectWithError(editFallback, "Unité responsable invalide.");

    const nomErr = await assertNomUnique("PROJET", nom, uniteId, id);
    if (nomErr) redirectWithError(editFallback, nomErr);

    const codeRaw = optStr(formData, "code") ?? existing.code;
    const code = normalizeCode(codeRaw);
    const codeErr = await assertCodeUnique("PROJET", code, uniteId, id);
    if (codeErr) redirectWithError(editFallback, codeErr);

    const description = optStr(formData, "description");
    const changes = diffChamps([
      { champ: "code", avant: existing.code, apres: code },
      { champ: "nom", avant: existing.nom, apres: nom },
      { champ: "description", avant: existing.description, apres: description },
      { champ: "uniteId", avant: existing.uniteId, apres: uniteId },
    ]);
    const bump = changes.length > 0;
    const nextVersion = bump
      ? existing.contenuVersion + 1
      : existing.contenuVersion;

    await prisma.projet.update({
      where: { id },
      data: {
        code,
        nom,
        description,
        uniteId,
        modifieParId: current.id,
        ...(bump ? { contenuVersion: nextVersion } : {}),
      },
    });

    if (bump) {
      await enregistrerModifications({
        typeObjet: "PROJET",
        objetId: id,
        uniteId,
        modifieParId: current.id,
        changes,
        versionObjet: nextVersion,
      });
    }
  } else if (sectionKey === "PILOTAGE" || sectionKey === "EQUIPE") {
    const statut = str(formData, "statut") || existing.statut;
    const priorite = str(formData, "priorite") || existing.priorite;
    if (sectionKey === "PILOTAGE") {
      if (!STATUTS.has(statut) || !PRIORITES.has(priorite)) {
        redirectWithError(editFallback, "Statut ou priorité invalide.");
      }
      const responsableId = str(formData, "responsableId") || current.id;
      if (!(await assertResponsable(responsableId))) {
        redirectWithError(editFallback, "Responsable introuvable.");
      }
      const avancement = Math.min(
        100,
        Math.max(0, optInt(formData, "avancement") ?? 0),
      );
      await prisma.projet.update({
        where: { id },
        data: {
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
    }
    // Équipe : toujours traitée depuis Pilotage (et EQUIPE legacy)
    const membreIds = formData
      .getAll("membreIds")
      .filter((v): v is string => typeof v === "string" && v.length > 0);
    if (sectionKey === "PILOTAGE" || formData.has("membreIds")) {
      await prisma.$transaction([
        prisma.projetMembre.deleteMany({ where: { projetId: id } }),
        ...(membreIds.length > 0
          ? [
              prisma.projetMembre.createMany({
                data: membreIds.map((utilisateurId) => ({
                  projetId: id,
                  utilisateurId,
                })),
              }),
            ]
          : []),
        prisma.projet.update({
          where: { id },
          data: { modifieParId: current.id },
        }),
      ]);
    }
  } else if (sectionKey === "REFLEXION") {
    await prisma.projet.update({
      where: { id },
      data: {
        reflexion: optStr(formData, "reflexion"),
        modifieParId: current.id,
      },
    });
  } else if (sectionKey === "TAGS") {
    await prisma.projet.update({
      where: { id },
      data: {
        tags: serializeTags(optStr(formData, "tags")),
        modifieParId: current.id,
      },
    });
  } else if (sectionKey === "ELEMENTS_ASSOCIES") {
    await prisma.projet.update({
      where: { id },
      data: { modifieParId: current.id },
    });
  }

  await markSectionRedaction({
    uniteId: existing.uniteId,
    typeObjet: "PROJET",
    objetId: id,
    sectionKey,
    etat: etatFromIntent(intent),
    modifieParId: current.id,
    bumpVersion: intent === "finaliser",
  });

  revalidateProjetViews(id);
  redirectWithOk(
    intent === "brouillon"
      ? sectionDraftHref(base, sectionKey)
      : sectionSavedHref(base, sectionKey),
    intent === "brouillon" ? "brouillon" : "modifie",
  );
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

  await prisma.projet.delete({ where: { id } });

  revalidateProjetViews();
  redirect("/projets?ok=supprime");
}

/** Définit les prérequis d’une tâche Projet (activation progressive). */
export async function setTachePrerequisAction(formData: FormData) {
  await getCurrentUser();
  const projetId = str(formData, "projetId");
  const tacheId = str(formData, "tacheId");
  if (!projetId || !tacheId) {
    redirectWithError("/projets", "Identifiants manquants.");
  }

  const prerequisIds = formData
    .getAll("prerequisIds")
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  const result = await setTachePrerequis({
    projetId,
    tacheId,
    prerequisIds,
  });
  if (!result.ok) {
    redirectWithError(`/projets/${projetId}`, result.erreur);
  }

  revalidateProjetViews(projetId);
  revalidateApp(["/taches", "/"]);
  redirectWithOk(`/projets/${projetId}`, "dependance");
}
