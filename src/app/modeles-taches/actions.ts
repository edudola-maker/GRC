"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import { CATEGORIE_TACHE_OPTIONS } from "@/lib/catalog";
import { assertNomUnique, nextCode } from "@/lib/codes";
import { optInt, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import {
  etatFromIntent,
  markSectionRedaction,
  parseSaveIntent,
} from "@/lib/section-redaction";
import { getCurrentUser } from "@/lib/session";

const CATEGORIES = new Set<string>(CATEGORIE_TACHE_OPTIONS.map((o) => o.value));

function revalidateModele(id: string) {
  revalidateApp([
    `/modeles-taches`,
    `/modeles-taches/${id}`,
    `/modeles-taches/${id}/modifier`,
  ]);
}

export async function createModeleTache(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const fallback = "/modeles-taches/nouveau";
  const nom = str(formData, "nom");
  if (!nom) redirectWithError(fallback, "Le nom du modèle est obligatoire.");

  const nomErr = await assertNomUnique("MODELE_TACHE", nom, uniteId);
  if (nomErr) redirectWithError(fallback, nomErr);

  const categorieRaw = optStr(formData, "categorieDefaut");
  const categorieDefaut =
    categorieRaw && CATEGORIES.has(categorieRaw)
      ? (categorieRaw as "AUTRE")
      : null;

  const modele = await prisma.modeleTache.create({
    data: {
      code: await nextCode("MODELE_TACHE", uniteId),
      uniteId,
      nom,
      description: optStr(formData, "description"),
      delaiJours: optInt(formData, "delaiJours"),
      responsableDefautId: optStr(formData, "responsableDefautId"),
      categorieDefaut,
      actif: str(formData, "actif") !== "0",
      creeParId: current.id,
    },
  });

  revalidateModele(modele.id);
  redirectWithOk(`/modeles-taches/${modele.id}`, "cree");
}

export async function updateModeleTache(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/modeles-taches", "Identifiant manquant.");

  const existing = await prisma.modeleTache.findUnique({ where: { id } });
  if (!existing) redirectWithError("/modeles-taches", "Modèle introuvable.");

  const sectionKey = optStr(formData, "sectionKey") ?? "INFOS_GENERALES";
  const intent = parseSaveIntent(formData);
  const editFallback = `/modeles-taches/${id}?edit=${sectionKey}`;

  if (sectionKey === "INFOS_GENERALES") {
    const nom = str(formData, "nom");
    if (!nom) {
      redirectWithError(editFallback, "Le nom du modèle est obligatoire.");
    }
    const nomErr = await assertNomUnique(
      "MODELE_TACHE",
      nom,
      existing.uniteId,
      id,
    );
    if (nomErr) redirectWithError(editFallback, nomErr);

    await prisma.modeleTache.update({
      where: { id },
      data: {
        nom,
        description: optStr(formData, "description"),
      },
    });
  } else if (sectionKey === "PARAMETRES") {
    const categorieRaw = optStr(formData, "categorieDefaut");
    const categorieDefaut =
      categorieRaw && CATEGORIES.has(categorieRaw)
        ? (categorieRaw as "AUTRE")
        : null;
    await prisma.modeleTache.update({
      where: { id },
      data: {
        delaiJours: optInt(formData, "delaiJours"),
        responsableDefautId: optStr(formData, "responsableDefautId"),
        categorieDefaut,
        actif: str(formData, "actif") !== "0",
      },
    });
  } else if (
    sectionKey === "CHECKLIST" ||
    sectionKey === "PROCESSUS_ASSOCIES"
  ) {
    // Structure déjà mutée par les actions dédiées — on ne fait que marquer la rédaction.
  }

  await markSectionRedaction({
    uniteId: existing.uniteId,
    typeObjet: "MODELE_TACHE",
    objetId: id,
    sectionKey,
    etat: etatFromIntent(intent),
    modifieParId: current.id,
    bumpVersion: intent === "finaliser",
  });

  revalidateModele(id);
  redirectWithOk(
    intent === "brouillon" ? editFallback : `/modeles-taches/${id}`,
    intent === "brouillon" ? "brouillon" : "modifie",
  );
}

async function markChecklistBrouillon(
  modeleId: string,
  userId: string,
  uniteId: string,
) {
  await markSectionRedaction({
    uniteId,
    typeObjet: "MODELE_TACHE",
    objetId: modeleId,
    sectionKey: "CHECKLIST",
    etat: "BROUILLON",
    modifieParId: userId,
  });
}

export async function addModeleTacheEtape(formData: FormData) {
  const current = await getCurrentUser();
  const modeleTacheId = str(formData, "modeleTacheId");
  if (!modeleTacheId) {
    redirectWithError("/modeles-taches", "Identifiant manquant.");
  }
  const modele = await prisma.modeleTache.findUnique({
    where: { id: modeleTacheId },
  });
  if (!modele) redirectWithError("/modeles-taches", "Modèle introuvable.");

  const libelle = str(formData, "libelle");
  if (!libelle) {
    redirectWithError(
      `/modeles-taches/${modeleTacheId}?edit=CHECKLIST`,
      "Libellé d’étape obligatoire.",
    );
  }

  const max = await prisma.modeleTacheEtape.aggregate({
    where: { modeleTacheId },
    _max: { ordre: true },
  });
  await prisma.modeleTacheEtape.create({
    data: {
      modeleTacheId,
      libelle,
      ordre: (max._max.ordre ?? -1) + 1,
    },
  });
  await markChecklistBrouillon(modeleTacheId, current.id, modele.uniteId);
  revalidateModele(modeleTacheId);
  redirectWithOk(`/modeles-taches/${modeleTacheId}?edit=CHECKLIST`, "etape");
}

export async function updateModeleTacheEtape(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const modeleTacheId = str(formData, "modeleTacheId");
  if (!id || !modeleTacheId) {
    redirectWithError("/modeles-taches", "Identifiant manquant.");
  }
  const etape = await prisma.modeleTacheEtape.findFirst({
    where: { id, modeleTacheId },
    include: { modeleTache: true },
  });
  if (!etape) {
    redirectWithError(`/modeles-taches/${modeleTacheId}`, "Étape introuvable.");
  }

  const libelle = str(formData, "libelle");
  if (!libelle) {
    redirectWithError(
      `/modeles-taches/${modeleTacheId}?edit=CHECKLIST`,
      "Libellé d’étape obligatoire.",
    );
  }
  await prisma.modeleTacheEtape.update({ where: { id }, data: { libelle } });
  await markChecklistBrouillon(
    modeleTacheId,
    current.id,
    etape.modeleTache.uniteId,
  );
  revalidateModele(modeleTacheId);
  redirectWithOk(`/modeles-taches/${modeleTacheId}?edit=CHECKLIST`, "etape");
}

export async function deleteModeleTacheEtape(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const modeleTacheId = str(formData, "modeleTacheId");
  if (!id || !modeleTacheId) {
    redirectWithError("/modeles-taches", "Identifiant manquant.");
  }
  const etape = await prisma.modeleTacheEtape.findFirst({
    where: { id, modeleTacheId },
    include: { modeleTache: true },
  });
  if (!etape) {
    redirectWithError(`/modeles-taches/${modeleTacheId}`, "Étape introuvable.");
  }

  await prisma.modeleTacheEtape.delete({ where: { id } });
  const rest = await prisma.modeleTacheEtape.findMany({
    where: { modeleTacheId },
    orderBy: { ordre: "asc" },
  });
  await prisma.$transaction(
    rest.map((e, i) =>
      prisma.modeleTacheEtape.update({
        where: { id: e.id },
        data: { ordre: i },
      }),
    ),
  );
  await markChecklistBrouillon(
    modeleTacheId,
    current.id,
    etape.modeleTache.uniteId,
  );
  revalidateModele(modeleTacheId);
  redirectWithOk(`/modeles-taches/${modeleTacheId}?edit=CHECKLIST`, "etape");
}

export async function moveModeleTacheEtape(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const modeleTacheId = str(formData, "modeleTacheId");
  const direction = str(formData, "direction");
  if (!id || !modeleTacheId) {
    redirectWithError("/modeles-taches", "Identifiant manquant.");
  }

  const etapes = await prisma.modeleTacheEtape.findMany({
    where: { modeleTacheId },
    orderBy: { ordre: "asc" },
    include: { modeleTache: true },
  });
  const index = etapes.findIndex((e) => e.id === id);
  if (index < 0) {
    redirectWithError(
      `/modeles-taches/${modeleTacheId}?edit=CHECKLIST`,
      "Étape introuvable.",
    );
  }
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= etapes.length) {
    redirect(`/modeles-taches/${modeleTacheId}?edit=CHECKLIST`);
  }

  const a = etapes[index]!;
  const b = etapes[swapWith]!;
  await prisma.$transaction([
    prisma.modeleTacheEtape.update({
      where: { id: a.id },
      data: { ordre: b.ordre },
    }),
    prisma.modeleTacheEtape.update({
      where: { id: b.id },
      data: { ordre: a.ordre },
    }),
  ]);
  await markChecklistBrouillon(
    modeleTacheId,
    current.id,
    a.modeleTache.uniteId,
  );
  revalidateModele(modeleTacheId);
  redirectWithOk(`/modeles-taches/${modeleTacheId}?edit=CHECKLIST`, "etape");
}

