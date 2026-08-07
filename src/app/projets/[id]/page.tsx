import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
} from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader, BtnLink } from "@/components/ui";
import {
  archiveProjet,
  deleteProjet,
  unarchiveProjet,
} from "../actions";
import {
  CATEGORIE_TACHE_LABELS,
  PRIORITE_LABELS,
  STATUT_PROJET_LABELS,
  STATUT_TACHE_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProjetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const projet = await prisma.projet.findUnique({
    where: { id },
    include: {
      responsable: true,
      creePar: true,
      modifiePar: true,
      taches: {
        include: { responsable: true },
        orderBy: { dateEcheance: "asc" },
      },
    },
  });

  if (!projet) notFound();

  return (
    <>
      <BackLink href="/projets" label="← Retour aux projets" />
      <PageHeader
        title={projet.nom}
        description={projet.description ?? "Aucune description."}
        actions={
          <>
            {!projet.archive ? (
              <BtnLink href={`/projets/${projet.id}/modifier`}>Modifier</BtnLink>
            ) : null}
            {!projet.archive ? (
              <BtnLink
                href={`/taches/nouvelle?projetId=${projet.id}`}
                variant="ghost"
              >
                Ajouter une tâche
              </BtnLink>
            ) : null}
            {projet.archive ? (
              <ConfirmActionButton
                action={unarchiveProjet}
                id={projet.id}
                label="Désarchiver"
                confirmMessage="Remettre ce projet dans la liste active ?"
                pendingLabel="…"
              />
            ) : (
              <ConfirmActionButton
                action={archiveProjet}
                id={projet.id}
                label="Archiver"
                confirmMessage="Archiver ce projet ? Il disparaîtra de la liste active mais restera consultable."
                pendingLabel="…"
              />
            )}
            <ConfirmDeleteButton
              action={deleteProjet}
              id={projet.id}
              confirmMessage="Supprimer définitivement ce projet ? Les tâches associées resteront, sans projet."
            />
          </>
        }
      />

      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {projet.archive ? (
        <div className="flash flash--warn" role="status">
          Ce projet est archivé. Vous pouvez le désarchiver ou le consulter en
          lecture.
        </div>
      ) : null}

      <div className="detail-grid">
        <div className="panel">
          <h2 className="panel-title">Informations</h2>
          <dl className="kv">
            <div>
              <dt>Responsable</dt>
              <dd>{projet.responsable.nom}</dd>
            </div>
            <div>
              <dt>Statut</dt>
              <dd>{STATUT_PROJET_LABELS[projet.statut]}</dd>
            </div>
            <div>
              <dt>Priorité</dt>
              <dd>{PRIORITE_LABELS[projet.priorite]}</dd>
            </div>
            <div>
              <dt>Avancement</dt>
              <dd>{projet.avancement} %</dd>
            </div>
            <div>
              <dt>Début</dt>
              <dd>{formatDate(projet.dateDebut)}</dd>
            </div>
            <div>
              <dt>Échéance</dt>
              <dd>{formatDate(projet.dateEcheance)}</dd>
            </div>
          </dl>
          {projet.commentaires ? (
            <p className="detail-note">{projet.commentaires}</p>
          ) : null}
          <p className="detail-trace">
            Créé par {projet.creePar.nom} · Modifié par {projet.modifiePar.nom} ·{" "}
            {formatDate(projet.modifieLe)}
          </p>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Tâches ({projet.taches.length})</h2>
          </div>
          {projet.taches.length === 0 ? (
            <p className="empty">Aucune tâche rattachée.</p>
          ) : (
            <ul className="entity-list">
              {projet.taches.map((t) => {
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
                          {t.responsable.nom} ·{" "}
                          {CATEGORIE_TACHE_LABELS[t.categorie]} ·{" "}
                          {STATUT_TACHE_LABELS[t.statut]}
                          {urgence === "retard" ? " · En retard" : ""}
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
