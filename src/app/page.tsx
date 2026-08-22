import Link from "next/link";
import { ActionBucket } from "@/components/ActionRow";
import { FlashBanner } from "@/components/Flash";
import { PlanningCalendar } from "@/components/PlanningCalendar";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { ModuleHelp } from "@/components/ModuleHelp";
import {
  ReprendreTravail,
} from "@/components/dashboard/ReprendreTravail";
import {
  SemaineCompacte,
  buildSemaineDays,
} from "@/components/dashboard/SemaineCompacte";
import { PageHeader, BtnLink } from "@/components/ui";
import { getMesActions } from "@/lib/actions-view";
import { formatDate } from "@/lib/labels";
import {
  getPlanningCollaborateur,
  parsePlanningFilters,
  parsePlanningHorizon,
  weeksForHorizon,
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
    horizon?: string;
    plan?: string;
    f?: string;
  }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const horizon = parsePlanningHorizon(sp.horizon);
  const weeks = weeksForHorizon(horizon);
  const weekOffset = Number.parseInt(sp.plan ?? "0", 10) || 0;
  const activeFilters = parsePlanningFilters(sp.f);

  const [actions, planning] = await Promise.all([
    getMesActions(user.id),
    getPlanningCollaborateur(user.id, user.uniteId, { weeks, weekOffset }),
  ]);

  const retourQs = new URLSearchParams();
  if (sp.vue) retourQs.set("vue", sp.vue);
  if (horizon !== "semaine") retourQs.set("horizon", horizon);
  if (weekOffset !== 0) retourQs.set("plan", String(weekOffset));
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

  const semaineItems = [
    ...actions.retard,
    ...actions.aujourdhui,
    ...actions.semaine,
    ...actions.avenir,
  ].map((t) => ({
    id: t.id,
    titre: t.titre,
    href: `/taches/${t.id}`,
    dateEcheance: t.dateEcheance,
    dateDebut: t.dateDebut,
  }));

  const weekDays = buildSemaineDays(semaineItems);

  return (
    <>
      <PageHeader
        title="Ma journée"
        help={
          <ModuleHelp
            title="Dashboard collaborateur"
            sections={[
              {
                heading: "À quoi ça sert ?",
                body: "Voir immédiatement ce qui demande votre attention : retards, échéances, planification, et reprendre un travail récent.",
              },
              {
                heading: "Planification",
                body: "Vue Semaine / 4 semaines / Mois. Glisser une barre replanifie le travail sans modifier l’échéance. Mobile : liste / tap.",
              },
              {
                heading: "Charge",
                body: "La charge s’exprime en jours (0,25 · 0,5 · 1 · 2…) — pas de timesheet.",
              },
            ]}
          />
        }
        actions={
          <BtnLink href="/taches/nouvelle" variant="ghost">
            + Action
          </BtnLink>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <ReprendreTravail />

      <CollapsibleSection title="Ma planification" defaultOpen>
        <div className="planning-desktop-only">
          <PlanningCalendar
            columns={planning.window.columns}
            bands={planning.bands.map((b) => ({
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
              startIso: b.start.toISOString(),
              endIso: b.end.toISOString(),
            }))}
            winStartIso={planning.window.start.toISOString()}
            weeks={planning.window.weeks}
            weekOffset={planning.window.weekOffset}
            activeFilters={[...activeFilters]}
            vue={vue}
            horizon={horizon}
            step={weeks}
          />
          <div className="planning__mini-semaine">
            <p
              className="muted"
              style={{ marginTop: "0.85rem", marginBottom: "0.45rem" }}
            >
              Bande jour — échéance / plage planifiée
            </p>
            <SemaineCompacte days={weekDays} />
          </div>
        </div>
        <div className="planning-mobile-only">
          <p className="muted" style={{ marginTop: 0 }}>
            Vue téléphone — agenda / liste (tap pour ouvrir). Pas de
            glisser-déposer.
          </p>
          <SemaineCompacte days={weekDays} />
          <ul className="planning-mobile-list">
            {planning.bands.slice(0, 12).map((b) => (
              <li key={b.id}>
                <Link href={b.href}>
                  <strong>{b.title}</strong>
                  <span className="muted">
                    {" "}
                    · {formatDate(b.start)}
                    {b.end.getTime() !== b.start.getTime()
                      ? ` → ${formatDate(b.end)}`
                      : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="À faire"
        defaultOpen
        badge={actions.totalOuvertes}
      >
        <div className="filter-bar" style={{ marginBottom: "0.75rem" }}>
          <Link href="/" className={`chip${vue === "toutes" ? " is-active" : ""}`}>
            Actives
          </Link>
          <Link
            href="/?vue=retard"
            className={`chip${vue === "retard" ? " is-active" : ""}`}
          >
            En retard ({actions.retard.length})
          </Link>
          <Link
            href="/?vue=aujourdhui"
            className={`chip${vue === "aujourdhui" ? " is-active" : ""}`}
          >
            Aujourd&apos;hui
          </Link>
          <Link
            href="/?vue=semaine"
            className={`chip${vue === "semaine" ? " is-active" : ""}`}
          >
            Semaine
          </Link>
          <Link
            href="/?vue=terminees"
            className={`chip${vue === "terminees" ? " is-active" : ""}`}
          >
            Terminées
          </Link>
        </div>

        {vue === "terminees" ? (
          <ActionBucket
            title="Terminées récemment"
            count={actions.terminees.length}
            items={actions.terminees}
            empty="Aucune tâche terminée récente."
            retour={retour}
          />
        ) : (
          visible.map((b) => (
            <ActionBucket
              key={b.id}
              title={b.title}
              count={b.items.length}
              items={b.items}
              empty={b.empty}
              tone={b.tone}
              retour={retour}
            />
          ))
        )}
      </CollapsibleSection>

      <p className="muted" style={{ marginTop: "1rem" }}>
        Bonjour {user.nom.split(" ")[0]} — inventaire complet :{" "}
        <Link href="/taches">Tâches</Link>
        {" · "}
        aujourd&apos;hui {formatDate(new Date())}
      </p>
    </>
  );
}
