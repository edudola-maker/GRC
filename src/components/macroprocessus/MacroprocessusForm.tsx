"use client";

import { useState } from "react";
import { BtnLink } from "@/components/ui";
import { SubmitButton } from "@/components/FormControls";

type UserOpt = { id: string; nom: string };
type UniteOpt = { id: string; nom: string; code: string };

export type MacroprocessusFormValues = {
  id?: string;
  code?: string;
  nom?: string;
  description?: string | null;
  responsableId?: string | null;
  ordre?: number;
  uniteId?: string;
  applicableUniteIds?: string[];
};

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field" htmlFor={htmlFor}>
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

export function MacroprocessusForm({
  action,
  users,
  unites,
  values,
  cancelHref,
  submitLabel,
  suggestedCode,
  defaultUniteId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  unites: UniteOpt[];
  values?: MacroprocessusFormValues;
  cancelHref: string;
  submitLabel: string;
  suggestedCode?: string;
  /** Unité propriétaire par défaut (création). */
  defaultUniteId?: string;
}) {
  const initialUniteId =
    values?.uniteId ?? defaultUniteId ?? unites[0]?.id ?? "";
  const [ownerUniteId, setOwnerUniteId] = useState(initialUniteId);
  const applicables = new Set(values?.applicableUniteIds ?? []);
  const autresUnites = unites.filter((u) => u.id !== ownerUniteId);

  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="form-grid">
        <Field
          label="Code *"
          htmlFor="code"
          hint="Proposé automatiquement — modifiable (MAC-0001)"
        >
          <input
            id="code"
            name="code"
            required
            defaultValue={values?.code ?? suggestedCode ?? ""}
          />
        </Field>
        <Field label="Nom *" htmlFor="nom">
          <input
            id="nom"
            name="nom"
            required
            defaultValue={values?.nom ?? ""}
          />
        </Field>
        <Field label="Unité propriétaire *" htmlFor="uniteId">
          <select
            id="uniteId"
            name="uniteId"
            required
            value={ownerUniteId}
            onChange={(e) => setOwnerUniteId(e.target.value)}
          >
            {unites.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} — {u.nom}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Responsable" htmlFor="responsableId">
          <select
            id="responsableId"
            name="responsableId"
            defaultValue={values?.responsableId ?? ""}
          >
            <option value="">— Non renseigné —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nom}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Ordre"
          htmlFor="ordre"
          hint="Ordre d’affichage dans l’arborescence"
        >
          <input
            id="ordre"
            name="ordre"
            type="number"
            min={0}
            defaultValue={values?.ordre ?? 0}
          />
        </Field>
      </div>

      <Field
        label="Description / finalité"
        htmlFor="description"
        hint="Narratif : à quoi sert cette famille d’activités ?"
      >
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={values?.description ?? ""}
        />
      </Field>

      <fieldset className="field">
        <legend className="field__label">Unités applicables</legend>
        <p className="field__hint" style={{ marginTop: 0 }}>
          Unités pour lesquelles ce macroprocessus est visible (hors unité
          propriétaire).
        </p>
        {autresUnites.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Aucune autre unité active.
          </p>
        ) : (
          <ul
            className="check-list"
            style={{ listStyle: "none", padding: 0, margin: 0 }}
          >
            {autresUnites.map((u) => (
              <li key={u.id}>
                <label className="check-field">
                  <input
                    type="checkbox"
                    name="applicableUniteIds"
                    value={u.id}
                    defaultChecked={applicables.has(u.id)}
                  />
                  {u.code} — {u.nom}
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={cancelHref} variant="ghost">
          Annuler
        </BtnLink>
      </div>
    </form>
  );
}
