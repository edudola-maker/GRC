import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import { EmptyGuidance } from "@/components/ui/EmptyGuidance";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const REPORTS = [
  {
    href: "/rapports/risques",
    title: "Gestion des risques",
    kind: "PDF",
    description:
      "Rapport narratif avec KPI, synthèse et tableau des risques non archivés de l’unité.",
  },
  {
    href: "/rapports/responsable",
    title: "Snapshot responsable",
    kind: "PDF",
    description:
      "Tableau de bord responsable : KPI, objectifs et charge équipe (impression / PDF).",
  },
  {
    href: "/rapports/gouvernance-unite",
    title: "Gouvernance d’unité",
    kind: "PDF",
    description:
      "Vue d’ensemble : missions / attributions, objectifs, processus, risques, arbitrages et décisions.",
  },
  {
    href: "/api/exports/risques",
    title: "Export risques (Excel)",
    kind: "CSV",
    description:
      "CSV UTF-8 (BOM, séparateur ;) de tous les risques non archivés — compatible Excel FR.",
  },
  {
    href: "/api/exports/arbitrages",
    title: "Export arbitrages (Excel)",
    kind: "CSV",
    description:
      "CSV UTF-8 des arbitrages de l’unité (code, titre, statut, liens processus / risque).",
  },
] as const;

export default async function RapportsHubPage() {
  const user = await getCurrentUser();
  const processus = await prisma.processus.findMany({
    where: { uniteId: user.uniteId, archive: false },
    select: { id: true, code: true, nom: true },
    orderBy: { code: "asc" },
    take: 12,
  });

  return (
    <>
      <PageHeader
        title="Rapports & exports"
        description="Documents imprimables (PDF via navigateur) et exports Excel-compatible pour l’unité courante."
      />

      <section className="report-hub">
        <h2 className="report-hub__heading">Disponibles</h2>
        <ul className="report-hub__list">
          {REPORTS.map((r) => (
            <li key={r.href} className="report-hub__item">
              <div>
                <p className="report-hub__kind">{r.kind}</p>
                <Link href={r.href} className="report-hub__title">
                  {r.title}
                </Link>
                <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                  {r.description}
                </p>
              </div>
              <BtnLink href={r.href} variant="ghost">
                Ouvrir
              </BtnLink>
            </li>
          ))}
        </ul>
      </section>

      <section className="report-hub" style={{ marginTop: "1.75rem" }}>
        <h2 className="report-hub__heading">Rapport processus</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Fiche processus imprimable avec sections sélectionnables (
          <code>?sections=presentation,etapes,raci…</code>). Accès aussi depuis
          la fiche processus (« Exporter PDF »).
        </p>
        {processus.length === 0 ? (
          <EmptyGuidance
            title="Aucun processus à exporter"
            actionHref="/processus/nouveau"
            actionLabel="Créer un processus"
            guideHref="/decouvrir/documenter-processus"
            guideLabel="Guide processus"
          >
            <p style={{ margin: 0 }}>
              Les rapports PDF processus s’appuient sur le référentiel. Créez
              d’abord un processus, ou utilisez les rapports unitaires
              ci-dessus.
            </p>
          </EmptyGuidance>
        ) : (
          <ul className="report-hub__list">
            {processus.map((p) => (
              <li key={p.id} className="report-hub__item">
                <div>
                  <Link
                    href={`/rapports/processus/${p.id}`}
                    className="report-hub__title"
                  >
                    {p.code} — {p.nom}
                  </Link>
                </div>
                <BtnLink
                  href={`/rapports/processus/${p.id}`}
                  variant="ghost"
                >
                  PDF
                </BtnLink>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
