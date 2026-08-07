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
  InventoryRow,
} from "@/components/inventory/InventoryRow";
import { formatDateDot } from "@/lib/labels";

export type AuditInventoryItem = {
  id: string;
  code: string;
  titre: string;
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

export function AuditInventory({
  items,
  responsables,
}: {
  items: AuditInventoryItem[];
  responsables: { id: string; nom: string }[];
}) {
  const { query, deferredQuery, setQuery } = useInventorySearch();
  const [quick, setQuick] = useState<QuickFilter>("actifs");
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

  return (
    <InventoryBrowser
      searchPlaceholder="Rechercher un audit (code, titre, tags…)"
      searchValue={query}
      onSearchChange={setQuery}
      advancedOpen={advancedOpen}
      onAdvancedToggle={() => setAdvancedOpen((v) => !v)}
      resultCount={filtered.length}
      totalCount={items.filter((a) => !a.archive).length}
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
          <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setStatut("");
                setTags("");
              }}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <InventoryEmpty>
          Aucun audit ne correspond à votre recherche.
        </InventoryEmpty>
      ) : (
        <ul className="inventory-list">
          {filtered.map((a) => (
            <li key={a.id}>
              <InventoryRow
                href={`/audits/${a.id}`}
                urgence={a.urgence}
                archived={a.archive}
                primary={[
                  { label: "Code", value: a.code, emphasis: "code" },
                  { label: "Nom", value: a.titre, emphasis: "title" },
                  {
                    label: "Période",
                    value: `${formatDateDot(a.dateDebut)} → ${formatDateDot(a.dateFin)}`,
                  },
                  {
                    label: "Statut",
                    value: a.statutLabel,
                    emphasis: "status",
                  },
                ]}
                secondary={[
                  { label: "Responsable", value: a.responsableNom },
                  {
                    label: "Échéance",
                    value: formatDateDot(a.dateFin ?? a.dateDebut),
                  },
                  {
                    label: "Reco / tâches",
                    value: `${a.nbReco} reco · ${a.nbTaches} tâche${a.nbTaches > 1 ? "s" : ""}`,
                  },
                  { label: "Tags", value: a.tags || "—" },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
    </InventoryBrowser>
  );
}
