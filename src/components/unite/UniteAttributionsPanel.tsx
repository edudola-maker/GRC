import {
  ConfirmDeleteButton,
} from "@/components/FormControls";
import {
  createAttribution,
  deleteAttribution,
  updateAttribution,
} from "@/app/unite/actions";

export type AttributionItem = {
  id: string;
  titre: string;
  description: string | null;
  ordre: number;
  actif: boolean;
};

/**
 * Missions / attributions institutionnelles de l’unité (≠ Mission d’assurance).
 */
export function UniteAttributionsPanel({
  attributions,
  editable,
}: {
  attributions: AttributionItem[];
  editable: boolean;
}) {
  const actifs = attributions.filter((a) => a.actif);

  if (!editable) {
    if (actifs.length === 0) {
      return (
        <p className="empty">
          Aucune mission / attribution renseignée pour cette unité.
        </p>
      );
    }
    return (
      <ul className="unite-attribution-list">
        {actifs.map((a) => (
          <li key={a.id} className="unite-attribution-card">
            <strong className="unite-attribution-card__titre">{a.titre}</strong>
            {a.description ? (
              <p className="unite-attribution-card__desc">{a.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="unite-attribution-edit">
      {attributions.length === 0 ? (
        <p className="empty">Aucune attribution — ajoutez-en ci-dessous.</p>
      ) : (
        <ul className="unite-attribution-list unite-attribution-list--edit">
          {attributions.map((a) => (
            <li
              key={a.id}
              className={`unite-attribution-card${a.actif ? "" : " is-inactive"}`}
            >
              <form action={updateAttribution} className="entity-form">
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="sectionKey" value="ATTRIBUTIONS" />
                <label className="field" htmlFor={`attr-titre-${a.id}`}>
                  <span className="field__label">Titre *</span>
                  <input
                    id={`attr-titre-${a.id}`}
                    name="titre"
                    required
                    defaultValue={a.titre}
                  />
                </label>
                <label className="field" htmlFor={`attr-desc-${a.id}`}>
                  <span className="field__label">Description</span>
                  <textarea
                    id={`attr-desc-${a.id}`}
                    name="description"
                    rows={2}
                    defaultValue={a.description ?? ""}
                  />
                </label>
                <div className="form-grid">
                  <label className="field" htmlFor={`attr-ordre-${a.id}`}>
                    <span className="field__label">Ordre</span>
                    <input
                      id={`attr-ordre-${a.id}`}
                      name="ordre"
                      type="number"
                      min={0}
                      defaultValue={a.ordre}
                    />
                  </label>
                  <label className="check-field" style={{ alignSelf: "end" }}>
                    <input
                      type="checkbox"
                      name="actif"
                      value="1"
                      defaultChecked={a.actif}
                    />
                    Active
                  </label>
                </div>
                <div className="form-actions" style={{ marginTop: "0.35rem" }}>
                  <button type="submit" className="btn btn--ghost">
                    Enregistrer
                  </button>
                </div>
              </form>
              <div className="form-actions" style={{ marginTop: "0.25rem" }}>
                <ConfirmDeleteButton
                  action={deleteAttribution}
                  id={a.id}
                  confirmMessage="Désactiver cette attribution ?"
                  label="Désactiver"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        action={createAttribution}
        className="entity-form"
        style={{ marginTop: "1rem" }}
      >
        <input type="hidden" name="sectionKey" value="ATTRIBUTIONS" />
        <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>
          Nouvelle attribution
        </h4>
        <label className="field" htmlFor="attr-new-titre">
          <span className="field__label">Titre *</span>
          <input id="attr-new-titre" name="titre" required />
        </label>
        <label className="field" htmlFor="attr-new-desc">
          <span className="field__label">Description</span>
          <textarea id="attr-new-desc" name="description" rows={2} />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn">
            Ajouter
          </button>
        </div>
      </form>
    </div>
  );
}
