import { toDateInputValue } from "@/lib/form";
import {
  CATEGORIE_RISQUE_OPTIONS,
  CATEGORIE_TACHE_OPTIONS,
  ECHELLE_RISQUE,
  FREQUENCE_CONTROLE_OPTIONS,
  FREQUENCE_REVUE_OPTIONS,
  NIVEAU_CONFIDENTIALITE_OPTIONS,
  PRIORITE_OPTIONS,
  STATUT_CONSEIL_OPTIONS,
  STATUT_CONTROLE_OPTIONS,
  STATUT_DOCUMENT_OPTIONS,
  STATUT_MISSION_OPTIONS,
  STATUT_PROCESSUS_OPTIONS,
  STATUT_PROJET_OPTIONS,
  STATUT_RISQUE_OPTIONS,
  STATUT_TACHE_OPTIONS,
  STRATEGIE_RISQUE_OPTIONS,
  TYPE_CONTROLE_OPTIONS,
  TYPE_DOCUMENT_OPTIONS,
} from "@/lib/catalog";
import { SubmitButton } from "@/components/FormControls";
import { BtnLink } from "@/components/ui";
import { FormSection } from "@/components/module/FormSection";
import { SectionSaveActions } from "@/components/module/EditableSection";
import { sectionCancelHref } from "@/lib/section-nav";

type UserOpt = { id: string; nom: string };
type ProjetOpt = { id: string; nom: string };
type Opt = { id: string; nom: string };

type ProjetValues = {
  id?: string;
  nom?: string;
  description?: string | null;
  taxinomie?: string | null;
  tags?: string | null;
  responsableId?: string;
  dateDebut?: Date | string | null;
  dateEcheance?: Date | string | null;
  statut?: string;
  priorite?: string;
  avancement?: number;
  commentaires?: string | null;
  reflexion?: string | null;
};

type TacheValues = {
  id?: string;
  titre?: string;
  description?: string | null;
  responsableId?: string;
  projetId?: string | null;
  conseilId?: string | null;
  controleSCIId?: string | null;
  missionId?: string | null;
  documentId?: string | null;
  recommandationId?: string | null;
  dateDebut?: Date | string | null;
  dateEcheance?: Date | string | null;
  chargeJours?: number | null;
  statut?: string;
  priorite?: string;
  categorie?: string;
  commentaires?: string | null;
};

type ConseilValues = {
  id?: string;
  objet?: string;
  description?: string | null;
  taxinomie?: string | null;
  tags?: string | null;
  demandeur?: string | null;
  entiteDemandeuse?: string | null;
  dateReception?: Date | string | null;
  responsableId?: string;
  dateEcheance?: Date | string | null;
  statut?: string;
  dateReponse?: Date | string | null;
  dateCloture?: Date | string | null;
  commentaires?: string | null;
  raisonnement?: string | null;
};

type ControleValues = {
  id?: string;
  nom?: string;
  description?: string | null;
  taxinomie?: string | null;
  tags?: string | null;
  processusConcerne?: string;
  responsableId?: string;
  typeControle?: string;
  frequence?: string;
  fenetreDeclenchementJours?: number | null;
  delaiRealisationJours?: number | null;
  dateDerniereRealisation?: Date | string | null;
  dateProchaineEcheance?: Date | string | null;
  statut?: string;
  commentaires?: string | null;
};

type RisqueValues = {
  id?: string;
  nom?: string;
  description?: string | null;
  taxinomie?: string | null;
  tags?: string | null;
  processus?: string | null;
  responsableId?: string;
  categorie?: string;
  probabilite?: number;
  impact?: number;
  probabiliteResiduelle?: number | null;
  impactResiduel?: number | null;
  strategie?: string | null;
  statut?: string;
  commentaires?: string | null;
  justificationEvaluation?: string | null;
};

type DocumentValues = {
  id?: string;
  nom?: string;
  typeDocument?: string;
  taxinomie?: string | null;
  tags?: string | null;
  version?: string | null;
  responsableId?: string | null;
  dateApprobation?: Date | string | null;
  dateDerniereRevue?: Date | string | null;
  frequenceRevue?: string | null;
  prochaineRevue?: Date | string | null;
  fenetreDeclenchementJours?: number | null;
  statut?: string;
  description?: string | null;
  reference?: string | null;
  contientDonneesPersonnelles?: boolean;
  niveauConfidentialite?: string;
};

type MissionValues = {
  id?: string;
  code?: string;
  titre?: string;
  typeId?: string;
  templateId?: string | null;
  descriptifPresetId?: string | null;
  descriptifLibre?: string | null;
  nature?: string | null;
  tags?: string | null;
  responsableId?: string;
  dateDebut?: Date | string | null;
  dateFin?: Date | string | null;
  statut?: string;
  commentaires?: string | null;
  analyseTravaux?: string | null;
  contientDonneesPersonnelles?: boolean;
  niveauConfidentialite?: string;
};

type MissionTypeOpt = { id: string; libelle: string };
type MissionTemplateOpt = { id: string; libelle: string; typeId: string };
type MissionDescriptifOpt = { id: string; libelle: string; typeId: string };

