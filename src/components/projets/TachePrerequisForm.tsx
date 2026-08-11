import { SubmitButton } from "@/components/FormControls";
import { setTachePrerequisAction } from "@/app/projets/actions";

/**
 * Choix du prérequis (0 ou 1 pour rester simple) — multi-prérequis via
 * sélection multiple possible plus tard.
 */
export function TachePrerequisForm({
  projetId,
  tacheId,
  currentPrerequisIds,
  candidats,
}: {
  projetId: string;
  tacheId: string;
  currentPrerequisIds: string[];
  candidats: { id: string; titre: string }[];
}) {
  const current = currentPrerequisIds[0] ?? "";
  return (
    <form action={setTachePrerequisAction} className="projet-tache-prerequis">
      <input type="hidden" name="projetId" value={projetId} />
      <input type="hidden" name="tacheId" value={tacheId} />
      <label className="sr-only" htmlFor={`prerequis-${tacheId}`}>
        Prérequis
      </label>
      <select
        id={`prerequis-${tacheId}`}
        name="prerequisIds"
        defaultValue={current}
      >
        <option value="">Aucun prérequis</option>
        {candidats
          .filter((c) => c.id !== tacheId)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.titre}
            </option>
          ))}
      </select>
      <SubmitButton variant="ghost">OK</SubmitButton>
    </form>
  );
}
