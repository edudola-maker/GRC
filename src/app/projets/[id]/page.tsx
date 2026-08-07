import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmDeleteButton } from "@/components/FormControls";
import { PageHeader, BtnLink } from "@/components/ui";
import { deleteProjet } from "../actions";
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      <PageHeader
        title={projet.nom}
        description={projet.description ?? "Aucune description."}
        actions={
          <>
            <BtnLink href={`/projets/${projet.id}/modifier`}>Modifier</BtnLink>
            <BtnLink
              href={`/taches/nouvelle?projetId=${projet.id}`}
              variant="ghost"
            >
              Ajouter une tâche
            </BtnLink>
            <ConfirmDeleteButton
              action={deleteProjet}
              id={projet.id}
              confirmMessage="Supprimer ce projet ? Les tâches associées resteront, sans projet."
            />
          </>
        }
      />

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
            Créé par {projet.creePar.nom} · Modifié par {projet.modifiePar.nom}
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
