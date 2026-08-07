import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import {
  CONSEIL_DELAI_CIBLE_JOURS,
  CONSEIL_STATUTS_CLOS,
  MODULE_HELP,
} from "@/lib/catalog";
import { businessDaysBetween } from "@/lib/dates";
import {
  STATUT_CONSEIL_LABELS,
  formatDate,
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { parseTags } from "@/lib/tags";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ConseilsPage({
  searchParams,
}: {
  searchParams: Promise<{ archives?: string; ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const archives = sp.archives === "1";
  const today = startOfToday();
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [conseils, ouverts, clotures, closAvecDelai] = await Promise.all([
    prisma.conseil.findMany({
      where: { archive: archives, uniteId },
      include: { responsable: true, _count: { select: { taches: true } } },
      orderBy: { dateReception: "desc" },
    }),
    prisma.conseil.count({
      where: {
        uniteId,
        archive: false,
        statut: { notIn: [...CONSEIL_STATUTS_CLOS] },
      },
    }),
    prisma.conseil.count({
      where: { uniteId, archive: false, statut: "CLOTURE" },
    }),
    prisma.conseil.findMany({
      where: {
        uniteId,
        archive: false,
        statut: { in: ["CLOTURE", "REPONDU"] },
        OR: [{ dateCloture: { not: null } }, { dateReponse: { not: null } }],
      },
      select: { dateReception: true, dateCloture: true, dateReponse: true },
    }),
  ]);

  const enRetard = conseils.filter((c) => {
    if (archives) return false;
    const clos = (CONSEIL_STATUTS_CLOS as readonly string[]).includes(c.statut);
    return !clos && c.dateEcheance && c.dateEcheance < today;
  }).length;

  const respects = closAvecDelai.filter((c) => {
    const fin = c.dateCloture ?? c.dateReponse;
    if (!fin) return false;
    return businessDaysBetween(c.dateReception, fin) <= CONSEIL_DELAI_CIBLE_JOURS;
  }).length;
  const tauxRespect =
    closAvecDelai.length > 0
      ? Math.round((respects / closAvecDelai.length) * 100)
      : null;

  return (
    <>
      <PageHeader
        title="Conseils"
        description="Demandes ponctuelles adressées à l'unité — délai cible 5 jours ouvrés."
        actions={<BtnLink href="/conseils/nouveau">Nouveau conseil</BtnLink>}
      />
      <ModuleHelp {...MODULE_HELP.conseils} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {!archives ? (
        <div className="stats">
          <div className="stat">
            <strong>{ouverts}</strong>
            Ouverts
          </div>
          <div className="stat">
            <strong>{clotures}</strong>
            Clôturés
          </div>
          <div className="stat">
            <strong>{enRetard}</strong>
            En retard
          </div>
          <div className="stat">
            <strong>
              {tauxRespect ?? "—"}
              {tauxRespect != null ? "%" : ""}
            </strong>
            Respect délai {CONSEIL_DELAI_CIBLE_JOURS} j.
          </div>
        </div>
      ) : null}

      <div className="filter-bar">
        <Link
          href="/conseils"
          className={`chip${!archives ? " is-active" : ""}`}
        >
          Actifs
        </Link>
        <Link
          href="/conseils?archives=1"
          className={`chip${archives ? " is-active" : ""}`}
        >
          Archivés
        </Link>
      </div>
      <div className="panel">
        {conseils.length === 0 ? (
          <p className="empty">
            Aucun conseil. <Link href="/conseils/nouveau">Créer le premier</Link>
          </p>
        ) : (
          <ul className="entity-list">
            {conseils.map((c) => {
              const clos = (CONSEIL_STATUTS_CLOS as readonly string[]).includes(
                c.statut,
              );
              const urgence = urgenceEcheance(c.dateEcheance, clos);
              const tags = parseTags(c.tags);
              return (
                <li key={c.id}>
                  <Link
                    href={`/conseils/${c.id}`}
                    className={`entity-row entity-row--${urgence}`}
                  >
                    <div className="entity-row__main">
                      <strong>
                        <span className="muted">{c.code}</span> · {c.objet}
                      </strong>
                      <span className="entity-row__meta">
                        {c.responsable.nom}
                        {c.demandeur ? ` · ${c.demandeur}` : ""}
                        {c.entiteDemandeuse ? ` · ${c.entiteDemandeuse}` : ""}
                        {" · "}
                        {STATUT_CONSEIL_LABELS[c.statut]}
                        {" · "}
                        {c._count.taches} tâche
                        {c._count.taches > 1 ? "s" : ""}
                        {tags.length
                          ? ` · ${tags.map((t) => `#${t}`).join(" ")}`
                          : ""}
                      </span>
                    </div>
                    <span className="entity-row__date">
                      {formatDate(c.dateEcheance)}
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
