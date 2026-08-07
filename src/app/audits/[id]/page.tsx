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
  unarchiveAudit,
} from "../actions";
import {
  CATEGORIE_TACHE_LABELS,
  STATUT_AUDIT_LABELS,
  STATUT_RECO_LABELS,
  STATUT_TACHE_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { STATUT_RECO_OPTIONS, TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { listUtilisateursActifs } from "@/lib/session";
import { toDateInputValue } from "@/lib/form";

export const dynamic = "force-dynamic";

export default async function AuditDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [audit, users] = await Promise.all([
    prisma.audit.findUnique({
      where: { id },
      include: {
        responsable: true,
        creePar: true,
        modifiePar: true,
        recommandations: {
          include: {
            responsable: true,
            taches: { select: { id: true } },
          },
          orderBy: { creeLe: "desc" },
        },
        taches: {
          include: { responsable: true },
          orderBy: { dateEcheance: "asc" },
        },
      },
    }),
    listUtilisateursActifs(),
  ]);
  if (!audit) notFound();

  return (
    <>
      <BackLink href="/audits" label="← Retour aux audits" />
      <PageHeader
        title={audit.titre}
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
              confirmMessage="Supprimer définitivement cet audit et ses recommandations ?"
            />
          </>
        }
      />

      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {audit.archive ? (
        <div className="flash flash--warn">Cet audit est archivé.</div>
      ) : null}

      <div className="detail-grid">
        <div className="panel">
          <h2 className="panel-title">Informations</h2>
          <dl className="kv">
            <div>
              <dt>Responsable</dt>
              <dd>{audit.responsable.nom}</dd>
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
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Tâches ({audit.taches.length})</h2>
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
                          {t.responsable.nom} ·{" "}
                          {CATEGORIE_TACHE_LABELS[t.categorie]} ·{" "}
                          {STATUT_TACHE_LABELS[t.statut]}
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

      <div className="panel" style={{ marginTop: "1rem" }}>
        <h2 className="panel-title">
          Recommandations ({audit.recommandations.length})
        </h2>

        {!audit.archive ? (
          <form action={createRecommandation} className="entity-form">
            <input type="hidden" name="auditId" value={audit.id} />
            <label className="field" htmlFor="reco-titre">
              <span className="field__label">Titre *</span>
              <input id="reco-titre" name="titre" required />
            </label>
            <label className="field" htmlFor="reco-desc">
              <span className="field__label">Description</span>
              <textarea id="reco-desc" name="description" rows={2} />
            </label>
            <div className="form-grid">
              <label className="field" htmlFor="reco-resp">
                <span className="field__label">Responsable</span>
                <select id="reco-resp" name="responsableId" defaultValue="">
                  <option value="">Non assigné</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nom}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" htmlFor="reco-echeance">
                <span className="field__label">Échéance</span>
                <input
                  id="reco-echeance"
                  name="dateEcheance"
                  type="date"
                  defaultValue={toDateInputValue(null)}
                />
              </label>
              <label className="field" htmlFor="reco-statut">
                <span className="field__label">Statut</span>
                <select id="reco-statut" name="statut" defaultValue="OUVERTE">
                  {STATUT_RECO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="check-field">
              <input type="checkbox" name="creerTache" value="1" />
              Créer une tâche de suivi
            </label>
            <div className="form-actions">
              <SubmitButton>Ajouter la recommandation</SubmitButton>
            </div>
          </form>
        ) : null}

        {audit.recommandations.length === 0 ? (
          <p className="empty">Aucune recommandation.</p>
        ) : (
          <ul className="entity-list" style={{ marginTop: "1rem" }}>
            {audit.recommandations.map((r) => (
              <li key={r.id}>
                <div className="entity-row">
                  <div className="entity-row__main">
                    <strong>{r.titre}</strong>
                    <span className="entity-row__meta">
                      {STATUT_RECO_LABELS[r.statut]}
                      {r.responsable ? ` · ${r.responsable.nom}` : ""}
                      {r.description ? ` · ${r.description}` : ""}
                      {r.taches.length > 0
                        ? ` · ${r.taches.length} tâche(s)`
                        : ""}
                    </span>
                  </div>
                  <span className="entity-row__date">
                    {formatDate(r.dateEcheance)}
                    {!audit.archive ? (
                      <form action={createTacheDepuisReco}>
                        <input
                          type="hidden"
                          name="recommandationId"
                          value={r.id}
                        />
                        <SubmitButton variant="ghost" pendingLabel="…">
                          Tâche
                        </SubmitButton>
                      </form>
                    ) : null}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
