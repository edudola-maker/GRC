import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { KpiZone } from "@/components/module/KpiZone";
import {
  TacheInventory,
  type TacheInventoryItem,
} from "@/components/taches/TacheInventory";
import { MODULE_HELP, TACHE_STATUTS_CLOS } from "@/lib/catalog";
import {
  CATEGORIE_TACHE_LABELS,
  PRIORITE_LABELS,
  STATUT_TACHE_LABELS,
  urgenceEcheance,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatUtilisateurNom, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

function sourceOf(t: {
  projetId: string | null;
  projet: { id: string; nom: string; code: string } | null;
  conseilId: string | null;
  conseil: { id: string; objet: string; code: string } | null;
  controleSCIId: string | null;
  controleSCI: { id: string; nom: string; code: string } | null;
  missionId: string | null;
  mission: { id: string; titre: string; code: string } | null;
  documentId: string | null;
  document: { id: string; nom: string; code: string } | null;
  recommandationId: string | null;
  recommandation: { id: string; titre: string; code: string } | null;
}): {
  sourceType: string | null;
  sourceLabel: string | null;
  sourceHref: string | null;
} {
  if (t.projet) {
    return {
      sourceType: "PROJET",
      sourceLabel: `${t.projet.code} — ${t.projet.nom}`,
      sourceHref: `/projets/${t.projet.id}`,
    };
  }
  if (t.conseil) {
    return {
      sourceType: "CONSEIL",
      sourceLabel: `${t.conseil.code} — ${t.conseil.objet}`,
      sourceHref: `/conseils/${t.conseil.id}`,
    };
  }
  if (t.controleSCI) {
    return {
      sourceType: "CONTROLE",
      sourceLabel: `${t.controleSCI.code} — ${t.controleSCI.nom}`,
      sourceHref: `/controles-sci/${t.controleSCI.id}`,
    };
  }
  if (t.mission) {
    return {
      sourceType: "MISSION",
      sourceLabel: `${t.mission.code} — ${t.mission.titre}`,
      sourceHref: `/missions/${t.mission.id}`,
    };
  }
  if (t.document) {
    return {
      sourceType: "DOCUMENT",
      sourceLabel: `${t.document.code} — ${t.document.nom}`,
      sourceHref: `/documents/${t.document.id}`,
    };
  }
  if (t.recommandation) {
    return {
      sourceType: "RECOMMANDATION",
      sourceLabel: `${t.recommandation.code} — ${t.recommandation.titre}`,
      sourceHref: `/missions`,
    };
  }
  return { sourceType: null, sourceLabel: null, sourceHref: null };
}

export default async function TachesInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string; filtre?: string }>;
}) {
  const sp = await searchParams;
  await getCurrentUser();
  // Inventaire transversal : toutes les tâches, indépendamment de l’objet
  // d’origine. Le Dashboard reste la vue personnelle ; ici on filtre.
  const [taches, unites] = await Promise.all([
    prisma.tache.findMany({
      include: {
        responsable: { select: { id: true, nom: true, prenom: true } },
        unite: { select: { id: true, nom: true, code: true } },
        projet: { select: { id: true, nom: true, code: true } },
        conseil: { select: { id: true, objet: true, code: true } },
        controleSCI: { select: { id: true, nom: true, code: true } },
        mission: { select: { id: true, titre: true, code: true } },
        document: { select: { id: true, nom: true, code: true } },
        recommandation: { select: { id: true, titre: true, code: true } },
      },
      orderBy: [{ dateEcheance: "asc" }, { titre: "asc" }],
    }),
    prisma.unite.findMany({
      where: { actif: true },
      orderBy: { code: "asc" },
      select: { id: true, nom: true, code: true },
    }),
  ]);

  const items: TacheInventoryItem[] = taches.map((t) => {
    const clos = (TACHE_STATUTS_CLOS as readonly string[]).includes(t.statut);
    const estOuverte = !clos;
    const estTerminee = t.statut === "TERMINE";
    const urgence = urgenceEcheance(t.dateEcheance, clos);
    const estRetard = urgence === "retard" && estOuverte;
    const source = sourceOf(t);
    return {
      id: t.id,
      titre: t.titre,
      statut: t.statut,
      statutLabel: STATUT_TACHE_LABELS[t.statut] ?? t.statut,
      priorite: t.priorite,
      prioriteLabel: PRIORITE_LABELS[t.priorite] ?? t.priorite,
      categorie: t.categorie,
      categorieLabel: CATEGORIE_TACHE_LABELS[t.categorie] ?? t.categorie,
      responsableId: t.responsableId,
      responsableNom: formatUtilisateurNom(t.responsable),
      uniteId: t.uniteId,
      uniteNom: `${t.unite.code} — ${t.unite.nom}`,
      dateEcheance: t.dateEcheance?.toISOString() ?? null,
      urgence,
      estOuverte,
      estTerminee,
      estRetard,
      ...source,
    };
  });

  const ouvertes = items.filter((t) => t.estOuverte).length;
  const enRetard = items.filter((t) => t.estRetard).length;
  const terminees = items.filter((t) => t.estTerminee).length;

  const responsables = Array.from(
    new Map(
      items.map((t) => [
        t.responsableId,
        { id: t.responsableId, nom: t.responsableNom },
      ]),
    ).values(),
  );

  const initialQuick =
    sp.filtre === "retard"
      ? "retard"
      : sp.filtre === "terminees"
        ? "terminees"
        : undefined;

  return (
    <>
      <PageHeader
        title="Tâches"
        description="Inventaire transversal — le Dashboard reste la vue personnelle du quotidien."
        help={<ModuleHelp {...MODULE_HELP.taches} />}
        actions={<BtnLink href="/taches/nouvelle">Nouvelle tâche</BtnLink>}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone
        items={[
          { value: items.length, label: "total" },
          { value: ouvertes, label: "ouvertes", tone: "ok" },
          { value: terminees, label: "terminées" },
          {
            value: enRetard,
            label: "à traiter",
            tone: enRetard > 0 ? "danger" : "default",
            href: enRetard > 0 ? "?filtre=retard#inventaire" : undefined,
          },
        ]}
      />

      <TacheInventory
        items={items}
        responsables={responsables}
        unites={unites.map((u) => ({
          id: u.id,
          nom: `${u.code} — ${u.nom}`,
        }))}
        initialQuick={initialQuick}
      />
    </>
  );
}
