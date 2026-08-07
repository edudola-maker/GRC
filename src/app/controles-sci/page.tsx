import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { MODULE_HELP } from "@/lib/catalog";
import {
  FREQUENCE_LABELS,
  STATUT_CONTROLE_LABELS,
  TYPE_CONTROLE_LABELS,
  formatDate,
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ControlesSCIPage({
  searchParams,
}: {
  searchParams: Promise<{ archives?: string; ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const showArchives = sp.archives === "1";
  const today = startOfToday();
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [controles, prevus, realises, enRetard] = await Promise.all([
    prisma.controleSCI.findMany({
      where: { archive: showArchives, uniteId },
      include: {
        responsable: true,
        _count: { select: { preuves: true, risques: true, taches: true } },
      },
      orderBy: [{ statut: "asc" }, { dateProchaineEcheance: "asc" }],
    }),
    prisma.controleSCI.count({
      where: {
        uniteId,
        archive: false,
        statut: { in: ["A_REALISER", "EN_COURS", "A_VALIDER", "EN_RETARD"] },
      },
    }),
    prisma.controleSCI.count({
      where: { uniteId, archive: false, statut: "REALISE" },
    }),
    prisma.controleSCI.count({
      where: {
        uniteId,
        archive: false,
        OR: [
          { statut: "EN_RETARD" },
          {
            statut: { notIn: ["REALISE"] },
            dateProchaineEcheance: { lt: today },
          },
        ],
      },
    }),
  ]);

  const taux =
    prevus + realises > 0
      ? Math.round((realises / (prevus + realises)) * 100)
      : null;

  return (
    <>
      <PageHeader
        title="Contrôles SCI"
        description="Registre des contrôles périodiques : fréquences, échéances, preuves et validation."
        actions={
          <BtnLink href="/controles-sci/nouveau">Nouveau contrôle</BtnLink>
        }
      />
      <ModuleHelp {...MODULE_HELP.controles} />

      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {!showArchives ? (
        <div className="stats">
          <div className="stat">
            <strong>{prevus}</strong>
            Prévus
          </div>
          <div className="stat">
            <strong>{realises}</strong>
            Réalisés
          </div>
          <div className="stat">
            <strong>{enRetard}</strong>
            En retard
          </div>
          <div className="stat">
            <strong>
              {taux ?? "—"}
              {taux != null ? "%" : ""}
            </strong>
            Taux de réalisation
          </div>
        </div>
      ) : null}

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
                        <span className="muted">{c.code}</span> · {c.nom}
                        {c.archive ? (
                          <span className="tag tag--muted"> Archivé</span>
                        ) : null}
                      </strong>
                      <span className="entity-row__meta">
                        {c.processusConcerne} · {c.responsable.nom} ·{" "}
                        {TYPE_CONTROLE_LABELS[c.typeControle]} ·{" "}
                        {FREQUENCE_LABELS[c.frequence]} ·{" "}
                        {STATUT_CONTROLE_LABELS[c.statut]} · fenêtre{" "}
                        {c.fenetreDeclenchementJours} j. · {c._count.preuves}{" "}
                        preuve
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
