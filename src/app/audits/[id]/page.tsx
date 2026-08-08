import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  SubmitButton,
} from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import {
  MissionEquipePanel,
  type MissionEquipeMembre,
} from "@/components/missions/MissionEquipePanel";
import { PageHeader, BtnLink } from "@/components/ui";
import {
  archiveMission,
  createRecommandation,
  createTacheDepuisMission,
  createTacheDepuisReco,
  deleteRecommandation,
  linkDocument,
  unarchiveMission,
  updateRecommandation,
} from "../actions";
import {
  CATEGORIE_TACHE_LABELS,
  STATUT_MISSION_LABELS,
  STATUT_RECO_LABELS,
  STATUT_TACHE_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { STATUT_RECO_OPTIONS, TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { toDateInputValue } from "@/lib/form";
import { deriveInitiales } from "@/lib/initiales";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { parseTags } from "@/lib/tags";

export const dynamic = "force-dynamic";

const RECO_STATUTS_CLOS = ["CLOTUREE", "ANNULEE"] as const;
const MISSION_STATUTS_CLOS = ["TERMINE", "ANNULE"] as const;

type TemplateDefinition = {
  sections?: Array<{
    key: string;
    title: string;
    order?: number;
    defaultOpen?: boolean;
  }>;
};

export default async function MissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [mission, users, documentsDispo, roles] = await Promise.all([
    prisma.mission.findUnique({
      where: { id },
      include: {
        responsable: true,
        type: true,
        template: true,
        descriptifPreset: true,
        unite: true,
        creePar: true,
        modifiePar: true,
        membres: {
          include: {
            utilisateur: true,
            roles: { include: { role: true } },
          },
          orderBy: { utilisateur: { nom: "asc" } },
        },
        checklistItems: { orderBy: { ordre: "asc" } },
        validationPoints: { orderBy: { code: "asc" } },
        recommandations: {
          where: { archive: false },
          include: { responsable: true },
          orderBy: [{ dateEcheance: "asc" }, { creeLe: "desc" }],
        },
        taches: {
          include: { responsable: true },
          orderBy: { dateEcheance: "asc" },
        },
        documents: {
          include: { document: true },
          orderBy: { creeLe: "desc" },
        },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
    prisma.document.findMany({
      where: { archive: false, uniteId },
      orderBy: { nom: "asc" },
      select: { id: true, nom: true },
    }),
    prisma.missionRole.findMany({
      where: { actif: true },
      orderBy: { ordre: "asc" },
    }),
  ]);
  if (!mission) notFound();

  const linkedIds = new Set(mission.documents.map((d) => d.documentId));
  const docsALier = documentsDispo.filter((d) => !linkedIds.has(d.id));
  const missionClos = (MISSION_STATUTS_CLOS as readonly string[]).includes(
    mission.statut,
  );
  const tags = parseTags(mission.tags);
  const editable = !mission.archive;

  const def = (mission.template.definition ?? {}) as TemplateDefinition;
  const sections =
    def.sections?.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) ??
    [
      { key: "VUE_ENSEMBLE", title: "Vue d'ensemble", defaultOpen: true },
      { key: "PLANIFICATION", title: "1. Planification", defaultOpen: true },
      { key: "SUBSTANTIF", title: "2. Substantif", defaultOpen: false },
      { key: "RECOMMANDATIONS", title: "3. Recommandations", defaultOpen: false },
      { key: "RAPPORT", title: "4. Rapport", defaultOpen: false },
      { key: "SUIVI", title: "5. Suivi des recommandations", defaultOpen: false },
    ];

  const equipe: MissionEquipeMembre[] = mission.membres.map((m) => ({
    id: m.id,
    utilisateurId: m.utilisateurId,
    nom: m.utilisateur.nom,
    initiales:
      m.utilisateur.initiales?.trim() ||
      deriveInitiales(m.utilisateur.nom),
    roleIds: m.roles.map((r) => r.roleId),
    roleLabels: m.roles.map((r) => r.role.libelle),
  }));

  const descriptif =
    mission.descriptifPreset?.libelle ??
    mission.descriptifLibre ??
    "—";

  const openFor = (key: string, fallback: boolean) =>
    sections.find((s) => s.key === key)?.defaultOpen ?? fallback;

  return (
    <>
      <BackLink href="/audits" label="← Retour aux missions" />
      <PageHeader
        title={`${mission.code} — ${mission.titre}`}
        description={`${mission.type.libelle} · ${mission.template.libelle}`}
        actions={
          <>
            {editable ? (
              <BtnLink href={`/audits/${mission.id}/modifier`}>Modifier</BtnLink>
            ) : null}
            {mission.archive ? (
              <ConfirmActionButton
                action={unarchiveMission}
                id={mission.id}
                label="Désarchiver"
                confirmMessage="Remettre cette mission dans la liste active ?"
              />
            ) : (
              <ConfirmActionButton
                action={archiveMission}
                id={mission.id}
                label="Archiver"
                confirmMessage="Archiver cette mission ? L’historique et les recommandations sont conservés."
              />
            )}
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {mission.archive ? (
        <div className="flash flash--warn" role="status">
          Cette mission est archivée (soft-delete).
        </div>
      ) : null}
      {!missionClos &&
      mission.dateFin &&
      urgenceEcheance(mission.dateFin, false) === "retard" ? (
        <div className="flash flash--error" role="status">
          Date de fin dépassée ({formatDate(mission.dateFin)}).
        </div>
      ) : null}

      <CollapsibleSection
        title="Vue d'ensemble"
        defaultOpen={openFor("VUE_ENSEMBLE", true)}
      >
        <dl className="kv">
          <div>
            <dt>Code</dt>
            <dd>{mission.code}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{mission.type.libelle}</dd>
          </div>
          <div>
            <dt>Descriptif</dt>
            <dd>{descriptif}</dd>
          </div>
          <div>
            <dt>Unité</dt>
            <dd>{mission.unite.nom}</dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>
              <span className="initiales-badge" title={mission.responsable.nom}>
                {mission.responsable.initiales?.trim() ||
                  deriveInitiales(mission.responsable.nom)}
              </span>{" "}
              {mission.responsable.nom}
            </dd>
          </div>
          <div>
            <dt>Équipe</dt>
            <dd>
              {equipe.length
                ? equipe
                    .map((m) => `${m.initiales} (${m.roleLabels.join(", ") || "—"})`)
                    .join(" · ")
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>{STATUT_MISSION_LABELS[mission.statut] ?? mission.statut}</dd>
          </div>
          <div>
            <dt>Dates</dt>
            <dd>
              {formatDate(mission.dateDebut)} → {formatDate(mission.dateFin)}
            </dd>
          </div>
          <div>
            <dt>Nature / périmètre</dt>
            <dd>{mission.nature ?? "—"}</dd>
          </div>
        </dl>
        {mission.commentaires ? (
          <p className="detail-note">{mission.commentaires}</p>
        ) : null}
        <p className="detail-trace">
          Créé par {mission.creePar.nom} · Modifié par {mission.modifiePar.nom} ·{" "}
          {formatDate(mission.modifieLe)}
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        title="1. Planification"
        defaultOpen={openFor("PLANIFICATION", true)}
      >
        <CollapsibleSection title="Équipe de mission" defaultOpen>
          <p className="muted" style={{ marginTop: 0 }}>
            Rôles propres à la mission (distincts du rôle applicatif). Plusieurs
            rôles possibles par personne. Affichage compact via les initiales.
          </p>
          <MissionEquipePanel
            missionId={mission.id}
            membres={equipe}
            roles={roles}
            utilisateurs={users.map((u) => ({
              id: u.id,
              nom: u.nom,
              initiales: u.initiales ?? null,
            }))}
            editable={editable}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Check-list qualité" defaultOpen>
          {mission.checklistItems.filter((c) => c.sectionKey === "PLANIFICATION")
            .length === 0 ? (
            <p className="empty">
              Aucun point pour l&apos;instant — les check-lists seront définies par
              template (contenu métier à venir).
            </p>
          ) : (
            <ul className="check-list">
              {mission.checklistItems
                .filter((c) => c.sectionKey === "PLANIFICATION")
                .map((c) => (
                  <li key={c.id}>
                    {c.fait ? "☑" : "☐"} {c.libelle}
                  </li>
                ))}
            </ul>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Validations" defaultOpen>
          {mission.validationPoints.filter(
            (v) => v.sectionKey === "PLANIFICATION",
          ).length === 0 ? (
            <p className="empty">
              Points de validation (Préparer → Soumettre → Valider) prévus par
              l&apos;architecture — contenu à définir progressivement.
            </p>
          ) : (
            <ul className="entity-list entity-list--compact">
              {mission.validationPoints
                .filter((v) => v.sectionKey === "PLANIFICATION")
                .map((v) => (
                  <li key={v.id}>
                    {v.libelle} — {v.statut} (v{v.contenuVersion})
                  </li>
                ))}
            </ul>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Tâches opérationnelles"
          badge={mission.taches.length}
          defaultOpen
        >
          <p className="muted" style={{ marginTop: 0 }}>
            Distinctes des check-lists qualité — visibles au Dashboard
            collaborateur.
          </p>
          {editable ? (
            <form
              action={createTacheDepuisMission}
              className="form-actions"
              style={{ marginBottom: "0.85rem" }}
            >
              <input type="hidden" name="missionId" value={mission.id} />
              <SubmitButton>Créer une tâche liée</SubmitButton>
              <BtnLink
                href={`/taches/nouvelle?missionId=${mission.id}&categorie=MISSION`}
                variant="ghost"
              >
                Formulaire complet
              </BtnLink>
            </form>
          ) : null}
          {mission.taches.length === 0 ? (
            <p className="empty">Aucune tâche liée.</p>
          ) : (
            <ul className="entity-list">
              {mission.taches.map((t) => {
                const clos = (TACHE_STATUTS_CLOS as readonly string[]).includes(
                  t.statut,
                );
                const urgence = urgenceEcheance(t.dateEcheance, clos);
                return (
                  <li key={t.id}>
                    <Link
                      href={`/taches/${t.id}`}
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
      </CollapsibleSection>

      <CollapsibleSection
        title="2. Substantif"
        defaultOpen={openFor("SUBSTANTIF", false)}
      >
        <p className="empty">
          Contenu méthodologique à définir progressivement (analyses, dossiers
          de travail, etc.).
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        title="3. Recommandations"
        defaultOpen={openFor("RECOMMANDATIONS", false)}
        badge={`${mission.recommandations.length}`}
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Objets suivis <code>REC-xxxx</code> — cycle de vie indépendant de la
          clôture / archivage de la mission.
        </p>

        {editable ? (
          <form
            action={createRecommandation}
            className="entity-form"
            style={{ marginBottom: "1.25rem" }}
          >
            <input type="hidden" name="missionId" value={mission.id} />
            <label className="field" htmlFor="titre">
              <span className="field__label">Nouvelle recommandation *</span>
              <input
                id="titre"
                name="titre"
                required
                placeholder="Ex. Renforcer le contrôle des accès"
              />
            </label>
            <label className="field" htmlFor="description">
              <span className="field__label">Description</span>
              <textarea id="description" name="description" rows={2} />
            </label>
            <div className="form-grid">
              <label className="field" htmlFor="responsableId">
                <span className="field__label">Responsable</span>
                <select id="responsableId" name="responsableId" defaultValue="">
                  <option value="">—</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nom}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" htmlFor="dateEcheance">
                <span className="field__label">Échéance</span>
                <input id="dateEcheance" name="dateEcheance" type="date" />
              </label>
            </div>
            <div className="form-actions">
              <SubmitButton>Ajouter la recommandation</SubmitButton>
            </div>
          </form>
        ) : null}

        {mission.recommandations.length === 0 ? (
          <p className="empty">Aucune recommandation.</p>
        ) : (
          <ul className="entity-list">
            {mission.recommandations.map((r) => (
              <li key={r.id} className="reco-block">
                <div className="entity-row entity-row--neutre">
                  <div className="entity-row__main">
                    <strong>
                      {r.code} — {r.titre}
                    </strong>
                    <span className="entity-row__meta">
                      {STATUT_RECO_LABELS[r.statut]}
                      {r.responsable ? ` · ${r.responsable.nom}` : ""}
                      {r.dateEcheance
                        ? ` · ${formatDate(r.dateEcheance)}`
                        : ""}
                    </span>
                    {r.description ? (
                      <span className="entity-row__meta">{r.description}</span>
                    ) : null}
                  </div>
                </div>
                {editable ? (
                  <div className="form-actions" style={{ marginTop: "0.5rem" }}>
                    <form action={createTacheDepuisReco}>
                      <input type="hidden" name="recommandationId" value={r.id} />
                      <SubmitButton variant="ghost">Créer une tâche</SubmitButton>
                    </form>
                    <form action={deleteRecommandation}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="missionId" value={mission.id} />
                      <SubmitButton variant="danger">Archiver</SubmitButton>
                    </form>
                  </div>
                ) : null}
                {editable &&
                !(RECO_STATUTS_CLOS as readonly string[]).includes(r.statut) ? (
                  <form
                    action={updateRecommandation}
                    className="entity-form"
                    style={{ marginTop: "0.65rem" }}
                  >
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="missionId" value={mission.id} />
                    <input type="hidden" name="titre" value={r.titre} />
                    <div className="form-grid">
                      <label className="field">
                        <span className="field__label">Statut</span>
                        <select name="statut" defaultValue={r.statut}>
                          {STATUT_RECO_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span className="field__label">Échéance</span>
                        <input
                          name="dateEcheance"
                          type="date"
                          defaultValue={toDateInputValue(r.dateEcheance)}
                        />
                      </label>
                    </div>
                    <div className="form-actions">
                      <SubmitButton variant="ghost">Mettre à jour</SubmitButton>
                    </div>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="4. Rapport"
        defaultOpen={openFor("RAPPORT", false)}
      >
        <p className="empty">
          Structure du rapport et validations associées — à définir ensuite.
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        title="5. Suivi des recommandations"
        defaultOpen={openFor("SUIVI", false)}
        badge={`${mission.recommandations.filter((r) => !(RECO_STATUTS_CLOS as readonly string[]).includes(r.statut)).length} ouvertes`}
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Vue de suivi des recommandations créées en section 3. Workflow détaillé
          à venir.
        </p>
        {mission.recommandations.length === 0 ? (
          <p className="empty">Aucune recommandation à suivre.</p>
        ) : (
          <ul className="entity-list entity-list--compact">
            {mission.recommandations.map((r) => (
              <li key={r.id}>
                <span className="inventory-cell__value--code">{r.code}</span>{" "}
                {r.titre} — {STATUT_RECO_LABELS[r.statut]}
                {r.dateEcheance ? ` · ${formatDate(r.dateEcheance)}` : ""}
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Documents liés"
        defaultOpen={false}
        badge={`${mission.documents.length}`}
      >
        {editable && docsALier.length > 0 ? (
          <form
            action={linkDocument}
            className="entity-form"
            style={{ marginBottom: "1rem" }}
          >
            <input type="hidden" name="missionId" value={mission.id} />
            <div className="form-grid">
              <label className="field" htmlFor="documentId">
                <span className="field__label">Lier un document</span>
                <select id="documentId" name="documentId" required defaultValue="">
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
        {mission.documents.length === 0 ? (
          <p className="empty">Aucun document lié.</p>
        ) : (
          <ul className="entity-list">
            {mission.documents.map((lien) => (
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

      <ElementsAssocies
        uniteId={uniteId}
        type="MISSION"
        id={mission.id}
        retour={`/audits/${mission.id}`}
        editable={false}
      />

      <CollapsibleSection title="Tags" defaultOpen={false}>
        <p style={{ margin: 0 }}>
          {tags.length ? tags.map((t) => `#${t}`).join(" ") : "Aucun tag."}
        </p>
      </CollapsibleSection>
    </>
  );
}
