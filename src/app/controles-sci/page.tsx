import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import {
  FREQUENCE_LABELS,
  STATUT_CONTROLE_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ControlesSCIPage({
  searchParams,
}: {
  searchParams: Promise<{ archives?: string; ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const showArchives = sp.archives === "1";

  const controles = await prisma.controleSCI.findMany({
    where: { archive: showArchives },
    include: {
      responsable: true,
      _count: { select: { preuves: true, risques: true, taches: true } },
    },
    orderBy: [{ statut: "asc" }, { dateProchaineEcheance: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Contrôles SCI"
        description="Registre des contrôles périodiques : fréquences, échéances, preuves et validation."
        actions={
          <BtnLink href="/controles-sci/nouveau">Nouveau contrôle</BtnLink>
        }
      />

      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <div className="filter-bar">
        <Link
          href="/controles-sci"
          className={`chip${!showArchives ? " is-active" : ""}`}
        >
          Actifs
        </Link>
        <Link
          href="/controles-sci?archives=1"
          className={`chip${showArchives ? " is-active" : ""}`}
        >
          Archivés
        </Link>
      </div>

      <div className="panel">
        {controles.length === 0 ? (
          <p className="empty">
            {showArchives ? (
              "Aucun contrôle archivé."
            ) : (
              <>
                Aucun contrôle actif.{" "}
                <Link href="/controles-sci/nouveau">Créer le premier</Link>
              </>
            )}
          </p>
        ) : (
          <ul className="entity-list">
            {controles.map((c) => {
              const clos =
                c.statut === "REALISE" && c.frequence === "PONCTUELLE";
              const urgence = urgenceEcheance(
                c.dateProchaineEcheance,
                clos || c.archive,
              );
              return (
                <li key={c.id}>
                  <Link
                    href={`/controles-sci/${c.id}`}
                    className={`entity-row entity-row--${urgence}`}
                  >
                    <div className="entity-row__main">
                      <strong>
                        {c.nom}
                        {c.archive ? (
                          <span className="tag tag--muted"> Archivé</span>
                        ) : null}
                      </strong>
                      <span className="entity-row__meta">
                        {c.processusConcerne} · {c.responsable.nom} ·{" "}
                        {FREQUENCE_LABELS[c.frequence]} ·{" "}
                        {STATUT_CONTROLE_LABELS[c.statut]} ·{" "}
                        {c._count.preuves} preuve
                        {c._count.preuves > 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="entity-row__date">
                      {formatDate(c.dateProchaineEcheance)}
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
