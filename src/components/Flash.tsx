import Link from "next/link";

export function FlashBanner({
  ok,
  erreur,
}: {
  ok?: string;
  erreur?: string;
}) {
  if (!ok && !erreur) return null;

  if (erreur) {
    return (
      <div className="flash flash--error" role="alert">
        {erreur}
      </div>
    );
  }

  const messages: Record<string, string> = {
    "1": "Enregistrement effectué.",
    cree: "Élément créé.",
    modifie: "Modifications enregistrées.",
    archive: "Élément archivé.",
    desarchive: "Élément désarchivé.",
    supprime: "Suppression effectuée.",
    statut: "Statut mis à jour.",
    priorite: "Priorité mise à jour.",
    responsable: "Responsable mis à jour.",
    realise: "Réalisation enregistrée.",
    lien: "Lien enregistré.",
    lien_ajoute: "Élément associé.",
    lien_supprime: "Lien retiré.",
    preuve: "Preuve ajoutée.",
    reco: "Recommandation créée.",
    tache: "Tâche créée.",
    note: "Note enregistrée.",
    journal: "Entrée ajoutée au journal de bord.",
    reouvert: "Conseil rouvert.",
    brouillon: "Brouillon enregistré.",
    etape: "Étape mise à jour.",
    equipe: "Équipe mise à jour.",
    checklist: "Checklist mise à jour.",
    desactive: "Élément désactivé.",
    active: "Élément réactivé.",
    dependance: "Prérequis de tâche mis à jour.",
    reevaluation: "Réévaluation documentée.",
    continuite: "Analyse de continuité enregistrée.",
    qualite: "Paramètres qualité enregistrés.",
    revue: "Revue qualité enregistrée.",
    ecart: "Écart qualité ajouté.",
  };

  return (
    <div className="flash flash--ok" role="status">
      {messages[ok ?? "1"] ?? "Enregistrement effectué."}
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <p className="back-link">
      <Link href={href}>{label}</Link>
    </p>
  );
}
