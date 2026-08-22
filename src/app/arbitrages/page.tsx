import Link from "next/link";
import { FlashBanner } from "@/components/Flash";
import { PageHeader, BtnLink } from "@/components/ui";
import { STATUT_ARBITRAGE_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ArbitragesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const rows = await prisma.arbitrage.findMany({
    where: { uniteId: user.uniteId, archive: false },
    include: {
      processus: { select: { code: true, nom: true } },
      risque: { select: { code: true, nom: true } },
    },
    orderBy: { code: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Arbitrages"
        actions={
          <BtnLink href="/arbitrages/nouveau" variant="ghost">
            + Arbitrage
          </BtnLink>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <p className="muted" style={{ marginTop: 0 }}>
        Règles retenues et justifications (ARB) — éventuellement liées à un
        processus ou un risque.
      </p>

      {rows.length === 0 ? (
        <p className="empty">Aucun arbitrage — créez le premier.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Titre</th>
                <th>Statut</th>
                <th>Processus</th>
                <th>Risque</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/arbitrages/${a.id}`}>{a.code}</Link>
                  </td>
                  <td>
                    <Link href={`/arbitrages/${a.id}`}>
                      <strong>{a.titre}</strong>
                    </Link>
                  </td>
                  <td>{STATUT_ARBITRAGE_LABELS[a.statut] ?? a.statut}</td>
                  <td>
                    {a.processus
                      ? `${a.processus.code}`
                      : "—"}
                  </td>
                  <td>{a.risque ? a.risque.code : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
