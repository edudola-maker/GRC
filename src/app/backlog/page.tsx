import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader } from "@/components/ui";
import {
  CATEGORIE_TACHE_OPTIONS,
  ECHEANCE_FILTER_OPTIONS,
  PRIORITE_OPTIONS,
  STATUT_TACHE_OPTIONS,
  TACHE_STATUTS_CLOS,
} from "@/lib/catalog";
import {
  CATEGORIE_TACHE_LABELS,
  PRIORITE_LABELS,
  STATUT_TACHE_LABELS,
  addDays,
  formatDate,
  startOfToday,
  urgenceEcheance,
  SOON_DAYS,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Sp = {
  responsable?: string;
  categorie?: string;
  projet?: string;
  statut?: string;
  priorite?: string;
  echeance?: string;
};

export default async function BacklogPage({
  searchParams,
}: {
  searchParams: Promise<Sp>;
}) {
  const sp = await searchParams;
  const today = startOfToday();
  const soon = addDays(today, SOON_DAYS);

  const where: Prisma.TacheWhereInput = {
    statut: { notIn: [...TACHE_STATUTS_CLOS] },
  };

  if (sp.responsable) where.responsableId = sp.responsable;
  if (sp.categorie) where.categorie = sp.categorie as "CONSEIL";
  if (sp.projet === "aucun") where.projetId = null;
  else if (sp.projet) where.projetId = sp.projet;
  if (sp.statut) where.statut = sp.statut as "A_FAIRE";
  if (sp.priorite) where.priorite = sp.priorite as "MOYENNE";

  if (sp.echeance === "retard") {
    where.dateEcheance = { lt: today };
  } else if (sp.echeance === "bientot") {
    where.dateEcheance = { gte: today, lte: soon };
  } else if (sp.echeance === "plus_tard") {
    where.dateEcheance = { gt: soon };
  } else if (sp.echeance === "sans") {
    where.dateEcheance = null;
  }

  const [taches, users, projets] = await Promise.all([
    prisma.tache.findMany({
      where,
      include: { responsable: true, projet: true },
      orderBy: [{ dateEcheance: "asc" }, { priorite: "desc" }],
    }),
    prisma.utilisateur.findMany({
      where: { actif: true },
      orderBy: { nom: "asc" },
    }),
    prisma.projet.findMany({
      orderBy: { nom: "asc" },
      select: { id: true, nom: true },
    }),
  ]);

  function hrefWith(patch: Partial<Sp>) {
    const next = { ...sp, ...patch };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
    }
    const q = params.toString();
    return q ? `/backlog?${q}` : "/backlog";
  }

  return (
    <>
      <PageHeader
        title="Backlog"
        description="Tâches nécessitant une action — indépendantes, liées à un projet, Conseil, SCI, etc."
      />

      <form className="filters panel" method="get">
        <label>
          <span>Responsable</span>
          <select name="responsable" defaultValue={sp.responsable ?? ""}>
            <option value="">Tous</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nom}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Catégorie</span>
          <select name="categorie" defaultValue={sp.categorie ?? ""}>
            <option value="">Toutes</option>
            {CATEGORIE_TACHE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Projet</span>
          <select name="projet" defaultValue={sp.projet ?? ""}>
            <option value="">Tous</option>
            <option value="aucun">Sans projet</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Statut</span>
          <select name="statut" defaultValue={sp.statut ?? ""}>
            <option value="">Ouverts</option>
            {STATUT_TACHE_OPTIONS.filter(
              (o) => !(TACHE_STATUTS_CLOS as readonly string[]).includes(o.value),
            ).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Priorité</span>
          <select name="priorite" defaultValue={sp.priorite ?? ""}>
            <option value="">Toutes</option>
            {PRIORITE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Échéance</span>
          <select name="echeance" defaultValue={sp.echeance ?? ""}>
            {ECHEANCE_FILTER_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <div className="filters__actions">
          <button type="submit" className="btn btn--primary">
            Filtrer
          </button>
          <Link href="/backlog" className="btn btn--ghost">
            Réinitialiser
          </Link>
        </div>
      </form>

      <div className="legend">
        <span>
          <i className="dot-retard" /> En retard
        </span>
        <span>
          <i className="dot-bientot" /> Échéance proche (≤ {SOON_DAYS} j.)
        </span>
        <span>
          <i className="dot-validation" /> À venir
        </span>
      </div>

      <div className="panel">
        {taches.length === 0 ? (
          <p className="empty">Aucune tâche ne correspond aux filtres.</p>
        ) : (
          <ul className="entity-list">
            {taches.map((t) => {
              const urgence = urgenceEcheance(t.dateEcheance, false);
              return (
                <li key={t.id}>
                  <Link
                    href={`/taches/${t.id}`}
                    className={`entity-row entity-row--${urgence}`}
                  >
                    <div className="entity-row__main">
                      <strong>{t.titre}</strong>
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

      {/* Conserve les filtres actifs visibles pour accessibilité */}
      {Object.keys(sp).length > 0 ? (
        <p className="filter-hint">
          <Link href={hrefWith({})}>Voir tout le backlog</Link>
        </p>
      ) : null}
    </>
  );
}
