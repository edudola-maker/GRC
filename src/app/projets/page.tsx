import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import {
  PRIORITE_LABELS,
  STATUT_PROJET_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { PROJET_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProjetsPage({
  searchParams,
}: {
  searchParams: Promise<{ archives?: string; ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const showArchives = sp.archives === "1";

  const projets = await prisma.projet.findMany({
    where: { archive: showArchives },
    include: {
      responsable: true,
      _count: { select: { taches: true } },
    },
    orderBy: [{ statut: "asc" }, { dateEcheance: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Projets"
        description="Suivi des projets de l'unité : statut, priorité, avancement et tâches associées."
        actions={<BtnLink href="/projets/nouveau">Nouveau projet</BtnLink>}
      />

      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <div className="filter-bar">
        <Link
          href="/projets"
          className={`chip${!showArchives ? " is-active" : ""}`}
        >
          Actifs
        </Link>
        <Link
          href="/projets?archives=1"
          className={`chip${showArchives ? " is-active" : ""}`}
        >
          Archivés
        </Link>
      </div>

      <div className="panel">
        {projets.length === 0 ? (
          <p className="empty">
            {showArchives ? (
              "Aucun projet archivé."
            ) : (
              <>
                Aucun projet actif.{" "}
                <Link href="/projets/nouveau">Créer le premier</Link>
              </>
            )}
          </p>
        ) : (
          <ul className="entity-list">
            {projets.map((p) => {
              const clos = (PROJET_STATUTS_CLOS as readonly string[]).includes(
                p.statut,
              );
              const urgence = urgenceEcheance(p.dateEcheance, clos || p.archive);
              return (
                <li key={p.id}>
                  <Link
                    href={`/projets/${p.id}`}
                    className={`entity-row entity-row--${urgence}`}
                  >
                    <div className="entity-row__main">
                      <strong>
                        {p.nom}
                        {p.archive ? (
                          <span className="tag tag--muted"> Archivé</span>
                        ) : null}
                      </strong>
                      <span className="entity-row__meta">
                        {p.responsable.nom} · {STATUT_PROJET_LABELS[p.statut]} ·{" "}
                        {PRIORITE_LABELS[p.priorite]} · {p.avancement}% ·{" "}
                        {p._count.taches} tâche
                        {p._count.taches > 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="entity-row__date">
                      {formatDate(p.dateEcheance)}
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
