import Link from "next/link";
import { ActionBucket } from "@/components/ActionRow";
import { FlashBanner } from "@/components/Flash";
import { PlanningCalendar } from "@/components/PlanningCalendar";
import { PageHeader, BtnLink } from "@/components/ui";
import { getMesActions } from "@/lib/actions-view";
import { formatDate } from "@/lib/labels";
import {
  getPlanningCollaborateur,
  parsePlanningFilters,
} from "@/lib/planning";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardCollaborateurPage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    erreur?: string;
    vue?: string;
    plan?: string;
    f?: string;
  }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const weekOffset = Number.parseInt(sp.plan ?? "0", 10) || 0;
  const planFilters = parsePlanningFilters(sp.f);
  const [actions, planning] = await Promise.all([
    getMesActions(user.id),
    getPlanningCollaborateur(user.id, user.uniteId, { weekOffset }),
  ]);
  const retourQs = new URLSearchParams();
  if (sp.vue) retourQs.set("vue", sp.vue);
  if (weekOffset) retourQs.set("plan", String(weekOffset));
  if (sp.f) retourQs.set("f", sp.f);
  const retour = retourQs.toString() ? `/?${retourQs}` : "/";

  const vue = sp.vue || "toutes";
  const buckets = [
    {
      id: "retard",
      title: "En retard",
      items: actions.retard,
      empty: "Aucune action en retard.",
      tone: "danger" as const,
    },
    {
      id: "aujourdhui",
      title: "Aujourd'hui",
      items: actions.aujourdhui,
      empty: "Rien pour aujourd'hui.",
      tone: "warn" as const,
    },
    {
      id: "semaine",
      title: "Cette semaine",
      items: actions.semaine,
      empty: "Aucune action cette semaine.",
      tone: "info" as const,
    },
    {
      id: "avenir",
      title: "À venir",
      items: actions.avenir,
      empty: "Rien de planifié plus loin.",
    },
  ];

  const visible =
    vue === "toutes"
      ? buckets
      : vue === "terminees"
        ? []
        : buckets.filter((b) => b.id === vue);

  return (
    <>
      <PageHeader
        title="Mon tableau de bord"
        description={`Bonjour ${user.nom.split(" ")[0]} — que dois-je faire et sur quoi vais-je travailler ?`}
        actions={
          <BtnLink href="/taches/nouvelle" variant="ghost">
            Créer une action
          </BtnLink>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <section className="section" aria-label="Ma planification">
        <div className="panel panel--soft">
          <h2 className="panel-title">Ma planification</h2>
          <p className="muted" style={{ marginBottom: "0.85rem" }}>
            Sur quoi vais-je travailler les prochaines semaines ? Vue high
            level — projets, audits et tâches (conseils, SCI, revues…). Outlook
            reste l&apos;outil des réunions.
          </p>
          <PlanningCalendar
            columns={planning.window.columns}
            bands={planning.bands}
            winStart={planning.window.start}
            weeks={planning.window.weeks}
            weekOffset={planning.window.weekOffset}
            activeFilters={planFilters}
            vue={sp.vue}
          />
        </div>
      </section>

      <section className="section" aria-label="Mes actions">
        <div className="panel-head" style={{ marginBottom: "0.75rem" }}>
          <h2 className="section__title" style={{ margin: 0 }}>
            Mes actions
            <span className="bucket-count">{actions.totalOuvertes}</span>
          </h2>
        </div>

        <div className="filter-bar">
          <Link href="/" className={`chip${vue === "toutes" ? " is-active" : ""}`}>
            Actives
          </Link>
          {buckets.map((b) => (
            <Link
              key={b.id}
              href={`/?vue=${b.id}`}
              className={`chip${vue === b.id ? " is-active" : ""}`}
            >
              {b.title} ({b.items.length})
            </Link>
          ))}
          <Link
            href="/?vue=terminees"
            className={`chip${vue === "terminees" ? " is-active" : ""}`}
          >
            Terminées ({actions.terminees.length})
          </Link>
        </div>

        {vue === "terminees" ? (
          <div className="panel">
            <h2 className="panel-title">Historique — actions terminées</h2>
            {actions.terminees.length === 0 ? (
              <p className="empty">Aucune action terminée récemment.</p>
            ) : (
              <ul className="entity-list">
                {actions.terminees.map((t) => (
                  <li key={t.id}>
                    <Link href={`/taches/${t.id}`} className="entity-row">
                      <div className="entity-row__main">
                        <strong>{t.titre}</strong>
                        <span className="entity-row__meta">
                          Clôturée le {formatDate(t.dateValidation ?? t.modifieLe)}
                        </span>
                      </div>
                      <span className="entity-row__date">
                        {formatDate(t.dateEcheance)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : actions.totalOuvertes === 0 ? (
          <div className="panel">
            <p className="empty empty--success">
              Aucune action ouverte. Belle progression — consultez l&apos;historique
              pour revoir les actions terminées.
            </p>
          </div>
        ) : (
          <div className="stack-panels">
            {visible.map((b) => (
              <ActionBucket
                key={b.id}
                title={b.title}
                count={b.items.length}
                items={b.items}
                retour={retour}
                empty={b.empty}
                tone={b.tone}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