async function markProcessusBrouillon(
  modeleId: string,
  userId: string,
  uniteId: string,
) {
  await markSectionRedaction({
    uniteId,
    typeObjet: "MODELE_TACHE",
    objetId: modeleId,
    sectionKey: "PROCESSUS_ASSOCIES",
    etat: "BROUILLON",
    modifieParId: userId,
  });
}

export async function linkModeleTacheProcessus(formData: FormData) {
  const current = await getCurrentUser();
  const modeleTacheId = str(formData, "modeleTacheId");
  const processusId = str(formData, "processusId");
  if (!modeleTacheId || !processusId) {
    redirectWithError("/modeles-taches", "Identifiant manquant.");
  }

  const modele = await prisma.modeleTache.findUnique({
    where: { id: modeleTacheId },
  });
  if (!modele) redirectWithError("/modeles-taches", "Modèle introuvable.");

  const processus = await prisma.processus.findFirst({
    where: { id: processusId, uniteId: modele.uniteId, archive: false },
  });
  if (!processus) {
    redirectWithError(
      `/modeles-taches/${modeleTacheId}?edit=PROCESSUS_ASSOCIES`,
      "Processus introuvable.",
    );
  }

  await prisma.modeleTacheProcessus.upsert({
    where: {
      modeleTacheId_processusId: { modeleTacheId, processusId },
    },
    create: {
      modeleTacheId,
      processusId,
      lieParId: current.id,
    },
    update: {},
  });
  await markProcessusBrouillon(modeleTacheId, current.id, modele.uniteId);
  revalidateModele(modeleTacheId);
  revalidateApp([`/processus/${processusId}`]);
  redirectWithOk(
    `/modeles-taches/${modeleTacheId}?edit=PROCESSUS_ASSOCIES`,
    "lien_ajoute",
  );
}

