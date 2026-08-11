import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { KpiZone } from "@/components/module/KpiZone";
import {
  MissionInventory,
  type MissionInventoryItem,
} from "@/components/missions/MissionInventory";
import { MODULE_HELP } from "@/lib/catalog";
import {
  STATUT_MISSION_LABELS,
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import {
  matchesMissionFamille,
  parseMissionFamille,
} from "@/lib/mission-famille";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const MISSION_STATUTS_CLOS = ["TERMINE", "ANNULE"] as const;

export default async function AuditsPage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    erreur?: string;
    filtre?: string;
    famille?: string;
  }>;
}) {
  const sp = await searchParams;
  const famille = parseMissionFamille(sp.famille);
  const today = startOfToday();
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [missionsRaw, planifies, enCours, termines, recoOuvertes, recoCloturees] =
    await Promise.all([
      prisma.mission.findMany({
        where: { uniteId },
        include: {
          responsable: true,
          type: true,
          _count: {
            select: { taches: true, recommandations: true },
          },
        },
        orderBy: [{ dateDebut: "desc" }, { titre: "asc" }],
      }),
      prisma.mission.count({
        where: { uniteId, archive: false, statut: "PLANIFIE" },
      }),
      prisma.mission.count({
        where: {
          uniteId,
          archive: false,
          statut: { in: ["EN_COURS", "EN_REVUE"] },
        },
      }),
      prisma.mission.count({
        where: { uniteId, archive: false, statut: "TERMINE" },
      }),
      prisma.recommandation.count({
        where: {
          archive: false,
          statut: { in: ["OUVERTE", "EN_COURS"] },
          mission: { uniteId, archive: false },
        },
      }),
      prisma.recommandation.count({
        where: {
          archive: false,
          statut: "CLOTUREE",
          mission: { uniteId, archive: false },
        },
      }),
    ]);

  const missions = missionsRaw.filter((m) =>
    matchesMissionFamille(m.type.code, famille),
  );

  const items: MissionInventoryItem[] = missions.map((a) => {
    const clos = (MISSION_STATUTS_CLOS as readonly string[]).includes(a.statut);
    const estActif = !clos && !a.archive;
    const estRetard = Boolean(estActif && a.dateFin && a.dateFin < today);
    return {
      id: a.id,
      code: a.code,
      titre: a.titre,
      typeLabel: a.type.libelle,
      statut: a.statut,
      statutLabel: STATUT_MISSION_LABELS[a.statut] ?? a.statut,
      responsableId: a.responsableId,
      responsableNom: a.responsable.nom,
      tags: a.tags,
      dateDebut: a.dateDebut?.toISOString() ?? null,
      dateFin: a.dateFin?.toISOString() ?? null,
      nbReco: a._count.recommandations,
      nbTaches: a._count.taches,
      archive: a.archive,
      urgence: urgenceEcheance(a.dateFin, clos || a.archive),
      estActif,
      estRetard,
    };
  });

  const enRetard = items.filter((a) => a.estRetard && !a.archive).length;
  const responsables = Array.from(
    new Map(
      items.map((a) => [
        a.responsableId,
        { id: a.responsableId, nom: a.responsableNom },
      ]),
    ).values(),
  );

  const initialQuick = sp.filtre === "retard" ? "retard" : undefined;
  const familleQs = (f: string) =>
    f === "toutes" ? "/missions" : `/missions?famille=${f}`;

  const title =
    famille === "audits"
      ? "Audits"
      : famille === "revues"
        ? "Revues de processus"
        : "Missions d'assurance";

  return (
    <>
      <PageHeader
        title={title}
        description="Un seul moteur Mission — vues séparées Audits / Revues de processus."
        help={<ModuleHelp {...MODULE_HELP.audits} />}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <nav className="mission-famille-tabs" aria-label="Famille de missions">
        {(
          [
            ["toutes", "Toutes"],
            ["audits", "Audits"],
            ["revues", "Revues de processus"],
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={familleQs(key)}
            className={`chip chip--button${famille === key ? " is-active" : ""}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <KpiZone
        items={[
          { value: planifies, label: "planifiés" },
          { value: enCours, label: "en cours" },
          { value: termines, label: "terminés" },
          { value: recoOuvertes, label: "reco ouvertes" },
          { value: recoCloturees, label: "reco clôturées", tone: "ok" },
          {
            value: enRetard,
            label: "à traiter",
            tone: enRetard > 0 ? "danger" : "default",
            href:
              enRetard > 0
                ? `${familleQs(famille)}${famille === "toutes" ? "?" : "&"}filtre=retard#inventaire`
                : undefined,
          },
        ]}
      />

      <MissionInventory
        items={items}
        responsables={responsables}
        initialQuick={initialQuick}
        createHref="/missions/nouveau"
        createLabel="Nouvelle mission"
      />
    </>
  );
}
