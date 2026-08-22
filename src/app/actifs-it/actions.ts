"use server";

import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  STATUT_ACTIF_IT_OPTIONS,
  TYPE_ACTIF_IT_OPTIONS,
} from "@/lib/catalog";
import {
  allocateCreateCode,
  assertCodeUnique,
  assertNomUnique,
  normalizeCode,
} from "@/lib/codes";
import { optInt, optStr, str } from "@/lib/form";
import {
  diffChamps,
  enregistrerModifications,
} from "@/lib/historique";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { getCurrentUser } from "@/lib/session";

const TYPES = new Set(TYPE_ACTIF_IT_OPTIONS.map((o) => o.value));
const STATUTS = new Set(STATUT_ACTIF_IT_OPTIONS.map((o) => o.value));

function revalidateActif(id: string) {
  revalidateApp([`/actifs-it`, `/actifs-it/${id}`, `/actifs-it/nouveau`]);
}

async function assertResponsable(id: string | null) {
  if (!id) return true;
  const u = await prisma.utilisateur.findFirst({ where: { id, actif: true } });
  return Boolean(u);
}

async function assertUniteActive(uniteId: string) {
  return prisma.unite.findFirst({ where: { id: uniteId, actif: true } });
}

function parseCriticite(formData: FormData): number | null {
  const n = optInt(formData, "criticite");
  if (n == null) return null;
  if (n < 1 || n > 5) return null;
  return n;
}

async function nextHistVersion(objetId: string) {
  const last = await prisma.historiqueModification.aggregate({
    where: { typeObjet: "ACTIF_IT", objetId },
    _max: { versionObjet: true },
  });
  return (last._max.versionObjet ?? 0) + 1;
}

