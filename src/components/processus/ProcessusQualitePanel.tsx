import { SubmitButton } from "@/components/FormControls";
import {
  createEcartQualite,
  createQualiteRevue,
  upsertProcessusQualite,
} from "@/app/processus/qualite-actions";
import { toDateInputValue } from "@/lib/form";
import {
  FREQUENCE_REVUE_QUALITE_LABELS,
  formatDate,
} from "@/lib/labels";

export type QualiteValues = {
  responsableRevueId: string | null;
  frequence: string;
  derniereRevue: Date | null;
  prochaineRevue: Date | null;
  confluenceUrl: string | null;
  confluenceAJour: boolean | null;
};

type UserOpt = { id: string; nom: string };

type RevueItem = {
  id: string;
  dateRevue: Date;
  responsableNom: string | null;
  commentaire: string | null;
  procedureConformePratique: boolean | null;
  pratiqueConformeProcedure: boolean | null;
  raciAJour: boolean | null;
  controlesPertinents: boolean | null;
  confluenceAJour: boolean | null;
  ecartsIdentifies: boolean | null;
  ameliorationProposee: boolean | null;
};

type EcartItem = {
  id: string;
  titre: string;
  description: string | null;
  statut: string;
  creeLe: Date;
};

function ouiNon(v: boolean | null | undefined) {
  if (v == null) return "—";
  return v ? "Oui" : "Non";
}

const QUEST_FIELDS: { name: string; label: string }[] = [
  {
    name: "procedureConformePratique",
    label: "La procédure est conforme à la pratique",
  },
  {
    name: "pratiqueConformeProcedure",
    label: "La pratique est conforme à la procédure",
  },
  { name: "raciAJour", label: "RACI à jour" },
  { name: "controlesPertinents", label: "Contrôles pertinents" },
  { name: "confluenceAJour", label: "Documentation Confluence à jour" },
  { name: "ecartsIdentifies", label: "Écarts identifiés" },
  { name: "ameliorationProposee", label: "Amélioration proposée" },
];

