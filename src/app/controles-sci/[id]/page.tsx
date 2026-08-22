import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
} from "@/components/FormControls";
import { TrackRecentView } from "@/components/dashboard/ReprendreTravail";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader, BtnLink } from "@/components/ui";
import {
  archiveControleSCI,
  deleteControleSCI,
  unarchiveControleSCI,
  updateControleSCI,
} from "../actions";
import {
  CATEGORIE_TACHE_LABELS,
  FREQUENCE_LABELS,
  STATUT_CONTROLE_LABELS,
  STATUT_TACHE_LABELS,
  TYPE_CONTROLE_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { parseTags } from "@/lib/tags";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { ControleSCIForm } from "@/components/EntityForms";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { EditableSection } from "@/components/module/EditableSection";
import { listUnitesActives } from "@/lib/unites-referentiel";

export const dynamic = "force-dynamic";

export default async function ControleSCIDetailPage({
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

  const [controle, users, unites] = await Promise.all([
  prisma.controleSCI.findUnique({
    where: { id },
    include: {
      responsable: true,
      creePar: true,
      modifiePar: true,
      risques: {
        include: { risque: true },
        orderBy: { creeLe: "desc" },
      },
      taches: {
        include: { responsable: true },
        orderBy: { dateEcheance: "asc" },
      },
    },
  }),
  listUtilisateursActifsForCurrentUnite(),
  listUnitesActives(),
  ]);
  if (!controle) notFound();

  const baseHref = `/controles-sci/${controle.id}`;
  const canEdit = !controle.archive;
  const urgence = urgenceEcheance(
    controle.dateProchaineEcheance,
    controle.archive || controle.statut === "SUSPENDU",
  );
  const tags = parseTags(controle.tags);

  return (
    <>
      <BackLink href="/controles-sci" label="← Retour aux contrôles" />
      <TrackRecentView
        href={baseHref}
        label={`${controle.code} — ${controle.nom}`}
      />
      <PageHeader
        title={`${controle.code} — ${controle.nom}`}
        description={controle.description ?? "Aucune description."}
        actions={
          <>
            {controle.archive ? (
              <ConfirmActionButton
                action={unarchiveControleSCI}
                id={controle.id}
                label="Désarchiver"
                confirmMessage="Remettre ce contrôle dans la liste active ?"
              />
            ) : (
              <ConfirmActionButton
                action={archiveControleSCI}
                id={controle.id}
                label="Archiver"
                confirmMessage="Archiver ce contrôle ?"
              />
            )}
            <ConfirmDeleteButton
              action={deleteControleSCI}
              id={controle.id}
              confirmMessage="Supprimer définitivement ce contrôle ?"
            />
          </>
        }
      />

      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {controle.archive ? (
        <div className="flash flash--warn">Ce contrôle est archivé.</div>
      ) : null}
      {urgence === "retard" && controle.statut === "ACTIF" ? (
        <div className="flash flash--error">
          Prochaine occurrence dépassée :{" "}
          {formatDate(controle.dateProchaineEcheance)}.
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
          <ControleSCIForm
            action={updateControleSCI}
            users={users}
            unites={unites}
            values={controle}
            cancelHref={baseHref}
            sectionKey="INFOS_GENERALES"
            submitLabel="Enregistrer"
          />
        }
      >
        <dl className="kv">
          <div>
            <dt>Code</dt>
            <dd>{controle.code}</dd>
          </div>
          <div>
            <dt>Processus</dt>
            <dd>{controle.processusConcerne}</dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{controle.responsable.nom}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{TYPE_CONTROLE_LABELS[controle.typeControle]}</dd>
          </div>
          <div>
            <dt>Fréquence</dt>
            <dd>{FREQUENCE_LABELS[controle.frequence]}</dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>{STATUT_CONTROLE_LABELS[controle.statut]}</dd>
          </div>
          <div>
            <dt>Fenêtre de déclenchement</dt>
            <dd>{controle.fenetreDeclenchementJours} j.</dd>
          </div>
          <div>
            <dt>Délai de réalisation</dt>
            <dd>
              {controle.delaiRealisationJours != null
                ? `${controle.delaiRealisationJours} j.`
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Dernière réalisation</dt>
            <dd>{formatDate(controle.dateDerniereRealisation)}</dd>
          </div>
          <div>
            <dt>Prochaine échéance</dt>
            <dd>{formatDate(controle.dateProchaineEcheance)}</dd>
          </div>
        </dl>
        {controle.commentaires ? (
          <p className="detail-note">{controle.commentaires}</p>
        ) : null}
        <p className="detail-trace">
          Créé par {controle.creePar.nom} · Modifié par{" "}
          {controle.modifiePar.nom} · {formatDate(controle.modifieLe)}
        </p>
      </EditableSection>

      <CollapsibleSection
        title="Risques couverts"
        badge={controle.risques.length}
        defaultOpen
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Consultation — associations libres via Éléments associés (mode Modifier de la box).
        </p>
        {controle.risques.length === 0 ? (
          <p className="empty">Aucun risque associé.</p>
        ) : (
          <ul className="entity-list">
            {controle.risques.map((rc) => (
              <li key={rc.id}>
                <Link
                  href={`/risques/${rc.risque.id}`}
                  className="entity-row"
                >
                  <div className="entity-row__main">
                    <strong>{rc.risque.nom}</strong>
                    <span className="entity-row__meta">
                      Criticité {rc.risque.criticite}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <EditableSection
        title="Éléments associés"
        sectionKey="ELEMENTS_ASSOCIES"
        baseHref={`/controles-sci/${controle.id}`}
        edit={edit}
        canEdit={!controle.archive}
        defaultOpen
        editChildren={
          <ElementsAssocies
            uniteId={user.uniteId}
            type="CONTROLE_SCI"
            id={controle.id}
            retour={`/controles-sci/${controle.id}?edit=ELEMENTS_ASSOCIES`}
            editable
            wrapInSection={false}
          />
        }
      >
        <ElementsAssocies
          uniteId={user.uniteId}
          type="CONTROLE_SCI"
          id={controle.id}
          retour={`/controles-sci/${controle.id}`}
          editable={false}
          wrapInSection={false}
        />
      </EditableSection>

      <CollapsibleSection
        title="Occurrences / tâches"
        badge={controle.taches.length}
        defaultOpen
        className="collapsible-section--secondary"
      >
        {!controle.archive && controle.statut === "ACTIF" ? (
          <div className="form-actions" style={{ marginBottom: "0.65rem" }}>
            <BtnLink
              href={`/taches/nouvelle?controleSCIId=${controle.id}&categorie=SCI`}
              variant="ghost"
            >
              Nouvelle occurrence
            </BtnLink>
          </div>
        ) : null}
        <p className="muted" style={{ marginTop: 0 }}>
          L’exécution du contrôle se fait via ces tâches (commentaire, preuve,
          date de réalisation).
        </p>
        {controle.taches.length === 0 ? (
          <p className="empty">Aucune occurrence pour le moment.</p>
        ) : (
          <ul className="entity-list entity-list--compact">
            {controle.taches.map((t) => {
              const tClos = (TACHE_STATUTS_CLOS as readonly string[]).includes(
                t.statut,
              );
              const tUrgence = urgenceEcheance(t.dateEcheance, tClos);
              return (
                <li key={t.id}>
                  <Link
                    href={`/taches/${t.id}`}
                    className={`entity-row entity-row--${tUrgence}`}
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
      </CollapsibleSection>

      <CollapsibleSection title="Tags" defaultOpen>
        <p style={{ margin: 0 }}>
          {tags.length ? tags.map((t) => `#${t}`).join(" ") : "Aucun tag."}
        </p>
      </CollapsibleSection>
    </>
  );
}
