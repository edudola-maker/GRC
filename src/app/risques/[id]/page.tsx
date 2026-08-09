import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
} from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { RisqueForm } from "@/components/EntityForms";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { EditableSection } from "@/components/module/EditableSection";
import { PageHeader } from "@/components/ui";
import { archiveRisque, deleteRisque, updateRisque } from "../actions";
import {
  CATEGORIE_RISQUE_LABELS,
  STATUT_CONTROLE_LABELS,
  STATUT_RISQUE_LABELS,
  STRATEGIE_RISQUE_LABELS,
  criticiteNiveau,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { parseTags } from "@/lib/tags";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RisqueDetailPage({
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

  const [risque, users] = await Promise.all([
  prisma.risque.findUnique({
    where: { id },
    include: {
      responsable: true,
      creePar: true,
      controles: {
        include: {
          controle: {
            include: { responsable: true },
          },
        },
        orderBy: { creeLe: "asc" },
      },
    },
  }),
  listUtilisateursActifsForCurrentUnite(),
  ]);

  if (!risque) notFound();

  const niveau = criticiteNiveau(risque.criticite);
  const tags = parseTags(risque.tags);
  const baseHref = `/risques/${risque.id}`;
  const canEdit = !risque.archive;

  return (
    <>
      <BackLink href="/risques" label="← Retour aux risques" />
      <PageHeader
        title={`${risque.code} — ${risque.nom}`}
        description={risque.description ?? "Aucune description."}
        actions={
          <>
            <ConfirmActionButton
              action={archiveRisque}
              id={risque.id}
              fields={{ archive: risque.archive ? "0" : "1" }}
              label={risque.archive ? "Désarchiver" : "Archiver"}
              confirmMessage={
                risque.archive
                  ? "Remettre ce risque dans la liste active ?"
                  : "Archiver ce risque ?"
              }
            />
            <ConfirmDeleteButton
              action={deleteRisque}
              id={risque.id}
              confirmMessage="Supprimer définitivement ce risque ?"
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {risque.archive ? (
        <div className="flash flash--warn" role="status">
          Ce risque est archivé.
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
          <RisqueForm
            action={updateRisque}
            users={users}
            values={risque}
            cancelHref={baseHref}
            submitLabel="Enregistrer"
          />
        }
      >
        <dl className="kv">
          <div>
            <dt>Code</dt>
            <dd>{risque.code}</dd>
          </div>
          <div>
            <dt>Catégorie</dt>
            <dd>{CATEGORIE_RISQUE_LABELS[risque.categorie]}</dd>
          </div>
          <div>
            <dt>Processus (libellé)</dt>
            <dd>{risque.processus ?? "—"}</dd>
          </div>
          <div>
            <dt>Inhérent (P × I)</dt>
            <dd>
              {risque.probabilite} × {risque.impact} = {risque.criticite} (
              {niveau})
            </dd>
          </div>
          <div>
            <dt>Résiduel (P × I)</dt>
            <dd>
              {risque.probabiliteResiduelle != null &&
              risque.impactResiduel != null &&
              risque.criticiteResiduelle != null
                ? `${risque.probabiliteResiduelle} × ${risque.impactResiduel} = ${risque.criticiteResiduelle} (${criticiteNiveau(risque.criticiteResiduelle)})`
                : "Non renseigné"}
            </dd>
          </div>
          <div>
            <dt>Stratégie</dt>
            <dd>
              {risque.strategie
                ? STRATEGIE_RISQUE_LABELS[risque.strategie]
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{risque.responsable.nom}</dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>{STATUT_RISQUE_LABELS[risque.statut]}</dd>
          </div>
          <div>
            <dt>Créé par</dt>
            <dd>{risque.creePar.nom}</dd>
          </div>
        </dl>
        {risque.justificationEvaluation ? (
          <p className="detail-note">{risque.justificationEvaluation}</p>
        ) : null}
        {risque.commentaires ? (
          <p className="detail-note">{risque.commentaires}</p>
        ) : null}
      </EditableSection>

      <CollapsibleSection
        title="Contrôles SCI liés"
        defaultOpen={false}
        badge={`${risque.controles.length}`}
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Liaison métier historique — pour les associations libres, utilisez
          Éléments associés (mode Modifier).
        </p>

        {risque.controles.length === 0 ? (
          <p className="empty">Aucun contrôle lié pour l&apos;instant.</p>
        ) : (
          <ul className="entity-list">
            {risque.controles.map(({ controle: c }) => {
              const urgence = urgenceEcheance(
                c.dateProchaineEcheance,
                c.archive || c.statut === "SUSPENDU",
              );
              return (
                <li key={c.id}>
                  <Link
                    href={`/controles-sci/${c.id}`}
                    className={`entity-row entity-row--${urgence}`}
                  >
                    <div className="entity-row__main">
                      <strong>{c.nom}</strong>
                      <span className="entity-row__meta">
                        {c.responsable.nom} ·{" "}
                        {STATUT_CONTROLE_LABELS[c.statut]}
                      </span>
                    </div>
                    <span className="entity-row__date">
                      {formatDate(c.dateProchaineEcheance)}
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
        baseHref={`/risques/${risque.id}`}
        edit={edit}
        canEdit={!risque.archive}
        defaultOpen={false}
        editChildren={
          <ElementsAssocies
            uniteId={user.uniteId}
            type="RISQUE"
            id={risque.id}
            retour={`/risques/${risque.id}?edit=ELEMENTS_ASSOCIES`}
            editable
            wrapInSection={false}
          />
        }
      >
        <ElementsAssocies
          uniteId={user.uniteId}
          type="RISQUE"
          id={risque.id}
          retour={`/risques/${risque.id}`}
          editable={false}
          wrapInSection={false}
        />
      </EditableSection>

      <CollapsibleSection title="Tags" defaultOpen={false}>
        <p style={{ margin: 0 }}>
          {tags.length ? tags.map((t) => `#${t}`).join(" ") : "Aucun tag."}
        </p>
      </CollapsibleSection>
    </>
  );
}