export function ProcessusQualitePanel({
  processusId,
  values,
  users,
  revues,
  ecarts,
}: {
  processusId: string;
  values: QualiteValues | null;
  users: UserOpt[];
  revues: RevueItem[];
  ecarts: EcartItem[];
}) {
  const v = values;

  return (
    <div className="continuite-panel" id="qualite">
      <h4 className="continuite-panel__sub">Paramètres qualité</h4>
      <form action={upsertProcessusQualite} className="entity-form">
        <input type="hidden" name="processusId" value={processusId} />
        <div className="form-grid">
          <label className="field" htmlFor="frequence">
            <span className="field__label">Fréquence de revue</span>
            <select
              id="frequence"
              name="frequence"
              defaultValue={v?.frequence ?? "ANNUELLE"}
            >
              {Object.entries(FREQUENCE_REVUE_QUALITE_LABELS).map(([val, lab]) => (
                <option key={val} value={val}>
                  {lab}
                </option>
              ))}
            </select>
          </label>
          <label className="field" htmlFor="responsableRevueId">
            <span className="field__label">Responsable de revue</span>
            <select
              id="responsableRevueId"
              name="responsableRevueId"
              defaultValue={v?.responsableRevueId ?? ""}
            >
              <option value="">—</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="field" htmlFor="derniereRevue">
            <span className="field__label">Dernière revue</span>
            <input
              id="derniereRevue"
              name="derniereRevue"
              type="date"
              defaultValue={toDateInputValue(v?.derniereRevue)}
            />
          </label>
          <label className="field" htmlFor="prochaineRevue">
            <span className="field__label">Prochaine revue</span>
            <input
              id="prochaineRevue"
              name="prochaineRevue"
              type="date"
              defaultValue={toDateInputValue(v?.prochaineRevue)}
            />
          </label>
        </div>
        <label className="field" htmlFor="confluenceUrl">
          <span className="field__label">URL Confluence</span>
          <input
            id="confluenceUrl"
            name="confluenceUrl"
            defaultValue={v?.confluenceUrl ?? ""}
            placeholder="https://…"
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="confluenceAJour"
            value="1"
            defaultChecked={v?.confluenceAJour === true}
          />{" "}
          Documentation Confluence à jour
        </label>
        <SubmitButton>Enregistrer les paramètres</SubmitButton>
      </form>

      <h4 className="continuite-panel__sub">Enregistrer une revue</h4>
      <form action={createQualiteRevue} className="entity-form">
        <input type="hidden" name="processusId" value={processusId} />
        <div className="form-grid">
          <label className="field" htmlFor="dateRevue">
            <span className="field__label">Date de revue</span>
            <input
              id="dateRevue"
              name="dateRevue"
              type="date"
              defaultValue={toDateInputValue(new Date())}
            />
          </label>
          <label className="field" htmlFor="responsableIdRevue">
            <span className="field__label">Responsable</span>
            <select
              id="responsableIdRevue"
              name="responsableId"
              defaultValue={v?.responsableRevueId ?? users[0]?.id ?? ""}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="field">
          <legend className="field__label">Questionnaire</legend>
          <div className="checkbox-list">
            {QUEST_FIELDS.map((q) => (
              <label key={q.name} className="checkbox-label">
                <input type="checkbox" name={q.name} value="1" />
                {q.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="field" htmlFor="commentaireRevue">
          <span className="field__label">Commentaire</span>
          <textarea id="commentaireRevue" name="commentaire" rows={2} />
        </label>
        <SubmitButton>Enregistrer la revue</SubmitButton>
      </form>

      {revues.length > 0 ? (
        <>
          <h4 className="continuite-panel__sub">Revues récentes</h4>
          <ul className="unite-activite__list">
            {revues.map((r) => (
              <li key={r.id}>
                <div>
                  <strong>{formatDate(r.dateRevue)}</strong>
                  {r.responsableNom ? (
                    <span className="muted"> · {r.responsableNom}</span>
                  ) : null}
                  <p
                    className="muted"
                    style={{ margin: "0.15rem 0 0", fontSize: "0.82rem" }}
                  >
                    Procédure↔pratique {ouiNon(r.procedureConformePratique)} ·
                    Pratique↔procédure {ouiNon(r.pratiqueConformeProcedure)} ·
                    RACI {ouiNon(r.raciAJour)} · Contrôles{" "}
                    {ouiNon(r.controlesPertinents)} · Écarts{" "}
                    {ouiNon(r.ecartsIdentifies)}
                  </p>
                  {r.commentaire ? (
                    <p style={{ margin: "0.2rem 0 0" }}>{r.commentaire}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h4 className="continuite-panel__sub">Écarts qualité</h4>
      {ecarts.length === 0 ? (
        <p className="empty">Aucun écart enregistré.</p>
      ) : (
        <ul className="unite-activite__list">
          {ecarts.map((e) => (
            <li key={e.id}>
              <div>
                <strong>{e.titre}</strong>
                <span className="muted">
                  {" "}
                  · {e.statut} · {formatDate(e.creeLe)}
                </span>
                {e.description ? (
                  <p style={{ margin: "0.2rem 0 0" }}>{e.description}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        action={createEcartQualite}
        className="entity-form"
        style={{ marginTop: "0.75rem" }}
      >
        <input type="hidden" name="processusId" value={processusId} />
        {revues[0] ? (
          <input type="hidden" name="revueId" value={revues[0].id} />
        ) : null}
        <label className="field" htmlFor="ecartTitre">
          <span className="field__label">Nouvel écart — titre</span>
          <input id="ecartTitre" name="titre" required placeholder="Écart…" />
        </label>
        <label className="field" htmlFor="ecartDesc">
          <span className="field__label">Description</span>
          <textarea id="ecartDesc" name="description" rows={2} />
        </label>
        <SubmitButton>Ajouter l’écart</SubmitButton>
      </form>
    </div>
  );
}
