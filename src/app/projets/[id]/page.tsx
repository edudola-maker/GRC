import { TrackRecentView } from "@/components/dashboard/ReprendreTravail";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
} from "@/components/FormControls";
import { ProjetForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader, BtnLink } from "@/components/ui";
import {
  archiveProjet,
  deleteProjet,
  unarchiveProjet,
  updateProjet,
} from "../actions";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import {
  PRIORITE_LABELS,
  STATUT_PROJET_LABELS,
  STATUT_TACHE_LABELS,
  formatDate,
} from "@/lib/labels";
import { TachePrerequisForm } from "@/components/projets/TachePrerequisForm";
import { withRetour } from "@/lib/navigation-retour";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import {
  ElementsAssocies,
  type ElementAssocieItem,
} from "@/components/liens/ElementsAssocies";
import {
  EditableSection,
  SectionSaveActions,
} from "@/components/module/EditableSection";
import { listSectionRedactions } from "@/lib/section-redaction";
import { getActivationByTacheIds } from "@/lib/tache-dependances";
import { parseTags } from "@/lib/tags";
import { JournalTravailPanel } from "@/components/travail/JournalTravailPanel";
import { listerNotes } from "@/lib/notes";
import { listerJournalBord } from "@/lib/journal-bord";
import { deleteTache } from "@/app/taches/actions";
import { formatUtilisateurNom } from "@/lib/session";

export const dynamic = "force-dynamic";

const EDIT_SECTIONS = [
  "INFOS_GENERALES",
  "PILOTAGE",
  "ELEMENTS_ASSOCIES",
  "REFLEXION",
  "TAGS",
] as const;

type EditSection = (typeof EDIT_SECTIONS)[number];

function parseEdit(raw: string | undefined): EditSection | null {
  if (!raw) return null;
  return (EDIT_SECTIONS as readonly string[]).includes(raw)
    ? (raw as EditSection)
    : null;
}

