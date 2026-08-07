import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionRow } from "@/components/ActionRow";
import { FlashBanner } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { getActionsUnite } from "@/lib/actions-view";
import { getDashboardResponsable } from "@/lib/dashboard-responsable";
import {
  PRIORITE_OPTIONS,
  STATUT_TACHE_OPTIONS,
} from "@/lib/catalog";
import {
  CATEGORIE_RISQUE_LABELS,
  STATUT_AUDIT_LABELS,
  STATUT_CONSEIL_LABELS,
  STATUT_CONTROLE_LABELS,
  STATUT_PROJET_LABELS,
  formatDate,
} from "@/lib/labels";
import { getObjectifsModuleAggreges } from "@/lib/objectifs-module";
import { RAG_LABELS, ragEcheance, type RagStatut } from "@/lib/rag";
import {
  getCurrentUser,
  isResponsable,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { prisma } from "@/lib/prisma";

function RagDot({ rag }: { rag: RagStatut }) {
  return (
    <span
      className={`rag-dot rag-dot--${rag}`}
      title={RAG_LABELS[rag]}
      aria-label={RAG_LABELS[rag]}
    />
  );
}

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  tone,
  suffix,
}: {
  label: string;
  value: number | string | null;
  tone?: "warn" | "danger" | "info";
  suffix?: string;
}) {
  return (
    <div className={`stat${tone ? ` stat--${tone}` : ""}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">
        {value ?? "—"}
        {suffix && value != null ? (
          <span className="stat__suffix">{suffix}</span>
        ) : null}
      </span>
    </div>
  );
}

export default async function DashboardResponsablePage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    erreur?: string;
    collaborateur?: string;
    type?: string;
    statut?: string;
    priorite?: string;
    echeance?: string;
    rag?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!isResponsable(user)) notFound();

  const sp = await searchParams;
  const ragFilter =
    sp.rag === "vert" || sp.rag === "jaune" || sp.rag === "rouge"
      ? sp.rag
      : null;
  const [data, users, monitoring, objectifsModule, unite] = await Promise.all([
    getDashboardResponsable(user.uniteId),
    listUtilisateursActifsForCurrentUnite(),
    getActionsUnite(user.uniteId, {
      collaborateurId: sp.collaborateur || undefined,
      type: sp.type || undefined,
      statut: sp.statut || undefined,
      priorite: sp.priorite || undefined,
      echeance:
        sp.echeance === "retard" || sp.echeance === "proche"
          ? sp.echeance
          : undefined,
    }),
    getObjectifsModuleAggreges(user.uniteId),
    prisma.unite.findUnique({
      where: { id: user.uniteId },
      select: { nom: true, code: true },
    }),
  ]);

  const s = data.synthetique;
  const chargeMap = new Map(
    monitoring.chargeParCollaborateur.map((c) => [
      c.responsableId,
      c._count._all,
    ]),
  );
  const qs = new URLSearchParams();
  if (sp.collaborateur) qs.set("collaborateur", sp.collaborateur);
  if (sp.type) qs.set("type", sp.type);
  if (sp.statut) qs.set("statut", sp.statut);
  if (sp.priorite) qs.set("priorite", sp.priorite);
  if (sp.echeance) qs.set("echeance", sp.echeance);
  const retour = `/responsable${qs.toString() ? `?${qs}` : ""}`;

  return (
    <>
      <PageHeader
        title="Dashboard responsable"
        description={`Comment va mon unité${unite ? ` (${unite.nom})` : ""} ? Vue consolidée — les objectifs et KPI sont définis par chaque module.`}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <section className="section" aria-label="Vue synthétique">
        <h2 className="section__title">Vue synthétique</h2>
        <div className="kpi-domains">
          <article className="kpi-domain">
            <h3>Audits</h3>
            <p>
              <strong>{s.auditsEnCours}</strong> en cours ·{" "}
              <strong>{s.auditsRealises}</strong> réalisés
            </p>
          </article>
          <article className="kpi-domain">
            <h3>Conseils</h3>
            <p>
              <strong>{s.conseilsOuverts}</strong> ouverts · respect délai{" "}
              <strong>{s.tauxRespectDelai ?? "—"}</strong>
              {s.tauxRespectDelai != null ? " %" : ""}
            </p>
          </article>
          <article className="kpi-domain">
            <h3>Projets</h3>
            <p>
              <strong>{s.projetsActifs}</strong> actifs ·{" "}
              <strong>{s.projetsEnRetard}</strong> en retard
            </p>
          </article>
          <article className="kpi-domain">
            <h3>Contrôles SCI</h3>
            <p>
              <strong>{s.controlesPrevus}</strong> prévus · taux{" "}
              <strong>{s.tauxRealisationControles ?? "—"}</strong>
              {s.tauxRealisationControles != null ? " %" : ""}
            </p>
          </article>
          <article className="kpi-domain">
            <h3>Risques</h3>
            <p>
              <strong>{s.risquesCritiques}</strong> critiques ·{" "}
              <strong>{s.risquesEleves}</strong> élevés
            </p>
          </article>
        </div>
      </section>

      <section className="section" aria-label="Vue opérationnelle">
        <h2 className="section__title">Que fait actuellement l&apos;unité ?</h2>
        <div className="filter-bar">
          <Link
            href="/responsable"
            className={`chip${!ragFilter ? " is-active" : ""}`}
          >
            Tous
          </Link>
          <Link
            href="/responsable?rag=vert"
            className={`chip${ragFilter === "vert" ? " is-active" : ""}`}
          >
            <span className="rag-dot rag-dot--vert" /> Vert
          </Link>
          <Link
            href="/responsable?rag=jaune"
            className={`chip${ragFilter === "jaune" ? " is-active" : ""}`}
          >
            <span className="rag-dot rag-dot--jaune" /> Jaune
          </Link>
          <Link
            href="/responsable?rag=rouge"
            className={`chip${ragFilter === "rouge" ? " is-active" : ""}`}
          >
            <span className="rag-dot rag-dot--rouge" /> Rouge
          </Link>
        </div>
        {(() => {
          type OpItem = {
            key: string;
            rag: RagStatut;
            href: string;
            title: string;
            meta: string;
            date: Date | null;
          };
          const items: OpItem[] = [
            ...data.operationnel.audits.map((a) => ({
              key: `a-${a.id}`,
              rag: ragEcheance(a.dateFin),
              href: `/audits/${a.id}`,
              title: a.titre,
              meta: `${a.responsable.nom} · Audit · ${STATUT_AUDIT_LABELS[a.statut]}`,
              date: a.dateFin,
            })),
            ...data.operationnel.conseils.map((c) => ({
              key: `c-${c.id}`,
              rag: ragEcheance(c.dateEcheance),
              href: `/conseils/${c.id}`,
              title: c.objet,
              meta: `${c.responsable.nom} · Conseil · ${STATUT_CONSEIL_LABELS[c.statut]}`,
              date: c.dateEcheance,
            })),
            ...data.operationnel.projets.map((p) => ({
              key: `p-${p.id}`,
              rag: ragEcheance(p.dateEcheance),
              href: `/projets/${p.id}`,
              title: p.nom,
              meta: `${p.responsable.nom} · Projet · ${STATUT_PROJET_LABELS[p.statut]} · ${p.avancement}%`,
              date: p.dateEcheance,
            })),
            ...data.operationnel.controles.map((c) => ({
              key: `ctl-${c.id}`,
              rag: ragEcheance(c.dateProchaineEcheance),
              href: `/controles-sci/${c.id}`,
              title: c.nom,
              meta: `${c.responsable.nom} · SCI · ${STATUT_CONTROLE_LABELS[c.statut]}`,
              date: c.dateProchaineEcheance,
            })),
            ...data.operationnel.risques.map((r) => ({
              key: `r-${r.id}`,
              rag: (r.criticite >= 20
                ? "rouge"
                : r.criticite >= 12
                  ? "jaune"
                  : "vert") as RagStatut,
              href: `/risques/${r.id}`,
              title: r.nom,
              meta: `${r.responsable.nom} · Risque · ${CATEGORIE_RISQUE_LABELS[r.categorie]} · crit. ${r.criticite}`,
              date: null,
            })),
          ].filter((i) => !ragFilter || i.rag === ragFilter);

          return (
            <div className="panel">
              {items.length === 0 ? (
                <p className="empty">Aucun élément pour ce filtre.</p>
              ) : (
                <ul className="item-list">
                  {items.map((i) => (
                    <li key={i.key} className="item">
                      <RagDot rag={i.rag} />
                      <div>
                        <p className="item__title">
                          <Link href={i.href}>{i.title}</Link>
                        </p>
                        <p className="item__meta">{i.meta}</p>
                      </div>
                      <span className="item__date">{formatDate(i.date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })()}
      </section>

      <section className="section" aria-label="Objectifs modules">
        <h2 className="section__title">
          Objectifs modules {data.meta.annee} — vision consolidée
        </h2>
        <p className="muted" style={{ marginBottom: "0.75rem" }}>
          Chaque module définit ses cibles ; ce tableau de bord les agrège
          uniquement.
        </p>
        <div className="panel">
          {objectifsModule.length === 0 ? (
            <p className="empty">
              Aucun objectif module pour cette année. Ils seront gérés via
              Administration.
            </p>
          ) : (
            <ul className="objectifs-module-list">
              {objectifsModule.map((o) => (
                <li key={o.id}>
                  <span className="module-tag">{o.moduleLabel}</span>
                  <div>
                    <strong>{o.libelle}</strong>
                    <span className="muted" style={{ display: "block", fontSize: "0.82rem" }}>
                      {o.source === "calcule" ? "Calculé" : "Saisi"}
                      {o.uniteMesure ? ` · ${o.uniteMesure}` : ""}
                    </span>
                  </div>
                  <span>
                    {o.realise ?? "—"}
                    {o.cible != null ? ` / ${o.cible}` : ""}
                    {o.cible != null && o.cible > 0 ? (
                      <span className="muted"> · {o.progression}%</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="section" aria-label="Objectifs annuels">
        <h2 className="section__title">
          Objectifs collaborateurs {data.meta.annee}
        </h2>
        <div className="stats-grid" style={{ marginBottom: "1rem" }}>
          <Stat
            label="Audits réalisés / planifiés"
            value={`${s.auditsRealises} / ${s.auditsPlanifies}`}
          />
          <Stat
            label="Délai moyen conseils"
            value={s.delaiMoyen}
            suffix=" j."
            tone="info"
          />
          <Stat label="Projets clôturés" value={s.projetsTermines} />
          <Stat
            label="Contrôles SCI réalisés"
            value={s.controlesRealises}
          />
        </div>
        <div className="panel">
          {data.objectifs.length === 0 ? (
            <p className="empty">Aucun objectif annuel collaborateur renseigné.</p>
          ) : (
            <ul className="history-list">
              {data.objectifs.map((o) => (
                <li key={o.id}>
                  <strong>
                    {o.utilisateur.nom} — {o.objectif}
                  </strong>
                  <span>
                    Progression {o.progression}%
                    {o.attenduAnnuel ? ` · Attendu : ${o.attenduAnnuel}` : ""}
                    {o.realiseADate ? ` · Réalisé : ${o.realiseADate}` : ""}
                  </span>
                  <em>Échéance {formatDate(o.dateEcheance)}</em>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="section" aria-label="Monitoring des actions">
        <h2 className="section__title">
          Actions de l&apos;unité
          <span className="bucket-count">{s.actionsOuvertes}</span>
          {s.actionsEnRetard > 0 ? (
            <span className="bucket-count bucket-count--danger">
              {s.actionsEnRetard} en retard
            </span>
          ) : null}
        </h2>

        <form className="filter-bar filter-bar--form" method="get">
          <label className="field">
            <span className="field__label">Collaborateur</span>
            <select name="collaborateur" defaultValue={sp.collaborateur ?? ""}>
              <option value="">Tous</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom} ({chargeMap.get(u.id) ?? 0} ouvertes)
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Origine</span>
            <select name="type" defaultValue={sp.type ?? ""}>
              <option value="">Toutes</option>
              <option value="PROJET">Projet</option>
              <option value="CONSEIL">Conseil</option>
              <option value="AUDIT">Audit</option>
              <option value="SCI">Contrôle SCI</option>
              <option value="DOCUMENT">Document</option>
              <option value="LIBRE">Action libre</option>
            </select>
          </label>
          <label className="field">
            <span className="field__label">Statut</span>
            <select name="statut" defaultValue={sp.statut ?? ""}>
              <option value="">Tous</option>
              {STATUT_TACHE_OPTIONS.filter(
                (o) => o.value !== "TERMINE" && o.value !== "ANNULE",
              ).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Priorité</span>
            <select name="priorite" defaultValue={sp.priorite ?? ""}>
              <option value="">Toutes</option>
              {PRIORITE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Échéance</span>
            <select name="echeance" defaultValue={sp.echeance ?? ""}>
              <option value="">Toutes</option>
              <option value="retard">En retard</option>
              <option value="proche">Proche (7 j.)</option>
            </select>
          </label>
          <button type="submit" className="btn btn--primary">
            Filtrer
          </button>
          <Link href="/responsable" className="btn btn--ghost">
            Réinitialiser
          </Link>
        </form>

        <div className="panel">
          {monitoring.actions.length === 0 ? (
            <p className="empty">Aucune action ouverte pour ces filtres.</p>
          ) : (
            <ul className="entity-list">
              {monitoring.actions.map((t) => (
                <ActionRow
                  key={t.id}
                  tache={t}
                  retour={retour}
                  showResponsable
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
