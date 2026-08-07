"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: string; responsableOnly?: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Mon tableau de bord", icon: "⌂" },
  {
    href: "/responsable",
    label: "Dashboard responsable",
    icon: "◎",
    responsableOnly: true,
  },
  { href: "/projets", label: "Projets", icon: "▦" },
  { href: "/conseils", label: "Conseils", icon: "💬" },
  { href: "/audits", label: "Audits", icon: "◉" },
  { href: "/risques", label: "Risques", icon: "⚠" },
  { href: "/controles-sci", label: "Contrôles SCI", icon: "☑" },
  { href: "/documents", label: "Documents", icon: "▤" },
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
  const items = NAV_ITEMS.filter((i) => !i.responsableOnly || isResponsable);

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
