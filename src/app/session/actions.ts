"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_ORG_COOKIE } from "@/lib/org-constants";
import { DEMO_USER_COOKIE } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { str } from "@/lib/form";

export async function switchDemoUser(formData: FormData) {
  const userId = str(formData, "userId");
  const retour = str(formData, "retour") || "/";

  const user = await prisma.utilisateur.findFirst({
    where: { id: userId, actif: true },
  });
  if (!user) redirect(`${retour}?erreur=${encodeURIComponent("Utilisateur introuvable.")}`);

  const jar = await cookies();
  jar.set(DEMO_USER_COOKIE, user.id, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });

  redirect(retour);
}

/**
 * Bascule l’Organisation (tenant) courante — cookie démo.
 * Change contexte, navigation modules et données (via uniteId effectif).
 */
export async function switchDemoOrganisation(formData: FormData) {
  const organisationId = str(formData, "organisationId");
  const retour = str(formData, "retour") || "/";

  const jar = await cookies();
  const userId = jar.get(DEMO_USER_COOKIE)?.value;

  if (!organisationId) {
    redirect(`${retour}?erreur=${encodeURIComponent("Organisation manquante.")}`);
  }

  const org = await prisma.organisation.findFirst({
    where: { id: organisationId, statut: "ACTIF" },
  });
  if (!org) {
    redirect(`${retour}?erreur=${encodeURIComponent("Organisation introuvable.")}`);
  }

  if (userId) {
    const membership = await prisma.organisationMembership.findFirst({
      where: {
        organisationId,
        utilisateurId: userId,
        actif: true,
      },
    });
    if (!membership) {
      redirect(
        `${retour}?erreur=${encodeURIComponent("Accès refusé à cette Organisation.")}`,
      );
    }
  }

  jar.set(DEMO_ORG_COOKIE, organisationId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });

  redirect(retour);
}
