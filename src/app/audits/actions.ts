"use server";

import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  NIVEAU_CONFIDENTIALITE_OPTIONS,
  STATUT_MISSION_OPTIONS,
  STATUT_RECO_OPTIONS,
} from "@/lib/catalog";
import { assertNomUnique, nextCode } from "@/lib/codes";
import { optDate, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { getCurrentUser } from "@/lib/session";
import { serializeTags } from "@/lib/tags";

const STATUTS_MISSION = new Set<string>(
  STATUT_MISSION_OPTIONS.map((o) => o.value),
);
const STATUTS_RECO = new Set<string>(STATUT_RECO_OPTIONS.map((o) => o.value));
const NIVEAUX_CONF = new Set<string>(
  NIVEAU_CONFIDENTIALITE_OPTIONS.map((o) => o.value),
);

function parseLpd(formData: FormData) {
  const niveau =
    optStr(formData, "niveauConfidentialite") ?? "INTERNE";
  return {
    contientDonneesPersonnelles:
      str(formData, "contientDonneesPersonnelles") === "1",
    niveauConfidentialite: (NIVEAUX_CONF.has(niveau)
      ? niveau
      : "INTERNE") as "INTERNE",
  };
}

async function assertResponsable(id: string) {
  return prisma.utilisateur.findFirst({ where: { id, actif: true } });
}

async function resolveTemplateId(
  typeId: string,
  templateId: string | null,
): Promise<string | null> {
  if (templateId) {
    const tpl = await prisma.missionTemplate.findFirst({
      where: { id: templateId, typeId, actif: true },
    });
    return tpl?.id ?? null;
  }
  const fallback = await prisma.missionTemplate.findFirst({
    where: { typeId, actif: true },
    orderBy: { creeLe: "asc" },
  });
  return fallback?.id ?? null;
}

export async function createMission(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const fallback = "/audits/nouveau";
  const titre = str(formData, "titre");
  if (!titre) {
    redirectWithError(fallback, "Le titre de la mission est obligatoire.");
  }

  const statut = str(formData, "statut") || "PLANIFIE";
  if (!STATUTS_MISSION.has(statut)) {
    redirectWithError(fallback, "Statut invalide.");
  }

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  const typeId = str(formData, "typeId");
  if (!typeId) {
    redirectWithError(fallback, "Type de mission obligatoire.");
  }
  const type = await prisma.missionType.findFirst({
    where: { id: typeId, actif: true },
  });
  if (!type) redirectWithError(fallback, "Type de mission introuvable.");

  const templateId = await resolveTemplateId(
    typeId,
    optStr(formData, "templateId"),
  );
  if (!templateId) {
    redirectWithError(fallback, "Aucun template disponible pour ce type.");
  }

  const descriptifPresetId = optStr(formData, "descriptifPresetId");
  if (descriptifPresetId) {
    const preset = await prisma.missionDescriptifPreset.findFirst({
      where: { id: descriptifPresetId, typeId, actif: true },
    });
    if (!preset) {
      redirectWithError(fallback, "Descriptif standard introuvable.");
    }
  }

  const nomErr = await assertNomUnique("MISSION", titre, uniteId);
  if (nomErr) redirectWithError(fallback, nomErr);

  const lpd = parseLpd(formData);
  const mission = await prisma.mission.create({
    data: {
      code: await nextCode("MISSION", uniteId),
      uniteId,
      titre,
      typeId,
      templateId,
      descriptifPresetId,
      descriptifLibre: optStr(formData, "descriptifLibre"),
      nature: optStr(formData, "nature"),
      tags: serializeTags(optStr(formData, "tags")),
      responsableId,
      dateDebut: optDate(formData, "dateDebut"),
      dateFin: optDate(formData, "dateFin"),
      statut: statut as "PLANIFIE",
      commentaires: optStr(formData, "commentaires"),
      analyseTravaux: optStr(formData, "analyseTravaux"),
      contientDonneesPersonnelles: lpd.contientDonneesPersonnelles,
      niveauConfidentialite: lpd.niveauConfidentialite,
      archive: false,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  const documentId = optStr(formData, "documentId");
  if (documentId) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (doc) {
      await prisma.missionDocument.create({
        data: { missionId: mission.id, documentId },
      });
    }
  }

  revalidateApp([`/audits/${mission.id}`]);
  redirectWithOk(`/audits/${mission.id}`, "cree");
}

export async function updateMission(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/audits", "Identifiant mission manquant.");

  const existing = await prisma.mission.findUnique({ where: { id } });
  if (!existing) redirectWithError("/audits", "Mission introuvable.");

  const editFallback = `/audits/${id}?edit=VUE_ENSEMBLE`;
  const titre = str(formData, "titre");
  if (!titre) {
    redirectWithError(editFallback, "Le titre de la mission est obligatoire.");
  }

  const statut = str(formData, "statut") || "PLANIFIE";
  if (!STATUTS_MISSION.has(statut)) {
    redirectWithError(editFallback, "Statut invalide.");
  }

  const typeId = str(formData, "typeId") || existing.typeId;
  const type = await prisma.missionType.findFirst({
    where: { id: typeId, actif: true },
  });
  if (!type) {
    redirectWithError(editFallback, "Type de mission introuvable.");
  }

  const templateId =
    (await resolveTemplateId(typeId, optStr(formData, "templateId"))) ??
    existing.templateId;

  const descriptifPresetId = optStr(formData, "descriptifPresetId");
  if (descriptifPresetId) {
    const preset = await prisma.missionDescriptifPreset.findFirst({
      where: { id: descriptifPresetId, typeId, actif: true },
    });
    if (!preset) {
      redirectWithError(editFallback, "Descriptif standard introuvable.");
    }
  }

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(editFallback, "Responsable introuvable.");
  }

  const nomErr = await assertNomUnique("MISSION", titre, existing.uniteId, id);
  if (nomErr) redirectWithError(editFallback, nomErr);

  const lpd = parseLpd(formData);
  await prisma.mission.update({
    where: { id },
    data: {
      titre,
      typeId,
      templateId,
      descriptifPresetId,
      descriptifLibre: optStr(formData, "descriptifLibre"),
      nature: optStr(formData, "nature"),
      tags: serializeTags(optStr(formData, "tags")),
      responsableId,
      dateDebut: optDate(formData, "dateDebut"),
      dateFin: optDate(formData, "dateFin"),
      statut: statut as "PLANIFIE",
      commentaires: optStr(formData, "commentaires"),
      analyseTravaux: optStr(formData, "analyseTravaux"),
      contientDonneesPersonnelles: lpd.contientDonneesPersonnelles,
      niveauConfidentialite: lpd.niveauConfidentialite,
      modifieParId: current.id,
    },
  });

  revalidateApp([`/audits/${id}`]);
  redirectWithOk(`/audits/${id}`, "modifie");
}

export async function archiveMission(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/audits", "Identifiant mission manquant.");

  const existing = await prisma.mission.findUnique({ where: { id } });
  if (!existing) redirectWithError("/audits", "Mission introuvable.");

  await prisma.mission.update({
    where: { id },
    data: { archive: true, modifieParId: current.id },
  });

  revalidateApp([`/audits/${id}`]);
  redirectWithOk(`/audits/${id}`, "archive");
}

export async function unarchiveMission(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/audits", "Identifiant mission manquant.");

  const existing = await prisma.mission.findUnique({ where: { id } });
  if (!existing) redirectWithError("/audits", "Mission introuvable.");

  await prisma.mission.update({
    where: { id },
    data: { archive: false, modifieParId: current.id },
  });

  revalidateApp([`/audits/${id}`]);
  redirectWithOk(`/audits/${id}`, "desarchive");
}

/**
 * Soft-delete privilégié : archive la mission.
 * Pas de suppression physique (recommandations en Restrict).
 */
export async function deleteMission(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/audits", "Identifiant mission manquant.");

  const existing = await prisma.mission.findUnique({
    where: { id },
    include: { _count: { select: { recommandations: true } } },
  });
  if (!existing) redirectWithError("/audits", "Mission introuvable.");

  if (existing._count.recommandations > 0 && existing.archive) {
    redirectWithError(
      `/audits/${id}`,
      "Impossible de supprimer définitivement une mission qui a des recommandations — elle reste archivée.",
    );
  }

  await prisma.mission.update({
    where: { id },
    data: { archive: true, modifieParId: current.id },
  });

  revalidateApp([`/audits/${id}`]);
  redirectWithOk(`/audits/${id}`, "archive");
}

export async function createRecommandation(formData: FormData) {
  const missionId =
    str(formData, "missionId") || str(formData, "auditId");
  if (!missionId) {
    redirectWithError("/audits", "Identifiant mission manquant.");
  }

  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) redirectWithError("/audits", "Mission introuvable.");

  const titre = str(formData, "titre");
  if (!titre) {
    redirectWithError(
      `/audits/${missionId}`,
      "Le titre de la recommandation est obligatoire.",
    );
  }

  const statut = str(formData, "statut") || "OUVERTE";
  if (!STATUTS_RECO.has(statut)) {
    redirectWithError(
      `/audits/${missionId}`,
      "Statut de recommandation invalide.",
    );
  }

  const responsableId = optStr(formData, "responsableId");
  if (responsableId && !(await assertResponsable(responsableId))) {
    redirectWithError(`/audits/${missionId}`, "Responsable introuvable.");
  }

  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const reco = await prisma.recommandation.create({
    data: {
      uniteId,
      code: await nextCode("RECOMMANDATION", uniteId),
      missionId,
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
        uniteId,
        titre: `Reco : ${titre}`,
        description: optStr(formData, "description"),
        responsableId: responsableId ?? mission.responsableId,
        missionId,
        recommandationId: reco.id,
        dateEcheance: optDate(formData, "dateEcheance"),
        statut: "A_FAIRE",
        priorite: "MOYENNE",
        categorie: "MISSION",
        creeParId: current.id,
        modifieParId: current.id,
      },
    });
  }

  revalidateApp([`/audits/${missionId}`]);
  redirectWithOk(`/audits/${missionId}?edit=RECOMMANDATIONS`, "reco");
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
      `/audits/${existing.missionId}`,
      "Le titre de la recommandation est obligatoire.",
    );
  }

  const statut = str(formData, "statut") || "OUVERTE";
  if (!STATUTS_RECO.has(statut)) {
    redirectWithError(
      `/audits/${existing.missionId}`,
      "Statut de recommandation invalide.",
    );
  }

  const responsableId = optStr(formData, "responsableId");
  if (responsableId && !(await assertResponsable(responsableId))) {
    redirectWithError(
      `/audits/${existing.missionId}`,
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

  revalidateApp([`/audits/${existing.missionId}`]);
  redirectWithOk(`/audits/${existing.missionId}?edit=RECOMMANDATIONS`, "modifie");
}

export async function deleteRecommandation(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/audits", "Identifiant recommandation manquant.");

  const existing = await prisma.recommandation.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/audits", "Recommandation introuvable.");
  }

  const missionId = existing.missionId;
  await prisma.recommandation.update({
    where: { id },
    data: { archive: true },
  });
  revalidateApp([`/audits/${missionId}`]);
  redirectWithOk(`/audits/${missionId}?edit=RECOMMANDATIONS`, "supprime");
}

