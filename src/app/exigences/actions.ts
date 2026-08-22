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

const STATUTS = new Set([
  "CONFORME",
  "PARTIELLEMENT_CONFORME",
  "NON_CONFORME",
  "A_EVALUER",
]);

function formIds(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());
}

export async function createExigence(formData: FormData) {
  const current = await getCurrentUser();
  const fallback = "/exigences/nouveau";
  const uniteId = current.uniteId;

  const titre = str(formData, "titre");
  if (!titre) redirectWithError(fallback, "Le titre est obligatoire.");

  const statut = str(formData, "statut") || "A_EVALUER";
  if (!STATUTS.has(statut)) {
    redirectWithError(fallback, "Statut de conformité invalide.");
  }

  const responsableId = optStr(formData, "responsableId");
  if (responsableId) {
    const resp = await prisma.utilisateur.findFirst({
      where: { id: responsableId, uniteId, actif: true },
    });
    if (!resp) redirectWithError(fallback, "Responsable introuvable.");
  }

  const processusIds = formIds(formData, "processusIds");
  if (processusIds.length > 0) {
    const count = await prisma.processus.count({
      where: { id: { in: processusIds }, uniteId, archive: false },
    });
    if (count !== processusIds.length) {
      redirectWithError(fallback, "Processus invalide.");
    }
  }

  const allocated = await allocateCreateCode(
    "EXIGENCE",
    uniteId,
    optStr(formData, "code"),
  );
  if (!allocated.ok) redirectWithError(fallback, allocated.error);

  const exigence = await prisma.exigence.create({
    data: {
      uniteId,
      code: allocated.code,
      titre,
      description: optStr(formData, "description"),
      source: optStr(formData, "source"),
      statut: statut as "A_EVALUER",
      responsableId,
      processus: {
        create: processusIds.map((processusId) => ({ processusId })),
      },
    },
  });

  revalidateApp([`/exigences/${exigence.id}`]);
  redirectWithOk(`/exigences/${exigence.id}`, "cree");
}

export async function updateExigence(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/exigences", "Identifiant manquant.");

  const existing = await prisma.exigence.findFirst({
    where: { id, uniteId: current.uniteId },
  });
  if (!existing) redirectWithError("/exigences", "Exigence introuvable.");

  const fallback = `/exigences/${id}`;
  const titre = str(formData, "titre");
  if (!titre) redirectWithError(fallback, "Le titre est obligatoire.");

  const statut = str(formData, "statut") || existing.statut;
  if (!STATUTS.has(statut)) {
    redirectWithError(fallback, "Statut de conformité invalide.");
  }

  const codeRaw = optStr(formData, "code") ?? existing.code;
  const code = normalizeCode(codeRaw);
  const codeErr = await assertCodeUnique(
    "EXIGENCE",
    code,
    current.uniteId,
    id,
  );
  if (codeErr) redirectWithError(fallback, codeErr);

  const responsableId = optStr(formData, "responsableId");
  if (responsableId) {
    const resp = await prisma.utilisateur.findFirst({
      where: { id: responsableId, uniteId: current.uniteId, actif: true },
    });
    if (!resp) redirectWithError(fallback, "Responsable introuvable.");
  }

  const processusIds = formIds(formData, "processusIds");
  if (processusIds.length > 0) {
    const count = await prisma.processus.count({
      where: {
        id: { in: processusIds },
        uniteId: current.uniteId,
        archive: false,
      },
    });
    if (count !== processusIds.length) {
      redirectWithError(fallback, "Processus invalide.");
    }
  }

  await prisma.$transaction([
    prisma.exigenceProcessus.deleteMany({ where: { exigenceId: id } }),
    prisma.exigence.update({
      where: { id },
      data: {
        code,
        titre,
        description: optStr(formData, "description"),
        source: optStr(formData, "source"),
        statut: statut as "A_EVALUER",
        responsableId,
        processus: {
          create: processusIds.map((processusId) => ({ processusId })),
        },
      },
    }),
  ]);

  revalidateApp([fallback]);
  redirectWithOk(fallback, "modifie");
}

export async function archiveExigence(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/exigences", "Identifiant manquant.");
  const existing = await prisma.exigence.findFirst({
    where: { id, uniteId: current.uniteId },
  });
  if (!existing) redirectWithError("/exigences", "Exigence introuvable.");

  await prisma.exigence.update({
    where: { id },
    data: { archive: true },
  });
  revalidateApp([`/exigences/${id}`]);
  redirectWithOk(`/exigences/${id}`, "archive");
}

export async function deleteExigence(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/exigences", "Identifiant manquant.");
  const existing = await prisma.exigence.findFirst({
    where: { id, uniteId: current.uniteId },
  });
  if (!existing) redirectWithError("/exigences", "Exigence introuvable.");

  await prisma.exigence.delete({ where: { id } });
  revalidateApp();
  redirect("/exigences?ok=supprime");
}
