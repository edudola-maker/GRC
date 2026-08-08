"use client";

import { useMemo, useState } from "react";
import { SubmitButton } from "@/components/FormControls";
import {
  addMissionMembre,
  removeMissionMembre,
  setMissionMembreRoles,
} from "@/app/audits/actions";
import { deriveInitiales } from "@/lib/initiales";

export type MissionEquipeMembre = {
  id: string;
  utilisateurId: string;
  nom: string;
  initiales: string;
  roleIds: string[];
  roleLabels: string[];
};

export function MissionEquipePanel({
  missionId,
  membres,
  roles,
  utilisateurs,
  editable,
}: {
  missionId: string;
  membres: MissionEquipeMembre[];
  roles: { id: string; code: string; libelle: string }[];
  utilisateurs: { id: string; nom: string; initiales: string | null }[];
  editable: boolean;
}) {
  const memberIds = useMemo(
    () => new Set(membres.map((m) => m.utilisateurId)),
    [membres],
  );
  const disponibles = utilisateurs.filter((u) => !memberIds.has(u.id));
  const [userId, setUserId] = useState(disponibles[0]?.id ?? "");
  const [roleIds, setRoleIds] = useState<string[]>(
    roles[0] ? [roles[0].id] : [],
  );

  return (
    <div className="mission-equipe">
      {membres.length === 0 ? (
        <p className="empty">Aucun membre dans l&apos;équipe.</p>
      ) : (
        <ul className="mission-equipe__list">
          {membres.map((m) => (
            <li key={m.id} className="mission-equipe__row">
              <span className="initiales-badge" title={m.nom}>
                {m.initiales}
              </span>
              <div className="mission-equipe__meta">
                <strong>{m.nom}</strong>
                <span className="muted">
                  {m.roleLabels.length
                    ? m.roleLabels.join(" · ")
                    : "Aucun rôle"}
                </span>
              </div>
              {editable ? (
                <div className="mission-equipe__actions">
                  <form action={setMissionMembreRoles} className="mission-equipe__roles">
                    <input type="hidden" name="missionId" value={missionId} />
                    <input type="hidden" name="membreId" value={m.id} />
                    {roles.map((r) => (
                      <label key={r.id} className="mission-equipe__role-check">
                        <input
                          type="checkbox"
                          name="roleIds"
                          value={r.id}
                          defaultChecked={m.roleIds.includes(r.id)}
                        />
                        {r.libelle}
                      </label>
                    ))}
                    <SubmitButton variant="ghost" pendingLabel="…">
                      Mettre à jour les rôles
                    </SubmitButton>
                  </form>
                  <form action={removeMissionMembre}>
                    <input type="hidden" name="missionId" value={missionId} />
                    <input type="hidden" name="membreId" value={m.id} />
                    <button type="submit" className="btn btn--ghost">
                      Retirer
                    </button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {editable && disponibles.length > 0 ? (
        <form action={addMissionMembre} className="entity-form mission-equipe__add">
          <input type="hidden" name="missionId" value={missionId} />
          <div className="form-grid">
            <label className="field" htmlFor="utilisateurId">
              <span className="field__label">Ajouter un membre</span>
              <select
                id="utilisateurId"
                name="utilisateurId"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                {disponibles.map((u) => (
                  <option key={u.id} value={u.id}>
                    {(u.initiales ?? deriveInitiales(u.nom))} — {u.nom}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="mission-equipe__role-fieldset">
            <legend>Rôles dans la mission</legend>
            {roles.map((r) => (
              <label key={r.id} className="mission-equipe__role-check">
                <input
                  type="checkbox"
                  name="roleIds"
                  value={r.id}
                  checked={roleIds.includes(r.id)}
                  onChange={(e) => {
                    setRoleIds((prev) =>
                      e.target.checked
                        ? [...prev, r.id]
                        : prev.filter((id) => id !== r.id),
                    );
                  }}
                />
                {r.libelle}
              </label>
            ))}
          </fieldset>
          <div className="form-actions">
            <SubmitButton>Ajouter à l&apos;équipe</SubmitButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}
