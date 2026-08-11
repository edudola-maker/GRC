import Link from "next/link";
import { BtnLink } from "@/components/ui";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { MissionPageChrome } from "@/components/missions/MissionPageChrome";
import { MissionRecommandationsPanel } from "@/components/missions/MissionRecommandationsPanel";
import { requireMissionDetail } from "@/lib/mission-data";
import { formatSectionEtatLabel } from "@/lib/section-redaction";
import { listUtilisateursActifsForCurrentUnite } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MissionRecommandationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const edit = sp.edit === "RECOMMANDATIONS" ? "RECOMMANDATIONS" : null;
  const { mission, redactions, etapes } = await requireMissionDetail(id);
  const users = await listUtilisateursActifsForCurrentUnite();
  const canEdit = !mission.archive;
  const baseHref = `/missions/${mission.id}/recommandations`;
  const editing = edit === "RECOMMANDATIONS";
  const etapeMeta = etapes.find((e) => e.key === "RECOMMANDATIONS")!;

  return (
    <MissionPageChrome
      mission={mission}
      etapes={etapes}
      currentSlug="recommandations"
      ok={sp.ok}
      erreur={sp.erreur}
    >
      <CollapsibleSection
        title="3. Recommandations"
        defaultOpen
        badge={
          formatSectionEtatLabel(redactions.get("RECOMMANDATIONS")) ??
          `${mission.recommandations.length}`
        }
        className={editing ? "collapsible-section--editing" : undefined}
        headerActions={
          canEdit && !edit ? (
            <Link
              href={`${baseHref}?edit=RECOMMANDATIONS#RECOMMANDATIONS`}
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
              Annuler
            </BtnLink>
          </div>
        ) : null}
        <MissionRecommandationsPanel
          missionId={mission.id}
          canEdit={canEdit}
          editing={editing}
          recommandations={mission.recommandations}
          users={users}
        />
      </CollapsibleSection>
    </MissionPageChrome>
  );
}
