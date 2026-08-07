import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { STATUT_CONSEIL_LABELS, formatDate, urgenceEcheance } from "@/lib/labels";
import { CONSEIL_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ConseilsPage({
  searchParams,
}: {
  searchParams: Promise<{ archives?: string; ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const archives = sp.archives === "1";
  const conseils = await prisma.conseil.findMany({
    where: { archive: archives },
    include: { responsable: true, _count: { select: { taches: true } } },
    orderBy: { dateReception: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Conseils"
        description="Demandes ponctuelles adressées à l'unité — délai cible 5 jours ouvrés."
        actions={<BtnLink href="/conseils/nouveau">Nouveau conseil</BtnLink>}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <div className="filter-bar">
        <Link href="/conseils" className={`chip${!archives ? " is-active" : ""}`}>Actifs</Link>
        <Link href="/conseils?archives=1" className={`chip${archives ? " is-active" : ""}`}>Archivés</Link>
      </div>
      <div className="panel">
        {conseils.length === 0 ? (
          <p className="empty">Aucun conseil. <Link href="/conseils/nouveau">Créer le premier</Link></p>
        ) : (
          <ul className="entity-list">
            {conseils.map((c) => {
              const clos = (CONSEIL_STATUTS_CLOS as readonly string[]).includes(c.statut);
              const urgence = urgenceEcheance(c.dateEcheance, clos);
              return (
                <li key={c.id}>
                  <Link href={`/conseils/${c.id}`} className={`entity-row entity-row--${urgence}`}>
                    <div className="entity-row__main">
                      <strong>{c.objet}</strong>
                      <span className="entity-row__meta">
                        {c.responsable.nom}
                        {c.demandeur ? ` · ${c.demandeur}` : ""}
                        {c.entiteDemandeuse ? ` · ${c.entiteDemandeuse}` : ""}
                        {" · "}{STATUT_CONSEIL_LABELS[c.statut]}
                        {" · "}{c._count.taches} tâche{c._count.taches > 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="entity-row__date">{formatDate(c.dateEcheance)}</span>
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
