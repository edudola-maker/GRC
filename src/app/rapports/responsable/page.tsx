import { notFound } from "next/navigation";
import {
  ReportKpis,
  ReportSection,
  ReportShell,
} from "@/components/rapports/ReportShell";
import { getDashboardResponsable } from "@/lib/dashboard-responsable";
import { getObjectifsModuleAggreges } from "@/lib/objectifs-module";
import { getActionsUnite } from "@/lib/actions-view";
import { getPlanningEquipe } from "@/lib/planning-equipe";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  isResponsable,
} from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RapportResponsablePage() {
  const user = await getCurrentUser();
  if (!isResponsable(user)) notFound();

  const annee = new Date().getFullYear();
  const [data, objectifsModule, objectifsAnnuels, monitoring, planning, unite] =
    await Promise.all([
      getDashboardResponsable(user.uniteId),
      getObjectifsModuleAggreges(user.uniteId),
      prisma.objectif.findMany({
        where: { uniteId: user.uniteId, annee },
        orderBy: { intitule: "asc" },
        select: {
          intitule: true,
          progression: true,
          cible: true,
          statut: true,
        },
      }),
      getActionsUnite(user.uniteId, {}),
      getPlanningEquipe(user.uniteId, { weeks: 8, weekOffset: 0 }),
      prisma.unite.findUnique({
        where: { id: user.uniteId },
        select: { code: true, nom: true },
      }),
    ]);

  if (!unite) notFound();

  const s = data.synthetique;
  const chargeRows = planning.rows
    .map((r) => ({
      nom: r.user.nom,
      chargeDays: r.chargeDays,
      actions:
        monitoring.chargeParCollaborateur.find(
          (c) => c.responsableId === r.user.id,
        )?._count._all ?? 0,
    }))
    .sort((a, b) => b.chargeDays - a.chargeDays);

  return (
    <ReportShell
      title="Snapshot responsable"
      subtitle={`Pilotage ${unite.nom} — année ${annee}`}
      uniteLabel={`${unite.code} — ${unite.nom}`}
      backHref="/responsable"
    >
      <ReportSection title="Indicateurs clés">
        <ReportKpis
          items={[
            { label: "Actions en retard", value: s.actionsEnRetard ?? 0 },
            { label: "Actions ouvertes", value: s.actionsOuvertes ?? 0 },
            { label: "Audits en cours", value: s.auditsEnCours ?? 0 },
            { label: "Conseils ouverts", value: s.conseilsOuverts ?? 0 },
            { label: "Projets actifs", value: s.projetsActifs ?? 0 },
            { label: "Projets en retard", value: s.projetsEnRetard ?? 0 },
            {
              label: "Risques critiques",
              value: s.risquesCritiques ?? 0,
            },
            { label: "Risques élevés", value: s.risquesEleves ?? 0 },
            {
              label: "Contrôles réalisés %",
              value:
                s.tauxRealisationControles != null
                  ? `${s.tauxRealisationControles} %`
                  : "—",
            },
          ]}
        />
      </ReportSection>

      <ReportSection title="Objectifs">
        <ReportKpis
          items={[
            {
              label: "Objectifs annuels",
              value: objectifsAnnuels.length,
            },
            {
              label: "Indicateurs module",
              value: objectifsModule.length,
            },
            {
              label: "Modules ≥ 80 %",
              value: objectifsModule.filter((o) => o.progression >= 80)
                .length,
            },
          ]}
        />
        {objectifsAnnuels.length === 0 && objectifsModule.length === 0 ? (
          <p className="report-empty">Aucun objectif pour {annee}.</p>
        ) : null}
        {objectifsAnnuels.length > 0 ? (
          <>
            <h3 className="report-h3">Objectifs annuels</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Intitulé</th>
                  <th>Statut</th>
                  <th>Progression</th>
                  <th>Cible</th>
                </tr>
              </thead>
              <tbody>
                {objectifsAnnuels.map((o, i) => (
                  <tr key={`${o.intitule}-${i}`}>
                    <td>{o.intitule}</td>
                    <td>{o.statut}</td>
                    <td>{o.progression ?? "—"}</td>
                    <td>{o.cible ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}
        {objectifsModule.length > 0 ? (
          <>
            <h3 className="report-h3">Indicateurs par module</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Libellé</th>
                  <th>Réalisé</th>
                  <th>Cible</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {objectifsModule.map((o) => (
                  <tr key={o.id}>
                    <td>{o.moduleLabel}</td>
                    <td>{o.libelle}</td>
                    <td>
                      {o.realise ?? "—"}
                      {o.uniteMesure ? ` ${o.uniteMesure}` : ""}
                    </td>
                    <td>
                      {o.cible ?? "—"}
                      {o.uniteMesure ? ` ${o.uniteMesure}` : ""}
                    </td>
                    <td>{o.progression} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}
      </ReportSection>

      <ReportSection title="Charge équipe (aperçu 8 semaines)">
        {chargeRows.length === 0 ? (
          <p className="report-empty">Aucune charge planifiée.</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Collaborateur</th>
                <th>Jours planifiés (fenêtre)</th>
                <th>Actions ouvertes</th>
              </tr>
            </thead>
            <tbody>
              {chargeRows.map((r) => (
                <tr key={r.nom}>
                  <td>{r.nom}</td>
                  <td>{r.chargeDays}</td>
                  <td>{r.actions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>
    </ReportShell>
  );
}
