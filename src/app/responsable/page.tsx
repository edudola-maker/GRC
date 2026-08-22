import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionRow } from "@/components/ActionRow";
import { FlashBanner } from "@/components/Flash";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PlanningEquipeGantt } from "@/components/dashboard/PlanningEquipeGantt";
import {
  AttentionCounters,
  DonutChart,
  HBarChart,
  TimeBuckets,
} from "@/components/dashboard/RespCharts";
import { PageHeader } from "@/components/ui";
import { getActionsUnite } from "@/lib/actions-view";
import { getDashboardResponsable } from "@/lib/dashboard-responsable";
import {
  PRIORITE_OPTIONS,
  STATUT_TACHE_OPTIONS,
  TACHE_STATUTS_CLOS,
} from "@/lib/catalog";
import {
  CATEGORIE_RISQUE_LABELS,
  STATUT_MISSION_LABELS,
  STATUT_CONSEIL_LABELS,
  STATUT_CONTROLE_LABELS,
  STATUT_PROJET_LABELS,
  formatDate,
} from "@/lib/labels";
import { getObjectifsModuleAggreges } from "@/lib/objectifs-module";
import { PLANNING_KINDS, type PlanningKind } from "@/lib/planning";
import {
  getPlanningEquipe,
  parsePlanningEquipeHorizon,
  stepForEquipeHorizon,
  weeksForEquipeHorizon,
} from "@/lib/planning-equipe";
import { RAG_LABELS, ragEcheance, type RagStatut } from "@/lib/rag";
import {
  formatUtilisateurNom,
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
    /** Planning équipe — horizon */
    ph?: string;
    plan?: string;
    pcollab?: string;
    pk?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!isResponsable(user)) notFound();

  const sp = await searchParams;
  const planHorizon = parsePlanningEquipeHorizon(sp.ph);
  const planWeeks = weeksForEquipeHorizon(planHorizon);
  const planStep = stepForEquipeHorizon(planHorizon);
  const planOffset = Number.parseInt(sp.plan ?? "0", 10) || 0;
  const planKindsRaw = (sp.pk ?? "")
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter((p): p is PlanningKind =>
      PLANNING_KINDS.includes(p as PlanningKind),
    );
  const planKinds =
    planKindsRaw.length > 0
      ? new Set(planKindsRaw)
      : new Set(PLANNING_KINDS);
  const ragFilter =
    sp.rag === "vert" || sp.rag === "jaune" || sp.rag === "rouge"
      ? sp.rag
      : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7 = new Date(today);
  in7.setDate(in7.getDate() + 7);
  const annee = today.getFullYear();

  const [
    data,
    users,
    monitoring,
    objectifsModule,
    objectifsAnnuels,
    planningEquipe,
    unite,
    auditsActifs,
    revuesActives,
    conseilsRetard,
    tachesSemaine,
    tachesPlus,
  ] = await Promise.all([
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
    prisma.objectif.findMany({
      where: { uniteId: user.uniteId, annee },
      orderBy: { intitule: "asc" },
      select: {
        id: true,
        intitule: true,
        progression: true,
        cible: true,
      },
    }),
    getPlanningEquipe(user.uniteId, {
      weeks: planWeeks,
      weekOffset: planOffset,
      filters: {
        collaborateurId: sp.pcollab || undefined,
        kinds: planKinds,
      },
    }),
    prisma.unite.findUnique({
      where: { id: user.uniteId },
      select: { nom: true, code: true },
    }),
    prisma.mission.count({
      where: {
        uniteId: user.uniteId,
        archive: false,
        statut: { in: ["EN_COURS", "EN_REVUE", "PLANIFIE"] },
        type: { code: { startsWith: "AUDIT" } },
      },
    }),
    prisma.mission.count({
      where: {
        uniteId: user.uniteId,
        archive: false,
        statut: { in: ["EN_COURS", "EN_REVUE", "PLANIFIE"] },
        type: { code: { startsWith: "REVUE" } },
      },
    }),
    prisma.conseil.count({
      where: {
        uniteId: user.uniteId,
        archive: false,
        statut: { notIn: ["REPONDU", "CLOTURE", "ANNULE"] },
        dateEcheance: { lt: today },
      },
    }),
    prisma.tache.count({
      where: {
        uniteId: user.uniteId,
        statut: { notIn: [...TACHE_STATUTS_CLOS] },
        dateEcheance: { gte: today, lte: in7 },
      },
    }),
    prisma.tache.count({
      where: {
        uniteId: user.uniteId,
        statut: { notIn: [...TACHE_STATUTS_CLOS] },
        dateEcheance: { gt: in7 },
      },
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
        title="Cockpit responsable"
        help={
          <ModuleHelp
            title="Dashboard responsable"
            body="Monitoring de l’unité : charge, échéances, activité. Chaque indicateur mène à l’inventaire filtré."
          />
        }
        badge="Pilotage"
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <AttentionCounters
        items={[
          {
            key: "retard",
            value: s.actionsEnRetard ?? 0,
            label: "en retard",
            href: "/taches?filtre=retard",
            tone: (s.actionsEnRetard ?? 0) > 0 ? "danger" : "default",
          },
          {
            key: "conseils-retard",
            value: conseilsRetard,
            label: "conseils à traiter",
            href: "/conseils?filtre=retard",
            tone: conseilsRetard > 0 ? "warn" : "default",
          },
          {
            key: "sci",
            value: s.controlesEnRetard,
            label: "contrôles échus",
            href: "/controles-sci?filtre=retard",
            tone: s.controlesEnRetard > 0 ? "danger" : "default",
          },
          {
            key: "risques",
            value: s.risquesCritiques,
            label: "risques critiques",
            href: "/risques?filtre=critiques",
            tone: s.risquesCritiques > 0 ? "danger" : "default",
          },
        ]}
      />

      <section className="resp-cockpit" aria-label="Vue cockpit">
        <div className="resp-block">
          <h3>Répartition de l’activité</h3>
          <DonutChart
            centerLabel="ouverts"
            slices={[
              {
                key: "audits",
                label: "Audits",
                value: auditsActifs,
                href: "/missions?famille=audits",
                color: "#3d6b4f",
              },
              {
                key: "revues",
                label: "Revues",
                value: revuesActives,
                href: "/missions?famille=revues",
                color: "#6a8f74",
              },
              {
                key: "conseils",
                label: "Conseils",
                value: s.conseilsOuverts,
                href: "/conseils?filtre=ouverts",
                color: "#2a6f9e",
              },
              {
                key: "projets",
                label: "Projets",
                value: s.projetsActifs,
                href: "/projets",
                color: "#c48a2a",
              },
            ]}
          />
        </div>

        <div className="resp-block">
          <h3>Charge de l’équipe</h3>
          <HBarChart
            items={users.slice(0, 8).map((u) => {
              const n = chargeMap.get(u.id) ?? 0;
              return {
                key: u.id,
                label: u.nom,
                value: n,
                href: `/responsable?collaborateur=${u.id}`,
                tone: n > 5 ? "warn" : "default",
              };
            })}
          />
        </div>

        <div className="resp-block">
          <h3>Échéances</h3>
          <TimeBuckets
            items={[
              {
                key: "retard",
                label: "En retard",
                value: s.actionsEnRetard ?? 0,
                href: "/taches?filtre=retard",
                tone: "danger",
              },
              {
                key: "semaine",
                label: "7 jours",
                value: tachesSemaine,
                href: "/taches",
                tone: "warn",
              },
              {
                key: "plus",
                label: "Plus loin",
                value: tachesPlus,
                href: "/taches",
                tone: "info",
              },
              {
                key: "sci",
                label: "SCI échus",
                value: s.controlesEnRetard,
                href: "/controles-sci?filtre=retard",
                tone: s.controlesEnRetard > 0 ? "danger" : "default",
              },
            ]}
          />
        </div>

        <div className="resp-block">
          <h3>Objectifs annuels</h3>
          <HBarChart
            items={objectifsAnnuels.slice(0, 6).map((o) => ({
              key: o.id,
              label: o.intitule,
              value: o.progression ?? 0,
              href: `/objectifs/${o.id}`,
              tone: (o.progression ?? 0) < 40 ? "warn" : "default",
              subtitle: o.cible ? `Cible : ${o.cible}` : undefined,
            }))}
            max={100}
          />
          {objectifsAnnuels.length === 0 ? (
            <p className="muted">Aucun objectif annuel défini.</p>
          ) : (
            <p className="muted" style={{ marginTop: "0.5rem" }}>
              Progression en % (cliquable).
            </p>
          )}
        </div>
      </section>

      <CollapsibleSection title="Planification équipe" defaultOpen>
        <p className="muted" style={{ marginTop: 0, marginBottom: "0.65rem" }}>
          {unite?.nom ?? "Unité"} — replanification visuelle · charge en jours ·
          échéance distincte
        </p>
        <div className="planning-desktop-only">
          <PlanningEquipeGantt
            columns={planningEquipe.window.columns}
            rows={planningEquipe.rows.map((r) => ({
              user: r.user,
              chargeDays: r.chargeDays,
              bands: r.bands.map((b) => ({
                id: b.id,
                kind: b.kind,
                title: b.title,
                href: b.href,
                source: b.source,
                entityType: b.entityType,
                entityId: b.entityId,
                editable: b.editable,
                echeanceIso: b.echeanceIso,
                chargeJours: b.chargeJours,
                planStartIso: b.planStartIso,
                planEndIso: b.planEndIso,
                durationDays: b.durationDays,
                startIso: b.start.toISOString(),
                endIso: b.end.toISOString(),
              })),
            }))}
            winStartIso={planningEquipe.window.start.toISOString()}
            weeks={planningEquipe.window.weeks}
            weekOffset={planOffset}
            horizon={planHorizon}
            step={planStep}
            collaborateurs={users.map((u) => ({
              id: u.id,
              nom: formatUtilisateurNom(u),
            }))}
            filterCollaborateur={sp.pcollab}
            filterKinds={[...planKinds]}
          />
        </div>
        <div className="planning-mobile-only">
          <p className="muted">
            Vue téléphone — liste chronologique (tap pour ouvrir).
          </p>
          <ul className="planning-mobile-list">
            {planningEquipe.rows.flatMap((r) =>
              r.bands.slice(0, 4).map((b) => (
                <li key={`${r.user.id}-${b.id}`}>
                  <Link href={b.href}>
                    <strong>{r.user.nom}</strong>
                    <span className="muted"> · {b.title}</span>
                  </Link>
                </li>
              )),
            )}
          </ul>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Que fait actuellement l'unité ?"
        defaultOpen
      >
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
              href: `/missions/${a.id}`,
              title: a.titre,
              meta: `${a.responsable.nom} · Mission · ${STATUT_MISSION_LABELS[a.statut]}`,
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
            <CollapsibleSection
              title="Éléments opérationnels"
              badge={items.length}
              defaultOpen
            >
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
            </CollapsibleSection>
          );
        })()}
      </CollapsibleSection>

      <CollapsibleSection
        title={`Objectifs modules ${data.meta.annee} — vision consolidée`}
        defaultOpen={false}
      >
          <p className="muted" style={{ marginBottom: "0.75rem" }}>
            Chaque module définit ses cibles ; ce tableau de bord les agrège
            uniquement.
          </p>
          {objectifsModule.length === 0 ? (
            <p className="empty">
              Aucun objectif module pour cette année. Ils seront gérés via
              Administration.
            </p>
          ) : (
            <>
              <HBarChart
                items={objectifsModule.slice(0, 8).map((o) => ({
                  key: o.id,
                  label: o.libelle,
                  value: o.progression ?? 0,
                  href: "/unite#objectifs",
                  tone: (o.progression ?? 0) < 40 ? "warn" : "default",
                }))}
                max={100}
              />
              <ul className="objectifs-module-list" style={{ marginTop: "1rem" }}>
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
            </>
          )}
      </CollapsibleSection>

      <CollapsibleSection
        title={`Objectifs collaborateurs ${data.meta.annee}`}
        defaultOpen
      >
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
            label="Occurrences SCI réalisées"
            value={s.controlesRealises}
          />
        </div>
        <CollapsibleSection
          title="Détail par collaborateur"
          badge={data.objectifs.length}
          defaultOpen={false}
        >
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
        </CollapsibleSection>
      </CollapsibleSection>

      <CollapsibleSection
        title="Actions de l'unité"
        defaultOpen
        badge={
          <>
            {s.actionsOuvertes}
            {s.actionsEnRetard > 0 ? ` · ${s.actionsEnRetard} en retard` : ""}
          </>
        }
      >
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
              <option value="MISSION">Mission</option>
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
      </CollapsibleSection>
    </>
  );
}
