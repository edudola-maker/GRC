import { TrackRecentView } from "@/components/dashboard/ReprendreTravail";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
  SubmitButton,
} from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ConseilForm } from "@/components/EntityForms";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { EditableSection } from "@/components/module/EditableSection";
import { PageHeader, BtnLink } from "@/components/ui";
import {
  addNoteJournal,
  archiveConseil,
  updateConseil,
  createTacheDepuisConseil,
  deleteConseil,
  reopenConseil,
  unarchiveConseil,
  duplicateConseil,
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
import { listerJournal } from "@/lib/journal";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite, formatUtilisateurNom } from "@/lib/session";
import { parseTags } from "@/lib/tags";
import { QuickTacheForm } from "@/components/taches/QuickTacheForm";
import { JournalTravailPanel } from "@/components/travail/JournalTravailPanel";
import { listerNotes } from "@/lib/notes";
import { listerJournalBord } from "@/lib/journal-bord";
import { JournalTimeline } from "@/components/historique/JournalTimeline";
import { listUnitesActives } from "@/lib/unites-referentiel";


export const dynamic = "force-dynamic";

export default async function ConseilDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const edit =
    sp.edit === "INFOS_GENERALES" || sp.edit === "ELEMENTS_ASSOCIES"
      ? sp.edit
      : null;
  const user = await getCurrentUser();
  const [conseil, journal, journalBord, notes, users, unites] = await Promise.all([
    prisma.conseil.findUnique({
      where: { id },
      include: {
        responsable: true,
        creePar: true,
        modifiePar: true,
        conseilPrecedent: { select: { id: true, code: true, objet: true } },
        taches: {
          include: { responsable: true },
          orderBy: { dateEcheance: "asc" },
        },
      },
    }),
    listerJournal("CONSEIL", id),
    listerJournalBord("CONSEIL", id),
    listerNotes("CONSEIL", id),
    listUtilisateursActifsForCurrentUnite(),
    listUnitesActives(),
  ]);
  if (!conseil) notFound();
  const baseHref = `/conseils/${conseil.id}`;
  const canEdit = !conseil.archive;

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
              <ConfirmActionButton
                action={duplicateConseil}
                id={conseil.id}
                label="Nouveau lié"
                confirmMessage="Créer un nouveau conseil lié à celui-ci ?"
                variant="ghost"
              />
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
      <TrackRecentView href={baseHref} label={`${conseil.code} — ${conseil.objet}`} />
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

      <EditableSection
        title="Informations"
        sectionKey="INFOS_GENERALES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        defaultOpen
        editChildren={
          <ConseilForm
            action={updateConseil}
            users={users}
            unites={unites}
            values={conseil}
            cancelHref={baseHref}
            sectionKey="INFOS_GENERALES"
            submitLabel="Enregistrer"
          />
        }
      >
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
        {conseil.raisonnement ? (
          <p className="detail-note">{conseil.raisonnement}</p>
        ) : null}
        {conseil.conseilPrecedent ? (
          <p className="muted">
            Suite de{" "}
            <Link href={`/conseils/${conseil.conseilPrecedent.id}`}>
              {conseil.conseilPrecedent.code}
            </Link>
          </p>
        ) : null}
      </EditableSection>

      <section className="conseil-reponse" aria-label="Réponse / Conclusion">
        <h3>Réponse / Conclusion</h3>
        {conseil.reponseConclusion ? (
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {conseil.reponseConclusion}
          </p>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Aucune réponse formalisée — passez en Modifier pour la saisir.
          </p>
        )}
      </section>

      <CollapsibleSection
        title="Tâches liées"
        badge={conseil.taches.length}
        defaultOpen
      >
        {!conseil.archive ? (
          <div style={{ marginBottom: "0.85rem" }}>
            <QuickTacheForm
              users={users.map((u) => ({
                id: u.id,
                nom: formatUtilisateurNom(u),
              }))}
              retour={baseHref}
              defaults={{ responsableId: conseil.responsableId }}
              hidden={{ conseilId: conseil.id }}
            />
          </div>
        ) : null}
        {conseil.taches.length === 0 ? (
          <p className="empty">Aucune tâche liée.</p>
        ) : (
          <ul className="entity-list">
            {conseil.taches.map((t) => {
              const clos = (TACHE_STATUTS_CLOS as readonly string[]).includes(
                t.statut,
              );
              const urgence = urgenceEcheance(t.dateEcheance, clos);
              return (
                <li key={t.id}>
                  <Link
                    href={`/taches/${t.id}?retour=${encodeURIComponent(`/conseils/${conseil.id}`)}`}
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
      </CollapsibleSection>

      <EditableSection
        title="Éléments associés"
        sectionKey="ELEMENTS_ASSOCIES"
        baseHref={`/conseils/${conseil.id}`}
        edit={edit}
        canEdit={!conseil.archive}
        defaultOpen
        editChildren={
          <ElementsAssocies
            uniteId={user.uniteId}
            type="CONSEIL"
            id={conseil.id}
            retour={`/conseils/${conseil.id}?edit=ELEMENTS_ASSOCIES`}
            editable
            wrapInSection={false}
          />
        }
      >
        <ElementsAssocies
          uniteId={user.uniteId}
          type="CONSEIL"
          id={conseil.id}
          retour={`/conseils/${conseil.id}`}
          editable={false}
          wrapInSection={false}
        />
      </EditableSection>

      <CollapsibleSection title="Tags" defaultOpen>
        <p style={{ margin: 0 }}>
          {tags.length ? (
            <span className="tag-list">
              {tags.map((t) => (
                <span key={t} className="tag">
                  #{t}
                </span>
              ))}
            </span>
          ) : (
            "Aucun tag."
          )}
        </p>
      </CollapsibleSection>

      <JournalTravailPanel
        typeObjet="CONSEIL"
        objetId={conseil.id}
        entrees={journalBord}
        notes={notes}
        canEdit={canEdit}
        baseHref={baseHref}
      />

      <CollapsibleSection title="Historique système" defaultOpen={false} badge={journal.length || undefined}>
        <p className="muted" style={{ marginBottom: "0.65rem" }}>
          Traçabilité automatique (création, statuts, réouvertures).
        </p>
        <JournalTimeline entries={journal} />
        <p className="detail-trace" style={{ marginTop: "0.85rem" }}>
          Créé par {conseil.creePar.nom} · Modifié par {conseil.modifiePar.nom}{" "}
          · {formatDate(conseil.modifieLe)}
        </p>
      </CollapsibleSection>
    </>
  );
}
