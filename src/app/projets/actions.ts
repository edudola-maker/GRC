"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  PRIORITE_OPTIONS,
  STATUT_PROJET_OPTIONS,
} from "@/lib/catalog";
import { optDate, optInt, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const STATUTS = new Set<string>(STATUT_PROJET_OPTIONS.map((o) => o.value));
const PRIORITES = new Set<string>(PRIORITE_OPTIONS.map((o) => o.value));

function revalidateProjetViews(id?: string) {
  revalidatePath("/");
  revalidatePath("/projets");
  revalidatePath("/backlog");
  revalidatePath("/taches");
  if (id) revalidatePath(`/projets/${id}`);
}

export async function createProjet(formData: FormData) {
  const current = await getCurrentUser();
  const nom = str(formData, "nom");
  if (!nom) throw new Error("Le nom du projet est obligatoire.");

  const statut = str(formData, "statut") || "A_FAIRE";
  const priorite = str(formData, "priorite") || "MOYENNE";
  if (!STATUTS.has(statut) || !PRIORITES.has(priorite)) {
    throw new Error("Statut ou priorité invalide.");
  }

  const avancement = Math.min(100, Math.max(0, optInt(formData, "avancement") ?? 0));

  const projet = await prisma.projet.create({
    data: {
      nom,
      description: optStr(formData, "description"),
      responsableId: str(formData, "responsableId") || current.id,
      dateDebut: optDate(formData, "dateDebut"),
      dateEcheance: optDate(formData, "dateEcheance"),
      statut: statut as "A_FAIRE",
      priorite: priorite as "MOYENNE",
      avancement,
      commentaires: optStr(formData, "commentaires"),
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateProjetViews(projet.id);
  redirect(`/projets/${projet.id}`);
}

export async function updateProjet(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) throw new Error("Identifiant projet manquant.");

  const nom = str(formData, "nom");
  if (!nom) throw new Error("Le nom du projet est obligatoire.");

  const statut = str(formData, "statut") || "A_FAIRE";
  const priorite = str(formData, "priorite") || "MOYENNE";
  if (!STATUTS.has(statut) || !PRIORITES.has(priorite)) {
    throw new Error("Statut ou priorité invalide.");
  }

  const avancement = Math.min(100, Math.max(0, optInt(formData, "avancement") ?? 0));

  await prisma.projet.update({
    where: { id },
    data: {
      nom,
      description: optStr(formData, "description"),
      responsableId: str(formData, "responsableId") || current.id,
      dateDebut: optDate(formData, "dateDebut"),
      dateEcheance: optDate(formData, "dateEcheance"),
      statut: statut as "A_FAIRE",
      priorite: priorite as "MOYENNE",
      avancement,
      commentaires: optStr(formData, "commentaires"),
      modifieParId: current.id,
    },
  });

  revalidateProjetViews(id);
  redirect(`/projets/${id}`);
}

export async function deleteProjet(formData: FormData) {
  const id = str(formData, "id");
  if (!id) throw new Error("Identifiant projet manquant.");

  // Les tâches liées passent en indépendantes (onDelete: SetNull)
  await prisma.projet.delete({ where: { id } });

  revalidateProjetViews();
  redirect("/projets");
}
