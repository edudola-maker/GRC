"use client";

import Link from "next/link";
import { SubmitButton } from "@/components/FormControls";
import {
  linkModeleTacheProcessus,
  unlinkModeleTacheProcessus,
} from "@/app/modeles-taches/actions";

export type ProcessusOpt = { id: string; code: string; nom: string };

export type ModeleProcessusLink = {
  id: string;
  processus: ProcessusOpt;
};

export function ModeleTacheProcessusPanel({
  modeleTacheId,
  links,
  candidats,
  editable,
}: {
  modeleTacheId: string;
  links: ModeleProcessusLink[];
  candidats: ProcessusOpt[];
  editable: boolean;
}) {
  const linkedIds = new Set(links.map((l) => l.processus.id));
  const disponibles = candidats.filter((c) => !linkedIds.has(c.id));

  return (
    <div className="modele-processus-panel">
      {!editable ? (
        <p className="muted" style={{ marginTop: 0 }}>
          Processus auxquels ce modèle peut s&apos;appliquer. Relation dédiée
          (≠ Éléments associés).
        </p>
      ) : (
        <p className="muted" style={{ marginTop: 0 }}>
          Liez ou retirez des processus, puis finalisez la box.
        </p>
      )}

      {links.length === 0 ? (
        <p className="empty">Aucun processus associé.</p>
      ) : (
        <ul className="link-list">
          {links.map((l) => (
            <li key={l.id} className="link-list__row">
              <Link href={`/processus/${l.processus.id}`}>
                {l.processus.code} — {l.processus.nom}
              </Link>
              {editable ? (
                <form action={unlinkModeleTacheProcessus}>
                  <input
                    type="hidden"
                    name="modeleTacheId"
                    value={modeleTacheId}
                  />
                  <input type="hidden" name="id" value={l.id} />
                  <SubmitButton variant="ghost" pendingLabel="…">
                    Retirer
                  </SubmitButton>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {editable ? (
        disponibles.length === 0 ? (
          <p className="muted">Tous les processus actifs sont déjà liés.</p>
        ) : (
          <form action={linkModeleTacheProcessus} className="entity-form">
            <input type="hidden" name="modeleTacheId" value={modeleTacheId} />
            <label className="field" htmlFor="processusId">
              <span className="field__label">Ajouter un processus</span>
              <select id="processusId" name="processusId" required>
                <option value="">— Choisir —</option>
                {disponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.nom}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-actions">
              <SubmitButton>Associer</SubmitButton>
            </div>
          </form>
        )
      ) : null}
    </div>
  );
}
