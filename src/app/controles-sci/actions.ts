"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  FREQUENCE_CONTROLE_OPTIONS,
  STATUT_CONTROLE_OPTIONS,
  TYPE_CONTROLE_OPTIONS,
} from "@/lib/catalog";
import {
  allocateCreateCode,
  assertCodeUnique,
  assertNomUnique,
  normalizeCode,
} from "@/lib/codes";
import { nextControleDate } from "@/lib/dates";
import { optDate, optInt, optStr, str } from "@/lib/form";
import {
  diffChamps,
  enregistrerModifications,
} from "@/lib/historique";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { sectionEditHref, sectionSavedHref } from "@/lib/section-nav";
import { getCurrentUser } from "@/lib/session";
import { serializeTags } from "@/lib/tags";

const STATUTS = new Set<string>(STATUT_CONTROLE_OPTIONS.map((o) => o.value));
const FREQUENCES = new Set<string>(
  FREQUENCE_CONTROLE_OPTIONS.map((o) => o.value),
);
const TYPES = new Set<string>(TYPE_CONTROLE_OPTIONS.map((o) => o.value));

async function assertResponsable(id: string) {
  return prisma.utilisateur.findFirst({ where: { id, actif: true } });
}

async function nextHistVersion(objetId: string) {
  const last = await prisma.historiqueModification.aggregate({
    where: { typeObjet: "CONTROLE_SCI", objetId },
    _max: { versionObjet: true },
  });
  return (last._max.versionObjet ?? 0) + 1;
}

