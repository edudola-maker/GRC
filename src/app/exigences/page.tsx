import Link from "next/link";
import { FlashBanner } from "@/components/Flash";
import { PageHeader, BtnLink } from "@/components/ui";
import { STATUT_CONFORMITE_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ExigencesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const rows = await prisma.exigence.findMany({
    where: { uniteId: user.uniteId, archive: false },
    include: {
      responsable: { select: { nom: true, prenom: true } },
      _count: { select: { processus: true } },
    },
    orderBy: { code: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Exigences"
        actions={
          <BtnLink href="/exigences/nouveau" variant="ghost">
            + Exigence
          </BtnLink>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <p className="muted" style={{ marginTop: 0 }}>
        Exigences de conformité (EXI) — statut de conformité et lien aux
        processus.
      </p>

      {rows.length === 0 ? (
        <p className="empty">Aucune exigence — créez la première.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Titre</th>
                <th>Statut</th>
                <th>Processus</th>
                <th>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/exigences/${e.id}`}>{e.code}</Link>
                  </td>
                  <td>
                    <Link href={`/exigences/${e.id}`}>
                      <strong>{e.titre}</strong>
                    </Link>
                  </td>
                  <td>
                    {STATUT_CONFORMITE_LABELS[e.statut] ?? e.statut}
                  </td>
                  <td>{e._count.processus}</td>
                  <td>
                    {e.responsable
                      ? `${e.responsable.prenom} ${e.responsable.nom}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