export async function createActifIT(formData: FormData) {
  const current = await getCurrentUser();
  const fallback = "/actifs-it/nouveau";
  const nom = str(formData, "nom");
  if (!nom) redirectWithError(fallback, "Le nom de l’actif est obligatoire.");

  const type = str(formData, "type") || "APPLICATION";
  const statut = str(formData, "statut") || "ACTIF";
  if (!TYPES.has(type as "APPLICATION") || !STATUTS.has(statut as "ACTIF")) {
    redirectWithError(fallback, "Type ou statut invalide.");
  }

  const uniteId = optStr(formData, "uniteId") || current.uniteId;
  const unite = await assertUniteActive(uniteId);
  if (!unite) redirectWithError(fallback, "Unité responsable invalide.");

  const nomErr = await assertNomUnique("ACTIF_IT", nom, uniteId);
  if (nomErr) redirectWithError(fallback, nomErr);

  const responsableId = optStr(formData, "responsableId");
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  const criticiteRaw = str(formData, "criticite");
  const criticite = parseCriticite(formData);
  if (criticiteRaw && criticite == null) {
    redirectWithError(fallback, "Criticité invalide (1 à 5).");
  }

  const allocated = await allocateCreateCode(
    "ACTIF_IT",
    uniteId,
    optStr(formData, "code"),
  );
  if (!allocated.ok) {
    redirectWithError("/actifs-it/nouveau", allocated.error);
  }

  const actif = await prisma.actifIT.create({
    data: {
      code: allocated.code,
      uniteId,
      nom,
      type: type as "APPLICATION",
      description: optStr(formData, "description"),
      responsableId: responsableId ?? null,
      statut: statut as "ACTIF",
      fournisseur: optStr(formData, "fournisseur"),
      hebergement: optStr(formData, "hebergement"),
      serviceFourni: optStr(formData, "serviceFourni"),
      criticite,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateActif(actif.id);
  redirectWithOk(`/actifs-it/${actif.id}`, "cree");
}

export async function updateActifIT(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/actifs-it", "Identifiant manquant.");
  const fallback = `/actifs-it/${id}?edit=INFOS`;

  const existing = await prisma.actifIT.findUnique({ where: { id } });
  if (!existing) redirectWithError("/actifs-it", "Actif introuvable.");
  if (existing.archive) {
    redirectWithError(`/actifs-it/${id}`, "Actif archivé — modification impossible.");
  }

  const nom = str(formData, "nom");
  if (!nom) redirectWithError(fallback, "Le nom est obligatoire.");

  const type = str(formData, "type") || existing.type;
  const statut = str(formData, "statut") || existing.statut;
  if (!TYPES.has(type as "APPLICATION") || !STATUTS.has(statut as "ACTIF")) {
    redirectWithError(fallback, "Type ou statut invalide.");
  }

  const uniteId = optStr(formData, "uniteId") || existing.uniteId;
  const unite = await assertUniteActive(uniteId);
  if (!unite) redirectWithError(fallback, "Unité responsable invalide.");

  const nomErr = await assertNomUnique("ACTIF_IT", nom, uniteId, id);
  if (nomErr) redirectWithError(fallback, nomErr);

  const codeRaw = optStr(formData, "code") ?? existing.code;
  const code = normalizeCode(codeRaw);
  const codeErr = await assertCodeUnique("ACTIF_IT", code, uniteId, id);
  if (codeErr) redirectWithError(fallback, codeErr);

  const responsableId = optStr(formData, "responsableId");
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  const criticiteRaw = str(formData, "criticite");
  const criticite = parseCriticite(formData);
  if (criticiteRaw && criticite == null) {
    redirectWithError(fallback, "Criticité invalide (1 à 5).");
  }

  const serviceFourni = optStr(formData, "serviceFourni");
  const description = optStr(formData, "description");
  const fournisseur = optStr(formData, "fournisseur");
  const hebergement = optStr(formData, "hebergement");

  const changes = diffChamps([
    { champ: "code", avant: existing.code, apres: code },
    { champ: "nom", avant: existing.nom, apres: nom },
    { champ: "type", avant: existing.type, apres: type },
    { champ: "statut", avant: existing.statut, apres: statut },
    { champ: "uniteId", avant: existing.uniteId, apres: uniteId },
    {
      champ: "responsableId",
      avant: existing.responsableId,
      apres: responsableId,
    },
    { champ: "description", avant: existing.description, apres: description },
    { champ: "fournisseur", avant: existing.fournisseur, apres: fournisseur },
    { champ: "hebergement", avant: existing.hebergement, apres: hebergement },
    {
      champ: "serviceFourni",
      avant: existing.serviceFourni,
      apres: serviceFourni,
    },
    { champ: "criticite", avant: existing.criticite, apres: criticite },
  ]);

  await prisma.actifIT.update({
    where: { id },
    data: {
      code,
      nom,
      type: type as "APPLICATION",
      description,
      responsableId: responsableId ?? null,
      statut: statut as "ACTIF",
      fournisseur,
      hebergement,
      serviceFourni,
      criticite,
      uniteId,
      modifieParId: current.id,
    },
  });

  if (changes.length > 0) {
    await enregistrerModifications({
      typeObjet: "ACTIF_IT",
      objetId: id,
      uniteId,
      modifieParId: current.id,
      changes,
      versionObjet: await nextHistVersion(id),
    });
  }

  revalidateActif(id);
  redirectWithOk(`/actifs-it/${id}`, "modifie");
}

export async function archiveActifIT(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/actifs-it", "Identifiant manquant.");
  await prisma.actifIT.update({
    where: { id },
    data: { archive: true, statut: "ARCHIVE", modifieParId: current.id },
  });
  revalidateActif(id);
  redirectWithOk(`/actifs-it/${id}`, "archive");
}

export async function unarchiveActifIT(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/actifs-it", "Identifiant manquant.");
  await prisma.actifIT.update({
    where: { id },
    data: { archive: false, statut: "ACTIF", modifieParId: current.id },
  });
  revalidateActif(id);
  redirectWithOk(`/actifs-it/${id}`, "restaure");
}

export async function deleteActifIT(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/actifs-it", "Identifiant manquant.");
  const existing = await prisma.actifIT.findUnique({
    where: { id },
    include: { _count: { select: { processus: true } } },
  });
  if (!existing) redirectWithError("/actifs-it", "Actif introuvable.");
  if (existing._count.processus > 0) {
    redirectWithError(
      `/actifs-it/${id}`,
      "Des processus sont liés — archivez plutôt que supprimer.",
    );
  }
  await prisma.actifIT.delete({ where: { id } });
  revalidateApp(["/actifs-it"]);
  redirectWithOk("/actifs-it", "supprime");
}

export async function linkActifProcessus(formData: FormData) {
  const current = await getCurrentUser();
  const actifITId = str(formData, "actifITId");
  const processusId = str(formData, "processusId");
  const retour = optStr(formData, "retour") ?? `/actifs-it/${actifITId}`;
  if (!actifITId || !processusId) {
    redirectWithError(retour, "Identifiant manquant.");
  }

  const [actif, processus] = await Promise.all([
    prisma.actifIT.findUnique({ where: { id: actifITId } }),
    prisma.processus.findFirst({
      where: { id: processusId, uniteId: current.uniteId, archive: false },
    }),
  ]);
  if (!actif || actif.uniteId !== current.uniteId) {
    redirectWithError("/actifs-it", "Actif introuvable.");
  }
  if (!processus) redirectWithError(retour, "Processus introuvable ou archivé.");

  await prisma.processusActifIT.upsert({
    where: {
      processusId_actifITId: { processusId, actifITId },
    },
    create: {
      processusId,
      actifITId,
      lieParId: current.id,
    },
    update: {},
  });

  revalidateApp([
    `/actifs-it/${actifITId}`,
    `/processus/${processusId}`,
    `/actifs-it`,
  ]);
  redirectWithOk(retour, "lien");
}

export async function unlinkActifProcessus(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  const retour = optStr(formData, "retour") ?? "/actifs-it";
  if (!id) redirectWithError(retour, "Identifiant manquant.");

  const lien = await prisma.processusActifIT.findUnique({
    where: { id },
    include: { actifIT: true, processus: true },
  });
  if (!lien || lien.actifIT.uniteId !== current.uniteId) {
    redirectWithError(retour, "Lien introuvable.");
  }

  await prisma.processusActifIT.delete({ where: { id } });
  revalidateApp([
    `/actifs-it/${lien.actifITId}`,
    `/processus/${lien.processusId}`,
    `/actifs-it`,
  ]);
  redirectWithOk(retour, "lien_retire");
}
