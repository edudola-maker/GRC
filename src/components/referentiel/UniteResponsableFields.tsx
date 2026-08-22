"use client";

import { useMemo } from "react";

export type UniteOpt = { id: string; code: string; nom: string };

/**
 * Unité propriétaire (obligatoire) + unités applicables (hors propriétaire).
 * Utilisé pour Processus / Macroprocessus (source de vérité unique, pas d’héritage auto).
 */
export function UniteResponsableFields({
  unites,
  uniteId,
  applicableUniteIds = [],
  showApplicables = true,
}: {
  unites: UniteOpt[];
  uniteId?: string;
  applicableUniteIds?: string[];
  showApplicables?: boolean;
}) {
  const ownerId = uniteId ?? unites[0]?.id ?? "";
  const others = useMemo(
    () => unites.filter((u) => u.id !== ownerId),
    [unites, ownerId],
  );

  return (
    <>
      <label className="field" htmlFor="uniteId">
        <span className="field__label">Unité responsable *</span>
        <select
          id="uniteId"
          name="uniteId"
          required
          defaultValue={ownerId}
          key={ownerId}
        >
          {unites.map((u) => (
            <option key={u.id} value={u.id}>
              {u.code} — {u.nom}
            </option>
          ))}
        </select>
        <span className="field__hint">
          Sélection depuis le référentiel Unités — modifiable après création.
        </span>
      </label>

      {showApplicables && others.length > 0 ? (
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <span className="field__label">Également applicable à</span>
          <span className="field__hint">
            Visibilité pour d’autres unités sans dupliquer l’objet. Pas d’héritage
            automatique Macroprocessus → Processus.
          </span>
          <div style={{ display: "grid", gap: "0.35rem", marginTop: "0.5rem" }}>
            {others.map((u) => (
              <label key={u.id} className="check-field">
                <input
                  type="checkbox"
                  name="applicableUniteIds"
                  value={u.id}
                  defaultChecked={applicableUniteIds.includes(u.id)}
                />
                {u.code} — {u.nom}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
    </>
  );
}

/** Sélecteur Unité seul (objets métier sans applicabilité multi). */
export function UniteSelectField({
  unites,
  uniteId,
}: {
  unites: UniteOpt[];
  uniteId?: string;
}) {
  return (
    <label className="field" htmlFor="uniteId">
      <span className="field__label">Unité responsable *</span>
      <select
        id="uniteId"
        name="uniteId"
        required
        defaultValue={uniteId ?? unites[0]?.id ?? ""}
      >
        {unites.map((u) => (
          <option key={u.id} value={u.id}>
            {u.code} — {u.nom}
          </option>
        ))}
      </select>
      <span className="field__hint">
        Sélection depuis le référentiel — modifiable après création.
      </span>
    </label>
  );
}
