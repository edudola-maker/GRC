"use server";

import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import { optStr, str } from "@/lib/form";
import { deriveInitiales } from "@/lib/initiales";
import { assertAdministrateur } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { formatUtilisateurNom } from "@/lib/session";

const ROLES = new Set(["COLLABORATEUR", "RESPONSABLE", "ADMINISTRATEUR"]);

function revalidateUsers(id?: string) {
  revalidateApp([
    "/administration",
    "/administration/utilisateurs",
    ...(id ? [`/administration/utilisateurs/${id}`] : []),
  ]);
}

function demoPasswordHash(email: string) {
  return `demo-hash-${email.toLowerCase()}`;
}

function parseRole(raw: string) {
  return ROLES.has(raw) ? raw : null;
}

async function countActiveAdmins(excludeId?: string) {
  return prisma.utilisateur.count({
    where: {
      role: "ADMINISTRATEUR",
      actif: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

export async function createUtilisateur(formData: FormData) {
  await assertAdministrateur();
  const fallback = "/administration/utilisateurs/nouveau";

  const nom = str(formData, "nom");
  const email = str(formData, "email").toLowerCase();
  const uniteId = str(formData, "uniteId");
  const role = parseRole(str(formData, "role"));
  const prenom = optStr(formData, "prenom");
  const fonction = optStr(formData, "fonction");
  const password = optStr(formData, "motDePasse");

  if (!nom) redirectWithError(fallback, "Le nom est obligatoire.");
  if (!email) redirectWithError(fallback, "L’e-mail est obligatoire.");
  if (!uniteId) redirectWithError(fallback, "L’unité est obligatoire.");
  if (!role) redirectWithError(fallback, "Rôle invalide.");

  const unite = await prisma.unite.findUnique({ where: { id: uniteId } });
  if (!unite) redirectWithError(fallback, "Unité introuvable.");

  const existingEmail = await prisma.utilisateur.findUnique({
    where: { email },
  });
  if (existingEmail) {
    redirectWithError(fallback, "Un utilisateur porte déjà cet e-mail.");
  }

  const displayNom = formatUtilisateurNom({ nom, prenom });
  const user = await prisma.utilisateur.create({
    data: {
      nom,
      prenom,
      fonction,
      email,
      uniteId,
      role: role as "COLLABORATEUR",
      motDePasse: password
        ? `demo-hash-${password}`
        : demoPasswordHash(email),
      initiales: deriveInitiales(displayNom),
      actif: str(formData, "actif") !== "0",
    },
  });

  revalidateUsers(user.id);
  redirectWithOk(`/administration/utilisateurs/${user.id}`, "cree");
}

export async function updateUtilisateur(formData: FormData) {
  await assertAdministrateur();
  const id = str(formData, "id");
  if (!id) {
    redirectWithError("/administration/utilisateurs", "Identifiant manquant.");
  }

  const existing = await prisma.utilisateur.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/administration/utilisateurs", "Utilisateur introuvable.");
  }

  const fallback = `/administration/utilisateurs/${id}`;
  const nom = str(formData, "nom");
  const email = str(formData, "email").toLowerCase();
  const uniteId = str(formData, "uniteId");
  const role = parseRole(str(formData, "role"));
  const prenom = optStr(formData, "prenom");
  const fonction = optStr(formData, "fonction");
  const password = optStr(formData, "motDePasse");
  const actif = str(formData, "actif") !== "0";

  if (!nom) redirectWithError(fallback, "Le nom est obligatoire.");
  if (!email) redirectWithError(fallback, "L’e-mail est obligatoire.");
  if (!uniteId) redirectWithError(fallback, "L’unité est obligatoire.");
  if (!role) redirectWithError(fallback, "Rôle invalide.");

  const unite = await prisma.unite.findUnique({ where: { id: uniteId } });
  if (!unite) redirectWithError(fallback, "Unité introuvable.");

  const emailClash = await prisma.utilisateur.findFirst({
    where: { email, id: { not: id } },
  });
  if (emailClash) {
    redirectWithError(fallback, "Un utilisateur porte déjà cet e-mail.");
  }

  const wasAdmin = existing.role === "ADMINISTRATEUR" && existing.actif;
  const willBeAdmin = role === "ADMINISTRATEUR" && actif;
  if (wasAdmin && !willBeAdmin) {
    const others = await countActiveAdmins(id);
    if (others === 0) {
      redirectWithError(
        fallback,
        "Impossible de retirer le dernier administrateur actif.",
      );
    }
  }

  const displayNom = formatUtilisateurNom({ nom, prenom });
  await prisma.utilisateur.update({
    where: { id },
    data: {
      nom,
      prenom,
      fonction,
      email,
      uniteId,
      role: role as "COLLABORATEUR",
      actif,
      initiales: deriveInitiales(displayNom),
      ...(password ? { motDePasse: `demo-hash-${password}` } : {}),
    },
  });

  revalidateUsers(id);
  redirectWithOk(fallback, "modifie");
}

export async function deleteUtilisateur(formData: FormData) {
  await assertAdministrateur();
  const id = str(formData, "id");
  if (!id) {
    redirectWithError("/administration/utilisateurs", "Identifiant manquant.");
  }

  const existing = await prisma.utilisateur.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/administration/utilisateurs", "Utilisateur introuvable.");
  }

  if (existing.role === "ADMINISTRATEUR" && existing.actif) {
    const others = await countActiveAdmins(id);
    if (others === 0) {
      redirectWithError(
        `/administration/utilisateurs/${id}`,
        "Impossible de supprimer le dernier administrateur actif.",
      );
    }
  }

  // Soft-delete : conserve l’historique et les FK métier.
  await prisma.utilisateur.update({
    where: { id },
    data: { actif: false },
  });

  revalidateUsers(id);
  redirectWithOk("/administration/utilisateurs", "supprime");
}
