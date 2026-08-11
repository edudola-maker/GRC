import Link from "next/link";
import { BtnLink } from "@/components/ui";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { MissionPageChrome } from "@/components/missions/MissionPageChrome";
import { MissionRapportPanel } from "@/components/missions/MissionEtapePanels";
import { requireMissionDetail } from "@/lib/mission-data";
import { formatSectionEtatLabel } from "@/lib/section-redaction";

export const dynamic = "force-dynamic";

export default async function MissionRapportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const edit = sp.edit === "RAPPORT" ? "RAPPORT" : null;
  const { mission, redactions, etapes } = await requireMissionDetail(id);
  const canEdit = !mission.archive;
  const baseHref = `/missions/${mission.id}/rapport`;
  const editing = edit === "RAPPORT";
  const etapeMeta = etapes.find((e) => e.key === "RAPPORT")!;

  return (
    <MissionPageChrome
      mission={mission}
      etapes={etapes}
      currentSlug="rapport"
      ok={sp.ok}
      erreur={sp.erreur}
    >
      <CollapsibleSection
        title="4. Rapport"
        defaultOpen
        badge={
          formatSectionEtatLabel(redactions.get("RAPPORT")) ?? undefined
        }
        className={editing ? "collapsible-section--editing" : undefined}
        headerActions={
          canEdit && !edit ? (
            <Link
              href={`${baseHref}?edit=RAPPORT#RAPPORT`}
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
        <MissionRapportPanel />
      </CollapsibleSection>
    </MissionPageChrome>
  );
}
