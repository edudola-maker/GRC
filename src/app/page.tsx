import Link from "next/link";
import { ActionBucket } from "@/components/ActionRow";
import { FlashBanner } from "@/components/Flash";
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
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardCollaborateurPage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    erreur?: string;
    vue?: string;
  }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const actions = await getMesActions(user.id);
  const retourQs = new URLSearchParams();
  if (sp.vue) retourQs.set("vue", sp.vue);
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
                body: "Voir immédiatement ce qui demande votre attention : retards, échéances, semaine, et reprendre un travail récent.",
              },
              {
                heading: "Semaine",
                body: "⚑ = échéance à rendre ce jour. ▸ = début de plage planifiée. Outlook reste l’outil des réunions.",
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

      <CollapsibleSection title="Ma semaine" defaultOpen>
        <p className="muted" style={{ marginTop: 0, marginBottom: "0.65rem" }}>
          ⚑ échéance · ▸ plage planifiée
        </p>
        <SemaineCompacte days={weekDays} />
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
