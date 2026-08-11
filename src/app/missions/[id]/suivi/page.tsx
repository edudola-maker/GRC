import Link from "next/link";
import { BtnLink } from "@/components/ui";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { MissionPageChrome } from "@/components/missions/MissionPageChrome";
import { MissionSuiviPanel } from "@/components/missions/MissionEtapePanels";
import { requireMissionDetail } from "@/lib/mission-data";
import { formatSectionEtatLabel } from "@/lib/section-redaction";

export const dynamic = "force-dynamic";

export default async function MissionSuiviPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const edit = sp.edit === "SUIVI" ? "SUIVI" : null;
  const { mission, redactions, etapes } = await requireMissionDetail(id);
  const canEdit = !mission.archive;
  const baseHref = `/missions/${mission.id}/suivi`;
  const editing = edit === "SUIVI";
  const etapeMeta = etapes.find((e) => e.key === "SUIVI")!;

  return (
    <MissionPageChrome
      mission={mission}
      etapes={etapes}
      currentSlug="suivi"
      ok={sp.ok}
      erreur={sp.erreur}
    >
      <CollapsibleSection
        title="5. Suivi des recommandations"
        defaultOpen
        badge={
          formatSectionEtatLabel(redactions.get("SUIVI")) ??
          etapeMeta.metric ??
          undefined
        }
        className={editing ? "collapsible-section--editing" : undefined}
        headerActions={
          canEdit && !edit ? (
            <Link
              href={`${baseHref}?edit=SUIVI#SUIVI`}
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
        </p>
        {editing && canEdit ? (
          <div className="form-actions section-save-actions">
            <BtnLink href={baseHref} variant="ghost">
              Annuler
            </BtnLink>
          </div>
        ) : null}
        <MissionSuiviPanel
          recommandations={mission.recommandations}
          metricLabel={etapeMeta.metric}
        />
      </CollapsibleSection>
    </MissionPageChrome>
  );
}
