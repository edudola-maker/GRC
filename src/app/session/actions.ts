"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
