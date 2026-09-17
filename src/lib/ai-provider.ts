/**
 * Abstraction IA future — DISABLED par défaut.
 * L’IA propose ; l’utilisateur valide / modifie / refuse.
 * Aucune création silencieuse d’objets métier.
 */

export type AiProviderMode = "DISABLED" | "LOCAL" | "EXTERNAL";

export type AiProposal<T = string> = {
  kind: string;
  content: T;
  disclaimer: string;
};

export function getAiProviderMode(): AiProviderMode {
  const raw = (process.env.AI_PROVIDER ?? "DISABLED").toUpperCase();
  if (raw === "LOCAL" || raw === "EXTERNAL") return raw;
  return "DISABLED";
}

export function isAiEnabled(): boolean {
  return getAiProviderMode() !== "DISABLED";
}

/**
 * Stub — retourne null tant que le provider est DISABLED.
 * Les parcours Guide / questionnaires restent opérationnels sans IA.
 */
export async function aiPropose(
  _prompt: string,
): Promise<AiProposal | null> {
  if (!isAiEnabled()) return null;
  return {
    kind: "stub",
    content:
      "Provider IA non branché — configurez AI_PROVIDER=LOCAL|EXTERNAL.",
    disclaimer: "Proposition uniquement — validation humaine obligatoire.",
  };
}
