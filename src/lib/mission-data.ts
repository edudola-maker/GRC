import { cache } from "react";
import { notFound } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { deriveInitiales } from "@/lib/initiales";
import {
  buildMissionEtapesVue,
  metricsFromMissionData,
  type MissionEtapeVue,
} from "@/lib/mission-etapes";
import { prisma } from "@/lib/prisma";
import { listSectionRedactions } from "@/lib/section-redaction";
import type { MissionEquipeMembre } from "@/components/missions/MissionEquipePanel";

const missionInclude = {
  responsable: true,
  type: true,
  template: true,
  descriptifPreset: true,
  unite: true,
  creePar: true,
  modifiePar: true,
  membres: {
    include: {
      utilisateur: true,
      roles: { include: { role: true } },
    },
    orderBy: { utilisateur: { nom: "asc" } },
  },
  checklistItems: { orderBy: { ordre: "asc" } },
  validationPoints: { orderBy: { code: "asc" } },
  recommandations: {
    where: { archive: false },
    include: { responsable: true },
    orderBy: [{ dateEcheance: "asc" }, { creeLe: "desc" }],
  },
  taches: {
    include: { responsable: true },
    orderBy: { dateEcheance: "asc" },
  },
  documents: {
    include: { document: true },
    orderBy: { creeLe: "desc" },
  },
  objectifsMission: { orderBy: { ordre: "asc" } },
  risquesMission: {
    include: { risque: { select: { id: true, code: true, nom: true } } },
    orderBy: { ordre: "asc" },
  },
  documentationDemandee: { orderBy: { ordre: "asc" } },
} satisfies Prisma.MissionInclude;

export type MissionDetail = Prisma.MissionGetPayload<{
  include: typeof missionInclude;
}>;

/** Charge une mission complète (cache React par requête). */
export const loadMissionDetail = cache(async (id: string) => {
  const mission = await prisma.mission.findUnique({
    where: { id },
    include: missionInclude,
  });
  if (!mission) return null;

  const redactions = await listSectionRedactions("MISSION", id);
  const etapes: MissionEtapeVue[] = buildMissionEtapesVue(
    id,
    redactions,
    metricsFromMissionData({
      checklistItems: mission.checklistItems,
      recommandations: mission.recommandations,
      redactions,
    }),
  );

  const equipe: MissionEquipeMembre[] = mission.membres.map((m) => ({
    id: m.id,
    utilisateurId: m.utilisateurId,
    nom: m.utilisateur.nom,
    initiales:
      m.utilisateur.initiales?.trim() || deriveInitiales(m.utilisateur.nom),
    roleIds: m.roles.map((r) => r.roleId),
    roleLabels: m.roles.map((r) => r.role.libelle),
  }));

  return { mission, redactions, etapes, equipe };
});

export async function requireMissionDetail(id: string) {
  const data = await loadMissionDetail(id);
  if (!data) notFound();
  return data;
}
