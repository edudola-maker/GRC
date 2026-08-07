import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import {
  PRIORITE_LABELS,
  STATUT_PROJET_LABELS,
  formatDate,
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import { MODULE_HELP, PROJET_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProjetsPage({
  searchParams,
}: {
  searchParams: Promise<{ archives?: string; ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const showArchives = sp.archives === "1";
  const today = startOfToday();
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [projets, actifs, termines, enRetard, avancementAgg, jalonsAtteints, jalonsTotal] =
    await Promise.all([
      prisma.projet.findMany({
        where: { archive: showArchives, uniteId },
        include: {
          responsable: true,
          _count: { select: { taches: true, jalons: true } },
        },
        orderBy: [{ statut: "asc" }, { dateEcheance: "asc" }],
      }),
      prisma.projet.count({
        where: {
          uniteId,
          archive: false,
          statut: {
            in: ["VALIDE", "PLANIFIE", "EN_COURS", "EN_VALIDATION", "DEPLOYE"],
          },
        },
      }),
      prisma.projet.count({
        where: { uniteId, archive: false, statut: "CLOTURE" },
      }),
      prisma.projet.count({
        where: {
          uniteId,
          archive: false,
          statut: { notIn: ["CLOTURE", "ABANDONNE"] },
          dateEcheance: { lt: today },
        },
      }),
      prisma.projet.aggregate({
        where: {
          uniteId,
          archive: false,
          statut: {
            in: ["VALIDE", "PLANIFIE", "EN_COURS", "EN_VALIDATION", "DEPLOYE"],
          },
        },
        _avg: { avancement: true },
      }),
      prisma.jalon.count({
        where: { atteint: true, projet: { archive: false, uniteId } },
      }),
      prisma.jalon.count({
        where: { projet: { archive: false, uniteId } },
      }),
    ]);

  const avancementGlobal = Math.round(avancementAgg._avg.avancement ?? 0);
  const respectEcheances =
    actifs + termines > 0
      ? Math.round((termines / (actifs + termines + enRetard || 1)) * 100)
      : null;

  return (
    <>
      <PageHeader
        title="Projets"
        description="Initiatives structurées de l'unité — du statut Idée à la clôture."
        actions={<BtnLink href="/projets/nouveau">Nouveau projet</BtnLink>}
      />
      <ModuleHelp {...MODULE_HELP.projets} />

      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {!showArchives ? (
        <div className="stats">
          <div className="stat">
            <strong>{actifs}</strong>
            Actifs
          </div>
          <div className="stat">
            <strong>{termines}</strong>
            Clôturés
          </div>
          <div className="stat">
            <strong>{enRetard}</strong>
            En retard
          </div>
          <div className="stat">
            <strong>{avancementGlobal}%</strong>
            Avancement global
          </div>
          <div className="stat">
            <strong>
              {jalonsAtteints}/{jalonsTotal}
            </strong>
            Jalons atteints
          </div>
          <div className="stat">
            <strong>{respectEcheances ?? "—"}{respectEcheances != null ? "%" : ""}</strong>
            Clôtures / volume
          </div>
        </div>
      ) : null}

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
                        <span className="muted">{p.code}</span> · {p.nom}
                        {p.archive ? (
                          <span className="tag tag--muted"> Archivé</span>
                        ) : null}
                      </strong>
                      <span className="entity-row__meta">
                        {p.responsable.nom} · {STATUT_PROJET_LABELS[p.statut]} ·{" "}
                        {PRIORITE_LABELS[p.priorite]} · {p.avancement}% ·{" "}
                        {p._count.taches} tâche
                        {p._count.taches > 1 ? "s" : ""}
                        {p._count.jalons > 0
                          ? ` · ${p._count.jalons} jalon${p._count.jalons > 1 ? "s" : ""}`
                          : ""}
                        {p.tags ? ` · ${p.tags}` : ""}
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