export async function createControleSCI(formData: FormData) {
  const current = await getCurrentUser();
  const fallback = "/controles-sci/nouveau";
  const uniteId = optStr(formData, "uniteId") || current.uniteId;
  const unite = await prisma.unite.findFirst({
    where: { id: uniteId, actif: true },
  });
  if (!unite) redirectWithError(fallback, "Unité responsable invalide.");

  const nom = str(formData, "nom");
  const processusConcerne = str(formData, "processusConcerne");
  if (!nom) redirectWithError(fallback, "Le nom du contrôle est obligatoire.");
  if (!processusConcerne) {
    redirectWithError(fallback, "Le processus concerné est obligatoire.");
  }

  const statut = str(formData, "statut") || "ACTIF";
  const frequence = str(formData, "frequence") || "TRIMESTRIELLE";
  const typeControle = str(formData, "typeControle") || "MANUEL";
  if (!STATUTS.has(statut) || !FREQUENCES.has(frequence) || !TYPES.has(typeControle)) {
    redirectWithError(fallback, "Statut, type ou fréquence invalide.");
  }

  const nomErr = await assertNomUnique("CONTROLE_SCI", nom, uniteId);
  if (nomErr) redirectWithError(fallback, nomErr);

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  const fenetreDeclenchementJours =
    optInt(formData, "fenetreDeclenchementJours") ?? 30;
  const delaiRealisationJours = optInt(formData, "delaiRealisationJours");
  const dateDerniereRealisation = optDate(formData, "dateDerniereRealisation");
  const dateProchaineEcheance =
    optDate(formData, "dateProchaineEcheance") ??
    nextControleDate(new Date(), frequence);

  const allocated = await allocateCreateCode(
    "CONTROLE_SCI",
    uniteId,
    optStr(formData, "code"),
  );
  if (!allocated.ok) {
    redirectWithError(fallback, allocated.error);
  }

  const controle = await prisma.controleSCI.create({
    data: {
      code: allocated.code,
      uniteId,
      nom,
      description: optStr(formData, "description"),
      taxinomie: optStr(formData, "taxinomie"),
      tags: serializeTags(optStr(formData, "tags")),
      processusConcerne,
      responsableId,
      typeControle: typeControle as "MANUEL",
      frequence: frequence as "TRIMESTRIELLE",
      fenetreDeclenchementJours,
      delaiRealisationJours,
      dateDerniereRealisation,
      dateProchaineEcheance,
      statut: statut as "ACTIF",
      commentaires: optStr(formData, "commentaires"),
      archive: false,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateApp([`/controles-sci/${controle.id}`]);
  redirectWithOk(`/controles-sci/${controle.id}`, "cree");
}

export async function updateControleSCI(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/controles-sci", "Identifiant manquant.");

  const existing = await prisma.controleSCI.findUnique({ where: { id } });
  if (!existing) redirectWithError("/controles-sci", "Contrôle introuvable.");

  const sectionKey = optStr(formData, "sectionKey") ?? "INFOS_GENERALES";
  const base = `/controles-sci/${id}`;
  const editFallback = sectionEditHref(base, sectionKey);

  const nom = str(formData, "nom");
  const processusConcerne = str(formData, "processusConcerne");
  if (!nom) {
    redirectWithError(editFallback, "Le nom du contrôle est obligatoire.");
  }
  if (!processusConcerne) {
    redirectWithError(editFallback, "Le processus concerné est obligatoire.");
  }

  const statut = str(formData, "statut") || "ACTIF";
  const frequence = str(formData, "frequence") || existing.frequence;
  if (!STATUTS.has(statut) || !FREQUENCES.has(frequence)) {
    redirectWithError(editFallback, "Statut ou fréquence invalide.");
  }

  const uniteId = optStr(formData, "uniteId") || existing.uniteId;
  const unite = await prisma.unite.findFirst({
    where: { id: uniteId, actif: true },
  });
  if (!unite) redirectWithError(editFallback, "Unité responsable invalide.");

  const nomErr = await assertNomUnique("CONTROLE_SCI", nom, uniteId, id);
  if (nomErr) redirectWithError(editFallback, nomErr);

  const codeRaw = optStr(formData, "code") ?? existing.code;
  const code = normalizeCode(codeRaw);
  const codeErr = await assertCodeUnique("CONTROLE_SCI", code, uniteId, id);
  if (codeErr) redirectWithError(editFallback, codeErr);

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(editFallback, "Responsable introuvable.");
  }

  const typeControle = str(formData, "typeControle") || existing.typeControle;
  if (!TYPES.has(typeControle)) {
    redirectWithError(editFallback, "Type de contrôle invalide.");
  }

  const fenetreDeclenchementJours =
    optInt(formData, "fenetreDeclenchementJours") ??
    existing.fenetreDeclenchementJours;
  const delaiRealisationJours = optInt(formData, "delaiRealisationJours");
  const taxinomie = optStr(formData, "taxinomie");
  const tags = serializeTags(optStr(formData, "tags"));
  const description = optStr(formData, "description");
  const commentaires = optStr(formData, "commentaires");

  const changes = diffChamps([
    { champ: "code", avant: existing.code, apres: code },
    { champ: "nom", avant: existing.nom, apres: nom },
    { champ: "description", avant: existing.description, apres: description },
    { champ: "uniteId", avant: existing.uniteId, apres: uniteId },
    {
      champ: "processusConcerne",
      avant: existing.processusConcerne,
      apres: processusConcerne,
    },
    { champ: "statut", avant: existing.statut, apres: statut },
    {
      champ: "responsableId",
      avant: existing.responsableId,
      apres: responsableId,
    },
  ]);

  await prisma.controleSCI.update({
    where: { id },
    data: {
      code,
      nom,
      description,
      processusConcerne,
      responsableId,
      typeControle: typeControle as "MANUEL",
      frequence: frequence as "TRIMESTRIELLE",
      fenetreDeclenchementJours,
      delaiRealisationJours,
      taxinomie,
      tags,
      dateDerniereRealisation: optDate(formData, "dateDerniereRealisation"),
      dateProchaineEcheance: optDate(formData, "dateProchaineEcheance"),
      statut: statut as "ACTIF",
      commentaires,
      uniteId,
      modifieParId: current.id,
    },
  });

  if (changes.length > 0) {
    await enregistrerModifications({
      typeObjet: "CONTROLE_SCI",
      objetId: id,
      uniteId,
      modifieParId: current.id,
      changes,
      versionObjet: await nextHistVersion(id),
    });
  }

  revalidateApp([`/controles-sci/${id}`, `/controles-sci/${id}?edit=INFOS_GENERALES`]);
  redirectWithOk(sectionSavedHref(base, sectionKey), "modifie");
}

export async function lierRisqueControle(formData: FormData) {
  const controleSCIId = str(formData, "controleSCIId");
  const risqueId = str(formData, "risqueId");
  const retour =
    str(formData, "retour") ||
    (controleSCIId ? `/controles-sci/${controleSCIId}?edit=INFOS_GENERALES` : "/controles-sci");
  if (!controleSCIId || !risqueId) {
    redirectWithError(retour, "Contrôle et risque requis.");
  }

  const [controle, risque] = await Promise.all([
    prisma.controleSCI.findUnique({ where: { id: controleSCIId } }),
    prisma.risque.findUnique({ where: { id: risqueId } }),
  ]);
  if (!controle) redirectWithError("/controles-sci", "Contrôle introuvable.");
  if (!risque) {
    redirectWithError(retour, "Risque introuvable.");
  }

  await prisma.risqueControle.upsert({
    where: {
      risqueId_controleSCIId: { risqueId, controleSCIId },
    },
    create: { risqueId, controleSCIId },
    update: {},
  });

  revalidateApp([
    `/controles-sci/${controleSCIId}`,
    `/controles-sci/${controleSCIId}?edit=INFOS_GENERALES`,
    `/risques/${risqueId}`,
  ]);
  redirectWithOk(retour, "lien");
}

export async function delierRisqueControle(formData: FormData) {
  const controleSCIId = str(formData, "controleSCIId");
  const risqueId = str(formData, "risqueId");
  const retour =
    str(formData, "retour") ||
    (controleSCIId ? `/controles-sci/${controleSCIId}?edit=INFOS_GENERALES` : "/controles-sci");
  if (!controleSCIId || !risqueId) {
    redirectWithError(retour, "Contrôle et risque requis.");
  }

  await prisma.risqueControle.deleteMany({
    where: { controleSCIId, risqueId },
  });

  revalidateApp([
    `/controles-sci/${controleSCIId}`,
    `/controles-sci/${controleSCIId}?edit=INFOS_GENERALES`,
    `/risques/${risqueId}`,
  ]);
  redirectWithOk(retour, "lien_supprime");
}

export async function archiveControleSCI(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/controles-sci", "Identifiant manquant.");
  const existing = await prisma.controleSCI.findUnique({ where: { id } });
  if (!existing) redirectWithError("/controles-sci", "Contrôle introuvable.");

  await prisma.controleSCI.update({
    where: { id },
    data: { archive: true, modifieParId: current.id },
  });
  revalidateApp([`/controles-sci/${id}`]);
  redirectWithOk(`/controles-sci/${id}`, "archive");
}

export async function unarchiveControleSCI(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/controles-sci", "Identifiant manquant.");
  const existing = await prisma.controleSCI.findUnique({ where: { id } });
  if (!existing) redirectWithError("/controles-sci", "Contrôle introuvable.");

  await prisma.controleSCI.update({
    where: { id },
    data: { archive: false, modifieParId: current.id },
  });
  revalidateApp([`/controles-sci/${id}`]);
  redirectWithOk(`/controles-sci/${id}`, "desarchive");
}

export async function deleteControleSCI(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/controles-sci", "Identifiant manquant.");
  const existing = await prisma.controleSCI.findUnique({ where: { id } });
  if (!existing) redirectWithError("/controles-sci", "Contrôle introuvable.");

  await prisma.controleSCI.delete({ where: { id } });
  revalidateApp();
  redirect("/controles-sci?ok=supprime");
}
