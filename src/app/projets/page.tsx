import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import {
  PRIORITE_LABELS,
  STATUT_PROJET_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { PROJET_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProjetsPage() {
  const projets = await prisma.projet.findMany({
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

      <div className="panel">
        {projets.length === 0 ? (
          <p className="empty">
            Aucun projet pour le moment.{" "}
            <Link href="/projets/nouveau">Créer le premier</Link>
          </p>
        ) : (
          <ul className="entity-list">
            {projets.map((p) => {
              const clos = (PROJET_STATUTS_CLOS as readonly string[]).includes(
                p.statut,
              );
              const urgence = urgenceEcheance(p.dateEcheance, clos);
              return (
                <li key={p.id}>
                  <Link
                    href={`/projets/${p.id}`}
                    className={`entity-row entity-row--${urgence}`}
                  >
                    <div className="entity-row__main">
                      <strong>{p.nom}</strong>
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
