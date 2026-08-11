import { SubmitButton } from "@/components/FormControls";
import { BtnLink } from "@/components/ui";
import { FormSection } from "@/components/module/FormSection";
import { ECHELLE_RISQUE } from "@/lib/catalog";
import { toDateInputValue } from "@/lib/form";
import { documenterReevaluationRisque } from "@/app/risques/actions";

type Values = {
  id: string;
  probabilite: number;
  impact: number;
  probabiliteResiduelle: number | null;
  impactResiduel: number | null;
};

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field" htmlFor={htmlFor}>
      <span className="field__label">{label}</span>
      {children}
    </label>
  );
}

/** Formulaire court pour documenter un acte de réévaluation. */
export function RisqueReevaluationForm({
  values,
  cancelHref,
}: {
  values: Values;
  cancelHref: string;
}) {
  return (
    <form action={documenterReevaluationRisque} className="entity-form">
      <input type="hidden" name="id" value={values.id} />

      <FormSection title="Acte de réévaluation" defaultOpen>
        <p className="form-section__desc">
          Documente la revue même si les notes restent inchangées. Un
          changement de notes alimente aussi l’Historique.
        </p>

        <Field label="Date de réévaluation *" htmlFor="dateReevaluation">
          <input
            id="dateReevaluation"
            name="dateReevaluation"
            type="date"
            required
            defaultValue={toDateInputValue(new Date())}
          />
        </Field>

        <div className="form-grid">
          <Field label="Probabilité inhérente (1–5) *" htmlFor="probabilite">
            <select
              id="probabilite"
              name="probabilite"
              defaultValue={String(values.probabilite)}
            >
              {ECHELLE_RISQUE.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Impact inhérent (1–5) *" htmlFor="impact">
            <select
              id="impact"
              name="impact"
              defaultValue={String(values.impact)}
            >
              {ECHELLE_RISQUE.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Probabilité résiduelle (1–5)"
            htmlFor="probabiliteResiduelle"
          >
            <select
              id="probabiliteResiduelle"
              name="probabiliteResiduelle"
              defaultValue={
                values.probabiliteResiduelle != null
                  ? String(values.probabiliteResiduelle)
                  : ""
              }
            >
              <option value="">— (non renseigné)</option>
              {ECHELLE_RISQUE.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Impact résiduel (1–5)" htmlFor="impactResiduel">
            <select
              id="impactResiduel"
              name="impactResiduel"
              defaultValue={
                values.impactResiduel != null
                  ? String(values.impactResiduel)
                  : ""
              }
            >
              <option value="">— (non renseigné)</option>
              {ECHELLE_RISQUE.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Réflexion / commentaire *" htmlFor="commentaire">
          <textarea
            id="commentaire"
            name="commentaire"
            rows={4}
            required
            placeholder="Pourquoi le niveau est maintenu ou modifié…"
          />
        </Field>
      </FormSection>

      <div className="form-actions">
        <SubmitButton>Enregistrer la réévaluation</SubmitButton>
        <BtnLink href={cancelHref} variant="ghost">
          Annuler
        </BtnLink>
      </div>
    </form>
  );
}
