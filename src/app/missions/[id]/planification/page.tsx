import Link from "next/link";
import { BtnLink } from "@/components/ui";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { MissionPageChrome } from "@/components/missions/MissionPageChrome";
import { MissionPlanificationPanel } from "@/components/missions/MissionPlanificationPanel";
import { requireMissionDetail } from "@/lib/mission-data";
import { listerNotes } from "@/lib/notes";
import { formatSectionEtatLabel } from "@/lib/section-redaction";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MissionPlanificationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const edit = sp.edit === "PLANIFICATION" ? "PLANIFICATION" : null;
  await getCurrentUser();
  const { mission, redactions, etapes, equipe } = await requireMissionDetail(id);

  const [users, roles, documentsDispo, notes, risquesGrc] = await Promise.all([
    listUtilisateursActifsForCurrentUnite(),
    prisma.missionRole.findMany({
      where: { actif: true },
      orderBy: { ordre: "asc" },
    }),
    prisma.document.findMany({
      where: { archive: false, uniteId: mission.uniteId },
      orderBy: { nom: "asc" },
      select: { id: true, nom: true },
    }),
    listerNotes("MISSION", id, { etapeMission: "PLANIFICATION" }),
    prisma.risque.findMany({
      where: { uniteId: mission.uniteId, archive: false },
      orderBy: { code: "asc" },
      select: { id: true, code: true, nom: true },
      take: 200,
    }),
  ]);

  const linkedIds = new Set(mission.documents.map((d) => d.documentId));
  const docsALier = documentsDispo.filter((d) => !linkedIds.has(d.id));
  const canEdit = !mission.archive;
  const baseHref = `/missions/${mission.id}/planification`;
  const editing = edit === "PLANIFICATION";
  const etapeMeta = etapes.find((e) => e.key === "PLANIFICATION")!;

  return (
    <MissionPageChrome
      mission={mission}
      etapes={etapes}
      currentSlug="planification"
      ok={sp.ok}
      erreur={sp.erreur}
    >
      <CollapsibleSection
        title="1. Planification"
        defaultOpen
        badge={
          formatSectionEtatLabel(redactions.get("PLANIFICATION")) ??
          etapeMeta.metric ??
          undefined
        }
        className={editing ? "collapsible-section--editing" : undefined}
        headerActions={
          canEdit && !edit ? (
            <Link
              href={`${baseHref}?edit=PLANIFICATION#PLANIFICATION`}
              scroll={false}
              className="btn btn--ghost collapsible-section__modify"
            >
              Modifier
            </Link>
          ) : null
        }
      >
        <p className="muted" style={{ marginTop: 0 }}>
          {etapeMeta.question}
          {etapeMeta.metric ? ` · ${etapeMeta.metric}` : ""}
        </p>
        {editing && canEdit ? (
          <div className="form-actions section-save-actions">
            <BtnLink href={baseHref} variant="ghost">
              Terminer / Annuler
            </BtnLink>
          </div>
        ) : null}
        <MissionPlanificationPanel
          missionId={mission.id}
          canEdit={canEdit}
          editing={editing}
          baseHref={baseHref}
          equipe={equipe}
          roles={roles}
          users={users}
          checklistItems={mission.checklistItems}
          validationPoints={mission.validationPoints}
          taches={mission.taches}
          documents={mission.documents}
          docsALier={docsALier}
          objectifs={mission.objectifsMission}
          risquesMission={mission.risquesMission}
          documentation={mission.documentationDemandee}
          notes={notes}
          risquesGrc={risquesGrc}
        />
      </CollapsibleSection>
    </MissionPageChrome>
  );
}
