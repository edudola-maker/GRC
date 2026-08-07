import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { AttentionZone } from "@/components/module/AttentionZone";
import { KpiStat, KpiZone } from "@/components/module/KpiZone";
import {
  RisqueInventory,
  type RisqueInventoryItem,
} from "@/components/risques/RisqueInventory";
import { MODULE_HELP, RISQUE_STATUTS_MAITRISES } from "@/lib/catalog";
import {
  CATEGORIE_RISQUE_LABELS,
  STATUT_RISQUE_LABELS,
  STRATEGIE_RISQUE_LABELS,
  criticiteNiveau,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RisquesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const risques = await prisma.risque.findMany({
    where: { uniteId: user.uniteId },
    include: {
      responsable: true,
      _count: { select: { controles: true } },
    },
    orderBy: [{ criticite: "desc" }, { nom: "asc" }],
  });

  const actifs = risques.filter((r) => !r.archive);
  const total = actifs.length;
  const critiques = actifs.filter((r) => r.criticite >= 20).length;
  const eleves = actifs.filter(
    (r) => r.criticite >= 12 && r.criticite < 20,
  ).length;
  const maitrises = actifs.filter((r) =>
    (RISQUE_STATUTS_MAITRISES as readonly string[]).includes(r.statut),
  ).length;
  const sansStrategie = actifs.filter((r) => !r.strategie).length;

  const matrixCounts: Record<string, number> = {};
  for (const r of actifs) {
    const key = `${r.probabilite}-${r.impact}`;
    matrixCounts[key] = (matrixCounts[key] ?? 0) + 1;
  }

  const items: RisqueInventoryItem[] = risques.map((r) => {
    const niveau = criticiteNiveau(r.criticite);
    const urgence =
      niveau === "critique" || niveau === "eleve"
        ? "retard"
        : niveau === "modere"
          ? "bientot"
          : "neutre";
    return {
      id: r.id,
      code: r.code,
      nom: r.nom,
      categorieLabel: CATEGORIE_RISQUE_LABELS[r.categorie] ?? r.categorie,
      statut: r.statut,
      statutLabel: STATUT_RISQUE_LABELS[r.statut] ?? r.statut,
      strategieLabel: r.strategie
        ? (STRATEGIE_RISQUE_LABELS[r.strategie] ?? r.strategie)
        : null,
      responsableId: r.responsableId,
      responsableNom: r.responsable.nom,
      probabilite: r.probabilite,
      impact: r.impact,
      criticite: r.criticite,
      nbControles: r._count.controles,
      archive: r.archive,
      urgence,
      estCritique: r.criticite >= 20,
      estEleve: r.criticite >= 12 && r.criticite < 20,
      sansStrategie: !r.strategie,
    };
  });

  const attentionItems = items.filter(
    (r) => !r.archive && (r.estCritique || r.sansStrategie),
  );
  const responsables = Array.from(
    new Map(
      items.map((r) => [
        r.responsableId,
        { id: r.responsableId, nom: r.responsableNom },
      ]),
    ).values(),
  );

  return (
    <>
      <PageHeader
        title="Risques"
        description="Cartographie des risques — criticité = probabilité × impact."
        actions={<BtnLink href="/risques/nouveau">Nouveau risque</BtnLink>}
      />
      <ModuleHelp {...MODULE_HELP.risques} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone>
        <KpiStat value={total} label="Total" />
        <KpiStat value={critiques} label="Critiques" />
        <KpiStat value={eleves} label="Élevés" />
        <KpiStat value={maitrises} label="Maîtrisés" />
        <KpiStat value={sansStrategie} label="Sans stratégie" />
      </KpiZone>

      <section className="page-zone page-zone--panel" aria-label="Matrice des risques">
        <p className="page-zone__label">Cartographie</p>
        <p className="muted page-zone__intro">
          Matrice 5×5 — lignes = impact (5→1), colonnes = probabilité (1→5).
        </p>
        <div className="matrix">
          <table className="matrix-table">
            <thead>
              <tr>
                <th scope="col">I \\ P</th>
                {[1, 2, 3, 4, 5].map((p) => (
                  <th key={p} scope="col">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map((impact) => (
                <tr key={impact}>
                  <th scope="row">{impact}</th>
                  {[1, 2, 3, 4, 5].map((probabilite) => {
                    const score = probabilite * impact;
                    const count = matrixCounts[`${probabilite}-${impact}`] ?? 0;
                    return (
                      <td
                        key={probabilite}
                        className={`matrix-cell matrix-cell--${criticiteNiveau(score)}`}
                      >
                        {count || "·"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AttentionZone
        label="Attention requise"
        items={attentionItems.map((r) => ({
          id: r.id,
          href: `/risques/${r.id}`,
          code: r.code,
          title: r.nom,
          meta: r.estCritique
            ? `Critique · ${r.responsableNom}`
            : `Sans stratégie · ${r.responsableNom}`,
        }))}
      />

      <RisqueInventory items={items} responsables={responsables} />
    </>
  );
}
