import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { MODULE_HELP } from "@/lib/catalog";
import { STATUT_AUDIT_LABELS, formatDate, urgenceEcheance } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const AUDIT_STATUTS_CLOS = ["TERMINE", "ANNULE"] as const;

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warn" | "danger" | "info";
}) {
  return (
    <div className={`stat${tone ? ` stat--${tone}` : ""}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
    </div>
  );
}

export default async function AuditsPage({
  searchParams,
}: {
  searchParams: Promise<{ archives?: string; ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const archives = sp.archives === "1";

  const [
    audits,
    planifies,
    enCours,
    termines,
    recoOuvertes,
    recoCloturees,
  ] = await Promise.all([
    prisma.audit.findMany({
      where: { archive: archives },
      include: {
        responsable: true,
        _count: {
          select: { taches: true, recommandations: true },
        },
      },
      orderBy: [{ dateDebut: "desc" }, { titre: "asc" }],
    }),
    prisma.audit.count({
      where: { archive: false, statut: "PLANIFIE" },
    }),
    prisma.audit.count({
      where: { archive: false, statut: { in: ["EN_COURS", "EN_REVUE"] } },
    }),
    prisma.audit.count({
      where: { archive: false, statut: "TERMINE" },
    }),
    prisma.recommandation.count({
      where: {
        statut: { in: ["OUVERTE", "EN_COURS"] },
        audit: { archive: false },
      },
    }),
    prisma.recommandation.count({
      where: {
        statut: "CLOTUREE",
        audit: { archive: false },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Audits"
        description="Planification des missions d'audit, recommandations et suivi des actions."
        actions={<BtnLink href="/audits/nouveau">Nouvel audit</BtnLink>}
      />
      <ModuleHelp {...MODULE_HELP.audits} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {!archives ? (
        <div className="stats-grid stats-grid--dense">
          <Stat label="Planifiés" value={planifies} />
          <Stat label="En cours" value={enCours} tone="info" />
          <Stat label="Terminés" value={termines} />
          <Stat label="Reco ouvertes" value={recoOuvertes} tone="warn" />
          <Stat label="Reco clôturées" value={recoCloturees} />
        </div>
      ) : null}

      <div className="filter-bar">
        <Link
          href="/audits"
          className={`chip${!archives ? " is-active" : ""}`}
        >
          Actifs
        </Link>
        <Link
          href="/audits?archives=1"
          className={`chip${archives ? " is-active" : ""}`}
        >
          Archivés
        </Link>
      </div>

      <div className="panel">
        {audits.length === 0 ? (
          <p className="empty">
            {archives ? (
              "Aucun audit archivé."
            ) : (
              <>
                Aucun audit.{" "}
                <Link href="/audits/nouveau">Créer le premier</Link>
              </>
            )}
          </p>
        ) : (
          <ul className="entity-list">
            {audits.map((a) => {
              const clos = (AUDIT_STATUTS_CLOS as readonly string[]).includes(
                a.statut,
              );
              const urgence = urgenceEcheance(a.dateFin, clos || a.archive);
              return (
                <li key={a.id}>
                  <Link
                    href={`/audits/${a.id}`}
                    className={`entity-row entity-row--${urgence}`}
                  >
                    <div className="entity-row__main">
                      <strong>
                        <span className="muted">{a.code}</span> · {a.titre}
                      </strong>
                      <span className="entity-row__meta">
                        {a.responsable.nom}
                        {" · "}
                        {STATUT_AUDIT_LABELS[a.statut]}
                        {a.tags ? ` · ${a.tags}` : ""}
                        {" · "}
                        {a._count.recommandations} reco
                        {a._count.recommandations > 1 ? "s" : ""}
                        {" · "}
                        {a._count.taches} tâche
                        {a._count.taches > 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="entity-row__date">
                      {formatDate(a.dateFin ?? a.dateDebut)}
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
