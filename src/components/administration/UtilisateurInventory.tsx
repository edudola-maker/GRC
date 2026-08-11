"use client";

import Link from "next/link";
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

export type UtilisateurInventoryItem = {
  id: string;
  nomAffiche: string;
  email: string;
  fonction: string | null;
  role: string;
  roleLabel: string;
  uniteId: string;
  uniteLabel: string;
  actif: boolean;
};

type QuickFilter = "tous" | "actifs" | "inactifs";

const QUICK_LABELS: Record<QuickFilter, string> = {
  tous: "Tous",
  actifs: "Actifs",
  inactifs: "Inactifs",
};

export function UtilisateurInventory({
  items,
  unites,
  roles,
  createHref,
  createLabel = "Nouvel utilisateur",
}: {
  items: UtilisateurInventoryItem[];
  unites: { id: string; label: string }[];
  roles: { value: string; label: string }[];
  createHref?: string;
  createLabel?: string;
}) {
  const { query, deferredQuery, setQuery } = useInventorySearch();
  const [quick, setQuick] = useState<QuickFilter>("actifs");
  const [uniteId, setUniteId] = useState("");
  const [role, setRole] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = items;
    if (quick === "actifs") list = list.filter((u) => u.actif);
    else if (quick === "inactifs") list = list.filter((u) => !u.actif);

    if (uniteId) list = list.filter((u) => u.uniteId === uniteId);
    if (role) list = list.filter((u) => u.role === role);

    return filterByQuery(list, deferredQuery, (u) => [
      u.nomAffiche,
      u.email,
      u.fonction ?? "",
      u.roleLabel,
      u.uniteLabel,
    ]);
  }, [items, quick, uniteId, role, deferredQuery]);

  const activeFilterChips = useMemo(() => {
    const chips: string[] = [];
    if (quick !== "tous") chips.push(QUICK_LABELS[quick]);
    if (query.trim()) chips.push(`Recherche : « ${query.trim()} »`);
    if (uniteId) {
      const label = unites.find((u) => u.id === uniteId)?.label ?? "?";
      chips.push(`Unité : ${label}`);
    }
    if (role) {
      const label = roles.find((r) => r.value === role)?.label ?? role;
      chips.push(`Rôle : ${label}`);
    }
    return chips;
  }, [quick, query, uniteId, unites, role, roles]);

  const canReset =
    quick !== "tous" ||
    query.trim() !== "" ||
    uniteId !== "" ||
    role !== "";

  const resetAll = () => {
    setQuick("tous");
    setQuery("");
    setUniteId("");
    setRole("");
  };

  return (
    <InventoryBrowser
      searchPlaceholder="Rechercher un utilisateur (nom, e-mail…)"
      searchValue={query}
      onSearchChange={setQuery}
      advancedOpen={advancedOpen}
      onAdvancedToggle={() => setAdvancedOpen((v) => !v)}
      resultCount={filtered.length}
      totalCount={items.length}
      activeFilterChips={activeFilterChips}
      onResetFilters={resetAll}
      canResetFilters={canReset}
      createAction={
        createHref ? (
          <Link className="btn" href={createHref}>
            {createLabel}
          </Link>
        ) : undefined
      }
      quickFilters={
        <>
          {(Object.keys(QUICK_LABELS) as QuickFilter[]).map((k) => (
            <ChipButton
              key={k}
              active={quick === k}
              onClick={() => setQuick(k)}
            >
              {QUICK_LABELS[k]}
            </ChipButton>
          ))}
          <label className="inventory__select">
            <span className="sr-only">Unité</span>
            <select
              value={uniteId}
              onChange={(e) => setUniteId(e.target.value)}
            >
              <option value="">Toutes unités</option>
              {unites.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
          <label className="inventory__select">
            <span className="sr-only">Rôle</span>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Tous rôles</option>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </>
      }
      advancedPanel={
        <p className="muted" style={{ margin: 0 }}>
          Filtres unité / rôle / actif disponibles dans la barre ci-dessus.
        </p>
      }
    >
      {filtered.length === 0 ? (
        <InventoryEmpty>Aucun utilisateur ne correspond.</InventoryEmpty>
      ) : (
        <InventoryList
          dense
          columns={["Nom", "Rôle", "Unité", "E-mail", "Statut"]}
        >
          {filtered.map((u) => (
            <li key={u.id}>
              <InventoryRow
                href={`/administration/utilisateurs/${u.id}`}
                archived={!u.actif}
                primary={[
                  {
                    value: u.nomAffiche,
                    emphasis: "title",
                  },
                  {
                    value: u.roleLabel,
                    emphasis: "status",
                    badgeTone:
                      u.role === "ADMINISTRATEUR"
                        ? "info"
                        : u.role === "RESPONSABLE"
                          ? "ok"
                          : "neutral",
                  },
                  {
                    value: u.uniteLabel,
                  },
                  { value: u.email, emphasis: "muted" },
                  {
                    value: u.actif ? "Actif" : "Inactif",
                    emphasis: "muted",
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
