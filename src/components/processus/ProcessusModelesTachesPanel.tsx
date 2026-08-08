import Link from "next/link";
import { SubmitButton } from "@/components/FormControls";
import { createTacheDepuisModele } from "@/app/modeles-taches/actions";

export type ProcessusModeleTacheItem = {
  id: string;
  code: string;
  nom: string;
  actif: boolean;
  delaiJours: number | null;
  etapesCount: number;
};

export function ProcessusModelesTachesPanel({
  modeles,
}: {
  modeles: ProcessusModeleTacheItem[];
}) {
  if (modeles.length === 0) {
    return (
      <p className="empty">
        Aucun modèle lié. Associez-en depuis la fiche d&apos;un{" "}
        <Link href="/modeles-taches">modèle de tâche</Link>.
      </p>
    );
  }

  return (
    <div className="processus-modeles">
      <p className="muted" style={{ marginTop: 0 }}>
        Modèles applicables à ce processus. Créer une tâche copie la checklist
        du modèle (sans synchronisation ultérieure).
      </p>
      <ul className="processus-modeles__list">
        {modeles.map((m) => (
          <li key={m.id} className="processus-modeles__row">
            <div>
              <Link href={`/modeles-taches/${m.id}`}>
                <strong>
                  {m.code} — {m.nom}
                </strong>
              </Link>
              <span className="muted">
                {" "}
                · {m.etapesCount} étape{m.etapesCount === 1 ? "" : "s"}
                {m.delaiJours != null ? ` · délai ${m.delaiJours} j` : ""}
                {!m.actif ? " · inactif" : ""}
              </span>
            </div>
            {m.actif ? (
              <form action={createTacheDepuisModele}>
                <input type="hidden" name="modeleTacheId" value={m.id} />
                <SubmitButton variant="ghost">Créer une tâche</SubmitButton>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
