import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { MODULE_HELP, RISQUE_STATUTS_MAITRISES } from "@/lib/catalog";
import {
  CATEGORIE_RISQUE_LABELS,
  STATUT_RISQUE_LABELS,
  STRATEGIE_RISQUE_LABELS,
  criticiteNiveau,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RisquesPage({
  searchParams,
}: {
  searchParams: Promise<{ archives?: string; ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const archives = sp.archives === "1";
  const risques = await prisma.risque.findMany({
    where: { archive: archives },
    include: {
      responsable: true,
      _count: { select: { controles: true } },
    },
    orderBy: [{ criticite: "desc" }, { nom: "asc" }],
  });

  const total = risques.length;
  const critiques = risques.filter((r) => r.criticite >= 20).length;
  const eleves = risques.filter((r) => r.criticite >= 12 && r.criticite < 20).length;
  const maitrises = risques.filter((r) =>
    (RISQUE_STATUTS_MAITRISES as readonly string[]).includes(r.statut),
  ).length;
  const sansStrategie = risques.filter((r) => !r.strategie && !archives).length;

  const matrixCounts: Record<string, number> = {};
  for (const r of risques) {
    const key = `${r.probabilite}-${r.impact}`;
    matrixCounts[key] = (matrixCounts[key] ?? 0) + 1;
  }

  return (
    <>
      <PageHeader
        title="Risques"
        description="Cartographie des risques — criticité = probabilité × impact."
        actions={<BtnLink href="/risques/nouveau">Nouveau risque</BtnLink>}
      />
      <ModuleHelp {...MODULE_HELP.risques} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <div className="filter-bar">
        <Link href="/risques" className={`chip${!archives ? " is-active" : ""}`}>
          Actifs
        </Link>
        <Link
          href="/risques?archives=1"
          className={`chip${archives ? " is-active" : ""}`}
        >
          Archivés
        </Link>
      </div>

      <div className="stats">
        <div className="stat">
          <strong>{total}</strong>
          Total
        </div>
        <div className="stat">
          <strong>{critiques}</strong>
          Critiques
        </div>
        <div className="stat">
          <strong>{eleves}</strong>
          Élevés
        </div>
        <div className="stat">
          <strong>{maitrises}</strong>
          Maîtrisés
        </div>
        {!archives ? (
          <div className="stat">
            <strong>{sansStrategie}</strong>
            Sans stratégie
          </div>
        ) : null}
      </div>

      <div className="panel">
        <h2 className="panel-title">Matrice 5×5</h2>
        <p className="muted" style={{ marginBottom: "0.5rem" }}>
          Lignes = impact (5→1), colonnes = probabilité (1→5). Cellule = nombre de
          risques.
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
      </div>

      <div className="panel">
        {risques.length === 0 ? (
          <p className="empty">
            Aucun risque. <Link href="/risques/nouveau">Créer le premier</Link>
          </p>
        ) : (
          <ul className="entity-list">
            {risques.map((r) => {
              const niveau = criticiteNiveau(r.criticite);
              return (
                <li key={r.id}>
                  <Link
                    href={`/risques/${r.id}`}
                    className={`entity-row entity-row--${niveau === "critique" || niveau === "eleve" ? "retard" : niveau === "modere" ? "bientot" : "neutre"}`}
                  >
                    <div className="entity-row__main">
                      <strong>
                        <span className="muted">{r.code}</span> · {r.nom}
                      </strong>
                      <span className="entity-row__meta">
                        {CATEGORIE_RISQUE_LABELS[r.categorie]}
                        {" · "}
                        {r.responsable.nom}
                        {" · "}
                        {STATUT_RISQUE_LABELS[r.statut]}
                        {r.strategie
                          ? ` · ${STRATEGIE_RISQUE_LABELS[r.strategie]}`
                          : " · sans stratégie"}
                        {" · "}
                        {r._count.controles} contrôle
                        {r._count.controles > 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="entity-row__date">
                      P{r.probabilite}×I{r.impact} = {r.criticite}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
