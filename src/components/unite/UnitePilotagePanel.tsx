import type { UnitePilotage } from "@/lib/unite-overview";
import { KpiStat, KpiZone } from "@/components/module/KpiZone";

export function UnitePilotagePanel({ pilotage }: { pilotage: UnitePilotage }) {
  return (
    <div className="unite-pilotage">
      <p className="muted" style={{ marginTop: 0 }}>
        Compteurs calculés automatiquement depuis l’activité de l’unité.
      </p>
      <KpiZone>
        <KpiStat
          value={pilotage.objectifsEnCours}
          label="Objectifs en cours"
        />
        <KpiStat value={pilotage.projetsActifs} label="Projets actifs" />
        <KpiStat value={pilotage.missionsEnCours} label="Missions en cours" />
        <KpiStat value={pilotage.tachesAVenir} label="Tâches à venir (30 j)" />
        <KpiStat value={pilotage.tachesEnRetard} label="Tâches en retard" />
        <KpiStat value={pilotage.processusActifs} label="Processus actifs" />
      </KpiZone>
    </div>
  );
}
