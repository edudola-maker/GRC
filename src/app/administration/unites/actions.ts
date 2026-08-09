"use server";

import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import { assertNomUnique, nextCode } from "@/lib/codes";
import { optStr, str } from "@/lib/form";
import { assertAdministrateur } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";

function revalidateUnites(id?: string) {
  revalidateApp([
    "/administration",
    "/administration/unites",
    "/unite",
    ...(id ? [`/administration/unites/${id}`] : []),
  ]);
}

async function assertUserInUnite(
  userId: string | null,
  uniteId: string,
  label: string,
  fallback: string,
) {
  if (!userId) return;
  const u = await prisma.utilisateur.findFirst({
    where: { id: userId, uniteId, actif: true },
  });
  if (!u) {
    redirectWithError(fallback, `${label} introuvable dans l’unité.`);
  }
}

export async function createUnite(formData: FormData) {
  const current = await assertAdministrateur();
  const fallback = "/administration/unites/nouveau";

  const nom = str(formData, "nom");
  if (!nom) redirectWithError(fallback, "Le nom de l’unité est obligatoire.");

  const nomErr = await assertNomUnique("UNITE", nom, current.uniteId);
  if (nomErr) redirectWithError(fallback, nomErr);

  // Code séquentiel global porté par l’unité courante (compteur UNT).
  const code = await nextCode("UNITE", current.uniteId);

  const unite = await prisma.unite.create({
    data: {
      code,
      nom,
      description: optStr(formData, "description"),
      actif: str(formData, "actif") !== "0",
    },
  });

  await prisma.parametreFonctionnel.create({
    data: {
      uniteId: unite.id,
      cle: "CONSEIL_DELAI_CIBLE_JOURS",
      valeur: "5",
      description: "Délai cible des conseils (jours ouvrés)",
    },
  });

  revalidateUnites(unite.id);
  redirectWithOk(`/administration/unites/${unite.id}`, "cree");
}

export async function updateUniteAdmin(formData: FormData) {
  await assertAdministrateur();
  const id = str(formData, "id");
  if (!id) {
    redirectWithError("/administration/unites", "Identifiant manquant.");
  }

  const existing = await prisma.unite.findUnique({ where: { id } });
  if (!existing) {
    redirectWithError("/administration/unites", "Unité introuvable.");
  }

  const fallback = `/administration/unites/${id}`;
  const nom = str(formData, "nom");
  if (!nom) redirectWithError(fallback, "Le nom de l’unité est obligatoire.");

  const nomErr = await assertNomUnique("UNITE", nom, id, id);
  if (nomErr) redirectWithError(fallback, nomErr);

  const responsableId = optStr(formData, "responsableId");
  const adjointId = optStr(formData, "adjointId");
  await assertUserInUnite(responsableId, id, "Responsable", fallback);
  await assertUserInUnite(adjointId, id, "Adjoint", fallback);

  await prisma.unite.update({
    where: { id },
    data: {
      nom,
      description: optStr(formData, "description"),
      responsableId,
      adjointId,
      actif: str(formData, "actif") !== "0",
    },
  });

  revalidateUnites(id);
  redirectWithOk(fallback, "modifie");
}
