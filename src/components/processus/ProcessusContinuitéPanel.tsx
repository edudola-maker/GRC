import Link from "next/link";
import { SubmitButton } from "@/components/FormControls";
import {
  addProcessusDependance,
  marquerRevueContinuité,
  removeProcessusDependance,
  upsertProcessusContinuité,
} from "@/app/processus/continuite-actions";
import {
  CRITICITE_CONTINUITE_OPTIONS,
  UNITE_DUREE_CONTINUITE_OPTIONS,
} from "@/lib/catalog";
import {
  CRITICITE_CONTINUITE_LABELS,
  UNITE_DUREE_CONTINUITE_LABELS,
  formatDate,
} from "@/lib/labels";
import { toDateInputValue } from "@/lib/form";

export type ContinuitéValues = {
  criticite: string | null;
  consequencesInterruption: string | null;
  mtpdValeur: number | null;
  mtpdUnite: string | null;
  rtoValeur: number | null;
  rtoUnite: string | null;
  rpoValeur: number | null;
  rpoUnite: string | null;
  periodesCritiques: string | null;
  modeDegradeMesures: string | null;
  commentaire: string | null;
  dateDerniereRevue: Date | null;
  dateProchaineRevue: Date | null;
};

type DepItem = { id: string; code: string; nom: string; lienId: string };
type ActifItem = { id: string; code: string; nom: string };
type PrcOpt = { id: string; label: string };

function formatDuree(v: number | null, u: string | null) {
  if (v == null || !u) return "—";
  return `${v} ${UNITE_DUREE_CONTINUITE_LABELS[u] ?? u}`;
}