export async function createTacheDepuisMission(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const missionId =
    str(formData, "missionId") ||
    str(formData, "auditId") ||
    str(formData, "id");
  if (!missionId) {
    redirectWithError("/audits", "Identifiant mission manquant.");
  }

  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) redirectWithError("/audits", "Mission introuvable.");

  const tache = await prisma.tache.create({
    data: {
      uniteId,
      titre: `Mission : ${mission.titre}`,
      description: mission.nature ?? mission.descriptifLibre,
      responsableId: mission.responsableId,
      missionId: mission.id,
      dateEcheance: mission.dateFin,
      statut: "A_FAIRE",
      priorite: "MOYENNE",
      categorie: "MISSION",
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateApp([`/audits/${mission.id}`, `/taches/${tache.id}`]);
  redirectWithOk(`/taches/${tache.id}`, "tache");
}

export async function createTacheDepuisReco(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const recommandationId =
    str(formData, "recommandationId") || str(formData, "id");
  if (!recommandationId) {
    redirectWithError("/audits", "Identifiant recommandation manquant.");
  }

  const reco = await prisma.recommandation.findUnique({
    where: { id: recommandationId },
    include: { mission: true },
  });
  if (!reco) redirectWithError("/audits", "Recommandation introuvable.");

  const tache = await prisma.tache.create({
    data: {
      uniteId,
      titre: `Reco : ${reco.titre}`,
      description: reco.description,
      responsableId:
        reco.responsableId ?? reco.mission.responsableId ?? current.id,
      missionId: reco.missionId,
      recommandationId: reco.id,
      dateEcheance: reco.dateEcheance,
      statut: "A_FAIRE",
      priorite: "MOYENNE",
      categorie: "MISSION",
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateApp([`/audits/${reco.missionId}`, `/taches/${tache.id}`]);
  redirectWithOk(`/taches/${tache.id}`, "tache");
}

export async function linkDocument(formData: FormData) {
  const missionId =
    str(formData, "missionId") || str(formData, "auditId");
  const documentId = str(formData, "documentId");
  if (!missionId) {
    redirectWithError("/audits", "Identifiant mission manquant.");
  }
  if (!documentId) {
    redirectWithError(`/audits/${missionId}`, "Sélectionnez un document.");
  }

  const [mission, document] = await Promise.all([
    prisma.mission.findUnique({ where: { id: missionId } }),
    prisma.document.findUnique({ where: { id: documentId } }),
  ]);
  if (!mission) redirectWithError("/audits", "Mission introuvable.");
  if (!document) {
    redirectWithError(`/audits/${missionId}`, "Document introuvable.");
  }

  const existing = await prisma.missionDocument.findUnique({
    where: {
      missionId_documentId: { missionId, documentId },
    },
  });
  if (existing) {
    redirectWithError(
      `/audits/${missionId}`,
      "Ce document est déjà lié à la mission.",
    );
  }

  await prisma.missionDocument.create({
    data: { missionId, documentId },
  });

  revalidateApp([`/audits/${missionId}`, `/documents/${documentId}`]);
  redirectWithOk(`/audits/${missionId}?edit=PLANIFICATION`, "lien");
}

export async function addMissionMembre(formData: FormData) {
  const current = await getCurrentUser();
  const missionId = str(formData, "missionId");
  const utilisateurId = str(formData, "utilisateurId");
  if (!missionId || !utilisateurId) {
    redirectWithError("/audits", "Données équipe incomplètes.");
  }

  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission || mission.uniteId !== current.uniteId) {
    redirectWithError("/audits", "Mission introuvable.");
  }

  const user = await prisma.utilisateur.findFirst({
    where: { id: utilisateurId, uniteId: current.uniteId, actif: true },
  });
  if (!user) {
    redirectWithError(`/audits/${missionId}`, "Utilisateur introuvable.");
  }

  const roleIds = formData
    .getAll("roleIds")
    .map(String)
    .filter(Boolean);

  const membre = await prisma.missionMembre.upsert({
    where: {
      missionId_utilisateurId: { missionId, utilisateurId },
    },
    create: { missionId, utilisateurId },
    update: {},
  });

  const validRoles = await prisma.missionRole.findMany({
    where: { id: { in: roleIds }, actif: true },
    select: { id: true },
  });
  await prisma.missionMembreRole.deleteMany({ where: { membreId: membre.id } });
  if (validRoles.length) {
    await prisma.missionMembreRole.createMany({
      data: validRoles.map((r) => ({ membreId: membre.id, roleId: r.id })),
    });
  }

  await prisma.mission.update({
    where: { id: missionId },
    data: { modifieParId: current.id },
  });

  revalidateApp([`/audits/${missionId}`]);
  redirectWithOk(`/audits/${missionId}?edit=PLANIFICATION`, "equipe");
}

export async function removeMissionMembre(formData: FormData) {
  const current = await getCurrentUser();
  const missionId = str(formData, "missionId");
  const membreId = str(formData, "membreId");
  if (!missionId || !membreId) {
    redirectWithError("/audits", "Données équipe incomplètes.");
  }

  const membre = await prisma.missionMembre.findFirst({
    where: { id: membreId, missionId, mission: { uniteId: current.uniteId } },
  });
  if (!membre) {
    redirectWithError(`/audits/${missionId}`, "Membre introuvable.");
  }

  await prisma.missionMembre.delete({ where: { id: membreId } });
  await prisma.mission.update({
    where: { id: missionId },
    data: { modifieParId: current.id },
  });

  revalidateApp([`/audits/${missionId}`]);
  redirectWithOk(`/audits/${missionId}?edit=PLANIFICATION`, "equipe");
}

export async function setMissionMembreRoles(formData: FormData) {
  const current = await getCurrentUser();
  const missionId = str(formData, "missionId");
  const membreId = str(formData, "membreId");
  if (!missionId || !membreId) {
    redirectWithError("/audits", "Données équipe incomplètes.");
  }

  const membre = await prisma.missionMembre.findFirst({
    where: { id: membreId, missionId, mission: { uniteId: current.uniteId } },
  });
  if (!membre) {
    redirectWithError(`/audits/${missionId}`, "Membre introuvable.");
  }

  const roleIds = formData
    .getAll("roleIds")
    .map(String)
    .filter(Boolean);
  const validRoles = await prisma.missionRole.findMany({
    where: { id: { in: roleIds }, actif: true },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.missionMembreRole.deleteMany({ where: { membreId } }),
    prisma.missionMembreRole.createMany({
      data: validRoles.map((r) => ({ membreId, roleId: r.id })),
    }),
    prisma.mission.update({
      where: { id: missionId },
      data: { modifieParId: current.id },
    }),
  ]);

  revalidateApp([`/audits/${missionId}`]);
  redirectWithOk(`/audits/${missionId}?edit=PLANIFICATION`, "equipe");
}

/** Alias de transition — préférer les noms Mission. */
export const createAudit = createMission;
export const updateAudit = updateMission;
export const archiveAudit = archiveMission;
export const unarchiveAudit = unarchiveMission;
export const deleteAudit = deleteMission;
export const createTacheDepuisAudit = createTacheDepuisMission;
