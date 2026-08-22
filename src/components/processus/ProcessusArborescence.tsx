"use client";

import Link from "next/link";
import { useState } from "react";

export type ProcessusArboItem = {
  id: string;
  code: string;
  nom: string;
};

export type MacroArboItem = {
  id: string;
  code: string;
  nom: string;
  ordre: number;
  processus: ProcessusArboItem[];
};

export type UniteArbo = {
  id: string;
  nom: string;
  code: string;
};

function ChevronButton({
  open,
  onClick,
  ariaLabel,
}: {
  open: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      className="processus-arbo__chevron-btn"
      aria-expanded={open}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <span aria-hidden className="processus-arbo__chevron">
        {open ? "▾" : "▸"}
      </span>
    </button>
  );
}

function processusHref(base: string | undefined, id: string) {
  if (!base) return `/processus/${id}`;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}selected=${id}`;
}

/**
 * Arborescence Unité → Macroprocessus → Processus.
 * En mode split : `selectHrefBase` + `selectedId` (pas de navigation pleine page).
 */
export function ProcessusArborescence({
  unite,
  macros,
  orphelins,
  selectedId = null,
  selectHrefBase,
}: {
  unite: UniteArbo;
  macros: MacroArboItem[];
  orphelins: ProcessusArboItem[];
  selectedId?: string | null;
  /** Si fourni, les processus pointent vers base&selected=id */
  selectHrefBase?: string;
}) {
  const [open, setOpen] = useState<Set<string>>(() => {
    const initial = new Set<string>([`unite:${unite.id}`]);
    for (const m of macros) initial.add(`macro:${m.id}`);
    if (orphelins.length > 0) initial.add("orphelins");
    return initial;
  });

  function toggle(key: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const uniteKey = `unite:${unite.id}`;
  const uniteOpen = open.has(uniteKey);
  const orphelinsOpen = open.has("orphelins");

  function ProcessusLink({ p }: { p: ProcessusArboItem }) {
    const href = processusHref(selectHrefBase, p.id);
    const active = selectedId === p.id;
    return (
      <Link
        href={href}
        className={`processus-arbo__link${active ? " is-selected" : ""}`}
        scroll={false}
      >
        <span className="processus-arbo__code">{p.code}</span>
        <span>{p.nom}</span>
      </Link>
    );
  }

  return (
    <div className="processus-arbo">
      <div className="processus-arbo__node">
        <div className="processus-arbo__row">
          <ChevronButton
            open={uniteOpen}
            onClick={() => toggle(uniteKey)}
            ariaLabel={uniteOpen ? "Replier l’unité" : "Déplier l’unité"}
          />
          <span className="processus-arbo__label">
            {unite.code} — {unite.nom}
          </span>
        </div>
        {uniteOpen ? (
          <ul className="processus-arbo__children">
            {macros.map((m) => {
              const key = `macro:${m.id}`;
              const macroOpen = open.has(key);
              return (
                <li key={m.id} className="processus-arbo__node">
                  <div className="processus-arbo__row">
                    <ChevronButton
                      open={macroOpen}
                      onClick={() => toggle(key)}
                      ariaLabel={
                        macroOpen ? `Replier ${m.code}` : `Déplier ${m.code}`
                      }
                    />
                    <Link
                      href={`/macroprocessus/${m.id}`}
                      className="processus-arbo__link processus-arbo__link--macro"
                    >
                      <strong>
                        {m.code} — {m.nom}
                      </strong>
                    </Link>
                  </div>
                  {macroOpen ? (
                    <ul className="processus-arbo__children">
                      {m.processus.length === 0 ? (
                        <li className="processus-arbo__empty muted">
                          Aucun processus rattaché
                        </li>
                      ) : (
                        m.processus.map((p) => (
                          <li key={p.id}>
                            <ProcessusLink p={p} />
                          </li>
                        ))
                      )}
                    </ul>
                  ) : null}
                </li>
              );
            })}

            <li className="processus-arbo__node">
              <div className="processus-arbo__row">
                <ChevronButton
                  open={orphelinsOpen}
                  onClick={() => toggle("orphelins")}
                  ariaLabel={
                    orphelinsOpen
                      ? "Replier Sans macroprocessus"
                      : "Déplier Sans macroprocessus"
                  }
                />
                <span className="processus-arbo__label">Sans macroprocessus</span>
              </div>
              {orphelinsOpen ? (
                <ul className="processus-arbo__children">
                  {orphelins.length === 0 ? (
                    <li className="processus-arbo__empty muted">
                      Aucun processus orphelin
                    </li>
                  ) : (
                    orphelins.map((p) => (
                      <li key={p.id}>
                        <ProcessusLink p={p} />
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </li>
          </ul>
        ) : null}
      </div>
    </div>
  );
}
