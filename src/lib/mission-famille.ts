/**
 * Familles UX de missions — un seul moteur Mission, deux vues.
 * Audits = types AUDIT_* ; Revues = REVUE_PROCESSUS (+ futurs codes REVUE_*).
 */
export type MissionFamille = "toutes" | "audits" | "revues";

export function parseMissionFamille(
  raw: string | null | undefined,
): MissionFamille {
  if (raw === "audits" || raw === "revues") return raw;
  return "toutes";
}

export function missionTypeIsAudit(typeCode: string): boolean {
  return typeCode.startsWith("AUDIT_");
}

export function missionTypeIsRevue(typeCode: string): boolean {
  return typeCode.startsWith("REVUE_");
}

export function matchesMissionFamille(
  typeCode: string,
  famille: MissionFamille,
): boolean {
  if (famille === "toutes") return true;
  if (famille === "audits") return missionTypeIsAudit(typeCode);
  return missionTypeIsRevue(typeCode);
}
