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
  archiveRisque,
  deleteRisque,
  setRisqueControles,
} from "../actions";
import {
  CATEGORIE_RISQUE_LABELS,
  STATUT_CONTROLE_LABELS,
  STATUT_RISQUE_LABELS,
  STRATEGIE_RISQUE_LABELS,
  TAXINOMIE_LABELS,
  criticiteNiveau,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { parseTags } from "@/lib/tags";

export const dynamic = "force-dynamic";

export default async function RisqueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [risque, controlesActifs] = await Promise.all([
    prisma.risque.findUnique({
      where: { id },
      include: {
        responsable: true,
        creePar: true,
        controles: {
          include: {
            controle: {
              include: { responsable: true },
            },
          },
          orderBy: { creeLe: "asc" },
        },
      },
    }),
    prisma.controleSCI.findMany({
      where: { archive: false },
      include: { responsable: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  if (!risque) notFound();

  const linkedIds = new Set(risque.controles.map((l) => l.controleSCIId));
  const niveau = criticiteNiveau(risque.criticite);
  const tags = parseTags(risque.tags);

  return (
    <>
      <BackLink href="/risques" label="← Retour aux risques" />
      <PageHeader
        title={`${risque.code} — ${risque.nom}`}
        description={risque.description ?? "Aucune description."}
        actions={
          <>
            {!risque.archive ? (
              <BtnLink href={`/risques/${risque.id}/modifier`}>Modifier</BtnLink>
            ) : null}
            <ConfirmActionButton
              action={archiveRisque}
              id={risque.id}
              fields={{ archive: risque.archive ? "0" : "1" }}
              label={risque.archive ? "Désarchiver" : "Archiver"}
              confirmMessage={
                risque.archive
                  ? "Remettre ce risque dans la liste active ?"
                  : "Archiver ce risque ?"
              }
            />
            <ConfirmDeleteButton
              action={deleteRisque}
              id={risque.id}
              confirmMessage="Supprimer définitivement ce risque ?"
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {risque.archive ? (
        <div className="flash flash--warn" role="status">
          Ce risque est archivé.
        </div>
      ) : null}

      <div className="detail-grid">
        <div className="panel">
          <h2 className="panel-title">Informations</h2>
          <dl className="kv">
            <div>
              <dt>Code</dt>
              <dd>{risque.code}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{risque.responsable.nom}</dd>
            </div>
            <div>
              <dt>Catégorie</dt>
              <dd>{CATEGORIE_RISQUE_LABELS[risque.categorie]}</dd>
            </div>
            <div>
              <dt>Statut</dt>
              <dd>{STATUT_RISQUE_LABELS[risque.statut]}</dd>
            </div>
            <div>
              <dt>Stratégie de traitement</dt>
              <dd>
                {risque.strategie
                  ? STRATEGIE_RISQUE_LABELS[risque.strategie]
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Taxinomie</dt>
              <dd>
                {risque.taxinomie
                  ? (TAXINOMIE_LABELS[risque.taxinomie] ?? risque.taxinomie)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Tags</dt>
              <dd>
                {tags.length
                  ? tags.map((t) => `#${t}`).join(" ")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Processus</dt>
              <dd>{risque.processus ?? "—"}</dd>
            </div>
            <div>
              <dt>Probabilité</dt>
              <dd>{risque.probabilite}</dd>
            </div>
            <div>
              <dt>Impact</dt>
              <dd>{risque.impact}</dd>
            </div>
            <div>
              <dt>Criticité</dt>
              <dd>
                {risque.criticite} ({niveau})
              </dd>
            </div>
            <div>
              <dt>Créé par</dt>
              <dd>{risque.creePar.nom}</dd>
            </div>
          </dl>
          {risque.commentaires ? (
            <p className="detail-note">{risque.commentaires}</p>
          ) : null}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">
              Contrôles liés ({risque.controles.length})
            </h2>
          </div>

          {risque.controles.length === 0 ? (
            <p className="empty">Aucun contrôle lié pour l&apos;instant.</p>
          ) : (
            <ul className="entity-list" style={{ marginBottom: "1rem" }}>
              {risque.controles.map(({ controle: c }) => {
                const clos = c.statut === "REALISE";
                const urgence = urgenceEcheance(c.dateProchaineEcheance, clos);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/controles-sci/${c.id}`}
                      className={`entity-row entity-row--${urgence}`}
                    >
                      <div className="entity-row__main">
                        <strong>{c.nom}</strong>
                        <span className="entity-row__meta">
                          {c.responsable.nom} · {STATUT_CONTROLE_LABELS[c.statut]}
                        </span>
                      </div>
                      <span className="entity-row__date">
                        {formatDate(c.dateProchaineEcheance)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {!risque.archive ? (
            <>
              <h3 className="panel-title" style={{ fontSize: "1rem" }}>
                Associer des contrôles SCI
              </h3>
              {controlesActifs.length === 0 ? (
                <p className="empty">Aucun contrôle SCI actif disponible.</p>
              ) : (
                <form action={setRisqueControles} className="entity-form">
                  <input type="hidden" name="risqueId" value={risque.id} />
                  <ul className="check-list">
                    {controlesActifs.map((c) => (
                      <li key={c.id}>
                        <label
                          className="field"
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <input
                            type="checkbox"
                            name="controleIds"
                            value={c.id}
                            defaultChecked={linkedIds.has(c.id)}
                          />
                          <span className="field__label" style={{ margin: 0 }}>
                            {c.nom}
                            <span className="muted">
                              {" "}
                              · {c.responsable.nom}
                              {c.dateProchaineEcheance
                                ? ` · ${formatDate(c.dateProchaineEcheance)}`
                                : ""}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className="form-actions">
                    <SubmitButton>Enregistrer les liens</SubmitButton>
                  </div>
                </form>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
