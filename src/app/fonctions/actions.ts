"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  allocateCreateCode,
  assertCodeUnique,
  normalizeCode,
} from "@/lib/codes";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdministrateur, isResponsable } from "@/lib/session";
import type {
  PerimetreAcces,
  RoleUtilisateur,
  TypeAffectationFonction,
} from "@/generated/prisma/client";

async function assertCanManageFonctions() {
  const user = await getCurrentUser();
  if (!isResponsable(user) && !isAdministrateur(user)) {
    throw new Error("Accès refusé");
  }
  return user;
}

export async function createFonction(formData: FormData) {
  const user = await assertCanManageFonctions();
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) redirect("/fonctions/nouveau?erreur=Nom+obligatoire");
  const description = String(formData.get("description") ?? "").trim() || null;
  const roleRaw = String(formData.get("roleApplicatif") ?? "").trim();
  const roleApplicatif = (roleRaw || null) as RoleUtilisateur | null;
  const perimetre = (String(formData.get("perimetre") ?? "MON_UNITE") ||
    "MON_UNITE") as PerimetreAcces;
  const codeRaw = String(formData.get("code") ?? "").trim() || undefined;

  const allocated = await allocateCreateCode("FONCTION", user.uniteId, codeRaw);
  if (!allocated.ok) {
    redirect(`/fonctions/nouveau?erreur=${encodeURIComponent(allocated.error)}`);
  }

  const f = await prisma.fonction.create({
    data: {
      uniteId: user.uniteId,
      code: normalizeCode(allocated.code),
      nom,
      description,
      roleApplicatif,
      perimetre,
    },
  });
  revalidatePath("/fonctions");
  redirect(`/fonctions/${f.id}?ok=Fonction+créée`);
}

export async function updateFonction(formData: FormData) {
  const user = await assertCanManageFonctions();
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.fonction.findFirst({
    where: { id, uniteId: user.uniteId },
  });
  if (!existing) redirect("/fonctions?erreur=Introuvable");

  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) redirect(`/fonctions/${id}?erreur=Nom+obligatoire`);
  const description = String(formData.get("description") ?? "").trim() || null;
  const roleRaw = String(formData.get("roleApplicatif") ?? "").trim();
  const roleApplicatif = (roleRaw || null) as RoleUtilisateur | null;
  const perimetre = (String(formData.get("perimetre") ?? existing.perimetre) ||
    "MON_UNITE") as PerimetreAcces;
  const actif = formData.get("actif") === "on" || formData.get("actif") === "1";
  const codeRaw = String(formData.get("code") ?? existing.code).trim();
  const codeErr = await assertCodeUnique(
    "FONCTION",
    codeRaw,
    user.uniteId,
    existing.id,
  );
  if (codeErr) {
    redirect(`/fonctions/${id}?erreur=${encodeURIComponent(codeErr)}`);
  }

  await prisma.fonction.update({
    where: { id },
    data: {
      code: normalizeCode(codeRaw),
      nom,
      description,
      roleApplicatif,
      perimetre,
      actif,
    },
  });
  revalidatePath("/fonctions");
  revalidatePath(`/fonctions/${id}`);
  redirect(`/fonctions/${id}?ok=Enregistré`);
}

export async function addFonctionAffectation(formData: FormData) {
  const user = await assertCanManageFonctions();
  const fonctionId = String(formData.get("fonctionId") ?? "");
  const utilisateurId = String(formData.get("utilisateurId") ?? "");
  const type = (String(formData.get("type") ?? "TITULAIRE") ||
    "TITULAIRE") as TypeAffectationFonction;
  const f = await prisma.fonction.findFirst({
    where: { id: fonctionId, uniteId: user.uniteId },
  });
  if (!f || !utilisateurId) redirect("/fonctions?erreur=Données+invalides");

  await prisma.fonctionAffectation.upsert({
    where: {
      fonctionId_utilisateurId_type: { fonctionId, utilisateurId, type },
    },
    create: { fonctionId, utilisateurId, type },
    update: {},
  });
  revalidatePath(`/fonctions/${fonctionId}`);
  redirect(`/fonctions/${fonctionId}?ok=Affectation+ajoutée`);
}

export async function removeFonctionAffectation(formData: FormData) {
  const user = await assertCanManageFonctions();
  const id = String(formData.get("id") ?? "");
  const aff = await prisma.fonctionAffectation.findUnique({
    where: { id },
    include: { fonction: { select: { id: true, uniteId: true } } },
  });
  if (!aff || aff.fonction.uniteId !== user.uniteId) {
    redirect("/fonctions?erreur=Introuvable");
  }
  await prisma.fonctionAffectation.delete({ where: { id } });
  revalidatePath(`/fonctions/${aff.fonction.id}`);
  redirect(`/fonctions/${aff.fonction.id}?ok=Affectation+retirée`);
}
