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
  addNoteJournal,
  archiveConseil,
  createTacheDepuisConseil,
  deleteConseil,
  reopenConseil,
  unarchiveConseil,
} from "../actions";
import {
  CATEGORIE_TACHE_LABELS,
  STATUT_CONSEIL_LABELS,
  STATUT_TACHE_LABELS,
  TAXINOMIE_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import {
  CONSEIL_DELAI_CIBLE_JOURS,
  CONSEIL_STATUTS_CLOS,
  TACHE_STATUTS_CLOS,
} from "@/lib/catalog";
import { businessDaysBetween } from "@/lib/dates";
import { listerJournal } from "@/lib/journal";
import { prisma } from "@/lib/prisma";
import { parseTags } from "@/lib/tags";

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
  const [conseil, journal] = await Promise.all([
    prisma.conseil.findUnique({
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
    }),
    listerJournal("CONSEIL", id),
  ]);
  if (!conseil) notFound();

  const fin = conseil.dateCloture ?? conseil.dateReponse;
  const delai = fin ? businessDaysBetween(conseil.dateReception, fin) : null;
  const estClos = (CONSEIL_STATUTS_CLOS as readonly string[]).includes(
    conseil.statut,
  );
  const horsCibleOuvert =
    !fin &&
    conseil.dateEcheance &&
    conseil.dateEcheance < new Date() &&
    !estClos;
  const tags = parseTags(conseil.tags);

  return (
    <>
      <BackLink href="/conseils" label="← Retour aux conseils" />
      <PageHeader
        title={`${conseil.code} — ${conseil.objet}`}
        description={conseil.description ?? "Aucune description."}
        actions={
          <>
            {!conseil.archive ? (
              <BtnLink href={`/conseils/${conseil.id}/modifier`}>
                Modifier
              </BtnLink>
            ) : null}
            {estClos && !conseil.archive ? (
              <ConfirmActionButton
                action={reopenConseil}
                id={conseil.id}
                label="Rouvrir"
                confirmMessage="Rouvrir ce conseil ? Le statut repassera à En cours."
              />
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
              <dt>Code</dt>
              <dd>{conseil.code}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{conseil.responsable.nom}</dd>
            </div>
            <div>
              <dt>Statut</dt>
              <dd>{STATUT_CONSEIL_LABELS[conseil.statut]}</dd>
            </div>
            <div>
              <dt>Taxinomie</dt>
              <dd>
                {conseil.taxinomie
                  ? (TAXINOMIE_LABELS[conseil.taxinomie] ?? conseil.taxinomie)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Tags</dt>
              <dd>
                {tags.length ? (
                  <span className="tag-list">
                    {tags.map((t) => (
                      <span key={t} className="tag">
                        #{t}
                      </span>
                    ))}
                  </span>
                ) : (
                  "—"
                )}
              </dd>
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

        <div className="stack-panels">
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

          <div className="panel">
            <h2 className="panel-title">Journal</h2>
            <p className="muted" style={{ marginBottom: "0.65rem" }}>
              Notes et événements (réouvertures, échanges).
            </p>
            {!conseil.archive ? (
              <form action={addNoteJournal} className="entity-form">
                <input type="hidden" name="conseilId" value={conseil.id} />
                <label className="field" htmlFor="message">
                  <span className="field__label">Ajouter une note</span>
                  <textarea
                    id="message"
                    name="message"
                    rows={2}
                    required
                    placeholder="Ex. Relance effectuée auprès du demandeur…"
                  />
                </label>
                <div className="form-actions">
                  <SubmitButton>Ajouter au journal</SubmitButton>
                </div>
              </form>
            ) : null}
            {journal.length === 0 ? (
              <p className="empty">Aucune entrée pour l&apos;instant.</p>
            ) : (
              <ul className="history-list" style={{ marginTop: "0.85rem" }}>
                {journal.map((e) => (
                  <li key={e.id}>
                    <strong>
                      {e.typeEvenement === "NOTE"
                        ? "Note"
                        : e.typeEvenement === "REOUVERTURE"
                          ? "Réouverture"
                          : e.typeEvenement}
                    </strong>
                    <span>{e.message}</span>
                    <em>
                      {e.auteur?.nom ?? "Système"} · {formatDate(e.creeLe)}
                    </em>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
