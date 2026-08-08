"use client";

import { SubmitButton } from "@/components/FormControls";
import {
  addTacheChecklistItem,
  deleteTacheChecklistItem,
  moveTacheChecklistItem,
  toggleTacheChecklistItem,
  updateTacheChecklistItem,
} from "@/app/taches/actions";

export type TacheChecklistItemVue = {
  id: string;
  libelle: string;
  ordre: number;
  fait: boolean;
  faitParNom?: string | null;
  faitLeLabel?: string | null;
};

/**
 * Checklist d’occurrence d’une Tâche.
 * Consultation : cocher / décocher (exécution).
 * Mode Modifier : renommer, ajouter, supprimer, réordonner (structure).
 */
export function TacheChecklistPanel({
  tacheId,
  items,
  structureEditable,
}: {
  tacheId: string;
  items: TacheChecklistItemVue[];
  structureEditable: boolean;
}) {
  const sorted = [...items].sort((a, b) => a.ordre - b.ordre);
  const faits = sorted.filter((i) => i.fait).length;

  return (
    <div className="tache-checklist">
      {!structureEditable ? (
        <p className="muted" style={{ marginTop: 0 }}>
          Cochez les étapes au fil de l&apos;exécution. Pour modifier la
          structure (renommer, ajouter, supprimer, réordonner), utilisez{" "}
          <strong>Modifier</strong>.
        </p>
      ) : (
        <p className="muted" style={{ marginTop: 0 }}>
          Mode structure : renommez, ajoutez, supprimez ou réordonnez les
          étapes. Le cochage reste disponible en consultation.
        </p>
      )}

      {sorted.length > 0 ? (
        <p className="muted tache-checklist__progress">
          {faits} / {sorted.length} étape{sorted.length === 1 ? "" : "s"} faite
          {faits === 1 ? "" : "s"}
        </p>
      ) : null}

      {sorted.length === 0 ? (
        <p className="empty">
          Aucune étape
          {structureEditable
            ? " — ajoutez la première ci-dessous."
            : " — passez en Modifier pour en créer, ou créez la tâche depuis un modèle."}
        </p>
      ) : (
        <ul className="tache-checklist__list">
          {sorted.map((item, index) => {
            const num = String(index + 1).padStart(2, "0");
            return (
              <li
                key={item.id}
                className={
                  item.fait
                    ? "tache-checklist__row tache-checklist__row--fait"
                    : "tache-checklist__row"
                }
              >
                {!structureEditable ? (
                  <form
                    action={toggleTacheChecklistItem}
                    className="tache-checklist__toggle"
                  >
                    <input type="hidden" name="tacheId" value={tacheId} />
                    <input type="hidden" name="id" value={item.id} />
                    <label className="tache-checklist__check">
                      <input
                        type="checkbox"
                        name="fait"
                        value="1"
                        defaultChecked={item.fait}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                      />
                      <span className="tache-checklist__num">{num}</span>
                      <span className="tache-checklist__label">
                        {item.libelle}
                      </span>
                    </label>
                    {item.fait && item.faitParNom ? (
                      <span className="muted tache-checklist__meta">
                        {item.faitParNom}
                        {item.faitLeLabel ? ` · ${item.faitLeLabel}` : ""}
                      </span>
                    ) : null}
                    <noscript>
                      <SubmitButton variant="ghost" pendingLabel="…">
                        OK
                      </SubmitButton>
                    </noscript>
                  </form>
                ) : (
                  <>
                    <span className="tache-checklist__num">{num}</span>
                    <form
                      action={updateTacheChecklistItem}
                      className="processus-etapes__rename"
                    >
                      <input type="hidden" name="tacheId" value={tacheId} />
                      <input type="hidden" name="id" value={item.id} />
                      <input
                        name="libelle"
                        defaultValue={item.libelle}
                        required
                        aria-label={`Libellé étape ${num}`}
                      />
                      <SubmitButton variant="ghost" pendingLabel="…">
                        OK
                      </SubmitButton>
                    </form>
                    <div className="processus-etapes__actions">
                      <form action={moveTacheChecklistItem}>
                        <input type="hidden" name="tacheId" value={tacheId} />
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="direction" value="up" />
                        <SubmitButton variant="ghost" pendingLabel="…">
                          Monter
                        </SubmitButton>
                      </form>
                      <form action={moveTacheChecklistItem}>
                        <input type="hidden" name="tacheId" value={tacheId} />
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="direction" value="down" />
                        <SubmitButton variant="ghost" pendingLabel="…">
                          Descendre
                        </SubmitButton>
                      </form>
                      <form action={deleteTacheChecklistItem}>
                        <input type="hidden" name="tacheId" value={tacheId} />
                        <input type="hidden" name="id" value={item.id} />
                        <SubmitButton variant="danger" pendingLabel="…">
                          Supprimer
                        </SubmitButton>
                      </form>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {structureEditable ? (
        <form
          action={addTacheChecklistItem}
          className="entity-form processus-etapes__add"
        >
          <input type="hidden" name="tacheId" value={tacheId} />
          <label className="field" htmlFor="nouvelle-etape-tache">
            <span className="field__label">Nouvelle étape</span>
            <input
              id="nouvelle-etape-tache"
              name="libelle"
              required
              placeholder="Ex. Vérifier les preuves"
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
