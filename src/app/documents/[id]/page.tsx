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
  archiveDocument,
  creerTacheRevue,
  deleteDocument,
  unarchiveDocument,
} from "../actions";
import {
  CATEGORIE_TACHE_LABELS,
  FREQUENCE_REVUE_LABELS,
  STATUT_DOCUMENT_LABELS,
  STATUT_TACHE_LABELS,
  TYPE_DOCUMENT_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      responsable: true,
      creePar: true,
      modifiePar: true,
      tachesRevue: {
        include: { responsable: true },
        orderBy: { dateEcheance: "asc" },
      },
    },
  });
  if (!document) notFound();

  const revueUrgence = urgenceEcheance(
    document.prochaineRevue,
    document.archive ||
      document.statut === "OBSOLETE" ||
      document.statut === "ARCHIVE",
  );

  return (
    <>
      <BackLink href="/documents" label="← Retour aux documents" />
      <PageHeader
        title={document.nom}
        description={document.description ?? "Aucune description."}
        actions={
          <>
            {!document.archive ? (
              <BtnLink href={`/documents/${document.id}/modifier`}>
                Modifier
              </BtnLink>
            ) : null}
            {document.archive ? (
              <ConfirmActionButton
                action={unarchiveDocument}
                id={document.id}
                label="Désarchiver"
                confirmMessage="Remettre ce document dans la liste active ?"
              />
            ) : (
              <ConfirmActionButton
                action={archiveDocument}
                id={document.id}
                label="Archiver"
                confirmMessage="Archiver ce document ?"
              />
            )}
            <ConfirmDeleteButton
              action={deleteDocument}
              id={document.id}
              confirmMessage="Supprimer définitivement ce document ? Les tâches de revue resteront."
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {document.archive ? (
        <div className="flash flash--warn" role="status">
          Ce document est archivé.
        </div>
      ) : null}
      {revueUrgence === "retard" ? (
        <div className="flash flash--error" role="status">
          Revue en retard (échéance {formatDate(document.prochaineRevue)}).
        </div>
      ) : null}

      <div className="detail-grid">
        <div className="panel">
          <h2 className="panel-title">Informations</h2>
          <dl className="kv">
            <div>
              <dt>Type</dt>
              <dd>{TYPE_DOCUMENT_LABELS[document.typeDocument]}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{document.version ?? "—"}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{document.responsable?.nom ?? "—"}</dd>
            </div>
            <div>
              <dt>Statut</dt>
              <dd>{STATUT_DOCUMENT_LABELS[document.statut]}</dd>
            </div>
            <div>
              <dt>Fréquence de revue</dt>
              <dd>
                {document.frequenceRevue
                  ? FREQUENCE_REVUE_LABELS[document.frequenceRevue]
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Approbation</dt>
              <dd>{formatDate(document.dateApprobation)}</dd>
            </div>
            <div>
              <dt>Dernière revue</dt>
              <dd>{formatDate(document.dateDerniereRevue)}</dd>
            </div>
            <div>
              <dt>Prochaine revue</dt>
              <dd>{formatDate(document.prochaineRevue)}</dd>
            </div>
            <div>
              <dt>Référence</dt>
              <dd>{document.reference ?? "—"}</dd>
            </div>
            <div>
              <dt>Fichier</dt>
              <dd>{document.nomFichier ?? "—"}</dd>
            </div>
          </dl>
          <p className="detail-trace">
            Créé par {document.creePar.nom}
            {document.modifiePar
              ? ` · Modifié par ${document.modifiePar.nom}`
              : ""}{" "}
            · {formatDate(document.modifieLe)}
          </p>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">
              Tâches de revue ({document.tachesRevue.length})
            </h2>
          </div>
          {!document.archive ? (
            <form
              action={creerTacheRevue}
              className="form-actions"
              style={{ marginBottom: "0.85rem" }}
            >
              <input type="hidden" name="documentId" value={document.id} />
              <SubmitButton>Créer une tâche de revue</SubmitButton>
              <BtnLink
                href={`/taches/nouvelle?documentId=${document.id}&categorie=DOCUMENT`}
                variant="ghost"
              >
                Formulaire complet
              </BtnLink>
            </form>
          ) : null}
          {document.tachesRevue.length === 0 ? (
            <p className="empty">Aucune tâche de revue.</p>
          ) : (
            <ul className="entity-list">
              {document.tachesRevue.map((t) => {
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
    </>
  );
}
