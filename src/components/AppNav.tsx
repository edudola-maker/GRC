"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Pilotage", icon: "⌂" },
  { href: "/backlog", label: "Backlog", icon: "☰" },
  { href: "/taches", label: "Tâches", icon: "✓" },
  { href: "/projets", label: "Projets", icon: "▦" },
  { href: "/controles-sci", label: "Contrôles SCI", icon: "☑" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <aside className="app-nav">
      <div className="app-nav__brand">
        <span className="app-nav__mark">GRC</span>
        <div className="app-nav__brand-text">
          <strong>Pilotage</strong>
          <span>Unité administrative</span>
        </div>
      </div>

      <nav className="app-nav__links" aria-label="Navigation principale">
        {NAV_ITEMS.map((item) => {
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

      <p className="app-nav__footnote">MVP — Module 1</p>
    </aside>
  );
}
