import {
  ConfirmActionButton,
  SubmitButton,
} from "@/components/FormControls";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import {
  addNoteQuestion,
  createNoteTravail,
  createTacheDepuisNote,
  deleteNoteTravail,
  updateNoteLibres,
  updateNoteQuestion,
} from "@/app/notes/actions";
import { TYPE_NOTE_LABELS, type NoteListeItem } from "@/lib/notes";
import { formatDate } from "@/lib/labels";
import { formatUtilisateurNom } from "@/lib/session";

type UserOpt = { id: string; nom: string };

/**
 * Section Notes / Séances — espace de travail sur Projet, Conseil, Mission.
 * Distincte du Journal de bord et du journal système.
 */
export function NotesPanel({
  typeObjet,
  objetId,
  notes,
  users,
  canEdit,
  etapeMission,
  baseHref,
}: {
  typeObjet: "PROJET" | "CONSEIL" | "MISSION";
  objetId: string;
  notes: NoteListeItem[];
  users: UserOpt[];
  canEdit: boolean;
  /** Si défini, les nouvelles notes sont rattachées à cette étape Mission. */
  etapeMission?: string;
  baseHref: string;
}) {
  return (
    <CollapsibleSection
      title="Notes / Séances"
      badge={notes.length || undefined}
      defaultOpen
      id="NOTES"
    >
      <p className="muted" style={{ marginTop: 0 }}>
        Espace de travail — préparation de séances, questions, notes libres.
        Distinct du journal de bord métier.
      </p>

      {canEdit ? (
        <details className="inline-create" style={{ marginBottom: "1rem" }}>
          <summary className="btn btn--ghost" style={{ cursor: "pointer" }}>
            + Note
          </summary>
          <form action={createNoteTravail} className="entity-form" style={{ marginTop: "0.75rem" }}>
            <input type="hidden" name="typeObjet" value={typeObjet} />
            <input type="hidden" name="objetId" value={objetId} />
            <input type="hidden" name="retour" value={baseHref} />
            {etapeMission ? (
              <input type="hidden" name="etapeMission" value={etapeMission} />
            ) : null}
            <div className="form-grid form-grid--2">
              <label>
                Titre
                <input name="titre" required maxLength={200} />
              </label>
              <label>
                Date
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </label>
              <label>
                Type
                <select name="type" defaultValue="TRAVAIL">
                  <option value="TRAVAIL">Note</option>
                  <option value="SEANCE">Séance</option>
                </select>
              </label>
              <label>
                Participants internes
                <select name="participantIds" multiple size={3}>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nom}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Participants externes
              <input
                name="participantsExternes"
                placeholder="Noms séparés par virgule (audités, partenaires…)"
              />
            </label>
            <label>
              Notes libres
              <textarea name="notesLibres" rows={3} />
            </label>
            <SubmitButton>Créer la note</SubmitButton>
          </form>
        </details>
      ) : null}

      {notes.length === 0 ? (
        <p className="empty">Aucune note pour l’instant.</p>
      ) : (
        <ul className="notes-list">
          {notes.map((n) => (
            <li key={n.id} className="notes-list__item">
              <header className="notes-list__head">
                <strong>
                  {formatDate(n.date)} — {n.titre}
                </strong>
                <span className="tag tag--compact">
                  {TYPE_NOTE_LABELS[n.type]}
                </span>
                <span className="muted">
                  {formatUtilisateurNom(n.auteur)}
                </span>
              </header>

              {n.participants.length > 0 ? (
                <p className="muted" style={{ margin: "0.35rem 0" }}>
                  Participants :{" "}
                  {n.participants
                    .map((p) =>
                      p.utilisateur
                        ? formatUtilisateurNom(p.utilisateur)
                        : p.nomExterne,
                    )
                    .filter(Boolean)
                    .join(", ")}
                </p>
              ) : null}

              <div className="notes-list__questions">
                <strong className="notes-list__sub">Questions</strong>
                {n.questions.length === 0 ? (
                  <p className="muted">Aucune question.</p>
                ) : (
                  <ul>
                    {n.questions.map((q) => (
                      <li key={q.id}>
                        <div>{q.libelle}</div>
                        {canEdit ? (
                          <form action={updateNoteQuestion} className="entity-form entity-form--compact">
                            <input type="hidden" name="questionId" value={q.id} />
                            <input type="hidden" name="retour" value={baseHref} />
                            <textarea
                              name="reponse"
                              rows={2}
                              defaultValue={q.reponse ?? ""}
                              placeholder="Réponse / note"
                            />
                            <SubmitButton variant="ghost">Enregistrer</SubmitButton>
                          </form>
                        ) : q.reponse ? (
                          <p className="muted">{q.reponse}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
                {canEdit ? (
                  <form action={addNoteQuestion} className="form-inline" style={{ marginTop: "0.5rem" }}>
                    <input type="hidden" name="noteId" value={n.id} />
                    <input type="hidden" name="retour" value={baseHref} />
                    <input
                      name="libelle"
                      required
                      placeholder="Nouvelle question"
                      style={{ flex: 1 }}
                    />
                    <SubmitButton variant="ghost">+ Question</SubmitButton>
                  </form>
                ) : null}
              </div>

              <div className="notes-list__libres">
                <strong className="notes-list__sub">Notes libres</strong>
                {canEdit ? (
                  <form action={updateNoteLibres} className="entity-form entity-form--compact">
                    <input type="hidden" name="noteId" value={n.id} />
                    <input type="hidden" name="retour" value={baseHref} />
                    <textarea
                      name="notesLibres"
                      rows={3}
                      defaultValue={n.notesLibres ?? ""}
                    />
                    <SubmitButton variant="ghost">Enregistrer</SubmitButton>
                  </form>
                ) : (
                  <p>{n.notesLibres || "—"}</p>
                )}
              </div>

              {n.taches.length > 0 ? (
                <p className="muted">
                  Actions liées :{" "}
                  {n.taches.map((t) => t.titre).join(" · ")}
                </p>
              ) : null}

              {canEdit ? (
                <div className="notes-list__actions">
                  <details>
                    <summary className="btn btn--ghost">Créer une tâche</summary>
                    <form
                      action={createTacheDepuisNote}
                      className="entity-form"
                      style={{ marginTop: "0.5rem" }}
                    >
                      <input type="hidden" name="noteId" value={n.id} />
                      <input type="hidden" name="retour" value={baseHref} />
                      <label>
                        Titre
                        <input name="titre" required />
                      </label>
                      <label>
                        Responsable
                        <select name="responsableId" defaultValue={users[0]?.id}>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nom}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Échéance
                        <input type="date" name="dateEcheance" />
                      </label>
                      <label>
                        Charge (j.)
                        <input
                          name="chargeJours"
                          type="number"
                          step="0.25"
                          min="0"
                          placeholder="0,5"
                        />
                      </label>
                      <SubmitButton>Créer</SubmitButton>
                    </form>
                  </details>
                  <ConfirmActionButton
                    action={deleteNoteTravail}
                    id={n.id}
                    label="Supprimer"
                    confirmMessage="Supprimer cette note ?"
                    variant="danger"
                    fields={{ retour: baseHref, noteId: n.id }}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  );
}
