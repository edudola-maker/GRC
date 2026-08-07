"use server";

import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import { optDate, optInt, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";

export async function createObjectif(formData: FormData) {
  const utilisateurId = str(formData, "utilisateurId");
  const objectif = str(formData, "objectif");
  if (!utilisateurId) redirectWithError("/equipe", "Collaborateur manquant.");
  if (!objectif) redirectWithError("/equipe", "L'objectif est obligatoire.");

  const annee = optInt(formData, "annee") ?? new Date().getFullYear();
  const progression = Math.min(
    100,
    Math.max(0, optInt(formData, "progression") ?? 0),
  );

  await prisma.objectifAnnuel.create({
    data: {
      utilisateurId,
      annee,
      objectif,
      attenduAnnuel: optStr(formData, "attenduAnnuel"),
      realiseADate: optStr(formData, "realiseADate"),
      progression,
      dateEcheance: optDate(formData, "dateEcheance"),
    },
  });

  revalidateApp(["/equipe"]);
  redirectWithOk("/equipe", "cree");
}

export async function updateObjectif(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/equipe", "Identifiant manquant.");

  const existing = await prisma.objectifAnnuel.findUnique({ where: { id } });
  if (!existing) redirectWithError("/equipe", "Objectif introuvable.");

  const objectif = str(formData, "objectif") || existing.objectif;
  const progression = Math.min(
    100,
    Math.max(0, optInt(formData, "progression") ?? existing.progression),
  );

  await prisma.objectifAnnuel.update({
    where: { id },
    data: {
      objectif,
      attenduAnnuel: optStr(formData, "attenduAnnuel"),
      realiseADate: optStr(formData, "realiseADate"),
      progression,
      dateEcheance: optDate(formData, "dateEcheance"),
    },
  });

  revalidateApp(["/equipe"]);
  redirectWithOk("/equipe", "modifie");
}

export async function deleteObjectif(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/equipe", "Identifiant manquant.");
  await prisma.objectifAnnuel.delete({ where: { id } });
  revalidateApp(["/equipe"]);
  redirectWithOk("/equipe", "supprime");
}
