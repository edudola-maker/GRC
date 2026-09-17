import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { DemoOrgSwitcher } from "@/components/DemoOrgSwitcher";
import { DemoUserSwitcher } from "@/components/DemoUserSwitcher";
import { RechercheHotkey } from "@/components/RechercheHotkey";
import { ScrollToHash } from "@/components/module/ScrollToHash";
import {
  getOrgContext,
  listOrganisationsForUser,
} from "@/lib/organisation";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  isAdministrateur,
  isResponsable,
  listUtilisateursActifsForCurrentOrg,
} from "@/lib/session";
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
  title: "Pilotage — Organisation",
  description:
    "Système de pilotage et de gouvernance : stratégie, travail, risques et amélioration.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userName = "";
  let uniteName = "";
  let orgName = "";
  let responsable = false;
  let administrateur = false;
  let activeModules: string[] | undefined;
  let switcher: React.ReactNode = null;

  try {
    const ctx = await getOrgContext();
    const [users, orgs] = await Promise.all([
      listUtilisateursActifsForCurrentOrg(),
      listOrganisationsForUser(ctx.user.id),
    ]);
    userName = formatUtilisateurNom(ctx.user);
    responsable = isResponsable({ role: ctx.role });
    administrateur = isAdministrateur({ role: ctx.role });
    orgName = ctx.organisation.nomCourt || ctx.organisation.nom;
    activeModules = [...ctx.modules];

    const unite = await prisma.unite.findUnique({
      where: { id: ctx.uniteId },
      select: { nom: true },
    });
    uniteName = unite?.nom ?? "";

    switcher = (
      <div className="demo-switchers">
        <Suspense fallback={null}>
          <DemoOrgSwitcher
            organisations={orgs}
            currentId={ctx.organisationId}
          />
        </Suspense>
        <Suspense fallback={null}>
          <DemoUserSwitcher
            users={users.map((u) => ({
              id: u.id,
              nom: formatUtilisateurNom(u),
              role: u.role,
            }))}
            currentId={ctx.user.id}
          />
        </Suspense>
      </div>
    );
  } catch {
    // DB non initialisée : navigation minimale
  }

  return (
    <html lang="fr" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <RechercheHotkey />
        <div className="app-shell">
          <AppNav
            isResponsable={responsable}
            isAdministrateur={administrateur}
            userName={userName}
            uniteName={uniteName}
            orgName={orgName}
            activeModules={activeModules}
            demoSwitcher={switcher}
          />
          <main className="app-main">
            <Suspense fallback={null}>
              <ScrollToHash />
            </Suspense>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
