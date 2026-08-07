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
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { getCurrentUser } from "@/lib/session";
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
      archive: false,
      creeParId: current.id,
      modifieParId: current.id,
    },
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
    redirectWithError(`/risques/${id}/modifier`, "Le nom du risque est obligatoire.");
  }

  const categorie = str(formData, "categorie") || existing.categorie;
  if (!CATEGORIES.has(categorie)) {
    redirectWithError(`/risques/${id}/modifier`, "Catégorie invalide.");
  }

  const statut = str(formData, "statut") || existing.statut;
  if (!STATUTS.has(statut)) {
    redirectWithError(`/risques/${id}/modifier`, "Statut invalide.");
  }

  const responsableId = str(formData, "responsableId") || existing.responsableId;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(`/risques/${id}/modifier`, "Responsable introuvable.");
  }

  const probabilite = parseEchelle(formData, "probabilite", existing.probabilite);
  const impact = parseEchelle(formData, "impact", existing.impact);
  if (probabilite == null || impact == null) {
    redirectWithError(
      `/risques/${id}/modifier`,
      "Probabilité et impact doivent être entre 1 et 5.",
    );
  }

  const criticite = clamp(probabilite * impact, 1, 25);
  const nomErr = await assertNomUnique("RISQUE", nom, uniteId, id);
  if (nomErr) redirectWithError(`/risques/${id}/modifier`, nomErr);
  const strategie = optStr(formData, "strategie");
  if (strategie && !STRATEGIES.has(strategie)) {
    redirectWithError(`/risques/${id}/modifier`, "Stratégie invalide.");
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
      redirectWithError(`/risques/${id}/modifier`, "Échelle résiduelle invalide (1–5).");
    }
    criticiteResiduelle = clamp(probabiliteResiduelle * impactResiduel, 1, 25);
  }

  await prisma.risque.update({
    where: { id },
    data: {
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
      modifieParId: current.id,
    },
  });

  revalidateApp([`/risques/${id}`, `/risques/${id}/modifier`]);
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

  await prisma.risque.update({
    where: { id },
    data: { archive, modifieParId: current.id },
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
  revalidateApp();
  redirect("/risques?ok=supprime");
}

export async function setRisqueControles(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const risqueId = str(formData, "risqueId");
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
        `/risques/${risqueId}`,
        "Un ou plusieurs contrôles sont introuvables ou archivés.",
      );
    }
  }

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
      data: { modifieParId: current.id },
    }),
  ]);

  revalidateApp([`/risques/${risqueId}`]);
  redirectWithOk(`/risques/${risqueId}`, "lien");
}
