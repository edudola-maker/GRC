"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  NIVEAU_CONFIDENTIALITE_OPTIONS,
  STATUT_PROCESSUS_OPTIONS,
} from "@/lib/catalog";
import {
  allocateCreateCode,
  assertCodeUnique,
  assertNomUnique,
  nextCode,
  normalizeCode
} from "@/lib/codes";
import { optInt, optStr, str } from "@/lib/form";
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
import { syncApplicables } from "@/lib/unites-referentiel";

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
  revalidateApp([`/processus/${id}`, `/processus/${id}/modifier`, "/processus"]);
}

function parseApplicableUniteIds(formData: FormData): string[] {
  const raw = formData.getAll("applicableUniteIds");
  return raw
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
}

export async function createProcessus(formData: FormData) {
  const current = await getCurrentUser();
  const fallback = "/processus/nouveau";
  const nom = str(formData, "nom");
  if (!nom) redirectWithError(fallback, "Le nom du processus est obligatoire.");

  const statut = str(formData, "statut") || "ACTIF";
  if (!STATUTS.has(statut as "ACTIF" | "SUSPENDU")) {
    redirectWithError(fallback, "Statut invalide.");
  }

  const uniteId = optStr(formData, "uniteId") || current.uniteId;
  const unite = await prisma.unite.findFirst({
    where: { id: uniteId, actif: true },
  });
  if (!unite) redirectWithError(fallback, "Unité responsable invalide.");

  const nomErr = await assertNomUnique("PROCESSUS", nom, uniteId);
  if (nomErr) redirectWithError(fallback, nomErr);

  const responsableId = str(formData, "responsableId") || current.id;
  const lpd = parseLpd(formData);
  const macroprocessusId = optStr(formData, "macroprocessusId");
  if (macroprocessusId) {
    const macro = await prisma.macroprocessus.findFirst({
      where: { id: macroprocessusId, archive: false },
    });
    if (!macro) redirectWithError(fallback, "Macroprocessus invalide.");
  }

  const allocated = await allocateCreateCode(
    "PROCESSUS",
    uniteId,
    optStr(formData, "code"),
  );
  if (!allocated.ok) {
    redirectWithError("/processus/nouveau", allocated.error);
  }

  const processus = await prisma.processus.create({
    data: {
      code: allocated.code,
      uniteId,
      nom,
      description: optStr(formData, "description"),
      tags: serializeTags(optStr(formData, "tags")),
      responsableId,
      statut: statut as "ACTIF",
      reference: optStr(formData, "reference"),
      macroprocessusId: macroprocessusId || null,
      contientDonneesPersonnelles: lpd.contientDonneesPersonnelles,
      niveauConfidentialite: lpd.niveauConfidentialite,
      archive: false,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  await syncApplicables(
    "processus",
    processus.id,
    uniteId,
    parseApplicableUniteIds(formData),
  );

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

    const uniteId = optStr(formData, "uniteId") || existing.uniteId;
    const unite = await prisma.unite.findFirst({
      where: { id: uniteId, actif: true },
    });
    if (!unite) redirectWithError(editFallback, "Unité responsable invalide.");

    const codeRaw = str(formData, "code");
    const code = normalizeCode(codeRaw);
    const codeErr = await assertCodeUnique(
      "PROCESSUS",
      code,
      uniteId,
      id,
    );
    if (codeErr) redirectWithError(editFallback, codeErr);

    const nomErr = await assertNomUnique(
      "PROCESSUS",
      nom,
      uniteId,
      id,
    );
    if (nomErr) redirectWithError(editFallback, nomErr);

    const macroprocessusId = optStr(formData, "macroprocessusId");
    if (macroprocessusId) {
      const macro = await prisma.macroprocessus.findFirst({
        where: { id: macroprocessusId, archive: false },
      });
      if (!macro) redirectWithError(editFallback, "Macroprocessus invalide.");
    }

    const responsableId = str(formData, "responsableId") || current.id;
    const changes = diffChamps([
      { champ: "code", avant: existing.code, apres: code },
      { champ: "nom", avant: existing.nom, apres: nom },
      {
        champ: "description",
        avant: existing.description,
        apres: optStr(formData, "description"),
      },
      {
        champ: "uniteId",
        avant: existing.uniteId,
        apres: uniteId,
      },
      {
        champ: "macroprocessusId",
        avant: existing.macroprocessusId,
        apres: macroprocessusId || null,
      },
      {
        champ: "responsableId",
        avant: existing.responsableId,
        apres: responsableId,
      },
      { champ: "statut", avant: existing.statut, apres: statut },
    ]);

    await prisma.processus.update({
      where: { id },
      data: {
        code,
        nom,
        description: optStr(formData, "description"),
        reference: optStr(formData, "reference"),
        responsableId,
        statut: statut as "ACTIF",
        uniteId,
        macroprocessusId: macroprocessusId || null,
        modifieParId: current.id,
      },
    });

    await syncApplicables(
      "processus",
      id,
      uniteId,
      parseApplicableUniteIds(formData),
    );

    if (changes.length > 0) {
      await enregistrerModifications({
        typeObjet: "PROCESSUS",
        objetId: id,
        uniteId,
        modifieParId: current.id,
        changes,
        versionObjet: 1,
      });
    }
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

const RACI_ROLES = new Set(["R", "A", "C", "I"]);

/** Ajoute une ligne RACI (activité libre ou depuis une étape). */
export async function addProcessusRaciLigne(formData: FormData) {
  const current = await getCurrentUser();
  const processusId = str(formData, "processusId");
  if (!processusId) redirectWithError("/processus", "Identifiant manquant.");
  const href = `/processus/${processusId}?edit=RACI`;

  const processus = await prisma.processus.findUnique({
    where: { id: processusId },
  });
  if (!processus || processus.uniteId !== current.uniteId) {
    redirectWithError("/processus", "Processus introuvable.");
  }

  const etapeId = optStr(formData, "etapeId");
  let activite = str(formData, "activite");
  if (etapeId) {
    const etape = await prisma.processusEtape.findFirst({
      where: { id: etapeId, processusId },
    });
    if (!etape) redirectWithError(href, "Étape introuvable.");
    if (!activite) activite = etape.libelle;
  }
  if (!activite) {
    redirectWithError(href, "Indiquez une activité ou choisissez une étape.");
  }

  const maxOrdre = await prisma.processusRaciLigne.aggregate({
    where: { processusId },
    _max: { ordre: true },
  });
  await prisma.processusRaciLigne.create({
    data: {
      processusId,
      etapeId: etapeId ?? null,
      activite,
      ordre: (maxOrdre._max.ordre ?? -1) + 1,
    },
  });
  revalidateProcessus(processusId);
  redirectWithOk(href, "raci");
}

/** Initialise le RACI à partir des étapes existantes (une ligne par étape manquante). */
export async function initProcessusRaciFromEtapes(formData: FormData) {
  const current = await getCurrentUser();
  const processusId = str(formData, "processusId");
  if (!processusId) redirectWithError("/processus", "Identifiant manquant.");
  const href = `/processus/${processusId}?edit=RACI`;

  const processus = await prisma.processus.findUnique({
    where: { id: processusId },
    include: {
      etapes: { orderBy: { ordre: "asc" } },
      raciLignes: { select: { etapeId: true } },
    },
  });
  if (!processus || processus.uniteId !== current.uniteId) {
    redirectWithError("/processus", "Processus introuvable.");
  }

  const deja = new Set(
    processus.raciLignes.map((l) => l.etapeId).filter(Boolean),
  );
  const aCreer = processus.etapes.filter((e) => !deja.has(e.id));
  if (aCreer.length === 0) {
    redirectWithOk(href, "raci_deja");
  }

  const maxOrdre = await prisma.processusRaciLigne.aggregate({
    where: { processusId },
    _max: { ordre: true },
  });
  let ordre = (maxOrdre._max.ordre ?? -1) + 1;
  await prisma.processusRaciLigne.createMany({
    data: aCreer.map((e) => ({
      processusId,
      etapeId: e.id,
      activite: e.libelle,
      ordre: ordre++,
    })),
  });
  revalidateProcessus(processusId);
  redirectWithOk(href, "raci");
}

export async function updateProcessusRaciLigne(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const processusId = str(formData, "processusId");
  const activite = str(formData, "activite");
  const href = `/processus/${processusId}?edit=RACI`;
  if (!id || !processusId || !activite) {
    redirectWithError(href || "/processus", "Données RACI incomplètes.");
  }

  const ligne = await prisma.processusRaciLigne.findUnique({
    where: { id },
    include: { processus: true },
  });
  if (!ligne || ligne.processus.uniteId !== current.uniteId) {
    redirectWithError("/processus", "Ligne RACI introuvable.");
  }

  await prisma.processusRaciLigne.update({
    where: { id },
    data: { activite },
  });
  revalidateProcessus(processusId);
  redirectWithOk(href, "raci");
}

export async function deleteProcessusRaciLigne(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const processusId = str(formData, "processusId");
  const href = `/processus/${processusId}?edit=RACI`;
  if (!id || !processusId) {
    redirectWithError("/processus", "Identifiant manquant.");
  }

  const ligne = await prisma.processusRaciLigne.findUnique({
    where: { id },
    include: { processus: true },
  });
  if (!ligne || ligne.processus.uniteId !== current.uniteId) {
    redirectWithError("/processus", "Ligne RACI introuvable.");
  }

  await prisma.processusRaciLigne.delete({ where: { id } });
  revalidateProcessus(processusId);
  redirectWithOk(href, "raci");
}

export async function addProcessusRaciParticipant(formData: FormData) {
  const current = await getCurrentUser();
  const ligneId = str(formData, "ligneId");
  const processusId = str(formData, "processusId");
  const role = str(formData, "role");
  const utilisateurId = str(formData, "utilisateurId");
  const href = `/processus/${processusId}?edit=RACI`;
  if (!ligneId || !processusId || !RACI_ROLES.has(role) || !utilisateurId) {
    redirectWithError(href || "/processus", "Participant RACI incomplet.");
  }

  const ligne = await prisma.processusRaciLigne.findUnique({
    where: { id: ligneId },
    include: { processus: true },
  });
  if (!ligne || ligne.processusId !== processusId || ligne.processus.uniteId !== current.uniteId) {
    redirectWithError("/processus", "Ligne RACI introuvable.");
  }

  const user = await prisma.utilisateur.findFirst({
    where: { id: utilisateurId, uniteId: current.uniteId, actif: true },
  });
  if (!user) redirectWithError(href, "Collaborateur introuvable.");

  const exists = await prisma.processusRaciParticipant.findFirst({
    where: { ligneId, role: role as "R", utilisateurId },
  });
  if (exists) redirectWithOk(href, "raci");

  await prisma.processusRaciParticipant.create({
    data: {
      ligneId,
      role: role as "R",
      utilisateurId,
    },
  });
  revalidateProcessus(processusId);
  redirectWithOk(href, "raci");
}

export async function removeProcessusRaciParticipant(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const processusId = str(formData, "processusId");
  const href = `/processus/${processusId}?edit=RACI`;
  if (!id || !processusId) {
    redirectWithError("/processus", "Identifiant manquant.");
  }

  const part = await prisma.processusRaciParticipant.findUnique({
    where: { id },
    include: { ligne: { include: { processus: true } } },
  });
  if (
    !part ||
    part.ligne.processusId !== processusId ||
    part.ligne.processus.uniteId !== current.uniteId
  ) {
    redirectWithError("/processus", "Participant introuvable.");
  }

  await prisma.processusRaciParticipant.delete({ where: { id } });
  revalidateProcessus(processusId);
  redirectWithOk(href, "raci");
}

export async function linkProcessusActifIT(formData: FormData) {
  const current = await getCurrentUser();
  const processusId = str(formData, "processusId");
  const actifITId = str(formData, "actifITId");
  const href = `/processus/${processusId}?edit=ACTIFS_IT`;
  if (!processusId || !actifITId) {
    redirectWithError(href || "/processus", "Identifiant manquant.");
  }

  const [processus, actif] = await Promise.all([
    prisma.processus.findUnique({ where: { id: processusId } }),
    prisma.actifIT.findFirst({
      where: { id: actifITId, uniteId: current.uniteId, archive: false },
    }),
  ]);
  if (!processus || processus.uniteId !== current.uniteId) {
    redirectWithError("/processus", "Processus introuvable.");
  }
  if (!actif) redirectWithError(href, "Actif IT introuvable ou archivé.");

  await prisma.processusActifIT.upsert({
    where: { processusId_actifITId: { processusId, actifITId } },
    create: { processusId, actifITId, lieParId: current.id },
    update: {},
  });
  revalidateApp([`/processus/${processusId}`, `/actifs-it/${actifITId}`]);
  redirectWithOk(href, "actif");
}

export async function unlinkProcessusActifIT(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const processusId = str(formData, "processusId");
  const href = `/processus/${processusId}?edit=ACTIFS_IT`;
  if (!id || !processusId) {
    redirectWithError("/processus", "Identifiant manquant.");
  }

  const lien = await prisma.processusActifIT.findUnique({
    where: { id },
    include: { processus: true },
  });
  if (!lien || lien.processusId !== processusId || lien.processus.uniteId !== current.uniteId) {
    redirectWithError("/processus", "Lien introuvable.");
  }

  await prisma.processusActifIT.delete({ where: { id } });
  revalidateApp([`/processus/${processusId}`, `/actifs-it/${lien.actifITId}`]);
  redirectWithOk(href, "actif");
}

