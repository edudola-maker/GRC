"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  responsableOnly?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "dashboards",
    label: "Dashboards",
    items: [
      { href: "/", label: "Dashboard collaborateur", icon: "⌂" },
      { href: "/unite", label: "Mon unité", icon: "⬡" },
      {
        href: "/responsable",
        label: "Dashboard responsable",
        icon: "◎",
        responsableOnly: true,
      },
    ],
  },
  {
    id: "metier",
    label: "Métier",
    items: [
      { href: "/projets", label: "Projets", icon: "▦" },
      { href: "/audits", label: "Missions d'assurance", icon: "◉" },
      { href: "/conseils", label: "Conseils", icon: "💬" },
    ],
  },
  {
    id: "gouvernance",
    label: "Gouvernance",
    items: [
      { href: "/processus", label: "Processus", icon: "⬡" },
      { href: "/modeles-taches", label: "Modèles de tâches", icon: "☰" },
      { href: "/risques", label: "Risques", icon: "⚠" },
      { href: "/controles-sci", label: "Contrôles SCI", icon: "☑" },
      { href: "/documents", label: "Documents", icon: "▤" },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    items: [],
  },
];

export function AppNav({
  isResponsable = false,
  userName,
  uniteName,
  demoSwitcher,
}: {
  isResponsable?: boolean;
  userName?: string;
  uniteName?: string;
  demoSwitcher?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <aside className="app-nav">
      <div className="app-nav__brand">
        <span className="app-nav__mark">GRC</span>
        <div className="app-nav__brand-text">
          <strong>Pilotage</strong>
          <span>{uniteName || "Unité"}</span>
        </div>
      </div>

      <nav className="app-nav__links" aria-label="Navigation principale">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter(
            (i) => !i.responsableOnly || isResponsable,
          );
          if (group.id === "admin") {
            return (
              <div key={group.id} className="app-nav__group">
                <p className="app-nav__group-label">{group.label}</p>
                <span className="app-nav__soon">À venir</span>
              </div>
            );
          }
          if (items.length === 0) return null;
          return (
            <div key={group.id} className="app-nav__group">
              <p className="app-nav__group-label">{group.label}</p>
              {items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`app-nav__link${active ? " is-active" : ""}`}
                  >
                    <span className="app-nav__icon" aria-hidden>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="app-nav__footer">
        {userName ? (
          <p className="app-nav__user">
            Connecté : <strong>{userName}</strong>
          </p>
        ) : null}
        {demoSwitcher}
        <p className="app-nav__footnote">Sprint 2 — Vague C</p>
      </div>
    </aside>
  );
}
