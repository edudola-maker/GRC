import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { DemoUserSwitcher } from "@/components/DemoUserSwitcher";
import {
  formatUtilisateurNom,
  getCurrentUser,
  isAdministrateur,
  isResponsable,
  listUtilisateursActifs,
} from "@/lib/session";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "GRC — Pilotage",
  description:
    "Application interne de pilotage : projets, conseils, audits, risques et contrôles SCI.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userName = "";
  let uniteName = "";
  let responsable = false;
  let administrateur = false;
  let switcher: React.ReactNode = null;

  try {
    const [user, users] = await Promise.all([
      getCurrentUser(),
      // Démo : tous les utilisateurs (toutes unités) pour basculer le contexte
      listUtilisateursActifs(),
    ]);
    userName = formatUtilisateurNom(user);
    responsable = isResponsable(user);
    administrateur = isAdministrateur(user);
    const unite = await prisma.unite.findUnique({
      where: { id: user.uniteId },
      select: { nom: true, code: true },
    });
    uniteName = unite ? `${unite.nom}` : "";
    switcher = (
      <Suspense fallback={null}>
        <DemoUserSwitcher
          users={users.map((u) => ({
            id: u.id,
            nom: formatUtilisateurNom(u),
            role: u.role,
          }))}
          currentId={user.id}
        />
      </Suspense>
    );
  } catch {
    // DB non initialisée : navigation minimale
  }

  return (
    <html lang="fr" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <div className="app-shell">
          <AppNav
            isResponsable={responsable}
            isAdministrateur={administrateur}
            userName={userName}
            uniteName={uniteName}
            demoSwitcher={switcher}
          />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
