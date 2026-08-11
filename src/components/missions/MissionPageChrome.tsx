import type { ReactNode } from "react";
import {
  ConfirmActionButton,
} from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { MissionEtapesNav } from "@/components/missions/MissionEtapesNav";
import { PageHeader } from "@/components/ui";
import { archiveMission, unarchiveMission } from "@/app/missions/actions";
import type { MissionEtapeSlug, MissionEtapeVue } from "@/lib/mission-etapes";
import { formatDate, urgenceEcheance } from "@/lib/labels";

const MISSION_STATUTS_CLOS = ["TERMINE", "ANNULE"] as const;

type MissionHeaderBits = {
  id: string;
  code: string;
  titre: string;
  archive: boolean;
  statut: string;
  dateFin: Date | null;
  type: { libelle: string };
  template: { libelle: string };
};

export function MissionPageChrome({
  mission,
  etapes,
  currentSlug,
  activeCockpit,
  ok,
  erreur,
  children,
}: {
  mission: MissionHeaderBits;
  etapes: MissionEtapeVue[];
  currentSlug?: MissionEtapeSlug | null;
  activeCockpit?: boolean;
  ok?: string;
  erreur?: string;
  children: ReactNode;
}) {
  const missionClos = (MISSION_STATUTS_CLOS as readonly string[]).includes(
    mission.statut,
  );
  const cockpitHref = `/missions/${mission.id}`;

  return (
    <>
      <BackLink href="/missions" label="← Retour aux missions" />
      <PageHeader
        title={`${mission.code} — ${mission.titre}`}
        description={`${mission.type.libelle} · ${mission.template.libelle}`}
        actions={
          <>
            {mission.archive ? (
              <ConfirmActionButton
                action={unarchiveMission}
                id={mission.id}
                label="Désarchiver"
                confirmMessage="Remettre cette mission dans la liste active ?"
              />
            ) : (
              <ConfirmActionButton
                action={archiveMission}
                id={mission.id}
                label="Archiver"
                confirmMessage="Archiver cette mission ? L’historique et les recommandations sont conservés."
              />
            )}
          </>
        }
      />
      <FlashBanner ok={ok} erreur={erreur} />
      {mission.archive ? (
        <div className="flash flash--warn" role="status">
          Cette mission est archivée (soft-delete).
        </div>
      ) : null}
      {!missionClos &&
      mission.dateFin &&
      urgenceEcheance(mission.dateFin, false) === "retard" ? (
        <div className="flash flash--error" role="status">
          Date de fin dépassée ({formatDate(mission.dateFin)}).
        </div>
      ) : null}

      <MissionEtapesNav
        etapes={etapes}
        currentSlug={currentSlug}
        cockpitHref={cockpitHref}
        activeCockpit={activeCockpit}
      />

      {children}
    </>
  );
}
