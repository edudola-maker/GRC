import { startOfToday } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";

export type AFaireItem = {
  id: string;
  priorite: "haute" | "moyenne" | "basse";
  titre: string;
  detail: string;
  href: string;
};

function joursDepuis(d: Date, today: Date): number {
  const a = new Date(d);
  a.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - a.getTime()) / 86_400_000);
}

/** Recommandations déterministes pour le dashboard collaborateur. */
export async function aFaireMaintenantCollaborateur(
  utilisateurId: string,
): Promise<AFaireItem[]> {
  const today = startOfToday();
  const items: AFaireItem[] = [];

  const taches = await prisma.tache.findMany({
    where: {
      responsableId: utilisateurId,
      statut: { notIn: [...TACHE_STATUTS_CLOS] },
    },
    select: {
      id: true,
      titre: true,
      dateEcheance: true,
      projet: { select: { id: true, code: true, nom: true } },
    },
    orderBy: [{ dateEcheance: "asc" }],
    take: 40,
  });

  const retards = taches.filter(
    (t) => t.dateEcheance && t.dateEcheance < today,
  );
  if (retards.length > 0) {
    const first = retards[0]!;
    items.push({
      id: `retard-${first.id}`,
      priorite: "haute",
      titre: `${retards.length} tâche(s) en retard`,
      detail: `Prochaine : ${first.titre}`,
      href: `/taches/${first.id}`,
    });
  }

  const aujourdhui = taches.filter((t) => {
    if (!t.dateEcheance) return false;
    const d = new Date(t.dateEcheance);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  if (aujourdhui.length > 0) {
    items.push({
      id: `today-${aujourdhui[0]!.id}`,
      priorite: "haute",
      titre: `${aujourdhui.length} échéance(s) aujourd’hui`,
      detail: aujourdhui[0]!.titre,
      href: `/taches/${aujourdhui[0]!.id}`,
    });
  }

  const prochaines = taches.filter(
    (t) => t.dateEcheance && t.dateEcheance > today,
  );
  if (prochaines.length > 0 && items.length < 4) {
    const p = prochaines[0]!;
    const j = -joursDepuis(p.dateEcheance!, today);
    items.push({
      id: `next-${p.id}`,
      priorite: "moyenne",
      titre: "Prochaine échéance",
      detail: `${p.titre} · dans ${j} j.`,
      href: `/taches/${p.id}`,
    });
  }

  const projets = await prisma.projet.findMany({
    where: {
      archive: false,
      statut: { notIn: ["CLOTURE", "ABANDONNE"] },
      OR: [
        { responsableId: utilisateurId },
        { membres: { some: { utilisateurId } } },
      ],
    },
    select: {
      id: true,
      code: true,
      nom: true,
      avancement: true,
      dateEcheance: true,
    },
    orderBy: { modifieLe: "desc" },
    take: 8,
  });

  const projetFaible = projets.find((p) => p.avancement < 40);
  if (projetFaible && items.length < 5) {
    items.push({
      id: `proj-${projetFaible.id}`,
      priorite: "basse",
      titre: `Projet ${projetFaible.code} à ${projetFaible.avancement} %`,
      detail: projetFaible.nom,
      href: `/projets/${projetFaible.id}`,
    });
  }

  return items.slice(0, 5);
}

/** Recommandations légères sur fiche Projet. */
export async function aFaireMaintenantProjet(
  projetId: string,
): Promise<AFaireItem[]> {
  const today = startOfToday();
  const projet = await prisma.projet.findUnique({
    where: { id: projetId },
    select: {
      id: true,
      code: true,
      avancement: true,
      dateEcheance: true,
      etapes: { select: { libelle: true, avancement: true, poids: true } },
      taches: {
        where: { statut: { notIn: [...TACHE_STATUTS_CLOS] } },
        select: { id: true, titre: true, dateEcheance: true },
        orderBy: { dateEcheance: "asc" },
      },
    },
  });
  if (!projet) return [];

  const items: AFaireItem[] = [];

  items.push({
    id: "avancement",
    priorite: projet.avancement < 50 ? "moyenne" : "basse",
    titre: `Avancement étapes : ${projet.avancement} %`,
    detail:
      projet.etapes.length === 0
        ? "Aucune étape — initialisez le parcours"
        : `${projet.etapes.length} étape(s)`,
    href: `/projets/${projet.id}`,
  });

  const retards = projet.taches.filter(
    (t) => t.dateEcheance && t.dateEcheance < today,
  );
  if (retards.length > 0) {
    items.push({
      id: `t-retard-${retards[0]!.id}`,
      priorite: "haute",
      titre: `${retards.length} tâche(s) en retard`,
      detail: retards[0]!.titre,
      href: `/taches/${retards[0]!.id}`,
    });
  }

  if (projet.dateEcheance) {
    const j = -joursDepuis(projet.dateEcheance, today);
    items.push({
      id: "echeance-projet",
      priorite: j < 0 ? "haute" : j <= 14 ? "moyenne" : "basse",
      titre:
        j < 0
          ? `Échéance dépassée de ${-j} j.`
          : `Échéance dans ${j} j.`,
      detail: "Deadline métier du projet",
      href: `/projets/${projet.id}`,
    });
  }

  const etapeFaible = projet.etapes.find((e) => e.avancement < 100 && e.poids > 0);
  if (etapeFaible && items.length < 4) {
    items.push({
      id: "etape",
      priorite: "basse",
      titre: `Étape « ${etapeFaible.libelle} »`,
      detail: `${etapeFaible.avancement} %`,
      href: `/projets/${projet.id}`,
    });
  }

  return items.slice(0, 4);
}

/** Recommandations légères sur fiche Mission. */
export async function aFaireMaintenantMission(
  missionId: string,
): Promise<AFaireItem[]> {
  const today = startOfToday();
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      id: true,
      code: true,
      dateFin: true,
      statut: true,
      taches: {
        where: { statut: { notIn: [...TACHE_STATUTS_CLOS] } },
        select: { id: true, titre: true, dateEcheance: true },
        orderBy: { dateEcheance: "asc" },
        take: 20,
      },
    },
  });
  if (!mission) return [];

  const items: AFaireItem[] = [];

  const retards = mission.taches.filter(
    (t) => t.dateEcheance && t.dateEcheance < today,
  );
  if (retards.length > 0) {
    items.push({
      id: `m-retard-${retards[0]!.id}`,
      priorite: "haute",
      titre: `${retards.length} tâche(s) en retard`,
      detail: retards[0]!.titre,
      href: `/taches/${retards[0]!.id}`,
    });
  }

  if (mission.dateFin) {
    const j = -joursDepuis(mission.dateFin, today);
    items.push({
      id: "fin-mission",
      priorite: j < 0 ? "haute" : j <= 14 ? "moyenne" : "basse",
      titre:
        j < 0 ? `Fin prévue dépassée (${-j} j.)` : `Fin prévue dans ${j} j.`,
      detail: `Statut : ${mission.statut}`,
      href: `/missions/${mission.id}`,
    });
  }

  if (mission.taches.length > 0 && items.length < 3) {
    const t = mission.taches[0]!;
    items.push({
      id: `m-next-${t.id}`,
      priorite: "moyenne",
      titre: "Prochaine tâche ouverte",
      detail: t.titre,
      href: `/taches/${t.id}`,
    });
  }

  return items.slice(0, 4);
}
