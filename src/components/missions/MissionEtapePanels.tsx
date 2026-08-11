import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { formatDate, STATUT_RECO_LABELS } from "@/lib/labels";
import { RECO_STATUTS_CLOS } from "@/lib/mission-etapes";

/** Substantif — structure souple (papiers de travail / constats à venir). */
export function MissionSubstantifPanel() {
  return (
    <>
      <p className="muted" style={{ marginTop: 0 }}>
        Logique cible : travail effectué → éléments examinés → analyse →
        conclusion → constat éventuel. Contenu méthodologique à construire
        progressivement.
      </p>

      <CollapsibleSection title="Papiers / dossiers de travail" defaultOpen>
        <p className="empty">
          Aucun papier de travail pour l’instant. Les dossiers structurés
          (entretiens, tests, revue documentaire…) seront ajoutés ici.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Constats" defaultOpen>
        <p className="muted" style={{ marginTop: 0 }}>
          Un constat peut exister sans recommandation associée.
        </p>
        <p className="empty">Aucun constat documenté.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Périmètre couvert" defaultOpen={false}>
        <p className="empty">
          Processus / unités / échantillon — à préciser avec la méthodologie.
        </p>
      </CollapsibleSection>
    </>
  );
}

/** Rapport — blocs typés (prépare un futur draft, sans génération IA). */
export function MissionRapportPanel() {
  return (
    <>
      <p className="muted" style={{ marginTop: 0 }}>
        Structure en blocs pour préparer une future génération de draft.
        Lecture seule par défaut ; contenu à enrichir progressivement.
      </p>

      {(
        [
          "Introduction / contexte",
          "Périmètre",
          "Synthèse",
          "Constats",
          "Recommandations",
          "Annexes",
        ] as const
      ).map((title) => (
        <CollapsibleSection key={title} title={title} defaultOpen={false}>
          <p className="empty">Bloc non renseigné.</p>
        </CollapsibleSection>
      ))}
    </>
  );
}

type RecoSuivi = {
  id: string;
  code: string;
  titre: string;
  statut: string;
  dateEcheance: Date | null;
  responsable: { nom: string } | null;
};

/** Suivi — % objectivement calculable sur les recommandations. */
export function MissionSuiviPanel({
  recommandations,
  metricLabel,
}: {
  recommandations: RecoSuivi[];
  metricLabel: string | null;
}) {
  const ouvertes = recommandations.filter(
    (r) => !RECO_STATUTS_CLOS.has(r.statut),
  ).length;

  return (
    <>
      <p className="muted" style={{ marginTop: 0 }}>
        Le suivi des recommandations est indépendant de la clôture de la
        mission (une mission peut être clôturée sans que toutes les recos le
        soient).
      </p>
      {metricLabel ? (
        <p className="mission-suivi-metric">
          Avancement : <strong>{metricLabel}</strong>
          {ouvertes > 0 ? ` · ${ouvertes} encore ouverte${ouvertes > 1 ? "s" : ""}` : ""}
        </p>
      ) : null}

      {recommandations.length === 0 ? (
        <p className="empty">Aucune recommandation à suivre.</p>
      ) : (
        <div className="mission-suivi-table">
          <div className="mission-suivi-table__head" role="row">
            <span>Code</span>
            <span>Titre</span>
            <span>Responsable</span>
            <span>Échéance</span>
            <span>Statut</span>
          </div>
          <ul className="mission-suivi-table__list">
            {recommandations.map((r) => (
              <li key={r.id} className="mission-suivi-table__row">
                <span className="inventory-cell__value--code">{r.code}</span>
                <span>{r.titre}</span>
                <span>{r.responsable?.nom ?? "—"}</span>
                <span>{formatDate(r.dateEcheance)}</span>
                <span>{STATUT_RECO_LABELS[r.statut] ?? r.statut}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
