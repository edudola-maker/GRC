import { toDateInputValue } from "@/lib/form";
import {
  CATEGORIE_RISQUE_OPTIONS,
  CATEGORIE_TACHE_OPTIONS,
  ECHELLE_RISQUE,
  FREQUENCE_CONTROLE_OPTIONS,
  FREQUENCE_REVUE_OPTIONS,
  PRIORITE_OPTIONS,
  STATUT_AUDIT_OPTIONS,
  STATUT_CONSEIL_OPTIONS,
  STATUT_CONTROLE_OPTIONS,
  STATUT_DOCUMENT_OPTIONS,
  STATUT_PROJET_OPTIONS,
  STATUT_RISQUE_OPTIONS,
  STATUT_TACHE_OPTIONS,
  STRATEGIE_RISQUE_OPTIONS,
  TAXINOMIE_OPTIONS,
  TYPE_CONTROLE_OPTIONS,
  TYPE_DOCUMENT_OPTIONS,
  TYPE_MISSION_OPTIONS,
} from "@/lib/catalog";
import { SubmitButton } from "@/components/FormControls";
import { BtnLink } from "@/components/ui";

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
};

type TacheValues = {
  id?: string;
  titre?: string;
  description?: string | null;
  responsableId?: string;
  projetId?: string | null;
  conseilId?: string | null;
  controleSCIId?: string | null;
  auditId?: string | null;
  documentId?: string | null;
  recommandationId?: string | null;
  dateEcheance?: Date | string | null;
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
};

