import Link from "next/link";
import { ActionBucket } from "@/components/ActionRow";
import { FlashBanner } from "@/components/Flash";
import { PageHeader, BtnLink } from "@/components/ui";
import { getMesActions } from "@/lib/actions-view";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardCollaborateurPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string; vue?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const actions = await getMesActions(user.id);
  const retour = sp.vue ? `/?vue=${sp.vue}` : "/";

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
    vue === "toutes" ? buckets : buckets.filter((b) => b.id === vue);

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
          <p className="muted">
            Vue calendrier des grandes plages de travail (semaines / mois) —
            disponible à l&apos;étape 6 du Sprint 2. Outlook reste l&apos;outil
            des réunions ; ici, on planifiera les blocs de travail sur audits,
            projets et revues.
          </p>
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
            Toutes
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
        </div>

        {actions.totalOuvertes === 0 ? (
          <div className="panel">
            <p className="empty empty--success">
              Aucune action ouverte. Belle progression — les listes diminuent
              quand le travail avance.
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

        <p className="muted" style={{ marginTop: "1rem" }}>
          Les actions viennent des objets métier (projet, conseil, audit,
          contrôle SCI, revue documentaire). « Créer une action » reste possible
          pour un cas ponctuel, mais ce n&apos;est pas le cœur du produit.
        </p>
      </section>
    </>
  );
}
