"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CATEGORIE_TACHE_OPTIONS,
  PRIORITE_OPTIONS,
  STATUT_TACHE_OPTIONS,
} from "@/lib/catalog";
import { optDate, optStr, str } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const STATUTS = new Set<string>(STATUT_TACHE_OPTIONS.map((o) => o.value));
const PRIORITES = new Set<string>(PRIORITE_OPTIONS.map((o) => o.value));
const CATEGORIES = new Set<string>(CATEGORIE_TACHE_OPTIONS.map((o) => o.value));

function revalidateTacheViews(id?: string, projetId?: string | null) {
  revalidatePath("/");
  revalidatePath("/taches");
  revalidatePath("/backlog");
  revalidatePath("/projets");
  if (id) revalidatePath(`/taches/${id}`);
  if (projetId) revalidatePath(`/projets/${projetId}`);
}

async function recordHistory(
  tacheId: string,
  userId: string,
  changes: Array<{ champ: string; avant: string | null; apres: string | null }>,
) {
  const rows = changes.filter((c) => (c.avant ?? "") !== (c.apres ?? ""));
  if (rows.length === 0) return;
  await prisma.historiqueTache.createMany({
    data: rows.map((c) => ({
      tacheId,
      modifieParId: userId,
      champModifie: c.champ,
      ancienneValeur: c.avant,
      nouvelleValeur: c.apres,
    })),
  });
}

export async function createTache(formData: FormData) {
  const current = await getCurrentUser();
  const titre = str(formData, "titre");
  if (!titre) throw new Error("Le titre de la tâche est obligatoire.");

  const statut = str(formData, "statut") || "A_FAIRE";
  const priorite = str(formData, "priorite") || "MOYENNE";
  const categorie = str(formData, "categorie") || "AUTRE";
  if (!STATUTS.has(statut) || !PRIORITES.has(priorite) || !CATEGORIES.has(categorie)) {
    throw new Error("Statut, priorité ou catégorie invalide.");
  }

  const projetId = optStr(formData, "projetId");
  const dateEcheance = optDate(formData, "dateEcheance");

  const tache = await prisma.tache.create({
    data: {
      titre,
      description: optStr(formData, "description"),
      responsableId: str(formData, "responsableId") || current.id,
      projetId,
      dateEcheance,
      statut: statut as "A_FAIRE",
      priorite: priorite as "MOYENNE",
      categorie: categorie as "AUTRE",
      commentaires: optStr(formData, "commentaires"),
      creeParId: current.id,
      modifieParId: current.id,
      ...(statut === "A_VALIDER"
        ? { soumisParId: current.id, dateSoumission: new Date() }
        : {}),
    },
  });

  revalidateTacheViews(tache.id, projetId);
  redirect(`/taches/${tache.id}`);
}

export async function updateTache(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) throw new Error("Identifiant tâche manquant.");

  const existing = await prisma.tache.findUnique({ where: { id } });
  if (!existing) throw new Error("Tâche introuvable.");

  const titre = str(formData, "titre");
  if (!titre) throw new Error("Le titre de la tâche est obligatoire.");

  const statut = str(formData, "statut") || "A_FAIRE";
  const priorite = str(formData, "priorite") || "MOYENNE";
  const categorie = str(formData, "categorie") || "AUTRE";
  if (!STATUTS.has(statut) || !PRIORITES.has(priorite) || !CATEGORIES.has(categorie)) {
    throw new Error("Statut, priorité ou catégorie invalide.");
  }

  const projetId = optStr(formData, "projetId");
  const dateEcheance = optDate(formData, "dateEcheance");

  const validationPatch: {
    soumisParId?: string | null;
    dateSoumission?: Date | null;
    valideParId?: string | null;
    dateValidation?: Date | null;
  } = {};

  if (statut === "A_VALIDER" && existing.statut !== "A_VALIDER") {
    validationPatch.soumisParId = current.id;
    validationPatch.dateSoumission = new Date();
    validationPatch.valideParId = null;
    validationPatch.dateValidation = null;
  }
  if (statut === "TERMINE" && existing.statut === "A_VALIDER") {
    validationPatch.valideParId = current.id;
    validationPatch.dateValidation = new Date();
  }

  await prisma.tache.update({
    where: { id },
    data: {
      titre,
      description: optStr(formData, "description"),
      responsableId: str(formData, "responsableId") || current.id,
      projetId,
      dateEcheance,
      statut: statut as "A_FAIRE",
      priorite: priorite as "MOYENNE",
      categorie: categorie as "AUTRE",
      commentaires: optStr(formData, "commentaires"),
      modifieParId: current.id,
      ...validationPatch,
    },
  });

  await recordHistory(id, current.id, [
    { champ: "titre", avant: existing.titre, apres: titre },
    {
      champ: "statut",
      avant: existing.statut,
      apres: statut,
    },
    {
      champ: "priorite",
      avant: existing.priorite,
      apres: priorite,
    },
    {
      champ: "categorie",
      avant: existing.categorie,
      apres: categorie,
    },
    {
      champ: "projetId",
      avant: existing.projetId,
      apres: projetId,
    },
    {
      champ: "dateEcheance",
      avant: existing.dateEcheance?.toISOString() ?? null,
      apres: dateEcheance?.toISOString() ?? null,
    },
  ]);

  revalidateTacheViews(id, projetId ?? existing.projetId);
  redirect(`/taches/${id}`);
}

export async function deleteTache(formData: FormData) {
  const id = str(formData, "id");
  if (!id) throw new Error("Identifiant tâche manquant.");

  const existing = await prisma.tache.findUnique({ where: { id } });
  if (!existing) throw new Error("Tâche introuvable.");

  await prisma.tache.delete({ where: { id } });

  revalidateTacheViews(undefined, existing.projetId);
  redirect("/taches");
}
