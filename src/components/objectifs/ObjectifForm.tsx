import { BtnLink } from "@/components/ui";
import { SubmitButton } from "@/components/FormControls";
import { FormSection } from "@/components/module/FormSection";
import { SectionSaveActions } from "@/components/module/EditableSection";
import {
  PRIORITE_OPTIONS,
  STATUT_OBJECTIF_OPTIONS,
} from "@/lib/catalog";
import { toDateInputValue } from "@/lib/form";

type UserOpt = { id: string; nom: string };
type AttributionOpt = { id: string; titre: string };

export type ObjectifValues = {
  id?: string;
  intitule?: string;
  description?: string | null;
  cible?: string | null;
  progression?: number | null;
  progressionMode?: string | null;
  annee?: number;
  responsableId?: string;
  statut?: string;
  priorite?: string;
  dateEcheance?: Date | string | null;
  smartSpecifique?: boolean;
  smartMesurable?: boolean;
  smartAtteignable?: boolean;
  smartRealiste?: boolean;
  smartTemporel?: boolean;
  attributionIds?: string[];
};

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field" htmlFor={htmlFor}>
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

export function ObjectifForm({
  action,
  users,
  attributions = [],
  values,
  cancelHref,
  submitLabel,
  section = "ALL",
  draftActions = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  attributions?: AttributionOpt[];
  values?: ObjectifValues;
  cancelHref: string;
  submitLabel: string;
  section?: "ALL" | "INFOS_GENERALES";
  draftActions?: boolean;
}) {
  const anneeDefaut = values?.annee ?? new Date().getFullYear();
  const selectedAttributions = new Set(values?.attributionIds ?? []);

  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {section !== "ALL" ? (
        <input type="hidden" name="sectionKey" value={section} />
      ) : null}

      <FormSection title="Objectif" defaultOpen>
        <Field label="Intitulé *" htmlFor="intitule">
          <input
            id="intitule"
            name="intitule"
            required
            defaultValue={values?.intitule ?? ""}
            placeholder="Ex. Renforcer la surveillance du SCI"
          />
        </Field>
        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={values?.description ?? ""}
          />
        </Field>
        <Field
          label="Cible"
          htmlFor="cible"
          hint="Résultat attendu sur la période (ex. 8 audits en 2027)."
        >
          <input
            id="cible"
            name="cible"
            defaultValue={values?.cible ?? ""}
            placeholder="Ex. 8 audits réalisés"
          />
        </Field>
        <div className="form-grid">
          <Field label="Année / période *" htmlFor="annee">
            <input
              id="annee"
              name="annee"
              type="number"
              required
              min={2000}
              max={2100}
              defaultValue={anneeDefaut}
            />
          </Field>
          <Field
            label="Progression %"
            htmlFor="progression"
            hint="0–100 — état d’avancement de l’objectif (≠ mission permanente)."
          >
            <input
              id="progression"
              name="progression"
              type="number"
              min={0}
              max={100}
              defaultValue={values?.progression ?? 0}
            />
          </Field>
          <Field label="Mode de progression" htmlFor="progressionMode">
            <select
              id="progressionMode"
              name="progressionMode"
              defaultValue={values?.progressionMode ?? "MANUELLE"}
            >
              <option value="MANUELLE">Manuelle</option>
              <option value="AUTOMATIQUE">Automatique (liens)</option>
            </select>
          </Field>
          <Field label="Échéance" htmlFor="dateEcheance">
            <input
              id="dateEcheance"
              name="dateEcheance"
              type="date"
              defaultValue={toDateInputValue(values?.dateEcheance)}
            />
          </Field>
          <Field label="Responsable *" htmlFor="responsableId">
            <select
              id="responsableId"
              name="responsableId"
              required
              defaultValue={values?.responsableId ?? users[0]?.id}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statut" htmlFor="statut">
            <select
              id="statut"
              name="statut"
              defaultValue={values?.statut ?? "EN_COURS"}
            >
              {STATUT_OBJECTIF_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priorité" htmlFor="priorite">
            <select
              id="priorite"
              name="priorite"
              defaultValue={values?.priorite ?? "MOYENNE"}
            >
              {PRIORITE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Critères SMART" defaultOpen={false}>
        <p className="muted" style={{ marginTop: 0 }}>
          Assistant léger — cochez les critères couverts (pas de prose
          obligatoire).
        </p>
        <div className="checkbox-list">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="smartSpecifique"
              value="1"
              defaultChecked={values?.smartSpecifique ?? false}
            />{" "}
            Spécifique
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="smartMesurable"
              value="1"
              defaultChecked={values?.smartMesurable ?? false}
            />{" "}
            Mesurable
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="smartAtteignable"
              value="1"
              defaultChecked={values?.smartAtteignable ?? false}
            />{" "}
            Atteignable
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="smartRealiste"
              value="1"
              defaultChecked={values?.smartRealiste ?? false}
            />{" "}
            Réaliste
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="smartTemporel"
              value="1"
              defaultChecked={values?.smartTemporel ?? false}
            />{" "}
            Temporel
          </label>
        </div>
      </FormSection>

      {attributions.length > 0 ? (
        <FormSection
          title="Attributions / missions institutionnelles"
          defaultOpen={false}
        >
          <p className="muted" style={{ marginTop: 0 }}>
            Lien vers les missions permanentes de l’unité (UniteAttribution).
          </p>
          <div className="checkbox-list">
            {attributions.map((a) => (
              <label key={a.id} className="checkbox-label">
                <input
                  type="checkbox"
                  name="attributionIds"
                  value={a.id}
                  defaultChecked={selectedAttributions.has(a.id)}
                />{" "}
                {a.titre}
              </label>
            ))}
          </div>
        </FormSection>
      ) : null}

      {draftActions ? (
        <SectionSaveActions
          baseHref={cancelHref}
          sectionKey={section !== "ALL" ? section : undefined}
          cancelHref={cancelHref}
          finalizeLabel={submitLabel}
        />
      ) : (
        <div className="form-actions">
          <SubmitButton>{submitLabel}</SubmitButton>
          <BtnLink href={cancelHref} variant="ghost" scroll={false}>
            Annuler
          </BtnLink>
        </div>
      )}
    </form>
  );
}
