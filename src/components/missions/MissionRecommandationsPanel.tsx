import {
  SubmitButton,
} from "@/components/FormControls";
import {
  createRecommandation,
  createTacheDepuisReco,
  deleteRecommandation,
  updateRecommandation,
} from "@/app/missions/actions";
import { STATUT_RECO_OPTIONS } from "@/lib/catalog";
import { toDateInputValue } from "@/lib/form";
import { formatDate, STATUT_RECO_LABELS } from "@/lib/labels";
import { RECO_STATUTS_CLOS } from "@/lib/mission-etapes";

type Reco = {
  id: string;
  code: string;
  titre: string;
  description: string | null;
  statut: string;
  dateEcheance: Date | null;
  responsable: { nom: string } | null;
};

export function MissionRecommandationsPanel({
  missionId,
  canEdit,
  editing,
  recommandations,
  users,
}: {
  missionId: string;
  canEdit: boolean;
  editing: boolean;
  recommandations: Reco[];
  users: { id: string; nom: string }[];
}) {
  return (
    <>
      <p className="muted" style={{ marginTop: 0 }}>
        Objets suivis <code>REC-xxxx</code> — cycle de vie indépendant de la
        clôture / archivage de la mission. Un constat peut exister sans
        recommandation ; une recommandation est autonome.
      </p>

      {editing && canEdit ? (
        <form
          action={createRecommandation}
          className="entity-form"
          style={{ marginBottom: "1.25rem" }}
        >
          <input type="hidden" name="missionId" value={missionId} />
          <label className="field" htmlFor="titre">
            <span className="field__label">Nouvelle recommandation *</span>
            <input
              id="titre"
              name="titre"
              required
              placeholder="Ex. Renforcer le contrôle des accès"
            />
          </label>
          <label className="field" htmlFor="description">
            <span className="field__label">Description</span>
            <textarea id="description" name="description" rows={2} />
          </label>
          <div className="form-grid">
            <label className="field" htmlFor="responsableId">
              <span className="field__label">Responsable</span>
              <select id="responsableId" name="responsableId" defaultValue="">
                <option value="">—</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" htmlFor="dateEcheance">
              <span className="field__label">Échéance</span>
              <input id="dateEcheance" name="dateEcheance" type="date" />
            </label>
          </div>
          <div className="form-actions">
            <SubmitButton>Ajouter la recommandation</SubmitButton>
          </div>
        </form>
      ) : null}

      {recommandations.length === 0 ? (
        <p className="empty">Aucune recommandation.</p>
      ) : (
        <ul className="entity-list">
          {recommandations.map((r) => (
            <li key={r.id} className="reco-block">
              <div className="entity-row entity-row--neutre">
                <div className="entity-row__main">
                  <strong>
                    {r.code} — {r.titre}
                  </strong>
                  <span className="entity-row__meta">
                    {STATUT_RECO_LABELS[r.statut]}
                    {r.responsable ? ` · ${r.responsable.nom}` : ""}
                    {r.dateEcheance ? ` · ${formatDate(r.dateEcheance)}` : ""}
                  </span>
                  {r.description ? (
                    <span className="entity-row__meta">{r.description}</span>
                  ) : null}
                </div>
              </div>
              {editing && canEdit ? (
                <div className="form-actions" style={{ marginTop: "0.5rem" }}>
                  <form action={createTacheDepuisReco}>
                    <input
                      type="hidden"
                      name="recommandationId"
                      value={r.id}
                    />
                    <SubmitButton variant="ghost">Créer une tâche</SubmitButton>
                  </form>
                  <form action={deleteRecommandation}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="missionId" value={missionId} />
                    <SubmitButton variant="danger">Archiver</SubmitButton>
                  </form>
                </div>
              ) : null}
              {editing &&
              canEdit &&
              !RECO_STATUTS_CLOS.has(r.statut) ? (
                <form
                  action={updateRecommandation}
                  className="entity-form"
                  style={{ marginTop: "0.65rem" }}
                >
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="missionId" value={missionId} />
                  <input type="hidden" name="titre" value={r.titre} />
                  <div className="form-grid">
                    <label className="field">
                      <span className="field__label">Statut</span>
                      <select name="statut" defaultValue={r.statut}>
                        {STATUT_RECO_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span className="field__label">Échéance</span>
                      <input
                        name="dateEcheance"
                        type="date"
                        defaultValue={toDateInputValue(r.dateEcheance)}
                      />
                    </label>
                  </div>
                  <div className="form-actions">
                    <SubmitButton variant="ghost">Mettre à jour</SubmitButton>
                  </div>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
