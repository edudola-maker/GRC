"use server";

import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import { optDate, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { getCurrentUser } from "@/lib/session";

const FREQUENCES = new Set([
  "TRIMESTRIELLE",
  "SEMESTRIELLE",
  "ANNUELLE",
  "BIANNUELLE",
]);

function formBool(formData: FormData, key: string): boolean {
  const v = formData.get(key);
  return v === "on" || v === "1" || v === "true";
}

export async function upsertProcessusQualite(formData: FormData) {
  const current = await getCurrentUser();
  const processusId = str(formData, "processusId");
  if (!processusId) redirectWithError("/processus", "Identifiant manquant.");
  const base = `/processus/${processusId}`;

  const processus = await prisma.processus.findFirst({
    where: { id: processusId, uniteId: current.uniteId },
  });
  if (!processus) redirectWithError("/processus", "Processus introuvable.");

  const frequence = str(formData, "frequence") || "ANNUELLE";
  if (!FREQUENCES.has(frequence)) {
    redirectWithError(base, "Fréquence de revue invalide.");
  }

  const responsableRevueId = optStr(formData, "responsableRevueId");
  if (responsableRevueId) {
    const u = await prisma.utilisateur.findFirst({
      where: { id: responsableRevueId, uniteId: current.uniteId, actif: true },
    });
    if (!u) redirectWithError(base, "Responsable de revue introuvable.");
  }

  const confluenceAJourRaw = formData.get("confluenceAJour");
  const confluenceAJour =
    confluenceAJourRaw === "1" || confluenceAJourRaw === "on"
      ? true
      : confluenceAJourRaw === "0"
        ? false
        : null;

  const data = {
    responsableRevueId,
    frequence: frequence as "ANNUELLE",
    derniereRevue: optDate(formData, "derniereRevue"),
    prochaineRevue: optDate(formData, "prochaineRevue"),
    confluenceUrl: optStr(formData, "confluenceUrl"),
    confluenceAJour,
  };

  await prisma.processusQualite.upsert({
    where: { processusId },
    create: { processusId, ...data },
    update: data,
  });

  revalidateApp([base]);
  redirectWithOk(`${base}?focus=qualite`, "qualite");
}

export async function createQualiteRevue(formData: FormData) {
  const current = await getCurrentUser();
  const processusId = str(formData, "processusId");
  if (!processusId) redirectWithError("/processus", "Identifiant manquant.");
  const base = `/processus/${processusId}`;

  const processus = await prisma.processus.findFirst({
    where: { id: processusId, uniteId: current.uniteId },
  });
  if (!processus) redirectWithError("/processus", "Processus introuvable.");

  const responsableId = optStr(formData, "responsableId") || current.id;
  const dateRevue = optDate(formData, "dateRevue") ?? new Date();

  await prisma.qualiteRevue.create({
    data: {
      uniteId: current.uniteId,
      processusId,
      dateRevue,
      responsableId,
      procedureConformePratique: formBool(formData, "procedureConformePratique"),
      pratiqueConformeProcedure: formBool(formData, "pratiqueConformeProcedure"),
      raciAJour: formBool(formData, "raciAJour"),
      controlesPertinents: formBool(formData, "controlesPertinents"),
      confluenceAJour: formBool(formData, "confluenceAJour"),
      ecartsIdentifies: formBool(formData, "ecartsIdentifies"),
      ameliorationProposee: formBool(formData, "ameliorationProposee"),
      commentaire: optStr(formData, "commentaire"),
    },
  });

  await prisma.processusQualite.upsert({
    where: { processusId },
    create: {
      processusId,
      derniereRevue: dateRevue,
      responsableRevueId: responsableId,
    },
    update: {
      derniereRevue: dateRevue,
    },
  });

  revalidateApp([base]);
  redirectWithOk(`${base}?focus=qualite`, "revue");
}

export async function createEcartQualite(formData: FormData) {
  const current = await getCurrentUser();
  const processusId = str(formData, "processusId");
  if (!processusId) redirectWithError("/processus", "Identifiant manquant.");
  const base = `/processus/${processusId}`;

  const processus = await prisma.processus.findFirst({
    where: { id: processusId, uniteId: current.uniteId },
  });
  if (!processus) redirectWithError("/processus", "Processus introuvable.");

  const titre = str(formData, "titre");
  if (!titre) redirectWithError(base, "Le titre de l’écart est obligatoire.");

  const revueId = optStr(formData, "revueId");
  if (revueId) {
    const revue = await prisma.qualiteRevue.findFirst({
      where: { id: revueId, processusId, uniteId: current.uniteId },
    });
    if (!revue) redirectWithError(base, "Revue introuvable.");
  }

  await prisma.ecartQualite.create({
    data: {
      uniteId: current.uniteId,
      processusId,
      revueId,
      titre,
      description: optStr(formData, "description"),
      statut: str(formData, "statut") || "OUVERT",
    },
  });

  revalidateApp([base]);
  redirectWithOk(`${base}?focus=qualite`, "ecart");
}
