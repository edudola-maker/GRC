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
  archiveConseil,
  createTacheDepuisConseil,
  deleteConseil,
  unarchiveConseil,
} from "../actions";
import {
  CATEGORIE_TACHE_LABELS,
  STATUT_CONSEIL_LABELS,
  STATUT_TACHE_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import {
  CONSEIL_DELAI_CIBLE_JOURS,
  CONSEIL_STATUTS_CLOS,
  TACHE_STATUTS_CLOS,
} from "@/lib/catalog";
import { businessDaysBetween } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ConseilDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const conseil = await prisma.conseil.findUnique({
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
  if (!conseil) notFound();

  const fin = conseil.dateCloture ?? conseil.dateReponse;
  const delai = fin ? businessDaysBetween(conseil.dateReception, fin) : null;
  const horsCibleOuvert =
    !fin &&
    conseil.dateEcheance &&
    conseil.dateEcheance < new Date() &&
    !(CONSEIL_STATUTS_CLOS as readonly string[]).includes(conseil.statut);

  return (
    <>
      <BackLink href="/conseils" label="← Retour aux conseils" />
      <PageHeader
        title={conseil.objet}
        description={conseil.description ?? "Aucune description."}
        actions={
          <>
            {!conseil.archive ? (
              <BtnLink href={`/conseils/${conseil.id}/modifier`}>Modifier</BtnLink>
            ) : null}
            {conseil.archive ? (
              <ConfirmActionButton
                action={unarchiveConseil}
                id={conseil.id}
                label="Désarchiver"
                confirmMessage="Remettre ce conseil dans la liste active ?"
              />
            ) : (
              <ConfirmActionButton
                action={archiveConseil}
                id={conseil.id}
                label="Archiver"
                confirmMessage="Archiver ce conseil ?"
              />
            )}
            <ConfirmDeleteButton
              action={deleteConseil}
              id={conseil.id}
              confirmMessage="Supprimer définitivement ce conseil ? Les tâches liées resteront."
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {conseil.archive ? (
        <div className="flash flash--warn" role="status">
          Ce conseil est archivé.
        </div>
      ) : null}
      {horsCibleOuvert ? (
        <div className="flash flash--error" role="status">
          Échéance dépassée (cible {CONSEIL_DELAI_CIBLE_JOURS} j. ouvrés).
        </div>
      ) : null}

      <div className="detail-grid">
        <div className="panel">
          <h2 className="panel-title">Informations</h2>
          <dl className="kv">
            <div>
              <dt>Responsable</dt>
              <dd>{conseil.responsable.nom}</dd>
            </div>
            <div>
              <dt>Statut</dt>
              <dd>{STATUT_CONSEIL_LABELS[conseil.statut]}</dd>
            </div>
            <div>
              <dt>Demandeur</dt>
              <dd>{conseil.demandeur ?? "—"}</dd>
            </div>
            <div>
              <dt>Entité</dt>
              <dd>{conseil.entiteDemandeuse ?? "—"}</dd>
            </div>
            <div>
              <dt>Réception</dt>
              <dd>{formatDate(conseil.dateReception)}</dd>
            </div>
            <div>
              <dt>Échéance</dt>
              <dd>{formatDate(conseil.dateEcheance)}</dd>
            </div>
            <div>
              <dt>Réponse</dt>
              <dd>{formatDate(conseil.dateReponse)}</dd>
            </div>
            <div>
              <dt>Clôture</dt>
              <dd>{formatDate(conseil.dateCloture)}</dd>
            </div>
            {delai != null ? (
              <div>
                <dt>Délai réel</dt>
                <dd>
                  {delai} j. ouvrés{" "}
                  {delai <= CONSEIL_DELAI_CIBLE_JOURS
                    ? "(respecté)"
                    : "(dépassé)"}
                </dd>
              </div>
            ) : null}
          </dl>
          {conseil.commentaires ? (
            <p className="detail-note">{conseil.commentaires}</p>
          ) : null}
          <p className="detail-trace">
            Créé par {conseil.creePar.nom} · Modifié par {conseil.modifiePar.nom}{" "}
            · {formatDate(conseil.modifieLe)}
          </p>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">
              Tâches liées ({conseil.taches.length})
            </h2>
          </div>
          {!conseil.archive ? (
            <form
              action={createTacheDepuisConseil}
              className="form-actions"
              style={{ marginBottom: "0.85rem" }}
            >
              <input type="hidden" name="conseilId" value={conseil.id} />
              <SubmitButton>Créer une tâche liée</SubmitButton>
              <BtnLink
                href={`/taches/nouvelle?conseilId=${conseil.id}&categorie=CONSEIL`}
                variant="ghost"
              >
                Formulaire complet
              </BtnLink>
            </form>
          ) : null}
          {conseil.taches.length === 0 ? (
            <p className="empty">Aucune tâche liée.</p>
          ) : (
            <ul className="entity-list">
              {conseil.taches.map((t) => {
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
