import Link from "next/link";
import {
  SubmitButton,
} from "@/components/FormControls";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import {
  MissionEquipePanel,
  type MissionEquipeMembre,
} from "@/components/missions/MissionEquipePanel";
import { BtnLink } from "@/components/ui";
import {
  createTacheDepuisMission,
  linkDocument,
} from "@/app/missions/actions";
import { CATEGORIE_TACHE_LABELS, STATUT_TACHE_LABELS, formatDate, urgenceEcheance } from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { withRetour } from "@/lib/navigation-retour";

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

/**
 * Contenu de l’étape Planification — volontairement souple.
 * Blocs existants (équipe, checklist, validations, tâches, docs) +
 * placeholders méthodologiques (risques de mission).
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
}: {
  missionId: string;
  canEdit: boolean;
  editing: boolean;
  baseHref: string;
  equipe: MissionEquipeMembre[];
  roles: { id: string; code: string; libelle: string }[];
  users: { id: string; nom: string; initiales?: string | null }[];
  checklistItems: ChecklistItem[];
  validationPoints: ValidationPoint[];
  taches: TacheRow[];
  documents: DocLien[];
  docsALier: { id: string; nom: string }[];
}) {
  const checklist = checklistItems.filter(
    (c) => c.sectionKey === "PLANIFICATION",
  );
  const validations = validationPoints.filter(
    (v) => v.sectionKey === "PLANIFICATION",
  );

  return (
    <>
      <CollapsibleSection title="Équipe de mission" defaultOpen>
        <p className="muted" style={{ marginTop: 0 }}>
          Rôles propres à la mission (distincts du rôle applicatif). Plusieurs
          rôles possibles par personne.
        </p>
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

      <CollapsibleSection title="Check-list qualité" defaultOpen>
        {checklist.length === 0 ? (
          <p className="empty">
            Aucun point pour l&apos;instant — les check-lists seront définies
            par template (contenu métier à venir).
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

      <CollapsibleSection title="Analyse des risques de mission" defaultOpen>
        <p className="muted" style={{ marginTop: 0 }}>
          Risques propres au déroulement de la mission (accès, disponibilité,
          indépendance…) — distincts des objets Risque du référentiel GRC.
          Contenu méthodologique à préciser progressivement.
        </p>
        <p className="empty">Aucun risque de mission documenté pour l’instant.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Validations" defaultOpen>
        {validations.length === 0 ? (
          <p className="empty">
            Points de validation (Préparer → Soumettre → Valider) prévus —
            contenu à définir progressivement.
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
        <p className="muted" style={{ marginTop: 0 }}>
          Distinctes des check-lists qualité — visibles au Dashboard
          collaborateur.
        </p>
        {editing && canEdit ? (
          <form
            action={createTacheDepuisMission}
            className="form-actions"
            style={{ marginBottom: "0.85rem" }}
          >
            <input type="hidden" name="missionId" value={missionId} />
            <SubmitButton>Créer une tâche liée</SubmitButton>
            <BtnLink
              href={`/taches/nouvelle?missionId=${missionId}&categorie=MISSION`}
              variant="ghost"
            >
              Formulaire complet
            </BtnLink>
          </form>
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
        defaultOpen={false}
        badge={`${documents.length}`}
      >
        {editing && canEdit && docsALier.length > 0 ? (
          <form
            action={linkDocument}
            className="entity-form"
            style={{ marginBottom: "1rem" }}
          >
            <input type="hidden" name="missionId" value={missionId} />
            <div className="form-grid">
              <label className="field" htmlFor="documentId">
                <span className="field__label">Lier un document</span>
                <select
                  id="documentId"
                  name="documentId"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Sélectionner…
                  </option>
                  {docsALier.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nom}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-actions">
              <SubmitButton>Lier le document</SubmitButton>
            </div>
          </form>
        ) : null}
        {documents.length === 0 ? (
          <p className="empty">Aucun document lié.</p>
        ) : (
          <ul className="entity-list">
            {documents.map((lien) => (
              <li key={lien.id}>
                <Link
                  href={`/documents/${lien.document.id}`}
                  className="entity-row entity-row--neutre"
                >
                  <div className="entity-row__main">
                    <strong>{lien.document.nom}</strong>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>
    </>
  );
}
