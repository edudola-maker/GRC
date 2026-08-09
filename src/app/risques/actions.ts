"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  CATEGORIE_RISQUE_OPTIONS,
  ECHELLE_RISQUE,
  STATUT_RISQUE_OPTIONS,
  STRATEGIE_RISQUE_OPTIONS,
} from "@/lib/catalog";
import { assertNomUnique, nextCode } from "@/lib/codes";
import { optInt, optStr, str } from "@/lib/form";
import {
  diffChamps,
  enregistrerModifications,
} from "@/lib/historique";
import { ajouterJournal, TYPE_EVENEMENT } from "@/lib/journal";
import { STATUT_RISQUE_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { formatUtilisateurNom, getCurrentUser } from "@/lib/session";
import { serializeTags } from "@/lib/tags";

const STATUTS = new Set<string>(STATUT_RISQUE_OPTIONS.map((o) => o.value));
const CATEGORIES = new Set<string>(
  CATEGORIE_RISQUE_OPTIONS.map((o) => o.value),
);
const STRATEGIES = new Set<string>(
  STRATEGIE_RISQUE_OPTIONS.map((o) => o.value),
);
const ECHELLE = new Set<number>(ECHELLE_RISQUE);

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseEchelle(formData: FormData, key: string, fallback: number) {
  const n = optInt(formData, key) ?? fallback;
  if (!ECHELLE.has(n)) return null;
  return n;
}

async function assertResponsable(id: string) {
  return prisma.utilisateur.findFirst({ where: { id, actif: true } });
}

async function labelResponsable(id: string) {
  const u = await prisma.utilisateur.findUnique({
    where: { id },
    select: { nom: true, prenom: true },
  });
  return u ? formatUtilisateurNom(u) : id;
}

export async function createRisque(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const fallback = "/risques/nouveau";

  const nom = str(formData, "nom");
  if (!nom) {
    redirectWithError(fallback, "Le nom du risque est obligatoire.");
  }

  const categorie = str(formData, "categorie") || "OPERATIONNEL";
  if (!CATEGORIES.has(categorie)) {
    redirectWithError(fallback, "Catégorie invalide.");
  }

  const statut = str(formData, "statut") || "IDENTIFIE";
  if (!STATUTS.has(statut)) {
    redirectWithError(fallback, "Statut invalide.");
  }

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  const probabilite = parseEchelle(formData, "probabilite", 1);
  const impact = parseEchelle(formData, "impact", 1);
  if (probabilite == null || impact == null) {
    redirectWithError(fallback, "Probabilité et impact doivent être entre 1 et 5.");
  }

  const criticite = clamp(probabilite * impact, 1, 25);

  const prRaw = optInt(formData, "probabiliteResiduelle");
  const irRaw = optInt(formData, "impactResiduel");
  let probabiliteResiduelle: number | null = null;
  let impactResiduel: number | null = null;
  let criticiteResiduelle: number | null = null;
  if (prRaw != null || irRaw != null) {
    probabiliteResiduelle = prRaw ?? probabilite;
    impactResiduel = irRaw ?? impact;
    if (!ECHELLE.has(probabiliteResiduelle) || !ECHELLE.has(impactResiduel)) {
      redirectWithError(fallback, "Échelle résiduelle invalide (1–5).");
    }
    criticiteResiduelle = clamp(probabiliteResiduelle * impactResiduel, 1, 25);
  }

  const nomErr = await assertNomUnique("RISQUE", nom, uniteId);
  if (nomErr) redirectWithError(fallback, nomErr);

  const strategie = optStr(formData, "strategie");
  if (strategie && !STRATEGIES.has(strategie)) {
    redirectWithError(fallback, "Stratégie de traitement invalide.");
  }

  const risque = await prisma.risque.create({
    data: {
      code: await nextCode("RISQUE", uniteId),
      uniteId,
      nom,
      description: optStr(formData, "description"),
      taxinomie: optStr(formData, "taxinomie"),
      tags: serializeTags(optStr(formData, "tags")),
      processus: optStr(formData, "processus"),
      responsableId,
      categorie: categorie as "OPERATIONNEL",
      probabilite,
      impact,
      criticite,
      probabiliteResiduelle,
      impactResiduel,
      criticiteResiduelle,
      strategie: (strategie as "REDUIRE") ?? null,
      statut: statut as "IDENTIFIE",
      commentaires: optStr(formData, "commentaires"),
      justificationEvaluation: optStr(formData, "justificationEvaluation"),
      archive: false,
      contenuVersion: 1,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  await ajouterJournal({
    typeObjet: "RISQUE",
    objetId: risque.id,
    uniteId,
    typeEvenement: TYPE_EVENEMENT.CREATION,
    message: `Risque ${risque.code} créé.`,
    auteurId: current.id,
  });

  revalidateApp([`/risques/${risque.id}`]);
  redirectWithOk(`/risques/${risque.id}`, "cree");
}

export async function updateRisque(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const id = str(formData, "id");
  if (!id) redirectWithError("/risques", "Identifiant risque manquant.");

  const existing = await prisma.risque.findUnique({ where: { id } });
  if (!existing) redirectWithError("/risques", "Risque introuvable.");

  const nom = str(formData, "nom");
  if (!nom) {
    redirectWithError(`/risques/${id}?edit=INFOS_GENERALES`, "Le nom du risque est obligatoire.");
  }

  const categorie = str(formData, "categorie") || existing.categorie;
  if (!CATEGORIES.has(categorie)) {
    redirectWithError(`/risques/${id}?edit=INFOS_GENERALES`, "Catégorie invalide.");
  }

  const statut = str(formData, "statut") || existing.statut;
  if (!STATUTS.has(statut)) {
    redirectWithError(`/risques/${id}?edit=INFOS_GENERALES`, "Statut invalide.");
  }

  const responsableId = str(formData, "responsableId") || existing.responsableId;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(`/risques/${id}?edit=INFOS_GENERALES`, "Responsable introuvable.");
  }

  const probabilite = parseEchelle(formData, "probabilite", existing.probabilite);
  const impact = parseEchelle(formData, "impact", existing.impact);
  if (probabilite == null || impact == null) {
    redirectWithError(
      `/risques/${id}?edit=INFOS_GENERALES`,
      "Probabilité et impact doivent être entre 1 et 5.",
    );
  }

  const criticite = clamp(probabilite * impact, 1, 25);
  const nomErr = await assertNomUnique("RISQUE", nom, uniteId, id);
  if (nomErr) redirectWithError(`/risques/${id}?edit=INFOS_GENERALES`, nomErr);
  const strategie = optStr(formData, "strategie");
  if (strategie && !STRATEGIES.has(strategie)) {
    redirectWithError(`/risques/${id}?edit=INFOS_GENERALES`, "Stratégie invalide.");
  }

  const prRaw = optInt(formData, "probabiliteResiduelle");
  const irRaw = optInt(formData, "impactResiduel");
  let probabiliteResiduelle: number | null = null;
  let impactResiduel: number | null = null;
  let criticiteResiduelle: number | null = null;
  if (prRaw != null || irRaw != null) {
    probabiliteResiduelle = prRaw ?? probabilite;
    impactResiduel = irRaw ?? impact;
    if (!ECHELLE.has(probabiliteResiduelle) || !ECHELLE.has(impactResiduel)) {
      redirectWithError(`/risques/${id}?edit=INFOS_GENERALES`, "Échelle résiduelle invalide (1–5).");
    }
    criticiteResiduelle = clamp(probabiliteResiduelle * impactResiduel, 1, 25);
  }

  const description = optStr(formData, "description");
  const taxinomie = optStr(formData, "taxinomie");
  const tags = serializeTags(optStr(formData, "tags"));
  const processus = optStr(formData, "processus");
  const commentaires = optStr(formData, "commentaires");
  const justificationEvaluation = optStr(formData, "justificationEvaluation");
  const strategieVal = (strategie as "REDUIRE") ?? null;

  const [avantResp, apresResp] = await Promise.all([
    labelResponsable(existing.responsableId),
    labelResponsable(responsableId),
  ]);

  const changes = diffChamps([
    { champ: "nom", avant: existing.nom, apres: nom },
    { champ: "description", avant: existing.description, apres: description },
    { champ: "taxinomie", avant: existing.taxinomie, apres: taxinomie },
    { champ: "tags", avant: existing.tags, apres: tags },
    { champ: "processus", avant: existing.processus, apres: processus },
    { champ: "responsable", avant: avantResp, apres: apresResp },
    { champ: "categorie", avant: existing.categorie, apres: categorie },
    { champ: "probabilite", avant: existing.probabilite, apres: probabilite },
    { champ: "impact", avant: existing.impact, apres: impact },
    { champ: "criticite", avant: existing.criticite, apres: criticite },
    {
      champ: "probabiliteResiduelle",
      avant: existing.probabiliteResiduelle,
      apres: probabiliteResiduelle,
    },
    {
      champ: "impactResiduel",
      avant: existing.impactResiduel,
      apres: impactResiduel,
    },
    {
      champ: "criticiteResiduelle",
      avant: existing.criticiteResiduelle,
      apres: criticiteResiduelle,
    },
    { champ: "strategie", avant: existing.strategie, apres: strategieVal },
    { champ: "statut", avant: existing.statut, apres: statut },
    { champ: "commentaires", avant: existing.commentaires, apres: commentaires },
    {
      champ: "justificationEvaluation",
      avant: existing.justificationEvaluation,
      apres: justificationEvaluation,
    },
  ]);

  const bump = changes.length > 0;
  const nextVersion = bump
    ? existing.contenuVersion + 1
    : existing.contenuVersion;

  await prisma.risque.update({
    where: { id },
    data: {
      nom,
      description,
      taxinomie,
      tags,
      processus,
      responsableId,
      categorie: categorie as "OPERATIONNEL",
      probabilite,
      impact,
      criticite,
      probabiliteResiduelle,
      impactResiduel,
      criticiteResiduelle,
      strategie: strategieVal,
      statut: statut as "IDENTIFIE",
      commentaires,
      justificationEvaluation,
      modifieParId: current.id,
      ...(bump ? { contenuVersion: nextVersion } : {}),
    },
  });

  if (bump) {
    await enregistrerModifications({
      typeObjet: "RISQUE",
      objetId: id,
      uniteId: existing.uniteId,
      modifieParId: current.id,
      changes,
      versionObjet: nextVersion,
    });
  }

  if (existing.statut !== statut) {
    await ajouterJournal({
      typeObjet: "RISQUE",
      objetId: id,
      uniteId: existing.uniteId,
      typeEvenement: TYPE_EVENEMENT.STATUT,
      message: `Statut : ${STATUT_RISQUE_LABELS[existing.statut] ?? existing.statut} → ${STATUT_RISQUE_LABELS[statut] ?? statut}`,
      auteurId: current.id,
    });
  }

  revalidateApp([`/risques/${id}`, `/risques/${id}?edit=INFOS_GENERALES`]);
  redirectWithOk(`/risques/${id}`, "modifie");
}

/** Archive / désarchive via archive=1|0 */
export async function archiveRisque(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/risques", "Identifiant risque manquant.");

  const existing = await prisma.risque.findUnique({ where: { id } });
  if (!existing) redirectWithError("/risques", "Risque introuvable.");

  const archive = str(formData, "archive") === "1";
  if (existing.archive === archive) {
    redirectWithOk(`/risques/${id}`, archive ? "archive" : "desarchive");
  }

  const nextVersion = existing.contenuVersion + 1;

  await prisma.risque.update({
    where: { id },
    data: {
      archive,
      modifieParId: current.id,
      contenuVersion: nextVersion,
    },
  });

  await enregistrerModifications({
    typeObjet: "RISQUE",
    objetId: id,
    uniteId: existing.uniteId,
    modifieParId: current.id,
    changes: diffChamps([
      { champ: "archive", avant: existing.archive, apres: archive },
    ]),
    versionObjet: nextVersion,
  });

  await ajouterJournal({
    typeObjet: "RISQUE",
    objetId: id,
    uniteId: existing.uniteId,
    typeEvenement: archive
      ? TYPE_EVENEMENT.ARCHIVE
      : TYPE_EVENEMENT.DESARCHIVE,
    message: archive ? "Risque archivé." : "Risque désarchivé.",
    auteurId: current.id,
  });

  revalidateApp([`/risques/${id}`]);
  redirectWithOk(`/risques/${id}`, archive ? "archive" : "desarchive");
}

export async function deleteRisque(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/risques", "Identifiant risque manquant.");

  const existing = await prisma.risque.findUnique({ where: { id } });
  if (!existing) redirectWithError("/risques", "Risque introuvable.");

  await prisma.risque.delete({ where: { id } });
  // Historique : pas de cascade FK (objetId libre) — nettoyage best-effort.
  await prisma.historiqueModification.deleteMany({
    where: { typeObjet: "RISQUE", objetId: id },
  });
  await prisma.journalEvenement.deleteMany({
    where: { typeObjet: "RISQUE", objetId: id },
  });
  revalidateApp();
  redirect("/risques?ok=supprime");
}

export async function setRisqueControles(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const risqueId = str(formData, "risqueId");
  const retour =
    str(formData, "retour") ||
    (risqueId ? `/risques/${risqueId}?edit=INFOS_GENERALES` : "/risques");
  if (!risqueId) redirectWithError("/risques", "Identifiant risque manquant.");

  const existing = await prisma.risque.findUnique({ where: { id: risqueId } });
  if (!existing) redirectWithError("/risques", "Risque introuvable.");

  const rawIds = formData
    .getAll("controleIds")
    .filter((v): v is string => typeof v === "string" && v.length > 0);
  const controleIds = [...new Set(rawIds)];

  if (controleIds.length > 0) {
    const found = await prisma.controleSCI.findMany({
      where: { id: { in: controleIds }, uniteId, archive: false },
      select: { id: true },
    });
    if (found.length !== controleIds.length) {
      redirectWithError(
        retour,
        "Un ou plusieurs contrôles sont introuvables ou archivés.",
      );
    }
  }

  const avantLiens = await prisma.risqueControle.findMany({
    where: { risqueId },
    include: { controle: { select: { code: true, nom: true } } },
  });
  const avantLabel =
    avantLiens
      .map((l) => `${l.controle.code} — ${l.controle.nom}`)
      .sort()
      .join(" ; ") || null;

  const apresControles =
    controleIds.length > 0
      ? await prisma.controleSCI.findMany({
          where: { id: { in: controleIds } },
          select: { code: true, nom: true },
        })
      : [];
  const apresLabel =
    apresControles
      .map((c) => `${c.code} — ${c.nom}`)
      .sort()
      .join(" ; ") || null;

  const changes = diffChamps([
    { champ: "controles", avant: avantLabel, apres: apresLabel },
  ]);
  const bump = changes.length > 0;
  const nextVersion = bump
    ? existing.contenuVersion + 1
    : existing.contenuVersion;

  await prisma.$transaction([
    prisma.risqueControle.deleteMany({ where: { risqueId } }),
    ...(controleIds.length > 0
      ? [
          prisma.risqueControle.createMany({
            data: controleIds.map((controleSCIId) => ({
              risqueId,
              controleSCIId,
            })),
          }),
        ]
      : []),
    prisma.risque.update({
      where: { id: risqueId },
      data: {
        modifieParId: current.id,
        ...(bump ? { contenuVersion: nextVersion } : {}),
      },
    }),
  ]);

  if (bump) {
    await enregistrerModifications({
      typeObjet: "RISQUE",
      objetId: risqueId,
      uniteId: existing.uniteId,
      modifieParId: current.id,
      changes,
      versionObjet: nextVersion,
    });
    await ajouterJournal({
      typeObjet: "RISQUE",
      objetId: risqueId,
      uniteId: existing.uniteId,
      typeEvenement: TYPE_EVENEMENT.LIEN,
      message: "Contrôles SCI liés mis à jour.",
      auteurId: current.id,
    });
  }

  revalidateApp([`/risques/${risqueId}`, `/risques/${risqueId}?edit=INFOS_GENERALES`]);
  redirectWithOk(retour, "lien");
}
