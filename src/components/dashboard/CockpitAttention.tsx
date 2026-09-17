import Link from "next/link";
import { getOrgContext, whereOrgUnites } from "@/lib/organisation";
import { prisma } from "@/lib/prisma";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { startOfToday } from "@/lib/labels";

/**
 * Bandeau « Qu’est-ce qui demande mon attention ? »
 * Profondeur adaptée au profil Organisation (mêmes données, widgets différents).
 */
export async function CockpitAttention() {
  const ctx = await getOrgContext();
  const today = startOfToday();
  const profil = ctx.organisation.profilInitial;
  const scope = whereOrgUnites(ctx);

  const [retards, objectifsFaibles, risquesHauts, projetsDerives] =
    await Promise.all([
      prisma.tache.count({
        where: {
          ...scope,
          statut: { notIn: [...TACHE_STATUTS_CLOS] },
          dateEcheance: { lt: today },
        },
      }),
      prisma.objectif.count({
        where: {
          ...scope,
          statut: "EN_COURS",
          progression: { lt: 40 },
        },
      }),
      ctx.modules.has("RISQUES")
        ? prisma.risque.count({
            where: {
              ...scope,
              archive: false,
              criticite: { gte: 12 },
            },
          })
        : Promise.resolve(0),
      prisma.projet.count({
        where: {
          ...scope,
          archive: false,
          statut: "EN_COURS",
          dateEcheance: { lt: today },
        },
      }),
    ]);

  const items: { label: string; value: number; href: string; tone?: string }[] =
    [
      {
        label: "Tâches en retard",
        value: retards,
        href: "/taches?filtre=retard",
        tone: retards > 0 ? "danger" : undefined,
      },
      {
        label: "Objectifs qui n’avancent pas",
        value: objectifsFaibles,
        href: "/objectifs",
      },
      {
        label: "Projets en dérive",
        value: projetsDerives,
        href: "/projets",
        tone: projetsDerives > 0 ? "warn" : undefined,
      },
    ];

  if (
    ctx.modules.has("RISQUES") &&
    (profil === "GRC_TRANSVERSE" ||
      profil === "PME_STRUCTUREE" ||
      profil === "FINANCE_CONTROLE" ||
      risquesHauts > 0)
  ) {
    items.push({
      label: "Risques importants",
      value: risquesHauts,
      href: "/risques",
      tone: risquesHauts > 0 ? "danger" : undefined,
    });
  }

  if (profil === "GRC_TRANSVERSE" && ctx.modules.has("CONTROLES")) {
    const controlesEchus = await prisma.controleSCI.count({
      where: {
        ...scope,
        archive: false,
        dateProchaineEcheance: { lt: today },
      },
    });
    items.push({
      label: "Contrôles à échéance",
      value: controlesEchus,
      href: "/controles-sci",
    });
  }

  return (
    <section className="cockpit-attention" aria-label="Attention">
      <header className="cockpit-attention__head">
        <h2>Qu’est-ce qui demande mon attention ?</h2>
        <p className="muted">
          {ctx.organisation.nomCourt || ctx.organisation.nom}
          {profil ? ` · ${profil.replace(/_/g, " ")}` : null}
        </p>
      </header>
      <ul className="cockpit-attention__grid">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              href={it.href}
              className={`cockpit-attention__item${it.tone ? ` is-${it.tone}` : ""}`}
            >
              <strong>{it.value}</strong>
              <span>{it.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      {!ctx.organisation.profilInitial ||
      ctx.organisation.profilInitial === "PME_SIMPLE" ? (
        <p className="muted cockpit-attention__hint">
          <Link href="/guide/diagnostic">Guide — démarrer simplement</Link>
          {" · "}
          <Link href="/strategie">Stratégie</Link>
        </p>
      ) : (
        <p className="muted cockpit-attention__hint">
          <Link href="/strategie">Stratégie</Link>
          {" · "}
          <Link href="/responsable">Pilotage responsable</Link>
          {" · "}
          <Link href="/guide">Guide</Link>
        </p>
      )}
    </section>
  );
}