export async function unlinkModeleTacheProcessus(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const modeleTacheId = str(formData, "modeleTacheId");
  if (!id || !modeleTacheId) {
    redirectWithError("/modeles-taches", "Identifiant manquant.");
  }

  const link = await prisma.modeleTacheProcessus.findFirst({
    where: { id, modeleTacheId },
    include: { modeleTache: true },
  });
  if (!link) {
    redirectWithError(`/modeles-taches/${modeleTacheId}`, "Lien introuvable.");
  }

  await prisma.modeleTacheProcessus.delete({ where: { id } });
  await markProcessusBrouillon(
    modeleTacheId,
    current.id,
    link.modeleTache.uniteId,
  );
  revalidateModele(modeleTacheId);
  revalidateApp([`/processus/${link.processusId}`]);
  redirectWithOk(
    `/modeles-taches/${modeleTacheId}?edit=PROCESSUS_ASSOCIES`,
    "lien_supprime",
  );
}

export async function desactiverModeleTache(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/modeles-taches", "Identifiant manquant.");
  await prisma.modeleTache.update({
    where: { id },
    data: { actif: false },
  });
  revalidateModele(id);
  redirectWithOk(`/modeles-taches/${id}`, "desactive");
}

export async function activerModeleTache(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/modeles-taches", "Identifiant manquant.");
  await prisma.modeleTache.update({
    where: { id },
    data: { actif: true },
  });
  revalidateModele(id);
  redirectWithOk(`/modeles-taches/${id}`, "active");
}

export async function deleteModeleTache(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/modeles-taches", "Identifiant manquant.");
  await prisma.modeleTache.delete({ where: { id } });
  revalidateApp(["/modeles-taches"]);
  redirect("/modeles-taches?ok=supprime");
}

/** Crée une tâche réelle depuis le modèle (copie checklist, pas de sync ultérieure). */
export async function createTacheDepuisModele(formData: FormData) {
  const current = await getCurrentUser();
  const modeleTacheId = str(formData, "modeleTacheId");
  if (!modeleTacheId) {
    redirectWithError("/modeles-taches", "Identifiant manquant.");
  }

  const modele = await prisma.modeleTache.findUnique({
    where: { id: modeleTacheId },
    include: { etapes: { orderBy: { ordre: "asc" } } },
  });
  if (!modele) redirectWithError("/modeles-taches", "Modèle introuvable.");
  if (!modele.actif) {
    redirectWithError(
      `/modeles-taches/${modeleTacheId}`,
      "Ce modèle est inactif.",
    );
  }

  const responsableId =
    optStr(formData, "responsableId") ||
    modele.responsableDefautId ||
    current.id;

  let dateEcheance: Date | null = null;
  if (modele.delaiJours != null && modele.delaiJours >= 0) {
    dateEcheance = new Date();
    dateEcheance.setHours(12, 0, 0, 0);
    dateEcheance.setDate(dateEcheance.getDate() + modele.delaiJours);
  }

  const tache = await prisma.tache.create({
    data: {
      uniteId: modele.uniteId,
      titre: modele.nom,
      description: modele.description,
      responsableId,
      modeleTacheId: modele.id,
      dateEcheance,
      statut: "A_FAIRE",
      priorite: "MOYENNE",
      categorie: modele.categorieDefaut ?? "AUTRE",
      creeParId: current.id,
      modifieParId: current.id,
      checklistItems: {
        create: modele.etapes.map((e) => ({
          libelle: e.libelle,
          ordre: e.ordre,
          sourceModeleEtapeId: e.id,
        })),
      },
    },
  });

  revalidateApp([
    `/taches/${tache.id}`,
    `/modeles-taches/${modeleTacheId}`,
    "/taches",
  ]);
  redirectWithOk(`/taches/${tache.id}`, "tache");
}