export default async function ProjetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const edit = parseEdit(sp.edit);
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [projet, users, redactions, notes, journalBord] = await Promise.all([
    prisma.projet.findUnique({
      where: { id },
      include: {
        responsable: true,
        creePar: true,
        modifiePar: true,
        unite: true,
        membres: { include: { utilisateur: true } },
        documents: { include: { document: true } },
        taches: {
          include: {
            responsable: true,
            dependancesEnTantQueSuccesseur: {
              select: { prerequisId: true },
            },
          },
          orderBy: [{ dateDebut: "asc" }, { dateEcheance: "asc" }, { titre: "asc" }],
        },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
    listSectionRedactions("PROJET", id),
    listerNotes("PROJET", id),
    listerJournalBord("PROJET", id),
  ]);

  if (!projet) notFound();

  const canEdit = !projet.archive;
  const baseHref = `/projets/${projet.id}`;
  const membreIds = new Set(projet.membres.map((m) => m.utilisateurId));
  const tags = parseTags(projet.tags);
  const activation = await getActivationByTacheIds(
    projet.taches.map((t) => t.id),
  );

  const ownedItems: ElementAssocieItem[] = [
    ...projet.documents.map((d) => ({
      key: `doc-${d.document.id}`,
      type: "DOCUMENT" as const,
      code: d.document.code,
      titre: d.document.nom,
      href: `/documents/${d.document.id}`,
      owned: true,
    })),
  ];

  return (
    <>
      <BackLink href="/projets" label="← Retour aux projets" />
      <PageHeader
        title={`${projet.code} — ${projet.nom}`}
        description={projet.description ?? "Aucune description."}
        actions={
          <>
            {canEdit ? (
              <BtnLink
                href={`/taches/nouvelle?projetId=${projet.id}&retour=${encodeURIComponent(baseHref)}`}
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
      <TrackRecentView href={baseHref} label={`${projet.code} — ${projet.nom}`} />

      {projet.archive ? (
        <div className="flash flash--warn" role="status">
          Ce projet est archivé. Vous pouvez le désarchiver ou le consulter en
          lecture.
        </div>
      ) : null}

      <div className="stats" style={{ marginBottom: "1rem" }}>
        <div className="stat">
          <strong>{projet.avancement}%</strong>
          Avancement
        </div>
        <div className="stat">
          <strong>{projet.taches.length}</strong>
          Tâches
        </div>
        <div className="stat">
          <strong>{projet.membres.length + 1}</strong>
          Équipe
        </div>
      </div>

      <EditableSection
        title="Informations générales"
        sectionKey="INFOS_GENERALES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("INFOS_GENERALES")}
        defaultOpen
        editChildren={
          <ProjetForm
            action={updateProjet}
            users={users}
            values={projet}
            cancelHref={baseHref}
            submitLabel="Finaliser"
            section="INFOS_GENERALES"
            draftActions
          />
        }
      >
        <dl className="kv">
          <div>
            <dt>Code</dt>
            <dd>{projet.code}</dd>
          </div>
          <div>
            <dt>Unité</dt>
            <dd>{projet.unite.nom}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{projet.description ?? "—"}</dd>
          </div>
        </dl>
        <p className="detail-trace">
          Créé par {projet.creePar.nom} · Modifié par {projet.modifiePar.nom} ·{" "}
          {formatDate(projet.modifieLe)}
        </p>
      </EditableSection>

      <EditableSection
        title="Pilotage"
        sectionKey="PILOTAGE"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("PILOTAGE")}
        defaultOpen
        editChildren={
          <ProjetForm
            action={updateProjet}
            users={users}
            values={projet}
            cancelHref={baseHref}
            submitLabel="Finaliser"
            section="PILOTAGE"
            draftActions
            membreIds={[...membreIds]}
          />
        }
      >
        <dl className="kv">
          <div>
            <dt>Responsable</dt>
            <dd>{projet.responsable.nom}</dd>
          </div>
          <div>
            <dt>Équipe</dt>
            <dd>
              {projet.membres.length
                ? projet.membres.map((m) => m.utilisateur.nom).join(", ")
                : "Aucun membre additionnel"}
            </dd>
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
      </EditableSection>

      <CollapsibleSection
        title="Tâches"
        defaultOpen
        badge={`${projet.taches.length}`}
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Planification du projet : dates, charge, statut, commentaire et
          prérequis optionnel. Les tâches en attente restent visibles ici ;
          elles n’apparaissent pas au Dashboard tant que le prérequis n’est pas
          terminé.
        </p>
        {canEdit ? (
          <div className="form-actions" style={{ marginBottom: "0.75rem" }}>
            <BtnLink
              href={`/taches/nouvelle?projetId=${projet.id}&retour=${encodeURIComponent(baseHref)}`}
            >
              Ajouter une tâche
            </BtnLink>
          </div>
        ) : null}
        {projet.taches.length === 0 ? (
          <p className="empty">Aucune tâche planifiée.</p>
        ) : (
          <div className="projet-taches-table">
            <div className="projet-taches-table__head" role="row">
              <span>Tâche</span>
              <span>Responsable</span>
              <span>Dates</span>
              <span>Charge</span>
              <span>Statut</span>
              <span>Prérequis</span>
              <span>Commentaire</span>
              <span className="sr-only">Actions</span>
            </div>
            <ul className="projet-taches-table__list">
              {projet.taches.map((t) => {
                const act = activation.get(t.id);
                const enAttente = act && !act.active;
                return (
                  <li key={t.id}>
                    <div className="projet-taches-table__row projet-taches-table__row--static">
                      <Link
                        href={withRetour(`/taches/${t.id}`, baseHref)}
                        className="projet-taches-table__title"
                      >
                        <strong>{t.titre}</strong>
                        {enAttente ? (
                          <span className="tag tag--warn">
                            En attente du prérequis
                            {act.enAttenteDe.length
                              ? ` (${act.enAttenteDe.join(", ")})`
                              : ""}
                          </span>
                        ) : null}
                      </Link>
                      <span>{t.responsable.nom}</span>
                      <span>
                        {t.dateDebut || t.dateEcheance
                          ? `${formatDate(t.dateDebut)} → ${formatDate(t.dateEcheance)}`
                          : "—"}
                      </span>
                      <span>
                        {t.chargeJours != null ? `${t.chargeJours} j.` : "—"}
                      </span>
                      <span>{STATUT_TACHE_LABELS[t.statut] ?? t.statut}</span>
                      <span>
                        {canEdit ? (
                          <TachePrerequisForm
                            projetId={projet.id}
                            tacheId={t.id}
                            currentPrerequisIds={t.dependancesEnTantQueSuccesseur.map(
                              (d) => d.prerequisId,
                            )}
                            candidats={projet.taches.map((x) => ({
                              id: x.id,
                              titre: x.titre,
                            }))}
                          />
                        ) : act?.prerequisIds.length ? (
                          act.enAttenteDe.length
                            ? act.enAttenteDe.join(", ")
                            : "Prérequis satisfait"
                        ) : (
                          "—"
                        )}
                      </span>
                      <span className="muted">
                        {t.commentaires?.trim()
                          ? t.commentaires.trim().slice(0, 80)
                          : "—"}
                      </span>
                      {canEdit ? (
                        <ConfirmActionButton
                          action={deleteTache}
                          id={t.id}
                          label="🗑"
                          confirmMessage="Supprimer cette tâche ?"
                          variant="ghost"
                          fields={{ retour: `${baseHref}#` }}
                        />
                      ) : (
                        <span />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CollapsibleSection>

      <EditableSection
        title="Éléments associés"
        sectionKey="ELEMENTS_ASSOCIES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("ELEMENTS_ASSOCIES")}
        defaultOpen
        badge={`${ownedItems.length}`}
        editChildren={
          <>
            <ElementsAssocies
              uniteId={uniteId}
              type="PROJET"
              id={projet.id}
              retour={`${baseHref}?edit=ELEMENTS_ASSOCIES`}
              editable
              ownedItems={ownedItems}
              wrapInSection={false}
            />
            <form action={updateProjet} className="entity-form">
              <input type="hidden" name="id" value={projet.id} />
              <input type="hidden" name="sectionKey" value="ELEMENTS_ASSOCIES" />
              <SectionSaveActions baseHref={baseHref} sectionKey="ELEMENTS_ASSOCIES" />
            </form>
          </>
        }
      >
        <ElementsAssocies
          uniteId={uniteId}
          type="PROJET"
          id={projet.id}
          retour={baseHref}
          editable={false}
          ownedItems={ownedItems}
          wrapInSection={false}
        />
      </EditableSection>

      <EditableSection
        title="Réflexion / analyse"
        sectionKey="REFLEXION"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("REFLEXION")}
        defaultOpen={Boolean(projet.reflexion)}
        editChildren={
          <ProjetForm
            action={updateProjet}
            users={users}
            values={projet}
            cancelHref={baseHref}
            submitLabel="Finaliser"
            section="REFLEXION"
            draftActions
          />
        }
      >
        {projet.reflexion ? (
          <p className="detail-note" style={{ margin: 0 }}>
            {projet.reflexion}
          </p>
        ) : (
          <p className="empty">Aucune réflexion documentée.</p>
        )}
      </EditableSection>

      <EditableSection
        title="Tags"
        sectionKey="TAGS"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("TAGS")}
        defaultOpen
        editChildren={
          <ProjetForm
            action={updateProjet}
            users={users}
            values={projet}
            cancelHref={baseHref}
            submitLabel="Finaliser"
            section="TAGS"
            draftActions
          />
        }
      >
        <p style={{ margin: 0 }}>
          {tags.length ? tags.map((t) => `#${t}`).join(" ") : "Aucun tag."}
        </p>
      </EditableSection>

      <JournalTravailPanel
        typeObjet="PROJET"
        objetId={projet.id}
        entrees={journalBord}
        notes={notes}
        canEdit={canEdit}
        baseHref={baseHref}
      />
    </>
  );
}
