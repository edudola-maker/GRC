"use client";

import { SubmitButton } from "@/components/FormControls";
import {
  addModeleTacheEtape,
  deleteModeleTacheEtape,
  moveModeleTacheEtape,
  updateModeleTacheEtape,
} from "@/app/modeles-taches/actions";

export type ModeleTacheEtapeItem = {
  id: string;
  libelle: string;
  ordre: number;
};

export function ModeleTacheEtapesPanel({
  modeleTacheId,
  etapes,
  editable,
}: {
  modeleTacheId: string;
  etapes: ModeleTacheEtapeItem[];
  editable: boolean;
}) {
  const sorted = [...etapes].sort((a, b) => a.ordre - b.ordre);

  return (
    <div className="processus-etapes">
      {!editable ? (
        <p className="muted" style={{ marginTop: 0 }}>
          Checklist standard du modèle. Cliquez sur <strong>Modifier</strong>{" "}
          pour ajouter, renommer, supprimer ou réordonner les étapes.
        </p>
      ) : (
        <p className="muted" style={{ marginTop: 0 }}>
          Modifiez la checklist, puis <strong>Finaliser</strong> ou{" "}
          <strong>Enregistrer comme brouillon</strong>.
        </p>
      )}

      {sorted.length === 0 ? (
        <p className="empty">
          Aucune étape pour l&apos;instant
          {editable
            ? " — ajoutez la première ci-dessous."
            : " — passez en Modifier pour en créer."}
        </p>
      ) : (
        <ol className="processus-etapes__list">
          {sorted.map((e, index) => {
            const num = String(index + 1).padStart(2, "0");
            return (
              <li key={e.id} className="processus-etapes__row">
                <span className="processus-etapes__num">{num}</span>
                <span className="processus-etapes__sep" aria-hidden>
                  —
                </span>
                {editable ? (
                  <>
                    <form
                      action={updateModeleTacheEtape}
                      className="processus-etapes__rename"
                    >
                      <input
                        type="hidden"
                        name="modeleTacheId"
                        value={modeleTacheId}
                      />
                      <input type="hidden" name="id" value={e.id} />
                      <input
                        name="libelle"
                        defaultValue={e.libelle}
                        required
                        aria-label={`Libellé étape ${num}`}
                      />
                      <SubmitButton variant="ghost" pendingLabel="…">
                        OK
                      </SubmitButton>
                    </form>
                    <div className="processus-etapes__actions">
                      <form action={moveModeleTacheEtape}>
                        <input
                          type="hidden"
                          name="modeleTacheId"
                          value={modeleTacheId}
                        />
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="direction" value="up" />
                        <SubmitButton variant="ghost" pendingLabel="…">
                          Monter
                        </SubmitButton>
                      </form>
                      <form action={moveModeleTacheEtape}>
                        <input
                          type="hidden"
                          name="modeleTacheId"
                          value={modeleTacheId}
                        />
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="direction" value="down" />
                        <SubmitButton variant="ghost" pendingLabel="…">
                          Descendre
                        </SubmitButton>
                      </form>
                      <form action={deleteModeleTacheEtape}>
                        <input
                          type="hidden"
                          name="modeleTacheId"
                          value={modeleTacheId}
                        />
                        <input type="hidden" name="id" value={e.id} />
                        <SubmitButton variant="danger" pendingLabel="…">
                          Supprimer
                        </SubmitButton>
                      </form>
                    </div>
                  </>
                ) : (
                  <strong className="processus-etapes__label">{e.libelle}</strong>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {editable ? (
        <form
          action={addModeleTacheEtape}
          className="entity-form processus-etapes__add"
        >
          <input type="hidden" name="modeleTacheId" value={modeleTacheId} />
          <label className="field" htmlFor="nouvelle-etape-modele">
            <span className="field__label">Nouvelle étape</span>
            <input
              id="nouvelle-etape-modele"
              name="libelle"
              required
              placeholder="Ex. Créer le compte applicatif"
            />
          </label>
          <div className="form-actions">
            <SubmitButton>Ajouter l&apos;étape</SubmitButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}
