"use client";

import { useMemo, useState } from "react";
import {
  ChipButton,
  InventoryBrowser,
  filterByQuery,
  useInventorySearch,
} from "@/components/inventory/InventoryBrowser";
import {
  InventoryEmpty,
  InventoryList,
  InventoryRow,
} from "@/components/inventory/InventoryRow";
import { formatDateDot } from "@/lib/labels";

export type ControleInventoryItem = {
  id: string;
  code: string;
  nom: string;
  processusConcerne: string;
  typeLabel: string;
  frequenceLabel: string;
  statut: string;
  statutLabel: string;
  responsableId: string;
  responsableNom: string;
  fenetreDeclenchementJours: number;
  dateProchaineEcheance: string | null;
  nbPreuves: number;
  archive: boolean;
  urgence: "retard" | "bientot" | "a_venir" | "neutre";
  estActif: boolean;
  estRetard: boolean;
};

type QuickFilter = "tous" | "actifs" | "retard" | "archives";

const QUICK_LABELS: Record<QuickFilter, string> = {
  tous: "Tous",
  actifs: "Actifs",
  retard: "En retard",
  archives: "Archivés",
};

export function ControleInventory({
  items,
  responsables,
}: {
  items: ControleInventoryItem[];
  responsables: { id: string; nom: string }[];
}) {
  const { query, deferredQuery, setQuery } = useInventorySearch();
  const [quick, setQuick] = useState<QuickFilter>("actifs");
  const [responsableQuick, setResponsableQuick] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [statut, setStatut] = useState("");
  const [processus, setProcessus] = useState("");

  const filtered = useMemo(() => {
    let list = items;
    if (quick === "actifs") list = list.filter((c) => c.estActif && !c.archive);
    else if (quick === "retard")
      list = list.filter((c) => c.estRetard && !c.archive);
    else if (quick === "archives") list = list.filter((c) => c.archive);
    else list = list.filter((c) => !c.archive);

    if (responsableQuick)
      list = list.filter((c) => c.responsableId === responsableQuick);

    list = filterByQuery(list, deferredQuery, (c) => [
      c.code,
      c.nom,
      c.processusConcerne,
    ]);

    if (statut) list = list.filter((c) => c.statut === statut);
    if (processus.trim()) {
      const p = processus.trim().toLowerCase();
      list = list.filter((c) =>
        c.processusConcerne.toLowerCase().includes(p),
      );
    }
    return list;
  }, [items, quick, responsableQuick, deferredQuery, statut, processus]);

  const statutOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of items) map.set(c.statut, c.statutLabel);
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [items]);

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
    if (statut) {
      const label =
        statutOptions.find((o) => o.value === statut)?.label ?? statut;
      chips.push(`Statut : ${label}`);
    }
    if (processus.trim()) chips.push(`Processus : ${processus.trim()}`);
    return chips;
  }, [
    quick,
    query,
    responsableQuick,
    statut,
    processus,
    responsables,
    statutOptions,
  ]);

  const canReset =
    quick !== "tous" ||
    query.trim() !== "" ||
    responsableQuick !== "" ||
    statut !== "" ||
    processus.trim() !== "";

  const resetAll = () => {
    setQuick("tous");
    setQuery("");
    setResponsableQuick("");
    setStatut("");
    setProcessus("");
  };

  return (
    <InventoryBrowser
      searchPlaceholder="Rechercher un contrôle (code, nom, processus…)"
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
            active={quick === "actifs"}
            onClick={() => setQuick("actifs")}
          >
            Actifs
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
            <span className="field__label">Statut</span>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
            >
              <option value="">Tous</option>
              {statutOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Processus</span>
            <input
              type="text"
              value={processus}
              onChange={(e) => setProcessus(e.target.value)}
            />
          </label>
          <div className="form-actions inventory__advanced-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setStatut("");
                setProcessus("");
              }}
            >
              Réinitialiser la recherche avancée
            </button>
          </div>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <InventoryEmpty>
          Aucun contrôle ne correspond à votre recherche.
        </InventoryEmpty>
      ) : (
        <InventoryList
          columns={["Code", "Nom", "Processus", "Statut"]}
          secondaryColumns={[
            "Responsable",
            "Échéance",
            "Type / fréquence",
            "Preuves",
          ]}
        >
          {filtered.map((c) => (
            <li key={c.id}>
              <InventoryRow
                href={`/controles-sci/${c.id}`}
                urgence={c.urgence}
                archived={c.archive}
                primary={[
                  { value: c.code, emphasis: "code" },
                  { value: c.nom, emphasis: "title" },
                  { value: c.processusConcerne },
                  { value: c.statutLabel, emphasis: "status" },
                ]}
                secondary={[
                  { value: c.responsableNom },
                  { value: formatDateDot(c.dateProchaineEcheance) },
                  {
                    value: `${c.typeLabel} · ${c.frequenceLabel} · fenêtre ${c.fenetreDeclenchementJours} j.`,
                  },
                  {
                    value: `${c.nbPreuves} preuve${c.nbPreuves > 1 ? "s" : ""}`,
                  },
                ]}
              />
            </li>
          ))}
        </InventoryList>
      )}
    </InventoryBrowser>
  );
}
