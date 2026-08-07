import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { MODULE_HELP } from "@/lib/catalog";
import {
  FREQUENCE_REVUE_LABELS,
  STATUT_DOCUMENT_LABELS,
  TYPE_DOCUMENT_LABELS,
  addDays,
  formatDate,
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DOC_STATUTS_CLOS = ["OBSOLETE", "ARCHIVE"] as const;

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

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ archives?: string; ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const archives = sp.archives === "1";
  const today = startOfToday();
  const dans30j = addDays(today, 30);

  const [documents, inventorie, revuesProchaines, enRetard, enVigueur] =
    await Promise.all([
      prisma.document.findMany({
        where: { archive: archives },
        include: {
          responsable: true,
          _count: { select: { tachesRevue: true } },
        },
        orderBy: [{ prochaineRevue: "asc" }, { nom: "asc" }],
      }),
      prisma.document.count({ where: { archive: false } }),
      prisma.document.count({
        where: {
          archive: false,
          prochaineRevue: { gte: today, lte: dans30j },
        },
      }),
      prisma.document.count({
        where: {
          archive: false,
          prochaineRevue: { lt: today },
        },
      }),
      prisma.document.count({
        where: { archive: false, statut: "EN_VIGUEUR" },
      }),
    ]);

  return (
    <>
      <PageHeader
        title="Documents"
        description="Inventaire, métadonnées et planification des revues — le contenu reste dans Confluence."
        actions={<BtnLink href="/documents/nouveau">Nouveau document</BtnLink>}
      />
      <ModuleHelp {...MODULE_HELP.documents} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {!archives ? (
        <div className="stats-grid stats-grid--dense">
          <Stat label="Inventoriés" value={inventorie} />
          <Stat
            label="Revues à effectuer (30 j.)"
            value={revuesProchaines}
            tone="info"
          />
          <Stat label="En retard" value={enRetard} tone="danger" />
          <Stat label="En vigueur" value={enVigueur} />
        </div>
      ) : null}

      <div className="filter-bar">
        <Link
          href="/documents"
          className={`chip${!archives ? " is-active" : ""}`}
        >
          Actifs
        </Link>
        <Link
          href="/documents?archives=1"
          className={`chip${archives ? " is-active" : ""}`}
        >
          Archivés
        </Link>
      </div>

      <div className="panel">
        {documents.length === 0 ? (
          <p className="empty">
            {archives ? (
              "Aucun document archivé."
            ) : (
              <>
                Aucun document.{" "}
                <Link href="/documents/nouveau">Créer le premier</Link>
              </>
            )}
          </p>
        ) : (
          <ul className="entity-list">
            {documents.map((d) => {
              const clos = (DOC_STATUTS_CLOS as readonly string[]).includes(
                d.statut,
              );
              const urgence = urgenceEcheance(
                d.prochaineRevue,
                clos || d.archive,
              );
              return (
                <li key={d.id}>
                  <Link
                    href={`/documents/${d.id}`}
                    className={`entity-row entity-row--${urgence}`}
                  >
                    <div className="entity-row__main">
                      <strong>
                        <span className="muted">{d.code}</span> · {d.nom}
                      </strong>
                      <span className="entity-row__meta">
                        {TYPE_DOCUMENT_LABELS[d.typeDocument]}
                        {d.version ? ` · v${d.version}` : ""}
                        {d.responsable ? ` · ${d.responsable.nom}` : ""}
                        {" · "}
                        {STATUT_DOCUMENT_LABELS[d.statut]}
                        {d.frequenceRevue
                          ? ` · ${FREQUENCE_REVUE_LABELS[d.frequenceRevue]}`
                          : ""}
                        {d.tags ? ` · ${d.tags}` : ""}
                        {" · "}
                        {d._count.tachesRevue} tâche
                        {d._count.tachesRevue > 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="entity-row__date">
                      {formatDate(d.prochaineRevue)}
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
