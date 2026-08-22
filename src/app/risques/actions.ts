"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  CATEGORIE_RISQUE_OPTIONS,
  ECHELLE_RISQUE,
  STATUT_RISQUE_OPTIONS,
  STRATEGIE_RISQUE_OPTIONS,
} from "@/lib/catalog";
import {
  allocateCreateCode,
  assertCodeUnique, assertNomUnique, nextCode, normalizeCode
} from "@/lib/codes";
import { optDate, optInt, optStr, str } from "@/lib/form";
import {
  diffChamps,
  enregistrerModifications,
} from "@/lib/historique";
import { ajouterJournal, TYPE_EVENEMENT } from "@/lib/journal";
import { STATUT_RISQUE_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { sectionEditHref, sectionSavedHref } from "@/lib/section-nav";
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
  const fallback = "/risques/nouveau";
  const uniteId = optStr(formData, "uniteId") || current.uniteId;
  const unite = await prisma.unite.findFirst({
    where: { id: uniteId, actif: true },
  });
  if (!unite) redirectWithError(fallback, "Unité responsable invalide.");

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

  const processusId = optStr(formData, "processusId");
  if (processusId) {
    const prc = await prisma.processus.findFirst({
      where: { id: processusId, uniteId, archive: false },
    });
    if (!prc) {
      redirectWithError(fallback, "Processus introuvable ou archivé.");
    }
  }

  const allocated = await allocateCreateCode(
    "RISQUE",
    uniteId,
    optStr(formData, "code"),
  );
  if (!allocated.ok) {
    redirectWithError(fallback, allocated.error);
  }

  const risque = await prisma.risque.create({
    data: {
      code: allocated.code,
      uniteId,
      nom,
      description: optStr(formData, "description"),
      taxinomie: optStr(formData, "taxinomie"),
      tags: serializeTags(optStr(formData, "tags")),
      processus: null,
      processusId,
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
  const id = str(formData, "id");
  if (!id) redirectWithError("/risques", "Identifiant risque manquant.");

  const existing = await prisma.risque.findUnique({ where: { id } });
  if (!existing) redirectWithError("/risques", "Risque introuvable.");

  const sectionKey = optStr(formData, "sectionKey") ?? "INFOS_GENERALES";
  const base = `/risques/${id}`;
  const editFallback = sectionEditHref(base, sectionKey);

  const nom = str(formData, "nom");
  if (!nom) {
    redirectWithError(editFallback, "Le nom du risque est obligatoire.");
  }

  const categorie = str(formData, "categorie") || existing.categorie;
  if (!CATEGORIES.has(categorie)) {
    redirectWithError(editFallback, "Catégorie invalide.");
  }

  const statut = str(formData, "statut") || existing.statut;
  if (!STATUTS.has(statut)) {
    redirectWithError(editFallback, "Statut invalide.");
  }

  const responsableId = str(formData, "responsableId") || existing.responsableId;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(editFallback, "Responsable introuvable.");
  }

  const uniteId = optStr(formData, "uniteId") || existing.uniteId;
  const unite = await prisma.unite.findFirst({
    where: { id: uniteId, actif: true },
  });
  if (!unite) redirectWithError(editFallback, "Unité responsable invalide.");

  const probabilite = parseEchelle(formData, "probabilite", existing.probabilite);
  const impact = parseEchelle(formData, "impact", existing.impact);
  if (probabilite == null || impact == null) {
    redirectWithError(
      editFallback,
      "Probabilité et impact doivent être entre 1 et 5.",
    );
  }

  const criticite = clamp(probabilite * impact, 1, 25);
  const nomErr = await assertNomUnique("RISQUE", nom, uniteId, id);
  if (nomErr) redirectWithError(editFallback, nomErr);
  const strategie = optStr(formData, "strategie");
  if (strategie && !STRATEGIES.has(strategie)) {
    redirectWithError(editFallback, "Stratégie invalide.");
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
      redirectWithError(editFallback, "Échelle résiduelle invalide (1–5).");
    }
    criticiteResiduelle = clamp(probabiliteResiduelle * impactResiduel, 1, 25);
  }

  const description = optStr(formData, "description");
  const taxinomie = optStr(formData, "taxinomie");
  const tags = serializeTags(optStr(formData, "tags"));
  const processusId = optStr(formData, "processusId");
  if (processusId) {
    const prc = await prisma.processus.findFirst({
      where: { id: processusId, uniteId, archive: false },
    });
    if (!prc) {
      redirectWithError(editFallback, "Processus introuvable ou archivé.");
    }
  }
  const commentaires = optStr(formData, "commentaires");
  const justificationEvaluation = optStr(formData, "justificationEvaluation");
  const strategieVal = (strategie as "REDUIRE") ?? null;

  const codeRaw = optStr(formData, "code") ?? existing.code;
  const code = normalizeCode(codeRaw);
  const codeErr = await assertCodeUnique("RISQUE", code, uniteId, id);
  if (codeErr) redirectWithError(editFallback, codeErr);

  const [avantResp, apresResp, avantPrc, apresPrc] = await Promise.all([
    labelResponsable(existing.responsableId),
    labelResponsable(responsableId),
    existing.processusId
      ? prisma.processus.findUnique({
          where: { id: existing.processusId },
          select: { code: true, nom: true },
        })
      : Promise.resolve(null),
    processusId
      ? prisma.processus.findUnique({
          where: { id: processusId },
          select: { code: true, nom: true },
        })
      : Promise.resolve(null),
  ]);

  const labelPrc = (p: { code: string; nom: string } | null) =>
    p ? `${p.code} — ${p.nom}` : null;

  const changes = diffChamps([
    { champ: "code", avant: existing.code, apres: code },
    { champ: "nom", avant: existing.nom, apres: nom },
    { champ: "description", avant: existing.description, apres: description },
    { champ: "taxinomie", avant: existing.taxinomie, apres: taxinomie },
    { champ: "tags", avant: existing.tags, apres: tags },
    { champ: "uniteId", avant: existing.uniteId, apres: uniteId },
    {
      champ: "processus",
      avant: labelPrc(avantPrc) ?? existing.processus,
      apres: labelPrc(apresPrc),
    },
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
      code,
      nom,
      description,
      taxinomie,
      tags,
      processus: null,
      processusId,
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
      uniteId,
      modifieParId: current.id,
      ...(bump ? { contenuVersion: nextVersion } : {}),
    },
  });

  if (bump) {
    await enregistrerModifications({
      typeObjet: "RISQUE",
      objetId: id,
      uniteId,
      modifieParId: current.id,
      changes,
      versionObjet: nextVersion,
    });
  }

  if (existing.statut !== statut) {
    await ajouterJournal({
      typeObjet: "RISQUE",
      objetId: id,
      uniteId,
      typeEvenement: TYPE_EVENEMENT.STATUT,
      message: `Statut : ${STATUT_RISQUE_LABELS[existing.statut] ?? existing.statut} → ${STATUT_RISQUE_LABELS[statut] ?? statut}`,
      auteurId: current.id,
    });
  }

  revalidateApp([`/risques/${id}`, `/risques/${id}?edit=INFOS_GENERALES`]);
  redirectWithOk(sectionSavedHref(base, sectionKey), "modifie");
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

/**
 * Documente un acte de réévaluation (même si les notes ne changent pas).
 * Si P/I (inhérent / résiduel) changent → maj risque + HistoriqueModification.
 * Toujours : RisqueReevaluation + journal REEVALUATION.
 */
export async function documenterReevaluationRisque(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/risques", "Identifiant risque manquant.");

  const existing = await prisma.risque.findUnique({ where: { id } });
  if (!existing) redirectWithError("/risques", "Risque introuvable.");
  if (existing.archive) {
    redirectWithError(`/risques/${id}`, "Risque archivé — réévaluation impossible.");
  }

  const dateReevaluation = optDate(formData, "dateReevaluation");
  if (!dateReevaluation) {
    redirectWithError(
      `/risques/${id}?edit=REEVALUATION`,
      "Date de réévaluation requise.",
    );
  }

  const probabilite = parseEchelle(formData, "probabilite", existing.probabilite);
  const impact = parseEchelle(formData, "impact", existing.impact);
  if (probabilite == null || impact == null) {
    redirectWithError(
      `/risques/${id}?edit=REEVALUATION`,
      "Probabilité et impact inhérents doivent être entre 1 et 5.",
    );
  }

  const commentaire = str(formData, "commentaire");
  if (!commentaire) {
    redirectWithError(
      `/risques/${id}?edit=REEVALUATION`,
      "Le commentaire de réévaluation est obligatoire.",
    );
  }

  const justificationEvaluation =
    optStr(formData, "justificationEvaluation") ??
    existing.justificationEvaluation;

  const rawPRes = str(formData, "probabiliteResiduelle");
  const rawIRes = str(formData, "impactResiduel");
  let probabiliteResiduelle: number | null = null;
  let impactResiduel: number | null = null;
  if (rawPRes) {
    const n = Number.parseInt(rawPRes, 10);
    if (!ECHELLE.has(n)) {
      redirectWithError(
        `/risques/${id}?edit=REEVALUATION`,
        "Probabilité résiduelle invalide.",
      );
    }
    probabiliteResiduelle = n;
  }
  if (rawIRes) {
    const n = Number.parseInt(rawIRes, 10);
    if (!ECHELLE.has(n)) {
      redirectWithError(
        `/risques/${id}?edit=REEVALUATION`,
        "Impact résiduel invalide.",
      );
    }
    impactResiduel = n;
  }
  if (
    (probabiliteResiduelle == null) !== (impactResiduel == null)
  ) {
    redirectWithError(
      `/risques/${id}?edit=REEVALUATION`,
      "Renseigner P et I résiduels ensemble, ou laisser les deux vides.",
    );
  }

  const criticite = probabilite * impact;
  const criticiteResiduelle =
    probabiliteResiduelle != null && impactResiduel != null
      ? probabiliteResiduelle * impactResiduel
      : null;

  const scoresChanged =
    existing.probabilite !== probabilite ||
    existing.impact !== impact ||
    existing.probabiliteResiduelle !== probabiliteResiduelle ||
    existing.impactResiduel !== impactResiduel;

  const nextVersion = scoresChanged
    ? existing.contenuVersion + 1
    : existing.contenuVersion;

  await prisma.$transaction(async (tx) => {
    await tx.risqueReevaluation.create({
      data: {
        risqueId: id,
        uniteId: existing.uniteId,
        dateReevaluation,
        auteurId: current.id,
        probabiliteAvant: existing.probabilite,
        impactAvant: existing.impact,
        criticiteAvant: existing.criticite,
        probabiliteApres: probabilite,
        impactApres: impact,
        criticiteApres: criticite,
        probabiliteResiduelleAvant: existing.probabiliteResiduelle,
        impactResiduelAvant: existing.impactResiduel,
        criticiteResiduelleAvant: existing.criticiteResiduelle,
        probabiliteResiduelleApres: probabiliteResiduelle,
        impactResiduelApres: impactResiduel,
        criticiteResiduelleApres: criticiteResiduelle,
        commentaire,
      },
    });

    if (scoresChanged) {
      await tx.risque.update({
        where: { id },
        data: {
          probabilite,
          impact,
          criticite,
          probabiliteResiduelle,
          impactResiduel,
          criticiteResiduelle,
          justificationEvaluation,
          modifieParId: current.id,
          contenuVersion: nextVersion,
        },
      });
    } else {
      await tx.risque.update({
        where: { id },
        data: {
          justificationEvaluation,
          modifieParId: current.id,
        },
      });
    }
  });

  if (scoresChanged) {
    await enregistrerModifications({
      typeObjet: "RISQUE",
      objetId: id,
      uniteId: existing.uniteId,
      modifieParId: current.id,
      changes: diffChamps([
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
      ]),
      versionObjet: nextVersion,
    });
  }

  const fmt = (p: number, i: number, c: number) => `P${p}·I${i}·${c}`;
  const inhAvant = fmt(
    existing.probabilite,
    existing.impact,
    existing.criticite,
  );
  const inhApres = fmt(probabilite, impact, criticite);
  const resLabel = (p: number | null, i: number | null, c: number | null) =>
    p != null && i != null && c != null ? fmt(p, i, c) : "non renseigné";

  await ajouterJournal({
    typeObjet: "RISQUE",
    objetId: id,
    uniteId: existing.uniteId,
    typeEvenement: TYPE_EVENEMENT.REEVALUATION,
    message: scoresChanged
      ? `Réévaluation : inhérent ${inhAvant} → ${inhApres} ; résiduel ${resLabel(existing.probabiliteResiduelle, existing.impactResiduel, existing.criticiteResiduelle)} → ${resLabel(probabiliteResiduelle, impactResiduel, criticiteResiduelle)}.`
      : `Réévaluation sans changement de notes (inhérent ${inhApres} ; résiduel ${resLabel(probabiliteResiduelle, impactResiduel, criticiteResiduelle)}).`,
    auteurId: current.id,
  });

  revalidateApp([`/risques/${id}`, `/risques/${id}?edit=REEVALUATION`]);
  redirectWithOk(`/risques/${id}`, "reevaluation");
}
