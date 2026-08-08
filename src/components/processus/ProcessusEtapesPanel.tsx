"use client";

import { SubmitButton } from "@/components/FormControls";
import {
  addProcessusEtape,
  deleteProcessusEtape,
  moveProcessusEtape,
  updateProcessusEtape,
} from "@/app/processus/actions";

export type ProcessusEtapeItem = {
  id: string;
  libelle: string;
  ordre: number;
};

export function ProcessusEtapesPanel({
  processusId,
  etapes,
  editable,
}: {
  processusId: string;
  etapes: ProcessusEtapeItem[];
  editable: boolean;
}) {
  const sorted = [...etapes].sort((a, b) => a.ordre - b.ordre);

  return (
    <div className="processus-etapes">
      {sorted.length === 0 ? (
        <p className="empty">
          Aucune étape. En mode Modifier, ajoutez la séquence du processus (ex.
          Planification → Substantif → …).
        </p>
      ) : (
        <ol className="processus-etapes__list">
          {sorted.map((e, index) => {
            const num = String(index + 1).padStart(2, "0");
            return (
              <li key={e.id} id={`etape-${e.id}`} className="processus-etapes__row">
                <span className="processus-etapes__num">{num}</span>
                {editable ? (
                  <>
                    <form
                      action={updateProcessusEtape}
                      className="processus-etapes__rename"
                    >
                      <input type="hidden" name="processusId" value={processusId} />
                      <input type="hidden" name="id" value={e.id} />
                      <input
                        name="libelle"
                        defaultValue={e.libelle}
                        required
                        aria-label={`Libellé étape ${num}`}
                      />
                      <SubmitButton variant="ghost" pendingLabel="…">
                        Renommer
                      </SubmitButton>
                    </form>
                    <div className="processus-etapes__actions">
                      <form action={moveProcessusEtape}>
                        <input type="hidden" name="processusId" value={processusId} />
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="direction" value="up" />
                        <SubmitButton
                          variant="ghost"
                          pendingLabel="…"
                          name="noop"
                          value="1"
                        >
                          ↑
                        </SubmitButton>
                      </form>
                      <form action={moveProcessusEtape}>
                        <input type="hidden" name="processusId" value={processusId} />
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="direction" value="down" />
                        <SubmitButton variant="ghost" pendingLabel="…">
                          ↓
                        </SubmitButton>
                      </form>
                      <form action={deleteProcessusEtape}>
                        <input type="hidden" name="processusId" value={processusId} />
                        <input type="hidden" name="id" value={e.id} />
                        <SubmitButton variant="danger" pendingLabel="…">
                          Supprimer
                        </SubmitButton>
                      </form>
                    </div>
                  </>
                ) : (
                  <strong>{e.libelle}</strong>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {editable ? (
        <form action={addProcessusEtape} className="entity-form" style={{ marginTop: "1rem" }}>
          <input type="hidden" name="processusId" value={processusId} />
          <label className="field" htmlFor="nouvelle-etape">
            <span className="field__label">Nouvelle étape</span>
            <input
              id="nouvelle-etape"
              name="libelle"
              required
              placeholder="Ex. Planification"
            />
          </label>
          <div className="form-actions">
            <SubmitButton>Ajouter l&apos;étape</SubmitButton>
          </div>
        </form>
      ) : null}

      {!editable && sorted.length > 0 ? (
        <p className="muted processus-etapes__flow">
          {sorted
            .map((e, i) => `${String(i + 1).padStart(2, "0")} ${e.libelle}`)
            .join(" → ")}
        </p>
      ) : null}
    </div>
  );
}
