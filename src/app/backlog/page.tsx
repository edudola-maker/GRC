import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { completeTacheRapide } from "@/app/taches/actions";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import {
  CATEGORIE_TACHE_LABELS,
  PRIORITE_LABELS,
  STATUT_TACHE_LABELS,
  formatDate,
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import { endOfMonth, endOfWeek } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/FormControls";

export const dynamic = "force-dynamic";

type Vue = "aujourdhui" | "semaine" | "mois" | "retard" | "valider" | "toutes";

export default async function BacklogPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const vue = (sp.vue as Vue) || "semaine";
  const today = startOfToday();
  const week = endOfWeek(today);
  const month = endOfMonth(today);

  const where: Prisma.TacheWhereInput = {
    statut: { notIn: [...TACHE_STATUTS_CLOS] },
  };

  if (vue === "aujourdhui") {
    where.dateEcheance = { lte: today };
  } else if (vue === "semaine") {
    where.OR = [
      { dateEcheance: { lte: week } },
      { statut: "A_VALIDER" },
    ];
  } else if (vue === "mois") {
    where.dateEcheance = { lte: month };
  } else if (vue === "retard") {
    where.dateEcheance = { lt: today };
  } else if (vue === "valider") {
    where.statut = "A_VALIDER";
  }

  const taches = await prisma.tache.findMany({
    where,
    include: {
      responsable: true,
      projet: true,
      conseil: true,
      controleSCI: true,
      audit: true,
      document: true,
    },
    orderBy: [{ dateEcheance: "asc" }, { priorite: "desc" }],
  });

  const tabs: Array<{ id: Vue; label: string }> = [
    { id: "aujourdhui", label: "Aujourd'hui" },
    { id: "semaine", label: "Cette semaine" },
    { id: "mois", label: "Ce mois" },
    { id: "retard", label: "En retard" },
    { id: "valider", label: "À valider" },
    { id: "toutes", label: "Toutes ouvertes" },
  ];

  return (
    <>
      <PageHeader
        title="Backlog"
        description="Vue de travail quotidienne — terminez vos actions pour faire avancer l'unité."
        actions={<BtnLink href="/taches/nouvelle">Nouvelle tâche</BtnLink>}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <div className="filter-bar">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/backlog?vue=${t.id}`}
            className={`chip${vue === t.id ? " is-active" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="panel">
        {taches.length === 0 ? (
          <p className="empty">
            Aucune action dans cette vue. Belle progression !
          </p>
        ) : (
          <ul className="entity-list">
            {taches.map((t) => {
              const urgence = urgenceEcheance(t.dateEcheance, false);
              const origine =
                t.projet?.nom ||
                t.conseil?.objet ||
                t.controleSCI?.nom ||
                t.audit?.titre ||
                t.document?.nom ||
                "Indépendante";
              return (
                <li key={t.id}>
                  <div className={`entity-row entity-row--${urgence} entity-row--actions`}>
                    <Link href={`/taches/${t.id}`} className="entity-row__main">
                      <strong>
                        {t.titre}
                        {urgence === "retard" ? (
                          <span className="tag tag--danger"> En retard</span>
                        ) : null}
                      </strong>
                      <span className="entity-row__meta">
                        {CATEGORIE_TACHE_LABELS[t.categorie]} ·{" "}
                        {t.responsable.nom} · {origine} ·{" "}
                        {STATUT_TACHE_LABELS[t.statut]} ·{" "}
                        {PRIORITE_LABELS[t.priorite]}
                      </span>
                    </Link>
                    <span className="entity-row__date">
                      {formatDate(t.dateEcheance)}
                    </span>
                    {t.statut !== "TERMINE" ? (
                      <form action={completeTacheRapide}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="retour" value={`/backlog?vue=${vue}`} />
                        <SubmitButton pendingLabel="…">Terminer</SubmitButton>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
