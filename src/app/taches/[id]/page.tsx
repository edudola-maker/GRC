import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmDeleteButton } from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { TacheActionsRapides } from "@/components/TacheActionsRapides";
import { PageHeader, BtnLink } from "@/components/ui";
import { deleteTache } from "../actions";
import {
  CATEGORIE_TACHE_LABELS,
  PRIORITE_LABELS,
  STATUT_TACHE_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { listUtilisateursActifsForCurrentUnite } from "@/lib/session";

export const dynamic = "force-dynamic";

const CHAMP_LABELS: Record<string, string> = {
  titre: "Titre",
  statut: "Statut",
  priorite: "Priorité",
  categorie: "Catégorie",
  responsable: "Responsable",
  responsableId: "Responsable",
  projet: "Projet",
  projetId: "Projet",
  dateEcheance: "Échéance",
};

function formatHistValue(champ: string, value: string | null) {
  if (value == null || value === "") return "—";
  if (champ === "statut") return STATUT_TACHE_LABELS[value] ?? value;
  if (champ === "priorite") return PRIORITE_LABELS[value] ?? value;
  if (champ === "categorie") return CATEGORIE_TACHE_LABELS[value] ?? value;
  if (champ === "dateEcheance") {
    try {
      return formatDate(value);
    } catch {
      return value;
    }
  }
  return value;
}

export default async function TacheDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [tache, users] = await Promise.all([
    prisma.tache.findUnique({
      where: { id },
      include: {
        responsable: true,
        projet: true,
        conseil: true,
        controleSCI: true,
        audit: true,
        document: true,
        recommandation: true,
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
    }),
    listUtilisateursActifsForCurrentUnite(),
  ]);

  if (!tache) notFound();

  const clos = (TACHE_STATUTS_CLOS as readonly string[]).includes(tache.statut);
  const urgence = urgenceEcheance(tache.dateEcheance, clos);

  return (
    <>
      <BackLink href="/taches" label="← Retour aux tâches" />
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

      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {urgence === "retard" ? (
        <div className="flash flash--error" role="status">
          Cette tâche est en retard (échéance {formatDate(tache.dateEcheance)}).
        </div>
      ) : urgence === "bientot" ? (
        <div className="flash flash--warn" role="status">
          Échéance proche : {formatDate(tache.dateEcheance)}.
        </div>
      ) : null}

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
                    {tache.projet.archive ? " (archivé)" : ""}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            {tache.conseil ? (
              <div>
                <dt>Conseil</dt>
                <dd>
                  <Link href={`/conseils/${tache.conseil.id}`}>
                    {tache.conseil.objet}
                  </Link>
                </dd>
              </div>
            ) : null}
            {tache.controleSCI ? (
              <div>
                <dt>Contrôle SCI</dt>
                <dd>
                  <Link href={`/controles-sci/${tache.controleSCI.id}`}>
                    {tache.controleSCI.nom}
                  </Link>
                </dd>
              </div>
            ) : null}
            {tache.audit ? (
              <div>
                <dt>Audit</dt>
                <dd>
                  <Link href={`/audits/${tache.audit.id}`}>
                    {tache.audit.titre}
                  </Link>
                </dd>
              </div>
            ) : null}
            {tache.document ? (
              <div>
                <dt>Document</dt>
                <dd>
                  <Link href={`/documents/${tache.document.id}`}>
                    {tache.document.nom}
                  </Link>
                </dd>
              </div>
            ) : null}
            {tache.recommandation ? (
              <div>
                <dt>Recommandation</dt>
                <dd>{tache.recommandation.titre}</dd>
              </div>
            ) : null}
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
              <dd>
                {formatDate(tache.dateEcheance)}
                {urgence === "retard" ? (
                  <span className="tag tag--danger"> En retard</span>
                ) : null}
              </dd>
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
            Créé par {tache.creePar.nom} · Modifié par {tache.modifiePar.nom} ·{" "}
            {formatDate(tache.modifieLe)}
          </p>
        </div>

        <div className="stack-panels">
          <TacheActionsRapides
            tacheId={tache.id}
            statut={tache.statut}
            priorite={tache.priorite}
            responsableId={tache.responsableId}
            users={users}
          />

          <div className="panel">
            <h2 className="panel-title">Historique</h2>
            {tache.historique.length === 0 ? (
              <p className="empty">Aucune modification enregistrée.</p>
            ) : (
              <ul className="history-list">
                {tache.historique.map((h) => (
                  <li key={h.id}>
                    <strong>{CHAMP_LABELS[h.champModifie] ?? h.champModifie}</strong>
                    <span>
                      {formatHistValue(h.champModifie, h.ancienneValeur)} →{" "}
                      {formatHistValue(h.champModifie, h.nouvelleValeur)}
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
      </div>

      <ElementsAssocies
        uniteId={tache.uniteId}
        type="TACHE"
        id={tache.id}
        retour={`/taches/${tache.id}`}
      />
    </>
  );
}
