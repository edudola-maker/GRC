"use client";

import { useState } from "react";
import {
  ConfirmActionButton,
  SubmitButton,
} from "@/components/FormControls";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { createJournalBordEntree, deleteJournalBordEntree } from "@/app/journal-bord/actions";
import type { JournalBordItem } from "@/lib/journal-bord";
import type { NoteListeItem } from "@/lib/notes";
import { formatDateDot } from "@/lib/labels";

function formatNom(u: { nom: string; prenom?: string | null }) {
  const prenom = u.prenom?.trim();
  const nom = u.nom.trim();
  return prenom ? `${prenom} ${nom}` : nom;
}

type TimelineItem = {
  id: string;
  kind: "journal" | "note";
  at: Date;
  auteurNom: string;
  texte: string;
  titre?: string | null;
};

/**
 * Journal de bord unifié (Notes + Journal).
 * Création : grande zone de texte uniquement — date/auteur auto.
 * Les notes historiques restent visibles (source préservée pour IA future).
 */
export function JournalTravailPanel({
  typeObjet,
  objetId,
  entrees,
  notes = [],
  canEdit,
  baseHref,
}: {
  typeObjet: "PROJET" | "CONSEIL" | "MISSION";
  objetId: string;
  entrees: JournalBordItem[];
  notes?: NoteListeItem[];
  canEdit: boolean;
  baseHref: string;
}) {
  const [open, setOpen] = useState(false);

  const timeline: TimelineItem[] = [
    ...entrees.map((e) => ({
      id: e.id,
      kind: "journal" as const,
      at: e.date,
      auteurNom: formatNom(e.auteur),
      texte: e.texte,
    })),
    ...notes.map((n) => ({
      id: n.id,
      kind: "note" as const,
      at: n.date,
      auteurNom: formatNom(n.auteur),
      texte: n.notesLibres?.trim() || "(sans texte libre)",
      titre: n.titre,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <CollapsibleSection
      title="Journal de bord"
      badge={timeline.length || undefined}
      defaultOpen
      id="JOURNAL_BORD"
    >
      <p className="muted" style={{ marginTop: 0 }}>
        Chronologie de travail — notes de séance, contacts, décisions. Date et
        auteur enregistrés automatiquement.
      </p>

      {canEdit ? (
        open ? (
          <form
            action={createJournalBordEntree}
            className="entity-form journal-travail__compose"
          >
            <input type="hidden" name="typeObjet" value={typeObjet} />
            <input type="hidden" name="objetId" value={objetId} />
            <input type="hidden" name="retour" value={`${baseHref}#JOURNAL_BORD`} />
            <label className="field" htmlFor="texte">
              <span className="sr-only">Nouvelle entrée</span>
              <textarea
                id="texte"
                name="texte"
                rows={8}
                required
                autoFocus
                placeholder="Écrire ici… (préparation de séance, notes, suivi…)"
              />
            </label>
            <div className="form-actions">
              <SubmitButton>Enregistrer</SubmitButton>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setOpen(false)}
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            style={{ marginBottom: "0.85rem" }}
            onClick={() => setOpen(true)}
          >
            + Nouvelle entrée
          </button>
        )
      ) : null}

      {timeline.length === 0 ? (
        <p className="empty">Aucune entrée pour l’instant.</p>
      ) : (
        <ol className="journal-travail">
          {timeline.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="journal-travail__item">
              <header className="journal-travail__meta">
                <time dateTime={item.at.toISOString()}>
                  {formatDateDot(item.at)}
                  {item.at.getHours() || item.at.getMinutes()
                    ? ` · ${String(item.at.getHours()).padStart(2, "0")}:${String(item.at.getMinutes()).padStart(2, "0")}`
                    : ""}
                </time>
                <span>· {item.auteurNom}</span>
                {item.kind === "note" && item.titre ? (
                  <span className="muted"> · {item.titre}</span>
                ) : null}
              </header>
              <p className="journal-travail__texte">
                {item.texte}
              </p>
              {canEdit && item.kind === "journal" ? (
                <ConfirmActionButton
                  action={deleteJournalBordEntree}
                  id={item.id}
                  label="×"
                  confirmMessage="Supprimer cette entrée ?"
                  variant="ghost"
                  fields={{ retour: `${baseHref}#JOURNAL_BORD` }}
                />
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </CollapsibleSection>
  );
}