function DureeInputs({
  label,
  valName,
  unitName,
  valeur,
  unite,
  optional,
}: {
  label: string;
  valName: string;
  unitName: string;
  valeur: number | null;
  unite: string | null;
  optional?: boolean;
}) {
  return (
    <div className="field">
      <span className="field__label">
        {label}
        {optional ? " (facultatif)" : ""}
      </span>
      <div className="duree-inputs">
        <input
          name={valName}
          type="number"
          min={0}
          defaultValue={valeur ?? ""}
          placeholder="Valeur"
        />
        <select name={unitName} defaultValue={unite ?? "JOURS"}>
          {UNITE_DUREE_CONTINUITE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function ProcessusContinuitéPanel({
  processusId,
  values,
  actifsLies,
  dependDe,
  dependants,
  processusOptions,
  editable,
}: {
  processusId: string;
  values: ContinuitéValues | null;
  actifsLies: ActifItem[];
  dependDe: DepItem[];
  dependants: DepItem[];
  processusOptions: PrcOpt[];
  editable: boolean;
}) {
  const v = values;

  if (!editable) {
    return (
      <div className="continuite-panel">
        {!v ? (
          <p className="empty">
            Aucune analyse de continuité documentée pour l’instant.
          </p>
        ) : (
          <dl className="kv">
            <div>
              <dt>Criticité</dt>
              <dd>
                {v.criticite
                  ? (CRITICITE_CONTINUITE_LABELS[v.criticite] ?? v.criticite)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Conséquences d’une interruption</dt>
              <dd>{v.consequencesInterruption ?? "—"}</dd>
            </div>
            <div>
              <dt>MTPD</dt>
              <dd>{formatDuree(v.mtpdValeur, v.mtpdUnite)}</dd>
            </div>
            <div>
              <dt>RTO</dt>
              <dd>{formatDuree(v.rtoValeur, v.rtoUnite)}</dd>
            </div>
            <div>
              <dt>RPO</dt>
              <dd>{formatDuree(v.rpoValeur, v.rpoUnite)}</dd>
            </div>
            <div>
              <dt>Périodes critiques</dt>
              <dd>{v.periodesCritiques ?? "—"}</dd>
            </div>
            <div>
              <dt>Mode dégradé / mesures</dt>
              <dd>{v.modeDegradeMesures ?? "—"}</dd>
            </div>
            <div>
              <dt>Commentaire</dt>
              <dd>{v.commentaire ?? "—"}</dd>
            </div>
            <div>
              <dt>Dernière revue</dt>
              <dd>{formatDate(v.dateDerniereRevue)}</dd>
            </div>
            <div>
              <dt>Prochaine revue</dt>
              <dd>{formatDate(v.dateProchaineRevue)}</dd>
            </div>
          </dl>
        )}

        <h4 className="continuite-panel__sub">Actifs IT (référentiel)</h4>
        {actifsLies.length === 0 ? (
          <p className="muted">Aucun actif IT lié — voir section Actifs IT.</p>
        ) : (
          <ul className="unite-activite__list">
            {actifsLies.map((a) => (
              <li key={a.id}>
                <Link href={`/actifs-it/${a.id}`}>
                  {a.code} — {a.nom}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <h4 className="continuite-panel__sub">Dépend de</h4>
        {dependDe.length === 0 ? (
          <p className="muted">Aucune dépendance processus.</p>
        ) : (
          <ul className="unite-activite__list">
            {dependDe.map((d) => (
              <li key={d.lienId}>
                <Link href={`/processus/${d.id}`}>
                  {d.code} — {d.nom}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {dependants.length > 0 ? (
          <>
            <h4 className="continuite-panel__sub">Processus dépendants</h4>
            <ul className="unite-activite__list">
              {dependants.map((d) => (
                <li key={d.lienId}>
                  <Link href={`/processus/${d.id}`}>
                    {d.code} — {d.nom}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="continuite-panel">
      <form action={upsertProcessusContinuité} className="entity-form">
        <input type="hidden" name="processusId" value={processusId} />
        <div className="form-grid">
          <label className="field" htmlFor="criticite">
            <span className="field__label">Criticité</span>
            <select
              id="criticite"
              name="criticite"
              defaultValue={v?.criticite ?? ""}
            >
              <option value="">—</option>
              {CRITICITE_CONTINUITE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <DureeInputs
            label="MTPD"
            valName="mtpdValeur"
            unitName="mtpdUnite"
            valeur={v?.mtpdValeur ?? null}
            unite={v?.mtpdUnite ?? null}
          />
          <DureeInputs
            label="RTO"
            valName="rtoValeur"
            unitName="rtoUnite"
            valeur={v?.rtoValeur ?? null}
            unite={v?.rtoUnite ?? null}
          />
          <DureeInputs
            label="RPO"
            valName="rpoValeur"
            unitName="rpoUnite"
            valeur={v?.rpoValeur ?? null}
            unite={v?.rpoUnite ?? null}
            optional
          />
          <label className="field" htmlFor="dateDerniereRevue">
            <span className="field__label">Dernière revue</span>
            <input
              id="dateDerniereRevue"
              name="dateDerniereRevue"
              type="date"
              defaultValue={toDateInputValue(v?.dateDerniereRevue)}
            />
          </label>
          <label className="field" htmlFor="dateProchaineRevue">
            <span className="field__label">Prochaine revue</span>
            <input
              id="dateProchaineRevue"
              name="dateProchaineRevue"
              type="date"
              defaultValue={toDateInputValue(v?.dateProchaineRevue)}
            />
          </label>
        </div>
        <label className="field" htmlFor="consequencesInterruption">
          <span className="field__label">Conséquences d’une interruption</span>
          <textarea
            id="consequencesInterruption"
            name="consequencesInterruption"
            rows={2}
            defaultValue={v?.consequencesInterruption ?? ""}
          />
        </label>
        <label className="field" htmlFor="periodesCritiques">
          <span className="field__label">Périodes critiques</span>
          <input
            id="periodesCritiques"
            name="periodesCritiques"
            defaultValue={v?.periodesCritiques ?? ""}
            placeholder="Ex. clôture annuelle, pics saisonniers"
          />
        </label>
        <label className="field" htmlFor="modeDegradeMesures">
          <span className="field__label">Mode dégradé / mesures</span>
          <textarea
            id="modeDegradeMesures"
            name="modeDegradeMesures"
            rows={3}
            defaultValue={v?.modeDegradeMesures ?? ""}
          />
        </label>
        <label className="field" htmlFor="commentaire">
          <span className="field__label">Commentaire / justification</span>
          <textarea
            id="commentaire"
            name="commentaire"
            rows={2}
            defaultValue={v?.commentaire ?? ""}
          />
        </label>
        <SubmitButton>Enregistrer l’analyse</SubmitButton>
      </form>

      <form
        action={marquerRevueContinuité}
        className="entity-form"
        style={{ marginTop: "0.85rem" }}
      >
        <input type="hidden" name="processusId" value={processusId} />
        <p className="muted" style={{ marginTop: 0 }}>
          Formaliser une revue sans modifier les valeurs :
        </p>
        <label className="field" htmlFor="commentaireRevue">
          <span className="field__label">Note de revue (optionnel)</span>
          <input
            id="commentaireRevue"
            name="commentaireRevue"
            placeholder="Analyse revue — aucun changement nécessaire"
            defaultValue="Analyse revue — aucun changement nécessaire"
          />
        </label>
        <SubmitButton variant="ghost">Marquer comme revue</SubmitButton>
      </form>

      <h4 className="continuite-panel__sub">Actifs IT liés</h4>
      <p className="muted">
        Source de vérité : section Actifs IT (pas de ressaisie ici).
      </p>
      {actifsLies.length === 0 ? (
        <p className="empty">Aucun.</p>
      ) : (
        <ul className="unite-activite__list">
          {actifsLies.map((a) => (
            <li key={a.id}>
              <Link href={`/actifs-it/${a.id}`}>
                {a.code} — {a.nom}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h4 className="continuite-panel__sub">Dépend de (processus amont)</h4>
      {dependDe.length === 0 ? (
        <p className="empty">Aucune dépendance.</p>
      ) : (
        <ul className="unite-activite__list">
          {dependDe.map((d) => (
            <li key={d.lienId}>
              <Link href={`/processus/${d.id}`}>
                {d.code} — {d.nom}
              </Link>
              <form action={removeProcessusDependance}>
                <input type="hidden" name="id" value={d.lienId} />
                <input type="hidden" name="processusId" value={processusId} />
                <SubmitButton variant="ghost">Retirer</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
      {processusOptions.length > 0 ? (
        <form action={addProcessusDependance} className="inline-add-form">
          <input type="hidden" name="processusId" value={processusId} />
          <select name="dependDeId" required defaultValue="">
            <option value="" disabled>
              Ajouter une dépendance…
            </option>
            {processusOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <SubmitButton>Lier</SubmitButton>
        </form>
      ) : null}

      {dependants.length > 0 ? (
        <>
          <h4 className="continuite-panel__sub">Processus dépendants</h4>
          <ul className="unite-activite__list">
            {dependants.map((d) => (
              <li key={d.lienId}>
                <Link href={`/processus/${d.id}`}>
                  {d.code} — {d.nom}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
