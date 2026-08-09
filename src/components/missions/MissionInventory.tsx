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
import { toneFromStatut } from "@/components/ui/StatusBadge";
import { formatDateDot } from "@/lib/labels";

export type MissionInventoryItem = {
  id: string;
  code: string;
  titre: string;
  typeLabel: string;
  statut: string;
  statutLabel: string;
  responsableId: string;
  responsableNom: string;
  tags: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  nbReco: number;
  nbTaches: number;
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

export function MissionInventory({
  items,
  responsables,
  initialQuick,
}: {
  items: MissionInventoryItem[];
  responsables: { id: string; nom: string }[];
  initialQuick?: QuickFilter;
}) {
  const { query, deferredQuery, setQuery } = useInventorySearch();
  const [quick, setQuick] = useState<QuickFilter>(initialQuick ?? "actifs");
  const [responsableQuick, setResponsableQuick] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [statut, setStatut] = useState("");
  const [tags, setTags] = useState("");

  const filtered = useMemo(() => {
    let list = items;
    if (quick === "actifs") list = list.filter((a) => a.estActif && !a.archive);
    else if (quick === "retard")
      list = list.filter((a) => a.estRetard && !a.archive);
    else if (quick === "archives") list = list.filter((a) => a.archive);
    else list = list.filter((a) => !a.archive);

    if (responsableQuick)
      list = list.filter((a) => a.responsableId === responsableQuick);

    list = filterByQuery(list, deferredQuery, (a) => [
      a.code,
      a.titre,
      a.tags,
    ]);

    if (statut) list = list.filter((a) => a.statut === statut);
    if (tags.trim()) {
      const t = tags.trim().toLowerCase();
      list = list.filter((a) => (a.tags ?? "").toLowerCase().includes(t));
    }
    return list;
  }, [items, quick, responsableQuick, deferredQuery, statut, tags]);

  const statutOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of items) map.set(a.statut, a.statutLabel);
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
    if (tags.trim()) chips.push(`Tags : ${tags.trim()}`);
    return chips;
  }, [quick, query, responsableQuick, statut, tags, responsables, statutOptions]);

  const canReset =
    quick !== "tous" ||
    query.trim() !== "" ||
    responsableQuick !== "" ||
    statut !== "" ||
    tags.trim() !== "";

  const resetAll = () => {
    setQuick("tous");
    setQuery("");
    setResponsableQuick("");
    setStatut("");
    setTags("");
  };

  return (
    <InventoryBrowser
      searchPlaceholder="Rechercher un audit (code, titre, tags…)"
      searchValue={query}
      onSearchChange={setQuery}
      advancedOpen={advancedOpen}
      onAdvancedToggle={() => setAdvancedOpen((v) => !v)}
      resultCount={filtered.length}
      totalCount={items.length}
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
            <span className="field__label">Tags</span>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </label>
          <div className="form-actions inventory__advanced-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setStatut("");
                setTags("");
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
          Aucune mission ne correspond à votre recherche.
        </InventoryEmpty>
      ) : (
        <InventoryList
          columns={["Code", "Nom", "Type", "Statut"]}
          secondaryColumns={["Responsable", "Échéance", "Reco / tâches", "Tags"]}
        >
          {filtered.map((a) => (
            <li key={a.id}>
              <InventoryRow
                href={`/missions/${a.id}`}
                urgence={a.urgence}
                archived={a.archive}
                primary={[
                  { value: a.code, emphasis: "code" },
                  { value: a.titre, emphasis: "title" },
                  { value: a.typeLabel },
                  { value: a.statutLabel, badgeTone: toneFromStatut(a.statut) },
                ]}
                secondary={[
                  { value: a.responsableNom },
                  { value: formatDateDot(a.dateFin ?? a.dateDebut) },
                  {
                    value: `${a.nbReco} reco · ${a.nbTaches} tâche${a.nbTaches > 1 ? "s" : ""}`,
                  },
                  { value: a.tags || "—" },
                ]}
              />
            </li>
          ))}
        </InventoryList>
      )}
    </InventoryBrowser>
  );
}