type ProcessusValues = {
  id?: string;
  nom?: string;
  description?: string | null;
  tags?: string | null;
  responsableId?: string;
  statut?: string;
  criticite?: number | null;
  reference?: string | null;
  parentId?: string | null;
  contientDonneesPersonnelles?: boolean;
  niveauConfidentialite?: string;
};

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field" htmlFor={htmlFor}>
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

export function ProjetForm({
  action,
  users,
  values,
  cancelHref,
  submitLabel,
  section = "ALL",
  draftActions = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: ProjetValues;
  cancelHref: string;
  submitLabel: string;
  /** ALL = création ; sinon une box d’édition. */
  section?:
    | "ALL"
    | "INFOS_GENERALES"
    | "PILOTAGE"
    | "REFLEXION"
    | "TAGS";
  draftActions?: boolean;
}) {
  const showInfos = section === "ALL" || section === "INFOS_GENERALES";
  const showPilotage = section === "ALL" || section === "PILOTAGE";
  const showReflexion = section === "ALL" || section === "REFLEXION";
  const showTags = section === "ALL" || section === "TAGS";

  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {section !== "ALL" ? (
        <input type="hidden" name="sectionKey" value={section} />
      ) : null}

      {showInfos ? (
        <FormSection title="Informations générales" defaultOpen>
          <Field label="Nom du projet *" htmlFor="nom">
            <input
              id="nom"
              name="nom"
              required
              defaultValue={values?.nom ?? ""}
              placeholder="Ex. Modernisation des procédures"
            />
          </Field>
          <Field label="Description" htmlFor="description">
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={values?.description ?? ""}
            />
          </Field>
        </FormSection>
      ) : null}

      {showPilotage ? (
        <FormSection title="Pilotage & dates" defaultOpen>
          <div className="form-grid">
            <Field label="Responsable" htmlFor="responsableId">
              <select
                id="responsableId"
                name="responsableId"
                required
                defaultValue={values?.responsableId ?? users[0]?.id}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Statut" htmlFor="statut">
              <select
                id="statut"
                name="statut"
                defaultValue={values?.statut ?? "IDEE"}
              >
                {STATUT_PROJET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priorité" htmlFor="priorite">
              <select
                id="priorite"
                name="priorite"
                defaultValue={values?.priorite ?? "MOYENNE"}
              >
                {PRIORITE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Avancement (%)" htmlFor="avancement">
              <input
                id="avancement"
                name="avancement"
                type="number"
                min={0}
                max={100}
                defaultValue={values?.avancement ?? 0}
              />
            </Field>
            <Field label="Date de début" htmlFor="dateDebut">
              <input
                id="dateDebut"
                name="dateDebut"
                type="date"
                defaultValue={toDateInputValue(values?.dateDebut)}
              />
            </Field>
            <Field label="Date d'échéance" htmlFor="dateEcheance">
              <input
                id="dateEcheance"
                name="dateEcheance"
                type="date"
                defaultValue={toDateInputValue(values?.dateEcheance)}
              />
            </Field>
          </div>
          <Field label="Commentaires" htmlFor="commentaires">
            <textarea
              id="commentaires"
              name="commentaires"
              rows={2}
              defaultValue={values?.commentaires ?? ""}
            />
          </Field>
        </FormSection>
      ) : null}

      {showReflexion ? (
        <FormSection title="Réflexion / analyse" defaultOpen={section !== "ALL"}>
          <Field
            label="Réflexion / analyse"
            htmlFor="reflexion"
            hint="Raisonnement distinct du journal d’activité."
          >
            <textarea
              id="reflexion"
              name="reflexion"
              rows={4}
              defaultValue={values?.reflexion ?? ""}
            />
          </Field>
        </FormSection>
      ) : null}

      {showTags ? (
        <FormSection title="Tags" defaultOpen={section !== "ALL"}>
          <Field label="Tags" htmlFor="tags" hint="Séparés par des virgules">
            <input
              id="tags"
              name="tags"
              defaultValue={values?.tags ?? ""}
              placeholder="Ex. gouvernance, SCI"
            />
          </Field>
        </FormSection>
      ) : null}

      {draftActions ? (
        <SectionSaveActions
          baseHref={cancelHref}
          sectionKey={section !== "ALL" ? section : undefined}
          cancelHref={cancelHref}
          finalizeLabel={submitLabel}
        />
      ) : (
        <div className="form-actions">
          <SubmitButton>{submitLabel}</SubmitButton>
          <BtnLink
            href={
              section !== "ALL"
                ? sectionCancelHref(cancelHref, section)
                : cancelHref
            }
            variant="ghost"
            scroll={false}
          >
            Annuler
          </BtnLink>
        </div>
      )}
    </form>
  );
}

export function TacheForm({
  action,
  users,
  projets,
  values,
  cancelHref,
  submitLabel,
  defaultCategorie,
  conseils,
  controles,
  missions,
  audits,
  documents,
  /** Contexte Projet : masque la priorité, expose dates / charge. */
  projetContext = false,
  retour,
  sectionKey,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  projets: ProjetOpt[];
  values?: TacheValues;
  cancelHref: string;
  submitLabel: string;
  defaultCategorie?: string;
  conseils?: Opt[];
  controles?: Opt[];
  missions?: Opt[];
  /** @deprecated Utiliser `missions` */
  audits?: Opt[];
  documents?: Opt[];
  projetContext?: boolean;
  retour?: string;
  sectionKey?: string;
}) {
  const missionOptions = missions ?? audits;
  const isProjet =
    projetContext || Boolean(values?.projetId);
  const resolvedCancel = sectionKey
    ? sectionCancelHref(cancelHref, sectionKey)
    : cancelHref;
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {sectionKey ? (
        <input type="hidden" name="sectionKey" value={sectionKey} />
      ) : null}
      {retour ? <input type="hidden" name="retour" value={retour} /> : null}
      {values?.recommandationId ? (
        <input
          type="hidden"
          name="recommandationId"
          value={values.recommandationId}
        />
      ) : null}
      {!conseils && values?.conseilId ? (
        <input type="hidden" name="conseilId" value={values.conseilId} />
      ) : null}
      {!controles && values?.controleSCIId ? (
        <input
          type="hidden"
          name="controleSCIId"
          value={values.controleSCIId}
        />
      ) : null}
      {!missionOptions && values?.missionId ? (
        <input type="hidden" name="missionId" value={values.missionId} />
      ) : null}
      {!documents && values?.documentId ? (
        <input type="hidden" name="documentId" value={values.documentId} />
      ) : null}

      <Field label="Titre *" htmlFor="titre">
        <input
          id="titre"
          name="titre"
          required
          defaultValue={values?.titre ?? ""}
          placeholder="Ex. Analyser la question X"
        />
      </Field>

      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={values?.description ?? ""}
        />
      </Field>

      <div className="form-grid">
        <Field label="Responsable" htmlFor="responsableId">
          <select
            id="responsableId"
            name="responsableId"
            required
            defaultValue={values?.responsableId ?? users[0]?.id}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nom}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Catégorie"
          htmlFor="categorie"
          hint="Ex. Conseil pour une demande ponctuelle sans projet."
        >
          <select
            id="categorie"
            name="categorie"
            defaultValue={values?.categorie ?? defaultCategorie ?? "AUTRE"}
          >
            {CATEGORIE_TACHE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Projet associé"
          htmlFor="projetId"
          hint="Facultatif — laisser vide pour une tâche indépendante."
        >
          <select
            id="projetId"
            name="projetId"
            defaultValue={values?.projetId ?? ""}
          >
            <option value="">Aucun (indépendante)</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Statut" htmlFor="statut">
          <select
            id="statut"
            name="statut"
            defaultValue={values?.statut ?? "A_FAIRE"}
          >
            {STATUT_TACHE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        {isProjet ? (
          <input
            type="hidden"
            name="priorite"
            value={values?.priorite ?? "MOYENNE"}
          />
        ) : (
          <Field label="Priorité" htmlFor="priorite">
            <select
              id="priorite"
              name="priorite"
              defaultValue={values?.priorite ?? "MOYENNE"}
            >
              {PRIORITE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field
          label={isProjet ? "Date de début" : "Date d'échéance"}
          htmlFor={isProjet ? "dateDebut" : "dateEcheance"}
        >
          {isProjet ? (
            <input
              id="dateDebut"
              name="dateDebut"
              type="date"
              defaultValue={toDateInputValue(values?.dateDebut)}
            />
          ) : (
            <input
              id="dateEcheance"
              name="dateEcheance"
              type="date"
              defaultValue={toDateInputValue(values?.dateEcheance)}
            />
          )}
        </Field>

        {isProjet ? (
          <>
            <Field label="Date de fin" htmlFor="dateEcheance">
              <input
                id="dateEcheance"
                name="dateEcheance"
                type="date"
                defaultValue={toDateInputValue(values?.dateEcheance)}
              />
            </Field>
            <Field
              label="Charge estimée (jours)"
              htmlFor="chargeJours"
              hint="Ex. 0,5 · 1 · 2 · 5"
            >
              <input
                id="chargeJours"
                name="chargeJours"
                type="number"
                min={0}
                step={0.5}
                defaultValue={
                  values?.chargeJours != null ? String(values.chargeJours) : ""
                }
                placeholder="1"
              />
            </Field>
          </>
        ) : null}
      </div>

      {(conseils || controles || missionOptions || documents) && (
        <div className="form-grid">
          {conseils ? (
            <Field label="Conseil lié" htmlFor="conseilId">
              <select
                id="conseilId"
                name="conseilId"
                defaultValue={values?.conseilId ?? ""}
              >
                <option value="">Aucun</option>
                {conseils.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {controles ? (
            <Field label="Contrôle SCI lié" htmlFor="controleSCIId">
              <select
                id="controleSCIId"
                name="controleSCIId"
                defaultValue={values?.controleSCIId ?? ""}
              >
                <option value="">Aucun</option>
                {controles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {missionOptions ? (
            <Field label="Mission liée" htmlFor="missionId">
              <select
                id="missionId"
                name="missionId"
                defaultValue={values?.missionId ?? ""}
              >
                <option value="">Aucun</option>
                {missionOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nom}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {documents ? (
            <Field label="Document lié" htmlFor="documentId">
              <select
                id="documentId"
                name="documentId"
                defaultValue={values?.documentId ?? ""}
              >
                <option value="">Aucun</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nom}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
        </div>
      )}

      <Field label="Commentaire" htmlFor="commentaires">
        <textarea
          id="commentaires"
          name="commentaires"
          rows={2}
          defaultValue={values?.commentaires ?? ""}
        />
      </Field>

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={resolvedCancel} variant="ghost" scroll={false}>
          Annuler
        </BtnLink>
      </div>
    </form>
  );
}

export function ConseilForm({
  action,
  users,
  values,
  cancelHref,
  submitLabel,
  showCreerTache,
  sectionKey,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: ConseilValues;
  cancelHref: string;
  submitLabel: string;
  showCreerTache?: boolean;
  sectionKey?: string;
}) {
  const resolvedCancel = sectionKey
    ? sectionCancelHref(cancelHref, sectionKey)
    : cancelHref;
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {sectionKey ? (
        <input type="hidden" name="sectionKey" value={sectionKey} />
      ) : null}

      <FormSection title="Description">
        <Field label="Objet *" htmlFor="objet">
          <input
            id="objet"
            name="objet"
            required
            defaultValue={values?.objet ?? ""}
            placeholder="Ex. Avis sur la procédure X"
          />
        </Field>

        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={values?.description ?? ""}
          />
        </Field>

        <div className="form-grid">
          <Field label="Demandeur" htmlFor="demandeur">
            <input
              id="demandeur"
              name="demandeur"
              defaultValue={values?.demandeur ?? ""}
            />
          </Field>
          <Field label="Entité demandeuse" htmlFor="entiteDemandeuse">
            <input
              id="entiteDemandeuse"
              name="entiteDemandeuse"
              defaultValue={values?.entiteDemandeuse ?? ""}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Pilotage">
        <div className="form-grid">
          <Field label="Responsable" htmlFor="responsableId">
            <select
              id="responsableId"
              name="responsableId"
              required
              defaultValue={values?.responsableId ?? users[0]?.id}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statut" htmlFor="statut">
            <select
              id="statut"
              name="statut"
              defaultValue={values?.statut ?? "RECU"}
            >
              {STATUT_CONSEIL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Date de réception"
            htmlFor="dateReception"
            hint="L'échéance cible est +5 jours ouvrés si non renseignée."
          >
            <input
              id="dateReception"
              name="dateReception"
              type="date"
              defaultValue={toDateInputValue(values?.dateReception ?? new Date())}
            />
          </Field>
          <Field label="Date d'échéance" htmlFor="dateEcheance">
            <input
              id="dateEcheance"
              name="dateEcheance"
              type="date"
              defaultValue={toDateInputValue(values?.dateEcheance)}
            />
          </Field>
          <Field label="Date de réponse" htmlFor="dateReponse">
            <input
              id="dateReponse"
              name="dateReponse"
              type="date"
              defaultValue={toDateInputValue(values?.dateReponse)}
            />
          </Field>
          <Field label="Date de clôture" htmlFor="dateCloture">
            <input
              id="dateCloture"
              name="dateCloture"
              type="date"
              defaultValue={toDateInputValue(values?.dateCloture)}
            />
          </Field>
        </div>

        <Field label="Commentaires" htmlFor="commentaires">
          <textarea
            id="commentaires"
            name="commentaires"
            rows={2}
            defaultValue={values?.commentaires ?? ""}
          />
        </Field>
      </FormSection>

      <FormSection title="Réflexion / analyse" defaultOpen={false}>
        <Field label="Raisonnement / analyse" htmlFor="raisonnement">
          <textarea
            id="raisonnement"
            name="raisonnement"
            rows={4}
            defaultValue={values?.raisonnement ?? ""}
          />
        </Field>
      </FormSection>

      <FormSection title="Tags" defaultOpen={false}>
        <Field label="Tags" htmlFor="tags" hint="Ex. LSubv, gouvernance">
          <input id="tags" name="tags" defaultValue={values?.tags ?? ""} />
        </Field>
      </FormSection>

      {showCreerTache ? (
        <label className="check-field">
          <input type="checkbox" name="creerTache" value="1" defaultChecked />
          Créer une tâche liée (catégorie Conseil)
        </label>
      ) : null}

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={resolvedCancel} variant="ghost" scroll={false}>
          Annuler
        </BtnLink>
      </div>
    </form>
  );
}

export function ControleSCIForm({
  action,
  users,
  values,
  cancelHref,
  submitLabel,
  sectionKey,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: ControleValues;
  cancelHref: string;
  submitLabel: string;
  sectionKey?: string;
}) {
  const resolvedCancel = sectionKey
    ? sectionCancelHref(cancelHref, sectionKey)
    : cancelHref;
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {sectionKey ? (
        <input type="hidden" name="sectionKey" value={sectionKey} />
      ) : null}

      <FormSection title="Description">
        <Field label="Nom *" htmlFor="nom">
          <input
            id="nom"
            name="nom"
            required
            defaultValue={values?.nom ?? ""}
            placeholder="Ex. Revue des accès applicatifs"
          />
        </Field>

        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={values?.description ?? ""}
          />
        </Field>

        <div className="form-grid">
          <Field label="Processus concerné *" htmlFor="processusConcerne">
            <input
              id="processusConcerne"
              name="processusConcerne"
              required
              defaultValue={values?.processusConcerne ?? ""}
              placeholder="Ex. Gestion des accès"
            />
          </Field>
          <Field label="Type de contrôle" htmlFor="typeControle">
            <select
              id="typeControle"
              name="typeControle"
              defaultValue={values?.typeControle ?? "MANUEL"}
            >
              {TYPE_CONTROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Pilotage">
        <div className="form-grid">
          <Field label="Responsable" htmlFor="responsableId">
            <select
              id="responsableId"
              name="responsableId"
              required
              defaultValue={values?.responsableId ?? users[0]?.id}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statut" htmlFor="statut">
            <select
              id="statut"
              name="statut"
              defaultValue={values?.statut ?? "ACTIF"}
            >
              {STATUT_CONTROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fréquence" htmlFor="frequence">
            <select
              id="frequence"
              name="frequence"
              required
              defaultValue={values?.frequence ?? "TRIMESTRIELLE"}
            >
              {FREQUENCE_CONTROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Fenêtre de déclenchement (jours)"
            htmlFor="fenetreDeclenchementJours"
            hint="L'action n'apparaît dans Mes actions que dans cette fenêtre avant l'échéance."
          >
            <input
              id="fenetreDeclenchementJours"
              name="fenetreDeclenchementJours"
              type="number"
              min={0}
              defaultValue={values?.fenetreDeclenchementJours ?? 30}
            />
          </Field>
          <Field
            label="Délai de réalisation (jours)"
            htmlFor="delaiRealisationJours"
          >
            <input
              id="delaiRealisationJours"
              name="delaiRealisationJours"
              type="number"
              min={0}
              defaultValue={values?.delaiRealisationJours ?? ""}
            />
          </Field>
          <Field label="Dernière réalisation" htmlFor="dateDerniereRealisation">
            <input
              id="dateDerniereRealisation"
              name="dateDerniereRealisation"
              type="date"
              defaultValue={toDateInputValue(values?.dateDerniereRealisation)}
            />
          </Field>
          <Field label="Prochaine échéance" htmlFor="dateProchaineEcheance">
            <input
              id="dateProchaineEcheance"
              name="dateProchaineEcheance"
              type="date"
              defaultValue={toDateInputValue(values?.dateProchaineEcheance)}
            />
          </Field>
        </div>

        <Field label="Commentaires" htmlFor="commentaires">
          <textarea
            id="commentaires"
            name="commentaires"
            rows={2}
            defaultValue={values?.commentaires ?? ""}
          />
        </Field>
      </FormSection>

      <FormSection title="Tags" defaultOpen={false}>
        <Field label="Tags" htmlFor="tags" hint="Séparés par des virgules">
          <input id="tags" name="tags" defaultValue={values?.tags ?? ""} />
        </Field>
      </FormSection>

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={resolvedCancel} variant="ghost" scroll={false}>
          Annuler
        </BtnLink>
      </div>
    </form>
  );
}

export function RisqueForm({
  action,
  users,
  values,
  cancelHref,
  submitLabel,
  sectionKey,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: RisqueValues;
  cancelHref: string;
  submitLabel: string;
  sectionKey?: string;
}) {
  const resolvedCancel = sectionKey
    ? sectionCancelHref(cancelHref, sectionKey)
    : cancelHref;
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {sectionKey ? (
        <input type="hidden" name="sectionKey" value={sectionKey} />
      ) : null}

      <FormSection title="Description">
        <Field label="Nom *" htmlFor="nom">
          <input
            id="nom"
            name="nom"
            required
            defaultValue={values?.nom ?? ""}
            placeholder="Ex. Perte de données critiques"
          />
        </Field>

        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={values?.description ?? ""}
          />
        </Field>

        <div className="form-grid">
          <Field label="Catégorie" htmlFor="categorie">
            <select
              id="categorie"
              name="categorie"
              required
              defaultValue={values?.categorie ?? "OPERATIONNEL"}
            >
              {CATEGORIE_RISQUE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Processus" htmlFor="processus">
            <input
              id="processus"
              name="processus"
              defaultValue={values?.processus ?? ""}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Évaluation">
        <div className="form-grid">
          <Field label="Probabilité inhérente (1–5)" htmlFor="probabilite">
            <select
              id="probabilite"
              name="probabilite"
              defaultValue={String(values?.probabilite ?? 1)}
            >
              {ECHELLE_RISQUE.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Impact inhérent (1–5)" htmlFor="impact">
            <select
              id="impact"
              name="impact"
              defaultValue={String(values?.impact ?? 1)}
            >
              {ECHELLE_RISQUE.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Probabilité résiduelle (1–5)"
            htmlFor="probabiliteResiduelle"
            hint="Après maîtrise — laisser vide = égale à l'inhérent"
          >
            <select
              id="probabiliteResiduelle"
              name="probabiliteResiduelle"
              defaultValue={
                values?.probabiliteResiduelle != null
                  ? String(values.probabiliteResiduelle)
                  : ""
              }
            >
              <option value="">— (inhérent)</option>
              {ECHELLE_RISQUE.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Impact résiduel (1–5)" htmlFor="impactResiduel">
            <select
              id="impactResiduel"
              name="impactResiduel"
              defaultValue={
                values?.impactResiduel != null
                  ? String(values.impactResiduel)
                  : ""
              }
            >
              <option value="">— (inhérent)</option>
              {ECHELLE_RISQUE.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Stratégie de traitement" htmlFor="strategie">
            <select
              id="strategie"
              name="strategie"
              defaultValue={values?.strategie ?? ""}
            >
              <option value="">À définir</option>
              {STRATEGIE_RISQUE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Justification de l'évaluation / traitement"
          htmlFor="justificationEvaluation"
        >
          <textarea
            id="justificationEvaluation"
            name="justificationEvaluation"
            rows={3}
            defaultValue={values?.justificationEvaluation ?? ""}
          />
        </Field>
      </FormSection>

      <FormSection title="Pilotage">
        <div className="form-grid">
          <Field label="Responsable" htmlFor="responsableId">
            <select
              id="responsableId"
              name="responsableId"
              required
              defaultValue={values?.responsableId ?? users[0]?.id}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statut" htmlFor="statut">
            <select
              id="statut"
              name="statut"
              defaultValue={values?.statut ?? "IDENTIFIE"}
            >
              {STATUT_RISQUE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Commentaires" htmlFor="commentaires">
          <textarea
            id="commentaires"
            name="commentaires"
            rows={2}
            defaultValue={values?.commentaires ?? ""}
          />
        </Field>
      </FormSection>

      <FormSection title="Tags / métadonnées" defaultOpen={false}>
        <Field label="Tags" htmlFor="tags">
          <input id="tags" name="tags" defaultValue={values?.tags ?? ""} />
        </Field>
      </FormSection>

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={resolvedCancel} variant="ghost" scroll={false}>
          Annuler
        </BtnLink>
      </div>
    </form>
  );
}

export function DocumentForm({
  action,
  users,
  values,
  cancelHref,
  submitLabel,
  sectionKey,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: DocumentValues;
  cancelHref: string;
  submitLabel: string;
  sectionKey?: string;
}) {
  const resolvedCancel = sectionKey
    ? sectionCancelHref(cancelHref, sectionKey)
    : cancelHref;
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {sectionKey ? (
        <input type="hidden" name="sectionKey" value={sectionKey} />
      ) : null}

      <FormSection title="Description">
        <Field label="Nom *" htmlFor="nom">
          <input
            id="nom"
            name="nom"
            required
            defaultValue={values?.nom ?? ""}
            placeholder="Ex. Procédure de validation budgétaire"
          />
        </Field>

        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={values?.description ?? ""}
          />
        </Field>

        <div className="form-grid">
          <Field label="Type" htmlFor="typeDocument">
            <select
              id="typeDocument"
              name="typeDocument"
              defaultValue={values?.typeDocument ?? "AUTRE"}
            >
              {TYPE_DOCUMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Version" htmlFor="version">
            <input
              id="version"
              name="version"
              defaultValue={values?.version ?? ""}
              placeholder="1.0"
            />
          </Field>
          <Field
            label="Lien Confluence / URL"
            htmlFor="reference"
            hint="Le contenu détaillé reste dans Confluence — inventaire uniquement."
          >
            <input
              id="reference"
              name="reference"
              defaultValue={values?.reference ?? ""}
              placeholder="https://confluence…"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Pilotage">
        <div className="form-grid">
          <Field label="Responsable" htmlFor="responsableId">
            <select
              id="responsableId"
              name="responsableId"
              defaultValue={values?.responsableId ?? ""}
            >
              <option value="">Non assigné</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statut" htmlFor="statut">
            <select
              id="statut"
              name="statut"
              defaultValue={values?.statut ?? "BROUILLON"}
            >
              {STATUT_DOCUMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fréquence de revue" htmlFor="frequenceRevue">
            <select
              id="frequenceRevue"
              name="frequenceRevue"
              defaultValue={values?.frequenceRevue ?? ""}
            >
              <option value="">Non définie</option>
              {FREQUENCE_REVUE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fenêtre revue (jours)" htmlFor="fenetreDeclenchementJours">
            <input
              id="fenetreDeclenchementJours"
              name="fenetreDeclenchementJours"
              type="number"
              min={0}
              defaultValue={values?.fenetreDeclenchementJours ?? 30}
            />
          </Field>
          <Field label="Date d'approbation" htmlFor="dateApprobation">
            <input
              id="dateApprobation"
              name="dateApprobation"
              type="date"
              defaultValue={toDateInputValue(values?.dateApprobation)}
            />
          </Field>
          <Field label="Dernière revue" htmlFor="dateDerniereRevue">
            <input
              id="dateDerniereRevue"
              name="dateDerniereRevue"
              type="date"
              defaultValue={toDateInputValue(values?.dateDerniereRevue)}
            />
          </Field>
          <Field label="Prochaine revue" htmlFor="prochaineRevue">
            <input
              id="prochaineRevue"
              name="prochaineRevue"
              type="date"
              defaultValue={toDateInputValue(values?.prochaineRevue)}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Protection des données (LPD)" defaultOpen={false}>
        <label className="check-field">
          <input
            type="checkbox"
            name="contientDonneesPersonnelles"
            value="1"
            defaultChecked={values?.contientDonneesPersonnelles ?? false}
          />
          Contient des données personnelles
        </label>
        <Field label="Niveau de confidentialité" htmlFor="niveauConfidentialite">
          <select
            id="niveauConfidentialite"
            name="niveauConfidentialite"
            defaultValue={values?.niveauConfidentialite ?? "INTERNE"}
          >
            {NIVEAU_CONFIDENTIALITE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>

      <FormSection title="Tags" defaultOpen={false}>
        <Field label="Tags" htmlFor="tags">
          <input id="tags" name="tags" defaultValue={values?.tags ?? ""} />
        </Field>
      </FormSection>

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={resolvedCancel} variant="ghost" scroll={false}>
          Annuler
        </BtnLink>
      </div>
    </form>
  );
}

export function MissionForm({
  action,
  users,
  values,
  cancelHref,
  submitLabel,
  types,
  templates,
  descriptifs,
  draftActions = false,
  sectionKey,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: MissionValues;
  cancelHref: string;
  submitLabel: string;
  types: MissionTypeOpt[];
  templates?: MissionTemplateOpt[];
  descriptifs?: MissionDescriptifOpt[];
  draftActions?: boolean;
  sectionKey?: string;
}) {
  const defaultTypeId = values?.typeId ?? types[0]?.id ?? "";
  const templatesForType = (templates ?? []).filter(
    (t) => !defaultTypeId || t.typeId === defaultTypeId,
  );
  const descriptifsForType = (descriptifs ?? []).filter(
    (d) => !defaultTypeId || d.typeId === defaultTypeId,
  );

  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {sectionKey ? (
        <input type="hidden" name="sectionKey" value={sectionKey} />
      ) : null}

      <FormSection title="Description">
        {values?.id ? (
          <Field label="Code *" htmlFor="code">
            <input
              id="code"
              name="code"
              required
              defaultValue={values.code ?? ""}
              placeholder="MIS-0001"
              pattern="[A-Za-z]{2,5}-[0-9]{1,6}"
              title="Format MIS-0001"
            />
          </Field>
        ) : null}
        <Field label="Titre *" htmlFor="titre">
          <input
            id="titre"
            name="titre"
            required
            defaultValue={values?.titre ?? ""}
            placeholder="Ex. Audit interne conformité 2026"
          />
        </Field>

        <Field label="Type de mission *" htmlFor="typeId">
          <select
            id="typeId"
            name="typeId"
            required
            defaultValue={defaultTypeId}
          >
            {types.map((o) => (
              <option key={o.id} value={o.id}>
                {o.libelle}
              </option>
            ))}
          </select>
        </Field>

        {templates && templates.length > 0 ? (
          <Field label="Template" htmlFor="templateId">
            <select
              id="templateId"
              name="templateId"
              defaultValue={values?.templateId ?? templatesForType[0]?.id ?? ""}
            >
              {templatesForType.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.libelle}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        {descriptifs && descriptifs.length > 0 ? (
          <Field
            label="Descriptif standard"
            htmlFor="descriptifPresetId"
            hint="Ou laissez vide et saisissez un descriptif libre."
          >
            <select
              id="descriptifPresetId"
              name="descriptifPresetId"
              defaultValue={values?.descriptifPresetId ?? ""}
            >
              <option value="">Mission spécifique (libre)</option>
              {descriptifsForType.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.libelle}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <Field label="Descriptif libre" htmlFor="descriptifLibre">
          <textarea
            id="descriptifLibre"
            name="descriptifLibre"
            rows={2}
            defaultValue={values?.descriptifLibre ?? ""}
          />
        </Field>

        <Field label="Nature / périmètre" htmlFor="nature">
          <textarea
            id="nature"
            name="nature"
            rows={3}
            defaultValue={values?.nature ?? ""}
          />
        </Field>
      </FormSection>

      <FormSection title="Pilotage">
        <div className="form-grid">
          <Field label="Responsable" htmlFor="responsableId">
            <select
              id="responsableId"
              name="responsableId"
              required
              defaultValue={values?.responsableId ?? users[0]?.id}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statut" htmlFor="statut">
            <select
              id="statut"
              name="statut"
              defaultValue={values?.statut ?? "PLANIFIE"}
            >
              {STATUT_MISSION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date de début" htmlFor="dateDebut">
            <input
              id="dateDebut"
              name="dateDebut"
              type="date"
              defaultValue={toDateInputValue(values?.dateDebut)}
            />
          </Field>
          <Field label="Date de fin" htmlFor="dateFin">
            <input
              id="dateFin"
              name="dateFin"
              type="date"
              defaultValue={toDateInputValue(values?.dateFin)}
            />
          </Field>
        </div>

        <Field label="Commentaires" htmlFor="commentaires">
          <textarea
            id="commentaires"
            name="commentaires"
            rows={2}
            defaultValue={values?.commentaires ?? ""}
          />
        </Field>
      </FormSection>

      <FormSection title="Réflexion / analyse" defaultOpen={false}>
        <Field label="Réflexion / analyse" htmlFor="analyseTravaux">
          <textarea
            id="analyseTravaux"
            name="analyseTravaux"
            rows={4}
            defaultValue={values?.analyseTravaux ?? ""}
          />
        </Field>
      </FormSection>

      <FormSection title="Protection des données (LPD)" defaultOpen={false}>
        <label className="check-field">
          <input
            type="checkbox"
            name="contientDonneesPersonnelles"
            value="1"
            defaultChecked={values?.contientDonneesPersonnelles ?? false}
          />
          Contient des données personnelles
        </label>
        <Field label="Niveau de confidentialité" htmlFor="niveauConfidentialite">
          <select
            id="niveauConfidentialite"
            name="niveauConfidentialite"
            defaultValue={values?.niveauConfidentialite ?? "INTERNE"}
          >
            {NIVEAU_CONFIDENTIALITE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>

      <FormSection title="Tags" defaultOpen={false}>
        <Field label="Tags" htmlFor="tags" hint="Séparés par des virgules">
          <input id="tags" name="tags" defaultValue={values?.tags ?? ""} />
        </Field>
      </FormSection>

      {draftActions ? (
        <SectionSaveActions
          baseHref={cancelHref}
          sectionKey={sectionKey}
          cancelHref={cancelHref}
          finalizeLabel={submitLabel}
        />
      ) : (
        <div className="form-actions">
          <SubmitButton>{submitLabel}</SubmitButton>
          <BtnLink
            href={
              sectionKey
                ? sectionCancelHref(cancelHref, sectionKey)
                : cancelHref
            }
            variant="ghost"
            scroll={false}
          >
            Annuler
          </BtnLink>
        </div>
      )}
    </form>
  );
}

/** @deprecated Utiliser MissionForm */
export const AuditForm = MissionForm;

export function ProcessusForm({
  action,
  users,
  values,
  cancelHref,
  submitLabel,
  section = "ALL",
  draftActions = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: ProcessusValues;
  cancelHref: string;
  submitLabel: string;
  /** ALL = création ; sinon une box d’édition. */
  section?: "ALL" | "INFOS_GENERALES" | "LPD";
  draftActions?: boolean;
}) {
  const showInfos = section === "ALL" || section === "INFOS_GENERALES";
  const showLpd = section === "ALL" || section === "LPD";

  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {section !== "ALL" ? (
        <input type="hidden" name="sectionKey" value={section} />
      ) : null}

      {showInfos ? (
        <FormSection title="Informations" defaultOpen>
          <Field label="Nom *" htmlFor="nom">
            <input
              id="nom"
              name="nom"
              required
              defaultValue={values?.nom ?? ""}
              placeholder="Ex. Réaliser un audit"
            />
          </Field>
          <Field
            label="Description courte"
            htmlFor="description"
            hint="Le détail procédural reste dans Confluence."
          >
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={values?.description ?? ""}
            />
          </Field>
          <Field
            label="Lien Confluence"
            htmlFor="reference"
            hint="Procédure détaillée (comment on le fait)."
          >
            <input
              id="reference"
              name="reference"
              defaultValue={values?.reference ?? ""}
              placeholder="https://confluence…"
            />
          </Field>
          <div className="form-grid">
            <Field label="Responsable" htmlFor="responsableId">
              <select
                id="responsableId"
                name="responsableId"
                required
                defaultValue={values?.responsableId ?? users[0]?.id}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Statut" htmlFor="statut">
              <select
                id="statut"
                name="statut"
                defaultValue={values?.statut ?? "ACTIF"}
              >
                {STATUT_PROCESSUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </FormSection>
      ) : null}

      {showLpd ? (
        <FormSection
          title="Protection des données & tags"
          defaultOpen={section !== "ALL"}
        >
          <label className="check-field">
            <input
              type="checkbox"
              name="contientDonneesPersonnelles"
              value="1"
              defaultChecked={values?.contientDonneesPersonnelles ?? false}
            />
            Contient des données personnelles
          </label>
          <Field
            label="Niveau de confidentialité"
            htmlFor="niveauConfidentialite"
          >
            <select
              id="niveauConfidentialite"
              name="niveauConfidentialite"
              defaultValue={values?.niveauConfidentialite ?? "INTERNE"}
            >
              {NIVEAU_CONFIDENTIALITE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tags" htmlFor="tags" hint="Séparés par des virgules">
            <input id="tags" name="tags" defaultValue={values?.tags ?? ""} />
          </Field>
        </FormSection>
      ) : null}

      {draftActions ? (
        <SectionSaveActions
          baseHref={cancelHref}
          sectionKey={section !== "ALL" ? section : undefined}
          cancelHref={cancelHref}
          finalizeLabel={submitLabel}
        />
      ) : (
        <div className="form-actions">
          <SubmitButton>{submitLabel}</SubmitButton>
          <BtnLink
            href={
              section !== "ALL"
                ? sectionCancelHref(cancelHref, section)
                : cancelHref
            }
            variant="ghost"
            scroll={false}
          >
            Annuler
          </BtnLink>
        </div>
      )}
    </form>
  );
}
