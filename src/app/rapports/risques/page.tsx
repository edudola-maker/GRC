import {
  ReportKpis,
  ReportSection,
  ReportShell,
} from "@/components/rapports/ReportShell";
import {
  CATEGORIE_RISQUE_LABELS,
  STATUT_RISQUE_LABELS,
  STRATEGIE_RISQUE_LABELS,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  getCurrentUser,
} from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RapportRisquesPage() {
  const user = await getCurrentUser();
  const unite = await prisma.unite.findUnique({
    where: { id: user.uniteId },
    select: { code: true, nom: true },
  });

  const risques = await prisma.risque.findMany({
    where: { uniteId: user.uniteId, archive: false },
    include: {
      responsable: { select: { nom: true, prenom: true } },
      processusRef: { select: { code: true } },
    },
    orderBy: [{ criticite: "desc" }, { code: "asc" }],
  });

  const critiques = risques.filter((r) => r.criticite >= 20).length;
  const eleves = risques.filter(
    (r) => r.criticite >= 12 && r.criticite < 20,
  ).length;
  const sansStrategie = risques.filter((r) => !r.strategie).length;
  const enTraitement = risques.filter(
    (r) =>
      r.statut === "EN_TRAITEMENT" ||
      r.statut === "EN_EVALUATION" ||
      r.statut === "IDENTIFIE",
  ).length;
  const maitrises = risques.filter(
    (r) => r.statut === "MAITRISE" || r.statut === "ACCEPTE",
  ).length;

  const byCategorie = new Map<string, number>();
  for (const r of risques) {
    byCategorie.set(r.categorie, (byCategorie.get(r.categorie) ?? 0) + 1);
  }

  return (
    <ReportShell
      title="Rapport — Gestion des risques"
      subtitle="Synthèse des risques non archivés de l’unité"
      uniteLabel={unite ? `${unite.code} — ${unite.nom}` : undefined}
      backHref="/risques"
    >
      <ReportSection title="Synthèse">
        <p className="report-prose">
          Ce rapport présente l’état du portefeuille de risques de l’unité
          {unite ? ` « ${unite.nom} »` : ""}. Sur{" "}
          <strong>{risques.length}</strong> risque
          {risques.length > 1 ? "s" : ""} actif
          {risques.length > 1 ? "s" : ""},{" "}
          <strong>{critiques}</strong> sont classés critiques (criticité ≥ 20)
          et <strong>{eleves}</strong> élevés (12–19).{" "}
          {sansStrategie > 0 ? (
            <>
              <strong>{sansStrategie}</strong> n’ont pas encore de stratégie de
              traitement définie.
            </>
          ) : (
            <>Tous les risques ont une stratégie de traitement.</>
          )}
        </p>
        <ReportKpis
          items={[
            { label: "Total", value: risques.length },
            { label: "Critiques", value: critiques },
            { label: "Élevés", value: eleves },
            { label: "Sans stratégie", value: sansStrategie },
            { label: "En cours de traitement", value: enTraitement },
            { label: "Maîtrisés / acceptés", value: maitrises },
          ]}
        />
      </ReportSection>

      <ReportSection title="Répartition par catégorie">
        {byCategorie.size === 0 ? (
          <p className="report-empty">Aucun risque.</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Nombre</th>
              </tr>
            </thead>
            <tbody>
              {[...byCategorie.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([cat, n]) => (
                  <tr key={cat}>
                    <td>{CATEGORIE_RISQUE_LABELS[cat] ?? cat}</td>
                    <td>{n}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      <ReportSection title="Inventaire détaillé">
        {risques.length === 0 ? (
          <p className="report-empty">Aucun risque non archivé.</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Titre</th>
                <th>Statut</th>
                <th>Catégorie</th>
                <th>P×I</th>
                <th>Stratégie</th>
                <th>Responsable</th>
                <th>Processus</th>
              </tr>
            </thead>
            <tbody>
              {risques.map((r) => (
                <tr key={r.id}>
                  <td>{r.code}</td>
                  <td>{r.nom}</td>
                  <td>{STATUT_RISQUE_LABELS[r.statut] ?? r.statut}</td>
                  <td>
                    {CATEGORIE_RISQUE_LABELS[r.categorie] ?? r.categorie}
                  </td>
                  <td>
                    {r.probabilite}×{r.impact}={r.criticite}
                  </td>
                  <td>
                    {r.strategie
                      ? (STRATEGIE_RISQUE_LABELS[r.strategie] ?? r.strategie)
                      : "—"}
                  </td>
                  <td>{formatUtilisateurNom(r.responsable)}</td>
                  <td>{r.processusRef?.code ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>
    </ReportShell>
  );
}
