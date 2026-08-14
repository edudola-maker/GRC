"use client";

import { SubmitButton } from "@/components/FormControls";
import {
  addProcessusRaciLigne,
  addProcessusRaciParticipant,
  deleteProcessusRaciLigne,
  initProcessusRaciFromEtapes,
  removeProcessusRaciParticipant,
  updateProcessusRaciLigne,
} from "@/app/processus/actions";
import { ROLE_RACI_OPTIONS } from "@/lib/catalog";
import { ROLE_RACI_LABELS } from "@/lib/labels";

export type RaciParticipant = {
  id: string;
  role: "R" | "A" | "C" | "I";
  utilisateurId: string | null;
  utilisateurNom: string | null;
};

export type RaciLigne = {
  id: string;
  activite: string;
  etapeId: string | null;
  ordre: number;
  participants: RaciParticipant[];
};

type UserOpt = { id: string; nom: string };
type EtapeOpt = { id: string; libelle: string };

const ROLES = ["R", "A", "C", "I"] as const;

function cellsForRole(ligne: RaciLigne, role: (typeof ROLES)[number]) {
  return ligne.participants.filter((p) => p.role === role);
}

export function ProcessusRaciPanel({
  processusId,
  lignes,
  etapes,
  users,
  editable,
}: {
  processusId: string;
  lignes: RaciLigne[];
  etapes: EtapeOpt[];
  users: UserOpt[];
  editable: boolean;
}) {
  const sorted = [...lignes].sort((a, b) => a.ordre - b.ordre);

  return (
    <div className="raci-panel">
      <p className="muted" style={{ marginTop: 0 }}>
        Matrice facultative — un responsable principal peut suffire. Les
        personnes proviennent du référentiel Utilisateurs.
      </p>

      {sorted.length === 0 ? (
        <p className="empty">
          Aucune ligne RACI
          {editable
            ? " — ajoutez une activité ou initialisez depuis les étapes."
            : "."}
        </p>
      ) : (
        <div className="raci-table-wrap">
          <table className="raci-table">
            <thead>
              <tr>
                <th>Activité / étape</th>
                {ROLES.map((r) => (
                  <th key={r} title={ROLE_RACI_LABELS[r]}>
                    {r}
                  </th>
                ))}
                {editable ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {sorted.map((ligne) => (
                <tr key={ligne.id}>
                  <td>
                    {editable ? (
                      <form
                        action={updateProcessusRaciLigne}
                        className="raci-rename"
                      >
                        <input type="hidden" name="id" value={ligne.id} />
                        <input
                          type="hidden"
                          name="processusId"
                          value={processusId}
                        />
                        <input
                          name="activite"
                          defaultValue={ligne.activite}
                          required
                          aria-label="Activité"
                        />
                        <SubmitButton variant="ghost">OK</SubmitButton>
                      </form>
                    ) : (
                      <strong>{ligne.activite}</strong>
                    )}
                    {editable ? (
                      <form
                        action={addProcessusRaciParticipant}
                        className="raci-add-part"
                      >
                        <input type="hidden" name="ligneId" value={ligne.id} />
                        <input
                          type="hidden"
                          name="processusId"
                          value={processusId}
                        />
                        <select name="role" defaultValue="R" aria-label="Rôle">
                          {ROLE_RACI_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.value}
                            </option>
                          ))}
                        </select>
                        <select
                          name="utilisateurId"
                          required
                          defaultValue=""
                          aria-label="Personne"
                        >
                          <option value="" disabled>
                            Collaborateur…
                          </option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nom}
                            </option>
                          ))}
                        </select>
                        <SubmitButton variant="ghost">+</SubmitButton>
                      </form>
                    ) : null}
                  </td>
                  {ROLES.map((role) => {
                    const parts = cellsForRole(ligne, role);
                    return (
                      <td key={role}>
                        {parts.length === 0 ? (
                          <span className="muted">—</span>
                        ) : (
                          <ul className="raci-people">
                            {parts.map((p) => (
                              <li key={p.id}>
                                {p.utilisateurNom ?? "—"}
                                {editable ? (
                                  <form
                                    action={removeProcessusRaciParticipant}
                                    className="inline-form"
                                  >
                                    <input type="hidden" name="id" value={p.id} />
                                    <input
                                      type="hidden"
                                      name="processusId"
                                      value={processusId}
                                    />
                                    <button
                                      type="submit"
                                      className="btn-link"
                                      title="Retirer"
                                    >
                                      ×
                                    </button>
                                  </form>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    );
                  })}
                  {editable ? (
                    <td>
                      <form action={deleteProcessusRaciLigne}>
                        <input type="hidden" name="id" value={ligne.id} />
                        <input
                          type="hidden"
                          name="processusId"
                          value={processusId}
                        />
                        <SubmitButton variant="ghost">Suppr.</SubmitButton>
                      </form>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editable ? (
        <div className="raci-edit-actions">
          {etapes.length > 0 ? (
            <form action={initProcessusRaciFromEtapes}>
              <input type="hidden" name="processusId" value={processusId} />
              <SubmitButton variant="ghost">
                Initialiser depuis les étapes
              </SubmitButton>
            </form>
          ) : null}
          <form action={addProcessusRaciLigne} className="raci-add-ligne">
            <input type="hidden" name="processusId" value={processusId} />
            <select name="etapeId" defaultValue="">
              <option value="">Activité libre…</option>
              {etapes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.libelle}
                </option>
              ))}
            </select>
            <input
              name="activite"
              placeholder="Libellé d’activité"
              aria-label="Activité"
            />
            <SubmitButton>Ajouter la ligne</SubmitButton>
          </form>
        </div>
      ) : null}
    </div>
  );
}
