import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
  SubmitButton,
} from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader, BtnLink } from "@/components/ui";
import {
  archiveAudit,
  createRecommandation,
  createTacheDepuisAudit,
  createTacheDepuisReco,
  deleteAudit,
  deleteRecommandation,
  linkDocument,
  unarchiveAudit,
  updateRecommandation,
} from "../actions";
import {
  CATEGORIE_TACHE_LABELS,
  STATUT_AUDIT_LABELS,
  STATUT_RECO_LABELS,
  STATUT_TACHE_LABELS,
  TYPE_MISSION_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import {
  STATUT_RECO_OPTIONS,
  TACHE_STATUTS_CLOS,
} from "@/lib/catalog";
import { toDateInputValue } from "@/lib/form";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parseTags } from "@/lib/tags";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";

export const dynamic = "force-dynamic";

const RECO_STATUTS_CLOS = ["CLOTUREE", "ANNULEE"] as const;
const AUDIT_STATUTS_CLOS = ["TERMINE", "ANNULE"] as const;

export default async function AuditDetailPage({
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
  const [audit, users, documentsDispo] = await Promise.all([
    prisma.audit.findUnique({
      where: { id },
      include: {
        responsable: true,
        creePar: true,
        modifiePar: true,
        recommandations: {
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
  ]);
  if (!audit) notFound();

  const linkedIds = new Set(audit.documents.map((d) => d.documentId));
  const docsALier = documentsDispo.filter((d) => !linkedIds.has(d.id));
  const auditClos = (AUDIT_STATUTS_CLOS as readonly string[]).includes(
    audit.statut,
  );
  const tags = parseTags(audit.tags);

  return (
    <>
      <BackLink href="/audits" label="← Retour aux audits" />
      <PageHeader
        title={`${audit.code} — ${audit.titre}`}
        description={audit.perimetre ?? "Aucun périmètre renseigné."}
        actions={
          <>
            {!audit.archive ? (
              <BtnLink href={`/audits/${audit.id}/modifier`}>Modifier</BtnLink>
            ) : null}
            {audit.archive ? (
              <ConfirmActionButton
                action={unarchiveAudit}
                id={audit.id}
                label="Désarchiver"
                confirmMessage="Remettre cet audit dans la liste active ?"
              />
            ) : (
              <ConfirmActionButton
                action={archiveAudit}
                id={audit.id}
                label="Archiver"
                confirmMessage="Archiver cet audit ?"
              />
            )}
            <ConfirmDeleteButton
              action={deleteAudit}
              id={audit.id}
              confirmMessage="Supprimer définitivement cet audit ? Les recommandations liées seront aussi supprimées."
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {audit.archive ? (
        <div className="flash flash--warn" role="status">
          Cet audit est archivé.
        </div>
      ) : null}
      {!auditClos &&
      audit.dateFin &&
      urgenceEcheance(audit.dateFin, false) === "retard" ? (
        <div className="flash flash--error" role="status">
          Date de fin dépassée ({formatDate(audit.dateFin)}).
        </div>
      ) : null}

      <div className="detail-grid">
        <div className="panel">
          <h2 className="panel-title">Informations</h2>
          <dl className="kv">
            <div>
              <dt>Code</dt>
              <dd>{audit.code}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{audit.responsable.nom}</dd>
            </div>
            <div>
              <dt>Type de mission</dt>
              <dd>
                {TYPE_MISSION_LABELS[audit.typeMission] ?? audit.typeMission}
              </dd>
            </div>
            <div>
              <dt>Statut</dt>
              <dd>{STATUT_AUDIT_LABELS[audit.statut]}</dd>
            </div>
            <div>
              <dt>Début</dt>
              <dd>{formatDate(audit.dateDebut)}</dd>
            </div>
            <div>
              <dt>Fin</dt>
              <dd>{formatDate(audit.dateFin)}</dd>
            </div>
          </dl>
          {audit.commentaires ? (
            <p className="detail-note">{audit.commentaires}</p>
          ) : null}
          <p className="detail-trace">
            Créé par {audit.creePar.nom} · Modifié par {audit.modifiePar.nom} ·{" "}
            {formatDate(audit.modifieLe)}
          </p>
          <p className="detail-note" style={{ marginTop: "1rem" }}>
            Les dossiers de travail (working papers) seront disponibles dans une
            prochaine version.
          </p>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">
              Tâches liées ({audit.taches.length})
            </h2>
          </div>
          {!audit.archive ? (
            <form
              action={createTacheDepuisAudit}
              className="form-actions"
              style={{ marginBottom: "0.85rem" }}
            >
              <input type="hidden" name="auditId" value={audit.id} />
              <SubmitButton>Créer une tâche liée</SubmitButton>
              <BtnLink
                href={`/taches/nouvelle?auditId=${audit.id}&categorie=AUDIT`}
                variant="ghost"
              >
                Formulaire complet
              </BtnLink>
            </form>
          ) : null}
          {audit.taches.length === 0 ? (
            <p className="empty">Aucune tâche liée.</p>
          ) : (
            <ul className="entity-list">
              {audit.taches.map((t) => {
                const clos = (
                  TACHE_STATUTS_CLOS as readonly string[]
                ).includes(t.statut);
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
        </div>
      </div>

      <div className="panel" style={{ marginTop: "1.25rem" }}>
        <div className="panel-head">
          <h2 className="panel-title">
            Documents liés ({audit.documents.length})
          </h2>
        </div>
        {!audit.archive && docsALier.length > 0 ? (
          <form
            action={linkDocument}
            className="entity-form"
            style={{ marginBottom: "1rem" }}
          >
            <input type="hidden" name="auditId" value={audit.id} />
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
        {audit.documents.length === 0 ? (
          <p className="empty">Aucun document lié.</p>
        ) : (
          <ul className="entity-list">
            {audit.documents.map((lien) => (
              <li key={lien.id}>
                <Link
                  href={`/documents/${lien.document.id}`}
                  className="entity-row entity-row--neutre"
                >
                  <div className="entity-row__main">
                    <strong>{lien.document.nom}</strong>
                    <span className="entity-row__meta">
                      Lié le {formatDate(lien.creeLe)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel" style={{ marginTop: "1.25rem" }}>
        <div className="panel-head">
          <h2 className="panel-title">
            Recommandations ({audit.recommandations.length})
          </h2>
        </div>

        {!audit.archive ? (
          <form
            action={createRecommandation}
            className="entity-form"
            style={{ marginBottom: "1.25rem" }}
          >
            <input type="hidden" name="auditId" value={audit.id} />
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
                  <option value="">Non assigné</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nom}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" htmlFor="statut">
                <span className="field__label">Statut</span>
                <select id="statut" name="statut" defaultValue="OUVERTE">
                  {STATUT_RECO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" htmlFor="dateEcheance">
                <span className="field__label">Échéance</span>
                <input id="dateEcheance" name="dateEcheance" type="date" />
              </label>
            </div>
            <label className="field" htmlFor="commentaires">
              <span className="field__label">Commentaires</span>
              <textarea id="commentaires" name="commentaires" rows={2} />
            </label>
            <div className="form-actions">
              <SubmitButton>Ajouter la recommandation</SubmitButton>
            </div>
          </form>
        ) : null}

        {audit.recommandations.length === 0 ? (
          <p className="empty">Aucune recommandation.</p>
        ) : (
          <ul className="entity-list" style={{ gap: "1rem" }}>
            {audit.recommandations.map((r) => {
              const clos = (RECO_STATUTS_CLOS as readonly string[]).includes(
                r.statut,
              );
              const urgence = urgenceEcheance(r.dateEcheance, clos);
              return (
                <li key={r.id}>
                  <div className={`entity-row entity-row--${urgence}`}>
                    <div className="entity-row__main" style={{ width: "100%" }}>
                      <strong>{r.titre}</strong>
                      <span className="entity-row__meta">
                        {r.responsable?.nom ?? "Sans responsable"} ·{" "}
                        {STATUT_RECO_LABELS[r.statut]} ·{" "}
                        {formatDate(r.dateEcheance)}
                      </span>
                      {r.description ? (
                        <p className="detail-note" style={{ marginTop: "0.4rem" }}>
                          {r.description}
                        </p>
                      ) : null}
                      {r.commentaires ? (
                        <p className="detail-note">{r.commentaires}</p>
                      ) : null}

                      {!audit.archive ? (
                        <>
                          <form
                            action={updateRecommandation}
                            className="entity-form"
                            style={{ marginTop: "0.75rem" }}
                          >
                            <input type="hidden" name="id" value={r.id} />
                            <label className="field" htmlFor={`titre-${r.id}`}>
                              <span className="field__label">Titre</span>
                              <input
                                id={`titre-${r.id}`}
                                name="titre"
                                required
                                defaultValue={r.titre}
                              />
                            </label>
                            <div className="form-grid">
                              <label
                                className="field"
                                htmlFor={`responsableId-${r.id}`}
                              >
                                <span className="field__label">Responsable</span>
                                <select
                                  id={`responsableId-${r.id}`}
                                  name="responsableId"
                                  defaultValue={r.responsableId ?? ""}
                                >
                                  <option value="">Non assigné</option>
                                  {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.nom}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label
                                className="field"
                                htmlFor={`statut-${r.id}`}
                              >
                                <span className="field__label">Statut</span>
                                <select
                                  id={`statut-${r.id}`}
                                  name="statut"
                                  defaultValue={r.statut}
                                >
                                  {STATUT_RECO_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label
                                className="field"
                                htmlFor={`dateEcheance-${r.id}`}
                              >
                                <span className="field__label">Échéance</span>
                                <input
                                  id={`dateEcheance-${r.id}`}
                                  name="dateEcheance"
                                  type="date"
                                  defaultValue={toDateInputValue(
                                    r.dateEcheance,
                                  )}
                                />
                              </label>
                            </div>
                            <label
                              className="field"
                              htmlFor={`description-${r.id}`}
                            >
                              <span className="field__label">Description</span>
                              <textarea
                                id={`description-${r.id}`}
                                name="description"
                                rows={2}
                                defaultValue={r.description ?? ""}
                              />
                            </label>
                            <label
                              className="field"
                              htmlFor={`commentaires-${r.id}`}
                            >
                              <span className="field__label">Commentaires</span>
                              <textarea
                                id={`commentaires-${r.id}`}
                                name="commentaires"
                                rows={2}
                                defaultValue={r.commentaires ?? ""}
                              />
                            </label>
                            <div className="form-actions">
                              <SubmitButton>Enregistrer</SubmitButton>
                            </div>
                          </form>
                          <div
                            className="form-actions"
                            style={{ marginTop: "0.5rem" }}
                          >
                            <form action={createTacheDepuisReco}>
                              <input
                                type="hidden"
                                name="recommandationId"
                                value={r.id}
                              />
                              <SubmitButton variant="ghost">
                                Créer une tâche
                              </SubmitButton>
                            </form>
                            <ConfirmDeleteButton
                              action={deleteRecommandation}
                              id={r.id}
                              confirmMessage="Supprimer cette recommandation ?"
                            />
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ElementsAssocies
        uniteId={user.uniteId}
        type="AUDIT"
        id={audit.id}
        retour={`/audits/${audit.id}`}
      />

      <CollapsibleSection title="Tags" defaultOpen={false}>
        <p style={{ margin: 0 }}>
          {tags.length ? tags.map((t) => `#${t}`).join(" ") : "Aucun tag."}
        </p>
      </CollapsibleSection>
    </>
  );
}
