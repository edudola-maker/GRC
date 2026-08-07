import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmDeleteButton } from "@/components/FormControls";
import { PageHeader, BtnLink } from "@/components/ui";
import { deleteTache } from "../actions";
import {
  CATEGORIE_TACHE_LABELS,
  PRIORITE_LABELS,
  STATUT_TACHE_LABELS,
  formatDate,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TacheDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tache = await prisma.tache.findUnique({
    where: { id },
    include: {
      responsable: true,
      projet: true,
      creePar: true,
      modifiePar: true,
      soumisPar: true,
      validePar: true,
      historique: {
        include: { modifiePar: true },
        orderBy: { modifieLe: "desc" },
        take: 20,
      },
    },
  });

  if (!tache) notFound();

  return (
    <>
      <PageHeader
        title={tache.titre}
        description={tache.description ?? "Aucune description."}
        actions={
          <>
            <BtnLink href={`/taches/${tache.id}/modifier`}>Modifier</BtnLink>
            <ConfirmDeleteButton
              action={deleteTache}
              id={tache.id}
              confirmMessage="Supprimer définitivement cette tâche ?"
            />
          </>
        }
      />

      <div className="detail-grid">
        <div className="panel">
          <h2 className="panel-title">Informations</h2>
          <dl className="kv">
            <div>
              <dt>Catégorie</dt>
              <dd>{CATEGORIE_TACHE_LABELS[tache.categorie]}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{tache.responsable.nom}</dd>
            </div>
            <div>
              <dt>Projet</dt>
              <dd>
                {tache.projet ? (
                  <Link href={`/projets/${tache.projet.id}`}>
                    {tache.projet.nom}
                  </Link>
                ) : (
                  "Indépendante"
                )}
              </dd>
            </div>
            <div>
              <dt>Statut</dt>
              <dd>{STATUT_TACHE_LABELS[tache.statut]}</dd>
            </div>
            <div>
              <dt>Priorité</dt>
              <dd>{PRIORITE_LABELS[tache.priorite]}</dd>
            </div>
            <div>
              <dt>Création</dt>
              <dd>{formatDate(tache.dateCreation)}</dd>
            </div>
            <div>
              <dt>Échéance</dt>
              <dd>{formatDate(tache.dateEcheance)}</dd>
            </div>
          </dl>
          {tache.commentaires ? (
            <p className="detail-note">{tache.commentaires}</p>
          ) : null}

          {(tache.soumisPar || tache.validePar) && (
            <dl className="kv kv--compact">
              {tache.soumisPar ? (
                <div>
                  <dt>Soumis par</dt>
                  <dd>
                    {tache.soumisPar.nom} · {formatDate(tache.dateSoumission)}
                  </dd>
                </div>
              ) : null}
              {tache.validePar ? (
                <div>
                  <dt>Validé par</dt>
                  <dd>
                    {tache.validePar.nom} · {formatDate(tache.dateValidation)}
                  </dd>
                </div>
              ) : null}
            </dl>
          )}

          <p className="detail-trace">
            Créé par {tache.creePar.nom} · Modifié par {tache.modifiePar.nom}
          </p>
        </div>

        <div className="panel">
          <h2 className="panel-title">Historique</h2>
          {tache.historique.length === 0 ? (
            <p className="empty">Aucune modification enregistrée.</p>
          ) : (
            <ul className="history-list">
              {tache.historique.map((h) => (
                <li key={h.id}>
                  <strong>{h.champModifie}</strong>
                  <span>
                    {h.ancienneValeur ?? "—"} → {h.nouvelleValeur ?? "—"}
                  </span>
                  <em>
                    {h.modifiePar.nom} · {formatDate(h.modifieLe)}
                  </em>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
