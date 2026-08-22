"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  allocateCreateCode,
  assertCodeUnique,
  normalizeCode,
} from "@/lib/codes";
import { optDate, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { getCurrentUser } from "@/lib/session";

const STATUTS = new Set(["PROPOSEE", "ADOPTEE", "REMPLACEE", "ABROGEE"]);

export async function createDecision(formData: FormData) {
  const current = await getCurrentUser();
  const fallback = "/decisions/nouveau";
  const uniteId = current.uniteId;

  const titre = str(formData, "titre");
  const decisionTexte = str(formData, "decisionTexte");
  if (!titre) redirectWithError(fallback, "Le titre est obligatoire.");
  if (!decisionTexte) {
    redirectWithError(fallback, "Le texte de décision est obligatoire.");
  }

  const statut = str(formData, "statut") || "PROPOSEE";
  if (!STATUTS.has(statut)) {
    redirectWithError(fallback, "Statut de décision invalide.");
  }

  const decideurId = optStr(formData, "decideurId") || current.id;
  const decideur = await prisma.utilisateur.findFirst({
    where: { id: decideurId, uniteId, actif: true },
  });
  if (!decideur) redirectWithError(fallback, "Décideur introuvable.");

  const processusId = optStr(formData, "processusId");
  if (processusId) {
    const p = await prisma.processus.findFirst({
      where: { id: processusId, uniteId, archive: false },
    });
    if (!p) redirectWithError(fallback, "Processus introuvable.");
  }

  const decisionPrecedenteId = optStr(formData, "decisionPrecedenteId");
  if (decisionPrecedenteId) {
    const prev = await prisma.decision.findFirst({
      where: { id: decisionPrecedenteId, uniteId, archive: false },
    });
    if (!prev) {
      redirectWithError(fallback, "Décision précédente introuvable.");
    }
  }

  const allocated = await allocateCreateCode(
    "DECISION",
    uniteId,
    optStr(formData, "code"),
  );
  if (!allocated.ok) redirectWithError(fallback, allocated.error);

  const decision = await prisma.decision.create({
    data: {
      uniteId,
      code: allocated.code,
      titre,
      problematique: optStr(formData, "problematique"),
      analyse: optStr(formData, "analyse"),
      decisionTexte,
      decideurId,
      dateDecision: optDate(formData, "dateDecision"),
      statut: statut as "PROPOSEE",
      processusId,
      decisionPrecedenteId,
    },
  });

  revalidateApp([`/decisions/${decision.id}`]);
  redirectWithOk(`/decisions/${decision.id}`, "cree");
}

export async function updateDecision(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/decisions", "Identifiant manquant.");

  const existing = await prisma.decision.findFirst({
    where: { id, uniteId: current.uniteId },
  });
  if (!existing) redirectWithError("/decisions", "Décision introuvable.");

  const fallback = `/decisions/${id}`;
  const titre = str(formData, "titre");
  const decisionTexte = str(formData, "decisionTexte");
  if (!titre) redirectWithError(fallback, "Le titre est obligatoire.");
  if (!decisionTexte) {
    redirectWithError(fallback, "Le texte de décision est obligatoire.");
  }

  const statut = str(formData, "statut") || existing.statut;
  if (!STATUTS.has(statut)) {
    redirectWithError(fallback, "Statut de décision invalide.");
  }

  const codeRaw = optStr(formData, "code") ?? existing.code;
  const code = normalizeCode(codeRaw);
  const codeErr = await assertCodeUnique(
    "DECISION",
    code,
    current.uniteId,
    id,
  );
  if (codeErr) redirectWithError(fallback, codeErr);

  const decideurId = optStr(formData, "decideurId") || existing.decideurId;
  if (decideurId) {
    const decideur = await prisma.utilisateur.findFirst({
      where: { id: decideurId, uniteId: current.uniteId, actif: true },
    });
    if (!decideur) redirectWithError(fallback, "Décideur introuvable.");
  }

  const processusId = optStr(formData, "processusId");
  if (processusId) {
    const p = await prisma.processus.findFirst({
      where: { id: processusId, uniteId: current.uniteId, archive: false },
    });
    if (!p) redirectWithError(fallback, "Processus introuvable.");
  }

  const decisionPrecedenteId = optStr(formData, "decisionPrecedenteId");
  if (decisionPrecedenteId) {
    if (decisionPrecedenteId === id) {
      redirectWithError(fallback, "Une décision ne peut pas se précéder.");
    }
    const prev = await prisma.decision.findFirst({
      where: {
        id: decisionPrecedenteId,
        uniteId: current.uniteId,
        archive: false,
      },
    });
    if (!prev) {
      redirectWithError(fallback, "Décision précédente introuvable.");
    }
  }

  await prisma.decision.update({
    where: { id },
    data: {
      code,
      titre,
      problematique: optStr(formData, "problematique"),
      analyse: optStr(formData, "analyse"),
      decisionTexte,
      decideurId,
      dateDecision: optDate(formData, "dateDecision"),
      statut: statut as "PROPOSEE",
      processusId,
      decisionPrecedenteId,
    },
  });

  revalidateApp([fallback]);
  redirectWithOk(fallback, "modifie");
}

export async function archiveDecision(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/decisions", "Identifiant manquant.");
  const existing = await prisma.decision.findFirst({
    where: { id, uniteId: current.uniteId },
  });
  if (!existing) redirectWithError("/decisions", "Décision introuvable.");

  await prisma.decision.update({
    where: { id },
    data: { archive: true },
  });
  revalidateApp([`/decisions/${id}`]);
  redirectWithOk(`/decisions/${id}`, "archive");
}

export async function deleteDecision(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/decisions", "Identifiant manquant.");
  const existing = await prisma.decision.findFirst({
    where: { id, uniteId: current.uniteId },
  });
  if (!existing) redirectWithError("/decisions", "Décision introuvable.");

  await prisma.decision.delete({ where: { id } });
  revalidateApp();
  redirect("/decisions?ok=supprime");
}
