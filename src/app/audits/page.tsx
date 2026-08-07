import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { STATUT_AUDIT_LABELS, formatDate } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AuditsPage({
  searchParams,
}: {
  searchParams: Promise<{ archives?: string; ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const showArchives = sp.archives === "1";

  const audits = await prisma.audit.findMany({
    where: { archive: showArchives },
    include: {
      responsable: true,
      _count: { select: { recommandations: true, taches: true } },
    },
    orderBy: [{ statut: "asc" }, { dateDebut: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="Audits"
        description="Planification et suivi des audits, recommandations et actions associées."
        actions={<BtnLink href="/audits/nouveau">Nouvel audit</BtnLink>}
      />

      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <div className="filter-bar">
        <Link
          href="/audits"
          className={`chip${!showArchives ? " is-active" : ""}`}
        >
          Actifs
        </Link>
        <Link
          href="/audits?archives=1"
          className={`chip${showArchives ? " is-active" : ""}`}
        >
          Archivés
        </Link>
      </div>

      <div className="panel">
        {audits.length === 0 ? (
          <p className="empty">
            {showArchives ? (
              "Aucun audit archivé."
            ) : (
              <>
                Aucun audit. <Link href="/audits/nouveau">Créer le premier</Link>
              </>
            )}
          </p>
        ) : (
          <ul className="entity-list">
            {audits.map((a) => (
              <li key={a.id}>
                <Link href={`/audits/${a.id}`} className="entity-row">
                  <div className="entity-row__main">
                    <strong>
                      {a.titre}
                      {a.archive ? (
                        <span className="tag tag--muted"> Archivé</span>
                      ) : null}
                    </strong>
                    <span className="entity-row__meta">
                      {a.responsable.nom} · {STATUT_AUDIT_LABELS[a.statut]} ·{" "}
                      {a._count.recommandations} reco
                      {a._count.recommandations > 1 ? "s" : ""} ·{" "}
                      {a._count.taches} tâche
                      {a._count.taches > 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="entity-row__date">
                    {formatDate(a.dateDebut)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
