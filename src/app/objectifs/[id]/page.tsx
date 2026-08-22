import { notFound } from "next/navigation";
import { ConfirmDeleteButton } from "@/components/FormControls";
import { TrackRecentView } from "@/components/dashboard/ReprendreTravail";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import {
  EditableSection,
  SectionSaveActions,
} from "@/components/module/EditableSection";
import { ObjectifForm } from "@/components/objectifs/ObjectifForm";
import { PageHeader } from "@/components/ui";
import { deleteObjectif, updateObjectif } from "../actions";
import {
  PRIORITE_LABELS,
  STATUT_OBJECTIF_LABELS,
  formatDate,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { listSectionRedactions } from "@/lib/section-redaction";
import {
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";

export const dynamic = "force-dynamic";

const EDIT_SECTIONS = ["INFOS_GENERALES", "ELEMENTS_ASSOCIES"] as const;
type EditSection = (typeof EDIT_SECTIONS)[number];

function parseEdit(raw: string | undefined): EditSection | null {
  if (!raw) return null;
  return (EDIT_SECTIONS as readonly string[]).includes(raw)
    ? (raw as EditSection)
    : null;
}

export default async function ObjectifDetailPage({
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

  const [objectif, users, redactions, attributions] = await Promise.all([
    prisma.objectif.findUnique({
      where: { id },
      include: {
        responsable: true,
        creePar: true,
        modifiePar: true,
        unite: true,
        attributions: { select: { attributionId: true } },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
    listSectionRedactions("OBJECTIF", id),
    prisma.uniteAttribution.findMany({
      where: { uniteId: user.uniteId, actif: true },
      select: { id: true, titre: true },
      orderBy: [{ ordre: "asc" }, { titre: "asc" }],
    }),
  ]);
  if (!objectif || objectif.uniteId !== user.uniteId) notFound();

  const baseHref = `/objectifs/${objectif.id}`;
  const formValues = {
    ...objectif,
    attributionIds: objectif.attributions.map((a) => a.attributionId),
  };
  const smartBits = [
    objectif.smartSpecifique && "Spécifique",
    objectif.smartMesurable && "Mesurable",
    objectif.smartAtteignable && "Atteignable",
    objectif.smartRealiste && "Réaliste",
    objectif.smartTemporel && "Temporel",
  ].filter(Boolean);

  return (
    <>
      <BackLink href="/unite" label="← Retour à l’unité" />
      <PageHeader
        title={`${objectif.code} — ${objectif.intitule}`}
        description={
          objectif.description ??
          "Objectif stratégique d’unité — liez les éléments qui y contribuent."
        }
        actions={
          <ConfirmDeleteButton
            action={deleteObjectif}
            id={objectif.id}
            confirmMessage="Supprimer définitivement cet objectif ?"
          />
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <TrackRecentView
        href={baseHref}
        label={`${objectif.code} — ${objectif.intitule}`}
      />

      <EditableSection
        title="Informations générales"
        sectionKey="INFOS_GENERALES"
        baseHref={baseHref}
        edit={edit}
        canEdit
        redaction={redactions.get("INFOS_GENERALES")}
        defaultOpen
        editChildren={
          <ObjectifForm
            action={updateObjectif}
            users={users}
            attributions={attributions}
            values={formValues}
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
            <dd>{objectif.code}</dd>
          </div>
          <div>
            <dt>Unité</dt>
            <dd>{objectif.unite.nom}</dd>
          </div>
          <div>
            <dt>Année</dt>
            <dd>{objectif.annee}</dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{objectif.responsable.nom}</dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>{STATUT_OBJECTIF_LABELS[objectif.statut] ?? objectif.statut}</dd>
          </div>
          <div>
            <dt>Priorité</dt>
            <dd>{PRIORITE_LABELS[objectif.priorite] ?? objectif.priorite}</dd>
          </div>
          <div>
            <dt>Progression</dt>
            <dd>
              {objectif.progression} % (
              {objectif.progressionMode === "AUTOMATIQUE"
                ? "automatique"
                : "manuelle"}
              )
            </dd>
          </div>
          <div>
            <dt>SMART</dt>
            <dd>{smartBits.length > 0 ? smartBits.join(" · ") : "—"}</dd>
          </div>
          <div>
            <dt>Échéance</dt>
            <dd>{formatDate(objectif.dateEcheance)}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{objectif.description ?? "—"}</dd>
          </div>
        </dl>
        <p className="detail-trace">
          Créé par {objectif.creePar.nom} · Modifié par{" "}
          {objectif.modifiePar.nom} · {formatDate(objectif.modifieLe)}
        </p>
      </EditableSection>

      <EditableSection
        title="Éléments associés"
        sectionKey="ELEMENTS_ASSOCIES"
        baseHref={baseHref}
        edit={edit}
        canEdit
        redaction={redactions.get("ELEMENTS_ASSOCIES")}
        defaultOpen
        editChildren={
          <>
            <ElementsAssocies
              uniteId={user.uniteId}
              type="OBJECTIF"
              id={objectif.id}
              retour={`${baseHref}?edit=ELEMENTS_ASSOCIES`}
              editable
              wrapInSection={false}
            />
            <form action={updateObjectif} className="entity-form">
              <input type="hidden" name="id" value={objectif.id} />
              <input type="hidden" name="sectionKey" value="ELEMENTS_ASSOCIES" />
              <SectionSaveActions baseHref={baseHref} sectionKey="ELEMENTS_ASSOCIES" />
            </form>
          </>
        }
      >
        <ElementsAssocies
          uniteId={user.uniteId}
          type="OBJECTIF"
          id={objectif.id}
          retour={baseHref}
          editable={false}
          wrapInSection={false}
        />
      </EditableSection>
    </>
  );
}
