"use client";

import { useMemo, useState } from "react";
import {
  ChipButton,
  InventoryBrowser,
  useInventorySearch,
} from "@/components/inventory/InventoryBrowser";
import {
  InventoryEmpty,
  InventoryList,
  InventoryRow,
} from "@/components/inventory/InventoryRow";
import { STATUT_CONSEIL_OPTIONS } from "@/lib/catalog";
import {
  EMPTY_CONSEIL_ADVANCED,
  filterConseils,
  hasAdvancedFilters,
  type ConseilAdvancedFilters,
  type ConseilQuickFilter,
} from "@/lib/inventory-filters";
import { TAXINOMIE_LABELS, formatDateDot } from "@/lib/labels";

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

const QUICK_LABELS: Record<ConseilQuickFilter, string> = {
  tous: "Tous",
  ouverts: "Ouverts",
  clos: "Clôturés",
  retard: "En retard",
  archives: "Archivés",
};

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
  const [quick, setQuick] = useState<ConseilQuickFilter>("ouverts");
  const [responsableQuick, setResponsableQuick] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advanced, setAdvanced] = useState<ConseilAdvancedFilters>(
    EMPTY_CONSEIL_ADVANCED,
  );

  const filtered = useMemo(
    () =>
      filterConseils(items, {
        quick,
        query: deferredQuery,
        responsableQuick,
        advanced,
      }),
    [items, quick, deferredQuery, responsableQuick, advanced],
  );

  const activeFilterChips = useMemo(() => {
    const chips: string[] = [];
    if (quick !== "tous") chips.push(QUICK_LABELS[quick]);
    if (query.trim()) chips.push(`Recherche : « ${query.trim()} »`);
    if (responsableQuick) {
      const nom =
        responsables.find((r) => r.id === responsableQuick)?.nom ??
        "Responsable";
      chips.push(`Responsable : ${nom}`);
    }
    if (advanced.dateReceptionDu || advanced.dateReceptionAu) {
      chips.push(
        `Réception ${advanced.dateReceptionDu || "…"} → ${advanced.dateReceptionAu || "…"}`,
      );
    }
    if (advanced.dateClotureDu || advanced.dateClotureAu) {
      chips.push(
        `Clôture ${advanced.dateClotureDu || "…"} → ${advanced.dateClotureAu || "…"}`,
      );
    }
    if (advanced.provenance.trim()) {
      chips.push(`Provenance : ${advanced.provenance.trim()}`);
    }
    if (advanced.responsableId) {
      const nom =
        responsables.find((r) => r.id === advanced.responsableId)?.nom ??
        "Responsable";
      chips.push(`Resp. avancé : ${nom}`);
    }
    if (advanced.statut) {
      const label =
        STATUT_CONSEIL_OPTIONS.find((o) => o.value === advanced.statut)
          ?.label ?? advanced.statut;
      chips.push(`Statut : ${label}`);
    }
    if (advanced.taxinomie) {
      const label =
        taxinomies.find((t) => t.value === advanced.taxinomie)?.label ??
        advanced.taxinomie;
      chips.push(`Taxinomie : ${label}`);
    }
    if (advanced.tags.trim()) chips.push(`Tags : ${advanced.tags.trim()}`);
    return chips;
  }, [quick, query, responsableQuick, advanced, responsables, taxinomies]);

  const canReset =
    quick !== "tous" ||
    query.trim() !== "" ||
    responsableQuick !== "" ||
    hasAdvancedFilters(advanced);

  const resetAll = () => {
    setQuick("tous");
    setQuery("");
    setResponsableQuick("");
    setAdvanced(EMPTY_CONSEIL_ADVANCED);
  };

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
      activeFilterChips={activeFilterChips}
      onResetFilters={resetAll}
      canResetFilters={canReset}
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
              placeholder="Ex. Gouvernance"
            />
          </label>
          <div className="form-actions inventory__advanced-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setAdvanced(EMPTY_CONSEIL_ADVANCED)}
            >
              Réinitialiser la recherche avancée
            </button>
          </div>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <InventoryEmpty>
          Aucun conseil ne correspond à votre recherche.
        </InventoryEmpty>
      ) : (
        <InventoryList
          columns={["Code", "Nom", "Provenance", "Statut"]}
          secondaryColumns={["Responsable", "Échéance", "Taxinomie", "Tags"]}
        >
          {filtered.map((c) => (
            <li key={c.id}>
              <InventoryRow
                href={`/conseils/${c.id}`}
                urgence={c.urgence}
                archived={c.archive}
                primary={[
                  { value: c.code, emphasis: "code" },
                  { value: c.objet, emphasis: "title" },
                  { value: provenance(c) },
                  { value: c.statutLabel, emphasis: "status" },
                ]}
                secondary={[
                  { value: c.responsableNom },
                  { value: formatDateDot(c.dateEcheance) },
                  {
                    value: c.taxinomie
                      ? (TAXINOMIE_LABELS[c.taxinomie] ?? c.taxinomie)
                      : "—",
                  },
                  { value: c.tags || "—" },
                ]}
              />
            </li>
          ))}
        </InventoryList>
      )}
    </InventoryBrowser>
  );
}
