import Link from "next/link";
import { FlashBanner } from "@/components/Flash";
import { PageHeader, BtnLink } from "@/components/ui";
import { STATUT_DECISION_LABELS, formatDate } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DecisionsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const rows = await prisma.decision.findMany({
    where: { uniteId: user.uniteId, archive: false },
    include: {
      decideur: { select: { nom: true, prenom: true } },
      processus: { select: { code: true } },
    },
    orderBy: { code: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Décisions"
        actions={
          <BtnLink href="/decisions/nouveau" variant="ghost">
            + Décision
          </BtnLink>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <p className="muted" style={{ marginTop: 0 }}>
        Décisions formelles (DEC) — chaînage possible via décision précédente.
      </p>

      {rows.length === 0 ? (
        <p className="empty">Aucune décision — créez la première.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Titre</th>
                <th>Statut</th>
                <th>Décideur</th>
                <th>Date</th>
                <th>Processus</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link href={`/decisions/${d.id}`}>{d.code}</Link>
                  </td>
                  <td>
                    <Link href={`/decisions/${d.id}`}>
                      <strong>{d.titre}</strong>
                    </Link>
                  </td>
                  <td>{STATUT_DECISION_LABELS[d.statut] ?? d.statut}</td>
                  <td>
                    {d.decideur
                      ? `${d.decideur.prenom} ${d.decideur.nom}`
                      : "—"}
                  </td>
                  <td>{formatDate(d.dateDecision)}</td>
                  <td>{d.processus?.code ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
