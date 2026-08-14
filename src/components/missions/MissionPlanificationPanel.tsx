import Link from "next/link";
import {
  ConfirmActionButton,
  SubmitButton,
} from "@/components/FormControls";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import {
  MissionEquipePanel,
  type MissionEquipeMembre,
} from "@/components/missions/MissionEquipePanel";
import { JournalTravailPanel } from "@/components/travail/JournalTravailPanel";
import { QuickTacheForm } from "@/components/taches/QuickTacheForm";
import { BtnLink } from "@/components/ui";
import { linkDocument } from "@/app/missions/actions";
import {
  addMissionDocumentation,
  addMissionObjectif,
  addMissionRisque,
  deleteMissionDocumentation,
  deleteMissionObjectif,
  deleteMissionRisque,
  updateMissionDocumentationStatut,
} from "@/app/missions/planification-actions";
import {
  CATEGORIE_TACHE_LABELS,
  STATUT_TACHE_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { withRetour } from "@/lib/navigation-retour";
import type { JournalBordItem } from "@/lib/journal-bord";
import type { NoteListeItem } from "@/lib/notes";
import { formatUtilisateurNom } from "@/lib/session";

type DocLien = {
  id: string;
  document: { id: string; nom: string };
};

type TacheRow = {
  id: string;
  titre: string;
  categorie: string;
  statut: string;
  dateEcheance: Date | null;
  responsable: { nom: string };
};

type ChecklistItem = {
  id: string;
  libelle: string;
  fait: boolean;
  sectionKey: string;
};

type ValidationPoint = {
  id: string;
  libelle: string;
  statut: string;
  contenuVersion: number;
  sectionKey: string;
};

type ObjectifRow = {
  id: string;
  libelle: string;
  description: string | null;
};

type RisqueMissionRow = {
  id: string;
  titre: string;
  description: string | null;
  risque: { id: string; code: string; nom: string } | null;
};

type DocDemandeRow = {
  id: string;
  documentAttendu: string;
  interlocuteur: string | null;
  dateDemandee: Date | null;
  dateRecue: Date | null;
  statut: string;
};

const DOC_STATUT_LABELS: Record<string, string> = {
  DEMANDE: "Demandé",
  RECU: "Reçu",
  ANALYSE: "Analysé",
};

/**
 * Étape Planification — première étape métier détaillée.
 */
export function MissionPlanificationPanel({
  missionId,
  canEdit,
  editing,
  baseHref,
  equipe,
  roles,
  users,
  checklistItems,
  validationPoints,
  taches,
  documents,
  docsALier,
  objectifs,
  risquesMission,
  documentation,
  notes,
  journalBord = [],
  risquesGrc,
}: {
  missionId: string;
  canEdit: boolean;
  editing: boolean;
  baseHref: string;
  equipe: MissionEquipeMembre[];
  roles: { id: string; code: string; libelle: string }[];
  users: { id: string; nom: string; prenom?: string | null; initiales?: string | null }[];
  checklistItems: ChecklistItem[];
  validationPoints: ValidationPoint[];
  taches: TacheRow[];
  documents: DocLien[];
  docsALier: { id: string; nom: string }[];
  objectifs: ObjectifRow[];
  risquesMission: RisqueMissionRow[];
  documentation: DocDemandeRow[];
  notes: NoteListeItem[];
  journalBord?: JournalBordItem[];
  risquesGrc: { id: string; code: string; nom: string }[];
}) {
  const checklist = checklistItems.filter(
    (c) => c.sectionKey === "PLANIFICATION",
  );
  const validations = validationPoints.filter(
    (v) => v.sectionKey === "PLANIFICATION",
  );
  const userOpts = users.map((u) => ({
    id: u.id,
    nom: formatUtilisateurNom(u),
  }));

  return (
    <>
      <CollapsibleSection title="Équipe de mission" defaultOpen>
        <MissionEquipePanel
          missionId={missionId}
          membres={equipe}
          roles={roles}
          utilisateurs={users.map((u) => ({
            id: u.id,
            nom: u.nom,
            initiales: u.initiales ?? null,
          }))}
          editable={editing && canEdit}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Objectifs d’audit"
        badge={objectifs.length || undefined}
        defaultOpen
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Plusieurs objectifs structurés (ex. exhaustivité des risques,
          adéquation des contrôles, application effective).
        </p>
        {editing && canEdit ? (
          <form action={addMissionObjectif} className="entity-form" style={{ marginBottom: "0.75rem" }}>
            <input type="hidden" name="missionId" value={missionId} />
            <label>
              Objectif
              <input name="libelle" required placeholder="Apprécier…" />
            </label>
            <label>
              Précision (facultatif)
              <input name="description" />
            </label>
            <SubmitButton>+ Objectif</SubmitButton>
          </form>
        ) : null}
        {objectifs.length === 0 ? (
          <p className="empty">Aucun objectif structuré.</p>
        ) : (
          <ol className="entity-list entity-list--compact">
            {objectifs.map((o, i) => (
              <li key={o.id} className="entity-row">
                <div className="entity-row__main">
                  <strong>
                    {i + 1}. {o.libelle}
                  </strong>
                  {o.description ? (
                    <span className="entity-row__meta">{o.description}</span>
                  ) : null}
                </div>
                {editing && canEdit ? (
                  <ConfirmActionButton
                    action={deleteMissionObjectif}
                    id={o.id}
                    label="×"
                    variant="ghost"
                    confirmMessage="Supprimer cet objectif ?"
                    fields={{ missionId }}
                  />
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Risques de mission"
        badge={risquesMission.length || undefined}
        defaultOpen
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Risques propres au déroulement de la mission — distincts du
          référentiel GRC. Lien facultatif vers un Risque GRC.
        </p>
        {editing && canEdit ? (
          <form action={addMissionRisque} className="entity-form" style={{ marginBottom: "0.75rem" }}>
            <input type="hidden" name="missionId" value={missionId} />
            <label>
              Titre
              <input name="titre" required placeholder="Accès aux données…" />
            </label>
            <label>
              Description
              <textarea name="description" rows={2} />
            </label>
            <label>
              Lien Risque GRC (facultatif)
              <select name="risqueId" defaultValue="">
                <option value="">— Aucun —</option>
                {risquesGrc.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} — {r.nom}
                  </option>
                ))}
              </select>
            </label>
            <SubmitButton>+ Risque de mission</SubmitButton>
          </form>
        ) : null}
        {risquesMission.length === 0 ? (
          <p className="empty">Aucun risque de mission documenté.</p>
        ) : (
          <ul className="entity-list entity-list--compact">
            {risquesMission.map((r) => (
              <li key={r.id} className="entity-row">
                <div className="entity-row__main">
                  <strong>{r.titre}</strong>
                  <span className="entity-row__meta">
                    {r.description ?? ""}
                    {r.risque
                      ? ` · GRC : ${r.risque.code} — ${r.risque.nom}`
                      : ""}
                  </span>
                </div>
                {editing && canEdit ? (
                  <ConfirmActionButton
                    action={deleteMissionRisque}
                    id={r.id}
                    label="×"
                    variant="ghost"
                    confirmMessage="Supprimer ce risque de mission ?"
                    fields={{ missionId }}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Documentation demandée"
        badge={documentation.length || undefined}
        defaultOpen
      >
        {editing && canEdit ? (
          <form
            action={addMissionDocumentation}
            className="entity-form"
            style={{ marginBottom: "0.75rem" }}
          >
            <input type="hidden" name="missionId" value={missionId} />
            <div className="form-grid form-grid--2">
              <label>
                Document attendu
                <input name="documentAttendu" required />
              </label>
              <label>
                Interlocuteur
                <input name="interlocuteur" />
              </label>
              <label>
                Date demandée
                <input
                  type="date"
                  name="dateDemandee"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </label>
            </div>
            <SubmitButton>+ Document</SubmitButton>
          </form>
        ) : null}
        {documentation.length === 0 ? (
          <p className="empty">Aucune documentation demandée.</p>
        ) : (
          <ul className="entity-list entity-list--compact">
            {documentation.map((d) => (
              <li key={d.id} className="entity-row">
                <div className="entity-row__main">
                  <strong>{d.documentAttendu}</strong>
                  <span className="entity-row__meta">
                    {DOC_STATUT_LABELS[d.statut] ?? d.statut}
                    {d.interlocuteur ? ` · ${d.interlocuteur}` : ""}
                    {d.dateDemandee
                      ? ` · demandé ${formatDate(d.dateDemandee)}`
                      : ""}
                    {d.dateRecue ? ` · reçu ${formatDate(d.dateRecue)}` : ""}
                  </span>
                </div>
                {editing && canEdit ? (
                  <div className="form-actions">
                    {d.statut !== "RECU" && d.statut !== "ANALYSE" ? (
                      <form action={updateMissionDocumentationStatut}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="missionId" value={missionId} />
                        <input type="hidden" name="statut" value="RECU" />
                        <SubmitButton variant="ghost">Reçu</SubmitButton>
                      </form>
                    ) : null}
                    {d.statut !== "ANALYSE" ? (
                      <form action={updateMissionDocumentationStatut}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="missionId" value={missionId} />
                        <input type="hidden" name="statut" value="ANALYSE" />
                        <SubmitButton variant="ghost">Analysé</SubmitButton>
                      </form>
                    ) : null}
                    <ConfirmActionButton
                      action={deleteMissionDocumentation}
                      id={d.id}
                      label="×"
                      variant="ghost"
                      confirmMessage="Supprimer cette demande ?"
                      fields={{ missionId }}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <JournalTravailPanel
        typeObjet="MISSION"
        objetId={missionId}
        entrees={journalBord}
        notes={notes}
        canEdit={editing && canEdit}
        baseHref={baseHref}
      />

      <CollapsibleSection title="Check-list qualité" defaultOpen={false}>
        {checklist.length === 0 ? (
          <p className="empty">
            Contenu template à définir progressivement.
          </p>
        ) : (
          <ul className="check-list">
            {checklist.map((c) => (
              <li key={c.id}>
                {c.fait ? "☑" : "☐"} {c.libelle}
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Validations" defaultOpen={false}>
        {validations.length === 0 ? (
          <p className="empty">
            Points de validation (quatre yeux) — à définir progressivement.
          </p>
        ) : (
          <ul className="entity-list entity-list--compact">
            {validations.map((v) => (
              <li key={v.id}>
                {v.libelle} — {v.statut} (v{v.contenuVersion})
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Tâches opérationnelles"
        badge={taches.length}
        defaultOpen
      >
        {editing && canEdit ? (
          <div style={{ marginBottom: "0.85rem" }}>
            <QuickTacheForm
              users={userOpts}
              retour={baseHref}
              hidden={{ missionId }}
            />
          </div>
        ) : canEdit ? (
          <p className="muted" style={{ marginTop: 0 }}>
            Passez en mode Modifier pour créer une tâche.
          </p>
        ) : null}
        {taches.length === 0 ? (
          <p className="empty">Aucune tâche liée.</p>
        ) : (
          <ul className="entity-list">
            {taches.map((t) => {
              const clos = (TACHE_STATUTS_CLOS as readonly string[]).includes(
                t.statut,
              );
              const urgence = urgenceEcheance(t.dateEcheance, clos);
              return (
                <li key={t.id}>
                  <Link
                    href={withRetour(`/taches/${t.id}`, baseHref)}
                    className={`entity-row entity-row--${urgence}`}
                  >
                    <div className="entity-row__main">
                      <strong>{t.titre}</strong>
                      <span className="entity-row__meta">
                        {CATEGORIE_TACHE_LABELS[t.categorie]} ·{" "}
                        {t.responsable.nom} · {STATUT_TACHE_LABELS[t.statut]}
                      </span>
                    </div>
                    <span className="entity-row__date">
                      {formatDate(t.dateEcheance)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Documents liés"
        badge={documents.length || undefined}
        defaultOpen={false}
      >
        {editing && canEdit && docsALier.length > 0 ? (
          <form action={linkDocument} className="form-inline" style={{ marginBottom: "0.75rem" }}>
            <input type="hidden" name="missionId" value={missionId} />
            <select name="documentId" required>
              <option value="">Choisir…</option>
              {docsALier.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nom}
                </option>
              ))}
            </select>
            <SubmitButton variant="ghost">Lier</SubmitButton>
          </form>
        ) : null}
        {documents.length === 0 ? (
          <p className="empty">Aucun document lié.</p>
        ) : (
          <ul className="entity-list entity-list--compact">
            {documents.map((d) => (
              <li key={d.id}>
                <Link href={`/documents/${d.document.id}`}>
                  {d.document.nom}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {!editing && canEdit ? (
          <p className="muted">
            <BtnLink href={`${baseHref}?edit=PLANIFICATION`} variant="ghost">
              Modifier pour lier un document
            </BtnLink>
          </p>
        ) : null}
      </CollapsibleSection>
    </>
  );
}
