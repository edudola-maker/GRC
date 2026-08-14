"use client";

import { SubmitButton } from "@/components/FormControls";
import {
  STATUT_ACTIF_IT_OPTIONS,
  TYPE_ACTIF_IT_OPTIONS,
} from "@/lib/catalog";
import { BtnLink } from "@/components/ui";

type UserOpt = { id: string; nom: string };

type Values = {
  id?: string;
  code?: string;
  nom?: string;
  type?: string;
  description?: string | null;
  responsableId?: string | null;
  statut?: string;
  fournisseur?: string | null;
  hebergement?: string | null;
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

export function ActifITForm({
  action,
  users,
  values,
  cancelHref,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: Values;
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="form-grid">
        {values?.id ? (
          <Field
            label="Code *"
            htmlFor="code"
            hint="Format AIT-0001 — préfixe générique Actif IT"
          >
            <input
              id="code"
              name="code"
              required
              defaultValue={values.code ?? ""}
            />
          </Field>
        ) : null}
        <Field label="Nom *" htmlFor="nom">
          <input
            id="nom"
            name="nom"
            required
            defaultValue={values?.nom ?? ""}
          />
        </Field>
        <Field label="Type" htmlFor="type">
          <select
            id="type"
            name="type"
            defaultValue={values?.type ?? "APPLICATION"}
          >
            {TYPE_ACTIF_IT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Statut" htmlFor="statut">
          <select
            id="statut"
            name="statut"
            defaultValue={values?.statut ?? "ACTIF"}
          >
            {STATUT_ACTIF_IT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Responsable / propriétaire" htmlFor="responsableId">
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
        <Field label="Fournisseur" htmlFor="fournisseur">
          <input
            id="fournisseur"
            name="fournisseur"
            defaultValue={values?.fournisseur ?? ""}
          />
        </Field>
        <Field label="Hébergement" htmlFor="hebergement">
          <input
            id="hebergement"
            name="hebergement"
            defaultValue={values?.hebergement ?? ""}
            placeholder="Ex. SaaS, on-premise, cloud interne…"
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={values?.description ?? ""}
        />
      </Field>

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={cancelHref} variant="ghost">
          Annuler
        </BtnLink>
      </div>
    </form>
  );
}
