import {
  ReportKpis,
  ReportSection,
  ReportShell,
} from "@/components/rapports/ReportShell";
import {
  STATUT_ARBITRAGE_LABELS,
  STATUT_DECISION_LABELS,
  STATUT_PROCESSUS_LABELS,
  STATUT_RISQUE_LABELS,
  formatDate,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RapportGouvernanceUnitePage() {
  const user = await getCurrentUser();
  const uniteId = user.uniteId;
  const annee = new Date().getFullYear();

  const [
    unite,
    attributions,
    objectifs,
    processus,
    risques,
    arbitrages,
    decisions,
  ] = await Promise.all([
    prisma.unite.findUnique({
      where: { id: uniteId },
      select: { code: true, nom: true },
    }),
    prisma.uniteAttribution.findMany({
      where: { uniteId, actif: true },
      orderBy: { ordre: "asc" },
    }),
    prisma.objectif.findMany({
      where: { uniteId, annee },
      orderBy: { intitule: "asc" },
      select: {
        intitule: true,
        statut: true,
        progression: true,
        cible: true,
      },
    }),
    prisma.processus.findMany({
      where: { uniteId, archive: false },
      select: { code: true, nom: true, statut: true, criticite: true },
      orderBy: { code: "asc" },
    }),
    prisma.risque.findMany({
      where: { uniteId, archive: false },
      select: {
        code: true,
        nom: true,
        statut: true,
        criticite: true,
      },
      orderBy: [{ criticite: "desc" }, { code: "asc" }],
      take: 30,
    }),
    prisma.arbitrage.findMany({
      where: { uniteId, archive: false },
      select: {
        code: true,
        titre: true,
        statut: true,
        dateEffet: true,
      },
      orderBy: { code: "asc" },
    }),
    prisma.decision.findMany({
      where: { uniteId, archive: false },
      select: {
        code: true,
        titre: true,
        statut: true,
        dateDecision: true,
      },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <ReportShell
      title="Gouvernance d’unité"
      subtitle="Vue d’ensemble missions, objectifs, processus et décisions"
      uniteLabel={unite ? `${unite.code} — ${unite.nom}` : undefined}
      backHref="/rapports"
    >
      <ReportSection title="Vue synthétique">
        <ReportKpis
          items={[
            { label: "Attributions", value: attributions.length },
            { label: `Objectifs ${annee}`, value: objectifs.length },
            { label: "Processus", value: processus.length },
            { label: "Risques", value: risques.length },
            { label: "Arbitrages", value: arbitrages.length },
            { label: "Décisions", value: decisions.length },
          ]}
        />
      </ReportSection>

      <ReportSection title="Missions / attributions">
        {attributions.length === 0 ? (
          <p className="report-empty">Aucune attribution active.</p>
        ) : (
          <ul className="report-ul">
            {attributions.map((a) => (
              <li key={a.id}>
                <strong>{a.titre}</strong>
                {a.description ? (
                  <span className="report-muted"> — {a.description}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      <ReportSection title={`Objectifs ${annee}`}>
        {objectifs.length === 0 ? (
          <p className="report-empty">Aucun objectif pour cette année.</p>
        ) : (
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
              {objectifs.map((o, i) => (
                <tr key={`${o.intitule}-${i}`}>
                  <td>{o.intitule}</td>
                  <td>{o.statut}</td>
                  <td>{o.progression ?? "—"}</td>
                  <td>{o.cible ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      <ReportSection title="Processus">
        {processus.length === 0 ? (
          <p className="report-empty">Aucun processus.</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Statut</th>
                <th>Criticité</th>
              </tr>
            </thead>
            <tbody>
              {processus.map((p) => (
                <tr key={p.code}>
                  <td>{p.code}</td>
                  <td>{p.nom}</td>
                  <td>{STATUT_PROCESSUS_LABELS[p.statut] ?? p.statut}</td>
                  <td>{p.criticite ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      <ReportSection title="Risques (top 30)">
        {risques.length === 0 ? (
          <p className="report-empty">Aucun risque.</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Titre</th>
                <th>Statut</th>
                <th>Criticité</th>
              </tr>
            </thead>
            <tbody>
              {risques.map((r) => (
                <tr key={r.code}>
                  <td>{r.code}</td>
                  <td>{r.nom}</td>
                  <td>{STATUT_RISQUE_LABELS[r.statut] ?? r.statut}</td>
                  <td>{r.criticite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      <ReportSection title="Arbitrages">
        {arbitrages.length === 0 ? (
          <p className="report-empty">Aucun arbitrage.</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Titre</th>
                <th>Statut</th>
                <th>Date effet</th>
              </tr>
            </thead>
            <tbody>
              {arbitrages.map((a) => (
                <tr key={a.code}>
                  <td>{a.code}</td>
                  <td>{a.titre}</td>
                  <td>{STATUT_ARBITRAGE_LABELS[a.statut] ?? a.statut}</td>
                  <td>{formatDate(a.dateEffet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      <ReportSection title="Décisions">
        {decisions.length === 0 ? (
          <p className="report-empty">Aucune décision.</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Titre</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d) => (
                <tr key={d.code}>
                  <td>{d.code}</td>
                  <td>{d.titre}</td>
                  <td>{STATUT_DECISION_LABELS[d.statut] ?? d.statut}</td>
                  <td>{formatDate(d.dateDecision)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>
    </ReportShell>
  );
}
