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

export type ProjetInventoryItem = {
  id: string;
  code: string;
  nom: string;
  statut: string;
  statutLabel: string;
  prioriteLabel: string;
  responsableId: string;
  responsableNom: string;
  avancement: number;
  tags: string | null;
  dateEcheance: string | null;
  nbTaches: number;
  nbJalons: number;
  archive: boolean;
  urgence: "retard" | "bientot" | "a_venir" | "neutre";
  estActif: boolean;
  estRetard: boolean;
};

type QuickFilter = "tous" | "actifs" | "retard" | "archives";

export function ProjetInventory({
  items,
  responsables,
}: {
  items: ProjetInventoryItem[];
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
    if (quick === "actifs") list = list.filter((p) => p.estActif && !p.archive);
    else if (quick === "retard")
      list = list.filter((p) => p.estRetard && !p.archive);
    else if (quick === "archives") list = list.filter((p) => p.archive);
    else list = list.filter((p) => !p.archive);

    if (responsableQuick)
      list = list.filter((p) => p.responsableId === responsableQuick);

    list = filterByQuery(list, deferredQuery, (p) => [p.code, p.nom, p.tags]);

    if (statut) list = list.filter((p) => p.statut === statut);
    if (tags.trim()) {
      const t = tags.trim().toLowerCase();
      list = list.filter((p) => (p.tags ?? "").toLowerCase().includes(t));
    }
    return list;
  }, [items, quick, responsableQuick, deferredQuery, statut, tags]);

  const statutOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of items) map.set(p.statut, p.statutLabel);
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [items]);

  return (
    <InventoryBrowser
      searchPlaceholder="Rechercher un projet (code, nom, tags…)"
      searchValue={query}
      onSearchChange={setQuery}
      advancedOpen={advancedOpen}
      onAdvancedToggle={() => setAdvancedOpen((v) => !v)}
      resultCount={filtered.length}
      totalCount={items.filter((p) => !p.archive).length}
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
          Aucun projet ne correspond à votre recherche.
        </InventoryEmpty>
      ) : (
        <InventoryList
          columns={["Code", "Nom", "Priorité", "Statut"]}
          secondaryColumns={[
            "Responsable",
            "Échéance",
            "Avancement",
            "Tags",
          ]}
        >
          {filtered.map((p) => (
            <li key={p.id}>
              <InventoryRow
                href={`/projets/${p.id}`}
                urgence={p.urgence}
                archived={p.archive}
                primary={[
                  { value: p.code, emphasis: "code" },
                  { value: p.nom, emphasis: "title" },
                  { value: p.prioriteLabel },
                  { value: p.statutLabel, emphasis: "status" },
                ]}
                secondary={[
                  { value: p.responsableNom },
                  { value: formatDateDot(p.dateEcheance) },
                  {
                    value: `${p.avancement}% · ${p.nbTaches} tâche${p.nbTaches > 1 ? "s" : ""}${p.nbJalons > 0 ? ` · ${p.nbJalons} jalon${p.nbJalons > 1 ? "s" : ""}` : ""}`,
                  },
                  { value: p.tags || "—" },
                ]}
              />
            </li>
          ))}
        </InventoryList>
      )}
    </InventoryBrowser>
  );
}
