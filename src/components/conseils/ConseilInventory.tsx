"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChipButton,
  InventoryBrowser,
  filterByQuery,
  useInventorySearch,
} from "@/components/inventory/InventoryBrowser";
import { STATUT_CONSEIL_OPTIONS } from "@/lib/catalog";
import { TAXINOMIE_LABELS } from "@/lib/labels";

export type ConseilInventoryItem = {
  id: string;
  code: string;
  objet: string;
  tags: string | null;
  taxinomie: string | null;
  demandeur: string | null;
  entiteDemandeuse: string | null;
  statut: string;
  statutLabel: string;
  responsableId: string;
  responsableNom: string;
  dateReception: string;
  dateEcheance: string | null;
  dateCloture: string | null;
  archive: boolean;
  urgence: "retard" | "bientot" | "a_venir" | "neutre";
  estOuvert: boolean;
  estClos: boolean;
  estRetard: boolean;
};

type QuickFilter = "tous" | "ouverts" | "clos" | "retard" | "archives";

type Advanced = {
  dateReceptionDu: string;
  dateReceptionAu: string;
  dateClotureDu: string;
  dateClotureAu: string;
  provenance: string;
  responsableId: string;
  statut: string;
  taxinomie: string;
  tags: string;
};

const EMPTY_ADVANCED: Advanced = {
  dateReceptionDu: "",
  dateReceptionAu: "",
  dateClotureDu: "",
  dateClotureAu: "",
  provenance: "",
  responsableId: "",
  statut: "",
  taxinomie: "",
  tags: "",
};

function inDateRange(
  value: string | null,
  du: string,
  au: string,
): boolean {
  if (!du && !au) return true;
  if (!value) return false;
  const d = value.slice(0, 10);
  if (du && d < du) return false;
  if (au && d > au) return false;
  return true;
}

