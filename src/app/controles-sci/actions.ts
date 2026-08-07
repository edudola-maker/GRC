"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  FREQUENCE_CONTROLE_OPTIONS,
  STATUT_CONTROLE_OPTIONS,
  TYPE_CONTROLE_OPTIONS,
} from "@/lib/catalog";
import { assertNomUnique, nextCode } from "@/lib/codes";
import { nextControleDate } from "@/lib/dates";
import { optDate, optInt, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
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

function applyRealisation(
  currentId: string,
  uniteId: string,
  frequence: string,
  creerTacheSuivante: boolean,
  nom: string,
  responsableId: string,
) {
  const now = new Date();
  const next = nextControleDate(now, frequence);
  const isPonctuelle = frequence === "PONCTUELLE";
  return {
    patch: {
      dateDerniereRealisation: now,
      dateProchaineEcheance: next,
      statut: (isPonctuelle ? "REALISE" : "A_REALISER") as
        | "REALISE"
        | "A_REALISER",
      valideParId: currentId,
      dateValidation: now,
    },
    nextTache:
      creerTacheSuivante && !isPonctuelle && next
        ? {
            uniteId,
            titre: `Réaliser le contrôle : ${nom}`,
            responsableId,
            dateEcheance: next,
            statut: "A_FAIRE" as const,
            priorite: "MOYENNE" as const,
            categorie: "SCI" as const,
            creeParId: currentId,
            modifieParId: currentId,
          }
        : null,
  };
}

export async function createControleSCI(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const fallback = "/controles-sci/nouveau";
  const nom = str(formData, "nom");
  const processusConcerne = str(formData, "processusConcerne");
  if (!nom) redirectWithError(fallback, "Le nom du contrôle est obligatoire.");
  if (!processusConcerne) {
    redirectWithError(fallback, "Le processus concerné est obligatoire.");
  }

  const statut = str(formData, "statut") || "A_REALISER";
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
  let dateDerniereRealisation = optDate(formData, "dateDerniereRealisation");
  let dateProchaineEcheance = optDate(formData, "dateProchaineEcheance");

  if (statut === "REALISE") {
    const result = applyRealisation(
      current.id,
      uniteId,
      frequence,
      str(formData, "creerTacheSuivante") === "1",
      nom,
      responsableId,
    );
    const controle = await prisma.controleSCI.create({
      data: {
        code: await nextCode("CONTROLE_SCI", uniteId),
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
        dateDerniereRealisation: result.patch.dateDerniereRealisation,
        dateProchaineEcheance: result.patch.dateProchaineEcheance,
        statut: result.patch.statut,
        commentaires: optStr(formData, "commentaires"),
        archive: false,
        creeParId: current.id,
        modifieParId: current.id,
        valideParId: result.patch.valideParId,
        dateValidation: result.patch.dateValidation,
      },
    });
    if (result.nextTache) {
      await prisma.tache.create({
        data: { ...result.nextTache, controleSCIId: controle.id },
      });
    }
    revalidateApp([`/controles-sci/${controle.id}`]);
    redirectWithOk(`/controles-sci/${controle.id}`, "cree");
  }

  const controle = await prisma.controleSCI.create({
    data: {
      code: await nextCode("CONTROLE_SCI", uniteId),
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
      dateProchaineEcheance:
        dateProchaineEcheance ?? nextControleDate(new Date(), frequence),
      statut: statut as "A_REALISER",
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

  const nom = str(formData, "nom");
  const processusConcerne = str(formData, "processusConcerne");
  if (!nom) {
    redirectWithError(
      `/controles-sci/${id}/modifier`,
      "Le nom du contrôle est obligatoire.",
    );
  }
  if (!processusConcerne) {
    redirectWithError(
      `/controles-sci/${id}/modifier`,
      "Le processus concerné est obligatoire.",
    );
  }

  const statut = str(formData, "statut") || "A_REALISER";
  const frequence = str(formData, "frequence") || existing.frequence;
  if (!STATUTS.has(statut) || !FREQUENCES.has(frequence)) {
    redirectWithError(
      `/controles-sci/${id}/modifier`,
      "Statut ou fréquence invalide.",
    );
  }

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(
      `/controles-sci/${id}/modifier`,
      "Responsable introuvable.",
    );
  }

  const typeControle = str(formData, "typeControle") || existing.typeControle;
  if (!TYPES.has(typeControle)) {
    redirectWithError(`/controles-sci/${id}/modifier`, "Type de contrôle invalide.");
  }

  const fenetreDeclenchementJours =
    optInt(formData, "fenetreDeclenchementJours") ??
    existing.fenetreDeclenchementJours;
  const delaiRealisationJours = optInt(formData, "delaiRealisationJours");
  const taxinomie = optStr(formData, "taxinomie");
  const tags = serializeTags(optStr(formData, "tags"));

  const becomingRealise =
    statut === "REALISE" && existing.statut !== "REALISE";

  if (becomingRealise) {
    const result = applyRealisation(
      current.id,
      existing.uniteId,
      frequence,
      str(formData, "creerTacheSuivante") === "1",
      nom,
      responsableId,
    );
    await prisma.controleSCI.update({
      where: { id },
      data: {
        nom,
        description: optStr(formData, "description"),
        processusConcerne,
        responsableId,
        typeControle: typeControle as "MANUEL",
        frequence: frequence as "TRIMESTRIELLE",
        fenetreDeclenchementJours,
        delaiRealisationJours,
        taxinomie,
        tags,
        commentaires: optStr(formData, "commentaires"),
        modifieParId: current.id,
        ...result.patch,
      },
    });
    if (result.nextTache) {
      await prisma.tache.create({
        data: { ...result.nextTache, controleSCIId: id },
      });
    }
  } else {
    await prisma.controleSCI.update({
      where: { id },
      data: {
        nom,
        description: optStr(formData, "description"),
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
        statut: statut as "A_REALISER",
        commentaires: optStr(formData, "commentaires"),
        modifieParId: current.id,
      },
    });
  }

  revalidateApp([`/controles-sci/${id}`, `/controles-sci/${id}/modifier`]);
  redirectWithOk(`/controles-sci/${id}`, "modifie");
}

export async function realiserControleSCI(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/controles-sci", "Identifiant manquant.");

  const existing = await prisma.controleSCI.findUnique({ where: { id } });
  if (!existing) redirectWithError("/controles-sci", "Contrôle introuvable.");

  const result = applyRealisation(
    current.id,
    existing.uniteId,
    existing.frequence,
    str(formData, "creerTacheSuivante") !== "0",
    existing.nom,
    existing.responsableId,
  );

  await prisma.controleSCI.update({
    where: { id },
    data: {
      ...result.patch,
      modifieParId: current.id,
    },
  });

  if (result.nextTache) {
    await prisma.tache.create({
      data: { ...result.nextTache, controleSCIId: id },
    });
  }

  revalidateApp([`/controles-sci/${id}`]);
  redirectWithOk(`/controles-sci/${id}`, "realise");
}

export async function ajouterPreuveControle(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const controleSCIId = str(formData, "controleSCIId");
  if (!controleSCIId) {
    redirectWithError("/controles-sci", "Identifiant contrôle manquant.");
  }

  const existing = await prisma.controleSCI.findUnique({
    where: { id: controleSCIId },
  });
  if (!existing) {
    redirectWithError("/controles-sci", "Contrôle introuvable.");
  }

  const nom = str(formData, "nom") || `Preuve — ${existing.nom}`;
  const reference = optStr(formData, "reference");
  if (!reference) {
    redirectWithError(
      `/controles-sci/${controleSCIId}`,
      "La référence de la preuve est obligatoire.",
    );
  }

  const document = await prisma.document.create({
    data: {
      code: await nextCode("DOCUMENT", uniteId),
      uniteId,
      nom,
      reference,
      typeDocument: "AUTRE",
      statut: "EN_VIGUEUR",
      responsableId: existing.responsableId,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  await prisma.controleDocument.create({
    data: {
      controleSCIId,
      documentId: document.id,
      typeLien: "preuve",
    },
  });

  revalidateApp([
    `/controles-sci/${controleSCIId}`,
    `/documents/${document.id}`,
  ]);
  redirectWithOk(`/controles-sci/${controleSCIId}`, "preuve");
}

export async function lierRisqueControle(formData: FormData) {
  const controleSCIId = str(formData, "controleSCIId");
  const risqueId = str(formData, "risqueId");
  if (!controleSCIId || !risqueId) {
    redirectWithError(
      controleSCIId ? `/controles-sci/${controleSCIId}` : "/controles-sci",
      "Contrôle et risque requis.",
    );
  }

  const [controle, risque] = await Promise.all([
    prisma.controleSCI.findUnique({ where: { id: controleSCIId } }),
    prisma.risque.findUnique({ where: { id: risqueId } }),
  ]);
  if (!controle) redirectWithError("/controles-sci", "Contrôle introuvable.");
  if (!risque) {
    redirectWithError(`/controles-sci/${controleSCIId}`, "Risque introuvable.");
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
    `/risques/${risqueId}`,
  ]);
  redirectWithOk(`/controles-sci/${controleSCIId}`, "lien");
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
