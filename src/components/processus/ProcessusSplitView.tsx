"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ProcessusArborescence,
  type MacroArboItem,
  type ProcessusArboItem,
  type UniteArbo,
} from "@/components/processus/ProcessusArborescence";

const STORAGE_WIDTH = "grc_processus_split_w";
const MIN_LEFT = 220;
const MAX_LEFT = 480;
const DEFAULT_LEFT = 300;

/**
 * Master/detail Processus — arbre | fiche.
 * Desktop : split redimensionnable.
 * Mobile : arbre OU fiche (retour).
 */
export function ProcessusSplitView({
  unite,
  macros,
  orphelins,
  selectedId,
  detail,
}: {
  unite: UniteArbo;
  macros: MacroArboItem[];
  orphelins: ProcessusArboItem[];
  selectedId: string | null;
  detail: React.ReactNode;
}) {
  const [leftW, setLeftW] = useState(DEFAULT_LEFT);
  const dragging = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_WIDTH);
      if (raw) {
        const n = Number(raw);
        if (Number.isFinite(n)) setLeftW(Math.min(MAX_LEFT, Math.max(MIN_LEFT, n)));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current) return;
    const shell = document.querySelector(".processus-split");
    if (!shell) return;
    const rect = shell.getBoundingClientRect();
    const next = Math.min(MAX_LEFT, Math.max(MIN_LEFT, e.clientX - rect.left));
    setLeftW(next);
  }, []);

  const stopDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    document.body.classList.remove("is-resizing");
    try {
      localStorage.setItem(STORAGE_WIDTH, String(leftW));
    } catch {
      /* ignore */
    }
  }, [leftW]);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDrag);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDrag);
    };
  }, [onPointerMove, stopDrag]);

  const showDetailMobile = Boolean(selectedId);

  return (
    <div
      className={`processus-split${showDetailMobile ? " has-selection" : ""}`}
      style={{ ["--split-left" as string]: `${leftW}px` }}
    >
      <aside className="processus-split__master" aria-label="Arborescence des processus">
        <div className="processus-split__master-head">
          <strong>Cartographie</strong>
          <Link href="/macroprocessus/nouveau" className="btn btn--ghost">
            + Macro
          </Link>
        </div>
        <ProcessusArborescence
          unite={unite}
          macros={macros}
          orphelins={orphelins}
          selectedId={selectedId}
          selectHrefBase="/processus?vue=arborescence"
        />
      </aside>

      <div
        className="processus-split__resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionner les panneaux"
        onPointerDown={(e) => {
          e.preventDefault();
          dragging.current = true;
          document.body.classList.add("is-resizing");
        }}
      />

      <section className="processus-split__detail" aria-label="Processus sélectionné">
        {selectedId ? (
          <>
            <div className="processus-split__detail-mobile-back">
              <Link href="/processus?vue=arborescence" className="btn btn--ghost">
                ← Arborescence
              </Link>
            </div>
            {detail}
          </>
        ) : (
          <div className="processus-split__empty">
            <p>
              Sélectionnez un processus dans l’arborescence pour consulter sa
              fiche.
            </p>
            <p className="muted">
              Exploration rapide ici — utilisez « Ouvrir la fiche » pour un
              travail prolongé.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