export function ConseilInventory({
  items,
  responsables,
  taxinomies,
}: {
  items: ConseilInventoryItem[];
  responsables: { id: string; nom: string }[];
  taxinomies: { value: string; label: string }[];
}) {
  const { query, deferredQuery, setQuery } = useInventorySearch();
  const [quick, setQuick] = useState<QuickFilter>("ouverts");
  const [responsableQuick, setResponsableQuick] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advanced, setAdvanced] = useState<Advanced>(EMPTY_ADVANCED);

  const filtered = useMemo(() => {
    let list = items;

    if (quick === "ouverts") list = list.filter((c) => c.estOuvert && !c.archive);
    else if (quick === "clos") list = list.filter((c) => c.estClos && !c.archive);
    else if (quick === "retard") list = list.filter((c) => c.estRetard && !c.archive);
    else if (quick === "archives") list = list.filter((c) => c.archive);
    else list = list.filter((c) => !c.archive); // tous (actifs)

    if (responsableQuick) {
      list = list.filter((c) => c.responsableId === responsableQuick);
    }

    list = filterByQuery(list, deferredQuery, (c) => [
      c.code,
      c.objet,
      c.tags,
      c.demandeur,
      c.entiteDemandeuse,
    ]);

    const a = advanced;
    if (a.provenance.trim()) {
      const p = a.provenance.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.demandeur ?? "").toLowerCase().includes(p) ||
          (c.entiteDemandeuse ?? "").toLowerCase().includes(p),
      );
    }
    if (a.responsableId) {
      list = list.filter((c) => c.responsableId === a.responsableId);
    }
    if (a.statut) list = list.filter((c) => c.statut === a.statut);
    if (a.taxinomie) list = list.filter((c) => c.taxinomie === a.taxinomie);
    if (a.tags.trim()) {
      const t = a.tags.trim().toLowerCase();
      list = list.filter((c) => (c.tags ?? "").toLowerCase().includes(t));
    }
    list = list.filter((c) =>
      inDateRange(c.dateReception, a.dateReceptionDu, a.dateReceptionAu),
    );
    list = list.filter((c) =>
      inDateRange(c.dateCloture, a.dateClotureDu, a.dateClotureAu),
    );

    return list;
  }, [items, quick, responsableQuick, deferredQuery, advanced]);

  const provenance = (c: ConseilInventoryItem) =>
    c.entiteDemandeuse || c.demandeur || "—";

  return (
    <InventoryBrowser
      searchPlaceholder="Rechercher un conseil (code, nom, tags…)"
      searchValue={query}
      onSearchChange={setQuery}
      advancedOpen={advancedOpen}
      onAdvancedToggle={() => setAdvancedOpen((v) => !v)}
      resultCount={filtered.length}
      totalCount={items.filter((c) => !c.archive).length}
      quickFilters={
        <>
          <ChipButton active={quick === "tous"} onClick={() => setQuick("tous")}>
            Tous
          </ChipButton>
          <ChipButton
            active={quick === "ouverts"}
            onClick={() => setQuick("ouverts")}
          >
            Ouverts
          </ChipButton>
          <ChipButton active={quick === "clos"} onClick={() => setQuick("clos")}>
            Clôturés
          </ChipButton>
          <ChipButton
            active={quick === "retard"}
            onClick={() => setQuick("retard")}
          >
            En retard
          </ChipButton>
          <ChipButton
            active={quick === "archives"}
            onClick={() => setQuick("archives")}
          >
            Archivés
          </ChipButton>
          <label className="inventory__select">
            <span className="sr-only">Responsable</span>
            <select
              value={responsableQuick}
              onChange={(e) => setResponsableQuick(e.target.value)}
            >
              <option value="">Tous responsables</option>
              {responsables.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom}
                </option>
              ))}
            </select>
          </label>
        </>
      }
      advancedPanel={
        <div className="inventory__advanced-grid">
          <label className="field">
            <span className="field__label">Réception du</span>
            <input
              type="date"
              value={advanced.dateReceptionDu}
              onChange={(e) =>
                setAdvanced((s) => ({ ...s, dateReceptionDu: e.target.value }))
              }
            />
          </label>
          <label className="field">
            <span className="field__label">Réception au</span>
            <input
              type="date"
              value={advanced.dateReceptionAu}
              onChange={(e) =>
                setAdvanced((s) => ({ ...s, dateReceptionAu: e.target.value }))
              }
            />
          </label>
          <label className="field">
            <span className="field__label">Clôture du</span>
            <input
              type="date"
              value={advanced.dateClotureDu}
              onChange={(e) =>
                setAdvanced((s) => ({ ...s, dateClotureDu: e.target.value }))
              }
            />
          </label>
          <label className="field">
            <span className="field__label">Clôture au</span>
            <input
              type="date"
              value={advanced.dateClotureAu}
              onChange={(e) =>
                setAdvanced((s) => ({ ...s, dateClotureAu: e.target.value }))
              }
            />
          </label>
          <label className="field">
            <span className="field__label">Provenance</span>
            <input
              type="text"
              value={advanced.provenance}
              onChange={(e) =>
                setAdvanced((s) => ({ ...s, provenance: e.target.value }))
              }
              placeholder="Demandeur ou entité"
            />
          </label>
          <label className="field">
            <span className="field__label">Responsable</span>
            <select
              value={advanced.responsableId}
              onChange={(e) =>
                setAdvanced((s) => ({ ...s, responsableId: e.target.value }))
              }
            >
              <option value="">Tous</option>
              {responsables.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Statut</span>
            <select
              value={advanced.statut}
              onChange={(e) =>
                setAdvanced((s) => ({ ...s, statut: e.target.value }))
              }
            >
              <option value="">Tous</option>
              {STATUT_CONSEIL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Taxinomie</span>
            <select
              value={advanced.taxinomie}
              onChange={(e) =>
                setAdvanced((s) => ({ ...s, taxinomie: e.target.value }))
              }
            >
              <option value="">Toutes</option>
              {taxinomies.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Tags</span>
            <input
              type="text"
              value={advanced.tags}
              onChange={(e) =>
                setAdvanced((s) => ({ ...s, tags: e.target.value }))
              }
              placeholder="Ex. LSubv"
            />
          </label>
          <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setAdvanced(EMPTY_ADVANCED)}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      }
    >
      <div className="panel">
        {filtered.length === 0 ? (
          <p className="empty">Aucun conseil ne correspond à votre recherche.</p>
        ) : (
          <ul className="inventory-list">
            {filtered.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/conseils/${c.id}`}
                  className={`inventory-row inventory-row--${c.urgence}${c.archive ? " is-archived" : ""}`}
                >
                  <div className="inventory-row__primary">
                    <span className="inventory-row__code">{c.code}</span>
                    <span className="inventory-row__sep" aria-hidden>
                      |
                    </span>
                    <span className="inventory-row__title">{c.objet}</span>
                    <span className="inventory-row__sep" aria-hidden>
                      |
                    </span>
                    <span className="inventory-row__prov">{provenance(c)}</span>
                    <span className="inventory-row__sep" aria-hidden>
                      |
                    </span>
                    <span className="inventory-row__status">{c.statutLabel}</span>
                  </div>
                  <div className="inventory-row__secondary">
                    <span>{c.responsableNom}</span>
                    {c.dateEcheance ? (
                      <span>
                        Éch.{" "}
                        {new Date(c.dateEcheance).toLocaleDateString("fr-FR")}
                      </span>
                    ) : null}
                    {c.taxinomie ? (
                      <span>
                        {TAXINOMIE_LABELS[c.taxinomie] ?? c.taxinomie}
                      </span>
                    ) : null}
                    {c.tags ? <span>{c.tags}</span> : null}
                    {c.archive ? <span>Archivé</span> : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </InventoryBrowser>
  );
}