type AuditValues = {
  id?: string;
  titre?: string;
  typeMission?: string;
  perimetre?: string | null;
  taxinomie?: string | null;
  tags?: string | null;
  responsableId?: string;
  dateDebut?: Date | string | null;
  dateFin?: Date | string | null;
  statut?: string;
  commentaires?: string | null;
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
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: ProjetValues;
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

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

      <div className="form-grid">
        <Field label="Taxinomie" htmlFor="taxinomie">
          <select
            id="taxinomie"
            name="taxinomie"
            defaultValue={values?.taxinomie ?? ""}
          >
            <option value="">—</option>
            {TAXINOMIE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tags" htmlFor="tags" hint="Séparés par des virgules">
          <input
            id="tags"
            name="tags"
            defaultValue={values?.tags ?? ""}
            placeholder="Ex. gouvernance, SCI"
          />
        </Field>
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

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={cancelHref} variant="ghost">
          Annuler
        </BtnLink>
      </div>
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
  audits,
  documents,
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
  audits?: Opt[];
  documents?: Opt[];
}) {
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
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
      {!audits && values?.auditId ? (
        <input type="hidden" name="auditId" value={values.auditId} />
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
            defaultValue={
              values?.categorie ?? defaultCategorie ?? "AUTRE"
            }
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

        <Field label="Date d'échéance" htmlFor="dateEcheance">
          <input
            id="dateEcheance"
            name="dateEcheance"
            type="date"
            defaultValue={toDateInputValue(values?.dateEcheance)}
          />
        </Field>
      </div>

      {(conseils || controles || audits || documents) && (
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
          {audits ? (
            <Field label="Audit lié" htmlFor="auditId">
              <select
                id="auditId"
                name="auditId"
                defaultValue={values?.auditId ?? ""}
              >
                <option value="">Aucun</option>
                {audits.map((a) => (
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
        <BtnLink href={cancelHref} variant="ghost">
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
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: ConseilValues;
  cancelHref: string;
  submitLabel: string;
  showCreerTache?: boolean;
}) {
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

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
        <Field label="Taxinomie" htmlFor="taxinomie">
          <select id="taxinomie" name="taxinomie" defaultValue={values?.taxinomie ?? ""}>
            <option value="">—</option>
            {TAXINOMIE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Tags" htmlFor="tags" hint="Ex. LSubv, gouvernance">
          <input id="tags" name="tags" defaultValue={values?.tags ?? ""} />
        </Field>
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

      {showCreerTache ? (
        <label className="check-field">
          <input type="checkbox" name="creerTache" value="1" defaultChecked />
          Créer une tâche liée (catégorie Conseil)
        </label>
      ) : null}

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={cancelHref} variant="ghost">
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
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: ControleValues;
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <Field label="Nom *" htmlFor="nom">
        <input
          id="nom"
          name="nom"
          required
          defaultValue={values?.nom ?? ""}
          placeholder="Ex. Revue des accès applicatifs"
        />
      </Field>

      <Field label="Processus concerné *" htmlFor="processusConcerne">
        <input
          id="processusConcerne"
          name="processusConcerne"
          required
          defaultValue={values?.processusConcerne ?? ""}
          placeholder="Ex. Gestion des accès"
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
        <Field label="Type de contrôle" htmlFor="typeControle">
          <select
            id="typeControle"
            name="typeControle"
            defaultValue={values?.typeControle ?? "MANUEL"}
          >
            {TYPE_CONTROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
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
        <Field label="Taxinomie" htmlFor="taxinomie">
          <select
            id="taxinomie"
            name="taxinomie"
            defaultValue={values?.taxinomie ?? ""}
          >
            <option value="">—</option>
            {TAXINOMIE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tags" htmlFor="tags" hint="Séparés par des virgules">
          <input id="tags" name="tags" defaultValue={values?.tags ?? ""} />
        </Field>
        <Field label="Statut" htmlFor="statut">
          <select
            id="statut"
            name="statut"
            defaultValue={values?.statut ?? "A_REALISER"}
          >
            {STATUT_CONTROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={cancelHref} variant="ghost">
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
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: RisqueValues;
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

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
        <Field label="Processus" htmlFor="processus">
          <input
            id="processus"
            name="processus"
            defaultValue={values?.processus ?? ""}
          />
        </Field>
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
        <Field label="Stratégie de traitement" htmlFor="strategie">
          <select id="strategie" name="strategie" defaultValue={values?.strategie ?? ""}>
            <option value="">À définir</option>
            {STRATEGIE_RISQUE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Taxinomie" htmlFor="taxinomie">
          <select id="taxinomie" name="taxinomie" defaultValue={values?.taxinomie ?? ""}>
            <option value="">—</option>
            {TAXINOMIE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Tags" htmlFor="tags">
          <input id="tags" name="tags" defaultValue={values?.tags ?? ""} />
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
      </div>

      <Field label="Commentaires" htmlFor="commentaires">
        <textarea
          id="commentaires"
          name="commentaires"
          rows={2}
          defaultValue={values?.commentaires ?? ""}
        />
      </Field>

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={cancelHref} variant="ghost">
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
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: DocumentValues;
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

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
        <Field label="Taxinomie" htmlFor="taxinomie">
          <select id="taxinomie" name="taxinomie" defaultValue={values?.taxinomie ?? ""}>
            <option value="">—</option>
            {TAXINOMIE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Tags" htmlFor="tags">
          <input id="tags" name="tags" defaultValue={values?.tags ?? ""} />
        </Field>
        <Field label="Version" htmlFor="version">
          <input
            id="version"
            name="version"
            defaultValue={values?.version ?? ""}
            placeholder="1.0"
          />
        </Field>
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

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={cancelHref} variant="ghost">
          Annuler
        </BtnLink>
      </div>
    </form>
  );
}

export function AuditForm({
  action,
  users,
  values,
  cancelHref,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: AuditValues;
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <Field label="Titre *" htmlFor="titre">
        <input
          id="titre"
          name="titre"
          required
          defaultValue={values?.titre ?? ""}
          placeholder="Ex. Audit interne conformité 2026"
        />
      </Field>

      <Field label="Type de mission *" htmlFor="typeMission">
        <select
          id="typeMission"
          name="typeMission"
          defaultValue={values?.typeMission ?? "AUDIT"}
        >
          {TYPE_MISSION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Périmètre" htmlFor="perimetre">
        <textarea
          id="perimetre"
          name="perimetre"
          rows={3}
          defaultValue={values?.perimetre ?? ""}
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
            defaultValue={values?.statut ?? "PLANIFIE"}
          >
            {STATUT_AUDIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Taxinomie" htmlFor="taxinomie">
          <select
            id="taxinomie"
            name="taxinomie"
            defaultValue={values?.taxinomie ?? ""}
          >
            <option value="">—</option>
            {TAXINOMIE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tags" htmlFor="tags" hint="Séparés par des virgules">
          <input id="tags" name="tags" defaultValue={values?.tags ?? ""} />
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

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={cancelHref} variant="ghost">
          Annuler
        </BtnLink>
      </div>
    </form>
  );
}
