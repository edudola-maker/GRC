"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import { STATUT_PROCESSUS_OPTIONS } from "@/lib/catalog";
import { assertNomUnique, nextCode } from "@/lib/codes";
import { optInt, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { getCurrentUser } from "@/lib/session";
import { serializeTags } from "@/lib/tags";

const STATUTS = new Set(STATUT_PROCESSUS_OPTIONS.map((o) => o.value));

export async function createProcessus(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const fallback = "/processus/nouveau";
  const nom = str(formData, "nom");
  if (!nom) redirectWithError(fallback, "Le nom du processus est obligatoire.");

  const statut = str(formData, "statut") || "ACTIF";
  if (!STATUTS.has(statut as "ACTIF" | "SUSPENDU")) {
    redirectWithError(fallback, "Statut invalide.");
  }

  const nomErr = await assertNomUnique("PROCESSUS", nom, uniteId);
  if (nomErr) redirectWithError(fallback, nomErr);

  const responsableId = str(formData, "responsableId") || current.id;
  const parentId = optStr(formData, "parentId");
  if (parentId) {
    const parent = await prisma.processus.findFirst({
      where: { id: parentId, uniteId, archive: false },
    });
    if (!parent) redirectWithError(fallback, "Processus parent introuvable.");
  }

  const criticite = optInt(formData, "criticite");
  if (criticite != null && (criticite < 1 || criticite > 5)) {
    redirectWithError(fallback, "Criticité invalide (1–5).");
  }

  const processus = await prisma.processus.create({
    data: {
      code: await nextCode("PROCESSUS", uniteId),
      uniteId,
      nom,
      description: optStr(formData, "description"),
      tags: serializeTags(optStr(formData, "tags")),
      responsableId,
      statut: statut as "ACTIF",
      criticite: criticite ?? null,
      reference: optStr(formData, "reference"),
      parentId: parentId ?? null,
      archive: false,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateApp([`/processus/${processus.id}`]);
  redirectWithOk(`/processus/${processus.id}`, "cree");
}

export async function updateProcessus(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/processus", "Identifiant manquant.");

  const existing = await prisma.processus.findUnique({ where: { id } });
  if (!existing) redirectWithError("/processus", "Processus introuvable.");

  const nom = str(formData, "nom");
  if (!nom) {
    redirectWithError(
      `/processus/${id}/modifier`,
      "Le nom du processus est obligatoire.",
    );
  }

  const statut = str(formData, "statut") || "ACTIF";
  if (!STATUTS.has(statut as "ACTIF" | "SUSPENDU")) {
    redirectWithError(`/processus/${id}/modifier`, "Statut invalide.");
  }

  const nomErr = await assertNomUnique(
    "PROCESSUS",
    nom,
    existing.uniteId,
    id,
  );
  if (nomErr) {
    redirectWithError(`/processus/${id}/modifier`, nomErr);
  }

  const responsableId = str(formData, "responsableId") || current.id;
  let parentId = optStr(formData, "parentId");
  if (parentId === id) {
    redirectWithError(
      `/processus/${id}/modifier`,
      "Un processus ne peut pas être son propre parent.",
    );
  }
  if (parentId) {
    const parent = await prisma.processus.findFirst({
      where: { id: parentId, uniteId: existing.uniteId, archive: false },
    });
    if (!parent) {
      redirectWithError(`/processus/${id}/modifier`, "Processus parent introuvable.");
    }
  } else {
    parentId = null;
  }

  const criticite = optInt(formData, "criticite");
  if (criticite != null && (criticite < 1 || criticite > 5)) {
    redirectWithError(`/processus/${id}/modifier`, "Criticité invalide (1–5).");
  }

  await prisma.processus.update({
    where: { id },
    data: {
      nom,
      description: optStr(formData, "description"),
      tags: serializeTags(optStr(formData, "tags")),
      responsableId,
      statut: statut as "ACTIF",
      criticite: criticite ?? null,
      reference: optStr(formData, "reference"),
      parentId,
      modifieParId: current.id,
    },
  });

  revalidateApp([`/processus/${id}`, `/processus/${id}/modifier`]);
  redirectWithOk(`/processus/${id}`, "modifie");
}

export async function archiveProcessus(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/processus", "Identifiant manquant.");
  await prisma.processus.update({
    where: { id },
    data: { archive: true, modifieParId: current.id },
  });
  revalidateApp([`/processus/${id}`]);
  redirectWithOk(`/processus/${id}`, "archive");
}

export async function unarchiveProcessus(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/processus", "Identifiant manquant.");
  await prisma.processus.update({
    where: { id },
    data: { archive: false, modifieParId: current.id },
  });
  revalidateApp([`/processus/${id}`]);
  redirectWithOk(`/processus/${id}`, "desarchive");
}

export async function deleteProcessus(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/processus", "Identifiant manquant.");
  await prisma.processus.delete({ where: { id } });
  revalidateApp();
  redirect("/processus?ok=supprime");
}
