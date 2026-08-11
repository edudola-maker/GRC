"use client";

import Link from "next/link";
import { SubmitButton } from "@/components/FormControls";
import {
  linkDocumentProcessus,
  unlinkDocumentProcessus,
} from "@/app/documents/actions";

export type ProcessusOpt = { id: string; code: string; nom: string };

export type DocumentProcessusLink = {
  id: string;
  processus: ProcessusOpt;
};

/**
 * Lien métier Document → Processus (N–N).
 * Cas d’usage : procédures / documents rattachés à un ou plusieurs processus.
 */
export function DocumentProcessusPanel({
  documentId,
  links,
  candidats,
  editable,
}: {
  documentId: string;
  links: DocumentProcessusLink[];
  candidats: ProcessusOpt[];
  editable: boolean;
}) {
  const linkedIds = new Set(links.map((l) => l.processus.id));
  const disponibles = candidats.filter((c) => !linkedIds.has(c.id));

  return (
    <div className="document-processus-panel">
      <p className="muted" style={{ marginTop: 0 }}>
        Un document (procédure, guide…) peut s&apos;appliquer à un ou plusieurs
        processus. Relation dédiée — distincte des Éléments associés génériques.
      </p>

      {links.length === 0 ? (
        <p className="empty">Aucun processus lié.</p>
      ) : (
        <ul className="link-list">
          {links.map((l) => (
            <li key={l.id} className="link-list__row">
              <Link href={`/processus/${l.processus.id}`}>
                {l.processus.code} — {l.processus.nom}
              </Link>
              {editable ? (
                <form action={unlinkDocumentProcessus}>
                  <input type="hidden" name="documentId" value={documentId} />
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
          <form action={linkDocumentProcessus} className="entity-form">
            <input type="hidden" name="documentId" value={documentId} />
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
              <SubmitButton>Lier</SubmitButton>
            </div>
          </form>
        )
      ) : null}
    </div>
  );
}
