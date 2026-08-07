import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { DemoUserSwitcher } from "@/components/DemoUserSwitcher";
import { getCurrentUser, isResponsable, listUtilisateursActifs } from "@/lib/session";
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
  let responsable = false;
  let switcher: React.ReactNode = null;

  try {
    const [user, users] = await Promise.all([
      getCurrentUser(),
      listUtilisateursActifs(),
    ]);
    userName = user.nom;
    responsable = isResponsable(user);
    switcher = (
      <Suspense fallback={null}>
        <DemoUserSwitcher
          users={users.map((u) => ({ id: u.id, nom: u.nom, role: u.role }))}
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
            userName={userName}
            demoSwitcher={switcher}
          />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
