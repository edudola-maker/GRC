import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import {
  CATEGORIE_TACHE_LABELS,
  PRIORITE_LABELS,
  STATUT_TACHE_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TachesPage({
  searchParams,
}: {
  searchParams: Promise<{
    categorie?: string;
    ok?: string;
    erreur?: string;
  }>;
}) {
  const sp = await searchParams;
  const categorie = sp.categorie;

  const taches = await prisma.tache.findMany({
    where: categorie ? { categorie: categorie as "CONSEIL" } : undefined,
    include: {
      responsable: true,
      projet: true,
    },
    orderBy: [{ dateEcheance: "asc" }, { priorite: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="Tâches"
        description="Toutes les tâches de l'unité — indépendantes ou liées à un projet. Utilisez la catégorie Conseil pour une demande ponctuelle."
        actions={
          <>
            <BtnLink href="/taches/nouvelle?categorie=CONSEIL" variant="ghost">
              Nouvelle demande Conseil
            </BtnLink>
            <BtnLink href="/taches/nouvelle">Nouvelle tâche</BtnLink>
          </>
        }
      />

      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <div className="filter-bar">
        <Link
          href="/taches"
          className={`chip${!categorie ? " is-active" : ""}`}
        >
          Toutes
        </Link>
        {(
          [
            ["CONSEIL", "Conseil"],
            ["PROJET", "Projet"],
            ["ADMINISTRATIF", "Administratif"],
            ["SCI", "SCI"],
            ["AUTRE", "Autre"],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={`/taches?categorie=${value}`}
            className={`chip${categorie === value ? " is-active" : ""}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="panel">
        {taches.length === 0 ? (
          <p className="empty">
            Aucune tâche.{" "}
            <Link href="/taches/nouvelle">Créer la première</Link>
          </p>
        ) : (
          <ul className="entity-list">
            {taches.map((t) => {
              const clos = (TACHE_STATUTS_CLOS as readonly string[]).includes(
                t.statut,
              );
              const urgence = urgenceEcheance(t.dateEcheance, clos);
              return (
                <li key={t.id}>
                  <Link
                    href={`/taches/${t.id}`}
                    className={`entity-row entity-row--${urgence}`}
                  >
                    <div className="entity-row__main">
                      <strong>
                        {t.titre}
                        {urgence === "retard" ? (
                          <span className="tag tag--danger"> En retard</span>
                        ) : null}
                      </strong>
                      <span className="entity-row__meta">
                        {CATEGORIE_TACHE_LABELS[t.categorie]} ·{" "}
                        {t.responsable.nom}
                        {t.projet ? ` · ${t.projet.nom}` : " · Indépendante"} ·{" "}
                        {STATUT_TACHE_LABELS[t.statut]} ·{" "}
                        {PRIORITE_LABELS[t.priorite]}
                      </span>
                    </div>
                    <span className="entity-row__date">
                      {formatDate(t.dateEcheance)}
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
