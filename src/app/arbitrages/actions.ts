"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  allocateCreateCode,
  assertCodeUnique,
  normalizeCode,
} from "@/lib/codes";
import { optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { getCurrentUser } from "@/lib/session";

const STATUTS = new Set(["EN_VIGUEUR", "REMPLACE", "ABROGE"]);

export async function createArbitrage(formData: FormData) {
  const current = await getCurrentUser();
  const fallback = "/arbitrages/nouveau";
  const uniteId = current.uniteId;

  const titre = str(formData, "titre");
  const regleRetenue = str(formData, "regleRetenue");
  if (!titre) redirectWithError(fallback, "Le titre est obligatoire.");
  if (!regleRetenue) {
    redirectWithError(fallback, "La règle retenue est obligatoire.");
  }

  const statut = str(formData, "statut") || "EN_VIGUEUR";
  if (!STATUTS.has(statut)) {
    redirectWithError(fallback, "Statut d’arbitrage invalide.");
  }

  const processusId = optStr(formData, "processusId");
  if (processusId) {
    const p = await prisma.processus.findFirst({
      where: { id: processusId, uniteId, archive: false },
    });
    if (!p) redirectWithError(fallback, "Processus introuvable.");
  }

  const risqueId = optStr(formData, "risqueId");
  if (risqueId) {
    const r = await prisma.risque.findFirst({
      where: { id: risqueId, uniteId, archive: false },
    });
    if (!r) redirectWithError(fallback, "Risque introuvable.");
  }

  const allocated = await allocateCreateCode(
    "ARBITRAGE",
    uniteId,
    optStr(formData, "code"),
  );
  if (!allocated.ok) redirectWithError(fallback, allocated.error);

  const arbitrage = await prisma.arbitrage.create({
    data: {
      uniteId,
      code: allocated.code,
      titre,
      problematique: optStr(formData, "problematique"),
      regleRetenue,
      justification: optStr(formData, "justification"),
      statut: statut as "EN_VIGUEUR",
      processusId,
      risqueId,
      responsableId: optStr(formData, "responsableId") || current.id,
    },
  });

  revalidateApp([`/arbitrages/${arbitrage.id}`]);
  redirectWithOk(`/arbitrages/${arbitrage.id}`, "cree");
}

export async function updateArbitrage(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/arbitrages", "Identifiant manquant.");

  const existing = await prisma.arbitrage.findFirst({
    where: { id, uniteId: current.uniteId },
  });
  if (!existing) redirectWithError("/arbitrages", "Arbitrage introuvable.");

  const fallback = `/arbitrages/${id}`;
  const titre = str(formData, "titre");
  const regleRetenue = str(formData, "regleRetenue");
  if (!titre) redirectWithError(fallback, "Le titre est obligatoire.");
  if (!regleRetenue) {
    redirectWithError(fallback, "La règle retenue est obligatoire.");
  }

  const statut = str(formData, "statut") || existing.statut;
  if (!STATUTS.has(statut)) {
    redirectWithError(fallback, "Statut d’arbitrage invalide.");
  }

  const codeRaw = optStr(formData, "code") ?? existing.code;
  const code = normalizeCode(codeRaw);
  const codeErr = await assertCodeUnique(
    "ARBITRAGE",
    code,
    current.uniteId,
    id,
  );
  if (codeErr) redirectWithError(fallback, codeErr);

  const processusId = optStr(formData, "processusId");
  if (processusId) {
    const p = await prisma.processus.findFirst({
      where: { id: processusId, uniteId: current.uniteId, archive: false },
    });
    if (!p) redirectWithError(fallback, "Processus introuvable.");
  }

  const risqueId = optStr(formData, "risqueId");
  if (risqueId) {
    const r = await prisma.risque.findFirst({
      where: { id: risqueId, uniteId: current.uniteId, archive: false },
    });
    if (!r) redirectWithError(fallback, "Risque introuvable.");
  }

  await prisma.arbitrage.update({
    where: { id },
    data: {
      code,
      titre,
      problematique: optStr(formData, "problematique"),
      regleRetenue,
      justification: optStr(formData, "justification"),
      statut: statut as "EN_VIGUEUR",
      processusId,
      risqueId,
      responsableId: optStr(formData, "responsableId") || existing.responsableId,
    },
  });

  revalidateApp([fallback]);
  redirectWithOk(fallback, "modifie");
}

export async function archiveArbitrage(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/arbitrages", "Identifiant manquant.");
  const existing = await prisma.arbitrage.findFirst({
    where: { id, uniteId: current.uniteId },
  });
  if (!existing) redirectWithError("/arbitrages", "Arbitrage introuvable.");

  await prisma.arbitrage.update({
    where: { id },
    data: { archive: true },
  });
  revalidateApp([`/arbitrages/${id}`]);
  redirectWithOk(`/arbitrages/${id}`, "archive");
}

export async function deleteArbitrage(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/arbitrages", "Identifiant manquant.");
  const existing = await prisma.arbitrage.findFirst({
    where: { id, uniteId: current.uniteId },
  });
  if (!existing) redirectWithError("/arbitrages", "Arbitrage introuvable.");

  await prisma.arbitrage.delete({ where: { id } });
  revalidateApp();
  redirect("/arbitrages?ok=supprime");
}
