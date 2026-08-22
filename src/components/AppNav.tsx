"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconMenu,
  NavIcon,
  type NavIconName,
} from "@/components/icons/NavIcons";

type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  responsableOnly?: boolean;
  adminOnly?: boolean;
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
      { href: "/", label: "Dashboard collaborateur", icon: "home" },
      { href: "/unite", label: "Mon unité", icon: "unit" },
      {
        href: "/responsable",
        label: "Dashboard responsable",
        icon: "dashboard",
        responsableOnly: true,
      },
      { href: "/taches", label: "Tâches", icon: "check" },
    ],
  },
  {
    id: "metier",
    label: "Métier",
    items: [
      { href: "/projets", label: "Projets", icon: "project" },
      { href: "/missions", label: "Missions d'assurance", icon: "mission" },
      { href: "/conseils", label: "Conseils", icon: "conseil" },
    ],
  },
  {
    id: "gouvernance",
    label: "Gouvernance",
    items: [
      { href: "/processus", label: "Processus", icon: "processus" },
      { href: "/fonctions", label: "Fonctions", icon: "roles" },
      { href: "/actifs-it", label: "Actifs", icon: "asset" },
      { href: "/modeles-taches", label: "Modèles de tâches", icon: "list" },
      { href: "/risques", label: "Risques", icon: "risk" },
      { href: "/controles-sci", label: "Contrôles SCI", icon: "check" },
      { href: "/documents", label: "Documents", icon: "document" },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    items: [
      {
        href: "/administration/utilisateurs",
        label: "Utilisateurs",
        icon: "users",
        adminOnly: true,
      },
      {
        href: "/administration/unites",
        label: "Unités",
        icon: "unit",
        adminOnly: true,
      },
      {
        href: "/administration/roles",
        label: "Rôles",
        icon: "roles",
        adminOnly: true,
      },
    ],
  },
];

const STORAGE_KEY = "grc_nav_compact";

export function AppNav({
  isResponsable = false,
  isAdministrateur = false,
  userName,
  uniteName,
  demoSwitcher,
}: {
  isResponsable?: boolean;
  isAdministrateur?: boolean;
  userName?: string;
  uniteName?: string;
  demoSwitcher?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setCompact(true);
      else if (stored === "0") setCompact(false);
      else if (window.matchMedia("(max-width: 1100px)").matches) {
        setCompact(true);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.nav = compact ? "compact" : "open";
    try {
      localStorage.setItem(STORAGE_KEY, compact ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [compact, ready]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("nav-drawer-open", mobileOpen);
    return () => document.body.classList.remove("nav-drawer-open");
  }, [mobileOpen]);

  const toggleCompact = useCallback(() => {
    setCompact((v) => !v);
  }, []);

  function renderLinks(onNavigate?: () => void) {
    return NAV_GROUPS.map((group) => {
      const items = group.items.filter((i) => {
        if (i.adminOnly) return isAdministrateur;
        if (i.responsableOnly) return isResponsable;
        return true;
      });

      if (group.id === "admin" && items.length === 0) {
        return (
          <div key={group.id} className="app-nav__group">
            <p className="app-nav__group-label">{group.label}</p>
            <span className="app-nav__soon">Réservé</span>
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
                title={item.label}
                aria-label={item.label}
                onClick={onNavigate}
              >
                <span className="app-nav__icon" aria-hidden>
                  <NavIcon name={item.icon} size={18} />
                </span>
                <span className="app-nav__label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      );
    });
  }

  return (
    <>
      <header className="app-topbar">
        <button
          type="button"
          className="app-topbar__menu"
          aria-label="Ouvrir la navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <IconMenu size={20} />
        </button>
        <Link href="/" className="app-topbar__brand" aria-label="Accueil GRC">
          <span className="app-nav__mark">GRC</span>
          <span className="app-topbar__brand-text">Pilotage</span>
        </Link>
      </header>

      {mobileOpen ? (
        <button
          type="button"
          className="app-nav__backdrop"
          aria-label="Fermer la navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`app-nav${compact ? " is-compact" : ""}${mobileOpen ? " is-mobile-open" : ""}`}
        aria-label="Navigation principale"
      >
        <div className="app-nav__brand-row">
          <Link
            href="/"
            className="app-nav__brand"
            aria-label="Accueil — Dashboard collaborateur"
          >
            <span className="app-nav__mark">GRC</span>
            <div className="app-nav__brand-text">
              <strong>Pilotage</strong>
              <span>{uniteName || "Unité"}</span>
            </div>
          </Link>
          <button
            type="button"
            className="app-nav__collapse"
            onClick={toggleCompact}
            aria-label={compact ? "Déplier la navigation" : "Replier la navigation"}
            title={compact ? "Déplier" : "Replier"}
          >
            {compact ? (
              <IconChevronRight size={16} />
            ) : (
              <IconChevronLeft size={16} />
            )}
          </button>
          <button
            type="button"
            className="app-nav__mobile-close"
            aria-label="Fermer la navigation"
            onClick={() => setMobileOpen(false)}
          >
            <IconClose size={18} />
          </button>
        </div>

        <nav className="app-nav__links">{renderLinks(() => setMobileOpen(false))}</nav>

        <div className="app-nav__footer">
          {userName ? (
            <p className="app-nav__user">
              <span className="app-nav__label">
                Connecté : <strong>{userName}</strong>
              </span>
            </p>
          ) : null}
          <div className="app-nav__label">{demoSwitcher}</div>
          <p className="app-nav__footnote app-nav__label">Sprint consolidation</p>
        </div>
      </aside>
    </>
  );
}
