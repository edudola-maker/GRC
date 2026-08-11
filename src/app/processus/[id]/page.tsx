import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
} from "@/components/FormControls";
import { ProcessusForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import {
  EditableSection,
  SectionSaveActions,
} from "@/components/module/EditableSection";
import { ProcessusEtapesPanel } from "@/components/processus/ProcessusEtapesPanel";
import { ProcessusModelesTachesPanel } from "@/components/processus/ProcessusModelesTachesPanel";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { PageHeader } from "@/components/ui";
import {
  archiveProcessus,
  deleteProcessus,
  unarchiveProcessus,
  updateProcessus,
} from "../actions";
import {
  NIVEAU_CONFIDENTIALITE_LABELS,
  STATUT_PROCESSUS_LABELS,
  formatDate,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { parseTags } from "@/lib/tags";
import { listSectionRedactions } from "@/lib/section-redaction";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";

export const dynamic = "force-dynamic";

const EDIT_SECTIONS = [
  "INFOS_GENERALES",
  "ETAPES",
  "ELEMENTS_ASSOCIES",
  "LPD",
] as const;

type EditSection = (typeof EDIT_SECTIONS)[number];

function parseEdit(raw: string | undefined): EditSection | null {
  if (!raw) return null;
  return (EDIT_SECTIONS as readonly string[]).includes(raw)
    ? (raw as EditSection)
    : null;
}

export default async function ProcessusDetailPage({
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

  const [processus, users, redactions] = await Promise.all([
    prisma.processus.findUnique({
      where: { id },
      include: {
        responsable: true,
        creePar: true,
        modifiePar: true,
        unite: true,
        etapes: { orderBy: { ordre: "asc" } },
        modelesTache: {
          include: {
            modeleTache: {
              select: {
                id: true,
                code: true,
                nom: true,
                actif: true,
                delaiJours: true,
                _count: { select: { etapes: true } },
              },
            },
          },
          orderBy: { lieLe: "asc" },
        },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
    listSectionRedactions("PROCESSUS", id),
  ]);
  if (!processus) notFound();

  const canEdit = !processus.archive;
  const baseHref = `/processus/${processus.id}`;
  const tags = parseTags(processus.tags);
  const confluenceUrl =
    processus.reference && /^https?:\/\//i.test(processus.reference)
      ? processus.reference
      : null;

  return (
    <>
      <BackLink href="/processus" label="← Retour aux processus" />
      <PageHeader
        title={`${processus.code} — ${processus.nom}`}
        description={
          processus.description ??
          "Processus = quoi ; procédure détaillée = Confluence."
        }
        actions={
          <>
            {processus.archive ? (
              <ConfirmActionButton
                action={unarchiveProcessus}
                id={processus.id}
                label="Désarchiver"
                confirmMessage="Remettre ce processus dans la liste active ?"
              />
            ) : (
              <ConfirmActionButton
                action={archiveProcessus}
                id={processus.id}
                label="Archiver"
                confirmMessage="Archiver ce processus ?"
              />
            )}
            <ConfirmDeleteButton
              action={deleteProcessus}
              id={processus.id}
              confirmMessage="Supprimer définitivement ce processus ?"
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {processus.archive ? (
        <div className="flash flash--warn">Ce processus est archivé.</div>
      ) : null}

      <EditableSection
        title="Informations générales"
        sectionKey="INFOS_GENERALES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("INFOS_GENERALES")}
        defaultOpen
        editChildren={
          <ProcessusForm
            action={updateProcessus}
            users={users}
            values={processus}
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
            <dd>{processus.code}</dd>
          </div>
          <div>
            <dt>Unité propriétaire</dt>
            <dd>{processus.unite.nom}</dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{processus.responsable.nom}</dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>{STATUT_PROCESSUS_LABELS[processus.statut]}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{processus.description ?? "—"}</dd>
          </div>
          <div>
            <dt>Lien Confluence</dt>
            <dd>
              {confluenceUrl ? (
                <a href={confluenceUrl} target="_blank" rel="noreferrer">
                  {processus.reference}
                </a>
              ) : (
                (processus.reference ?? "—")
              )}
            </dd>
          </div>
        </dl>
        <p className="detail-trace">
          Créé par {processus.creePar.nom} · Modifié par{" "}
          {processus.modifiePar.nom} · {formatDate(processus.modifieLe)}
        </p>
      </EditableSection>

      <EditableSection
        title="Étapes du processus"
        sectionKey="ETAPES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("ETAPES")}
        defaultOpen
        badge={`${processus.etapes.length}`}
        editChildren={
          <>
            <ProcessusEtapesPanel
              processusId={processus.id}
              etapes={processus.etapes}
              editable
            />
            <form action={updateProcessus} className="entity-form">
              <input type="hidden" name="id" value={processus.id} />
              <input type="hidden" name="sectionKey" value="ETAPES" />
              <SectionSaveActions baseHref={baseHref} sectionKey="ETAPES" />
            </form>
          </>
        }
      >
        <ProcessusEtapesPanel
          processusId={processus.id}
          etapes={processus.etapes}
          editable={false}
        />
      </EditableSection>

      <CollapsibleSection
        title="Modèles de tâches associés"
        defaultOpen
        badge={`${processus.modelesTache.length}`}
      >
        <ProcessusModelesTachesPanel
          modeles={processus.modelesTache.map((l) => ({
            id: l.modeleTache.id,
            code: l.modeleTache.code,
            nom: l.modeleTache.nom,
            actif: l.modeleTache.actif,
            delaiJours: l.modeleTache.delaiJours,
            etapesCount: l.modeleTache._count.etapes,
          }))}
        />
      </CollapsibleSection>

      <EditableSection
        title="Éléments associés"
        sectionKey="ELEMENTS_ASSOCIES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("ELEMENTS_ASSOCIES")}
        defaultOpen
        editChildren={
          <>
            <ElementsAssocies
              uniteId={user.uniteId}
              type="PROCESSUS"
              id={processus.id}
              retour={`${baseHref}?edit=ELEMENTS_ASSOCIES`}
              editable
              wrapInSection={false}
            />
            <form action={updateProcessus} className="entity-form">
              <input type="hidden" name="id" value={processus.id} />
              <input type="hidden" name="sectionKey" value="ELEMENTS_ASSOCIES" />
              <SectionSaveActions baseHref={baseHref} sectionKey="ELEMENTS_ASSOCIES" />
            </form>
          </>
        }
      >
        <ElementsAssocies
          uniteId={user.uniteId}
          type="PROCESSUS"
          id={processus.id}
          retour={baseHref}
          editable={false}
          wrapInSection={false}
        />
      </EditableSection>

      <EditableSection
        title="Protection des données & tags"
        sectionKey="LPD"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("LPD")}
        defaultOpen={false}
        editChildren={
          <ProcessusForm
            action={updateProcessus}
            users={users}
            values={processus}
            cancelHref={baseHref}
            submitLabel="Finaliser"
            section="LPD"
            draftActions
          />
        }
      >
        <dl className="kv">
          <div>
            <dt>Données personnelles</dt>
            <dd>
              {processus.contientDonneesPersonnelles ? "Oui" : "Non"}
            </dd>
          </div>
          <div>
            <dt>Niveau de confidentialité</dt>
            <dd>
              {NIVEAU_CONFIDENTIALITE_LABELS[processus.niveauConfidentialite] ??
                processus.niveauConfidentialite}
            </dd>
          </div>
          <div>
            <dt>Tags</dt>
            <dd>
              {tags.length ? tags.map((t) => `#${t}`).join(" ") : "—"}
            </dd>
          </div>
        </dl>
      </EditableSection>
    </>
  );
}
