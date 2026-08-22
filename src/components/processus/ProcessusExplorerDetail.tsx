import Link from "next/link";
import {
  NIVEAU_CONFIDENTIALITE_LABELS,
  STATUT_PROCESSUS_LABELS,
  formatDate,
} from "@/lib/labels";

export type ProcessusPreviewData = {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  statut: string;
  criticite: number | null;
  reference: string | null;
  responsableNom: string;
  uniteNom: string;
  macroNom: string | null;
  etapesCount: number;
  risquesCount: number;
  controlesCount: number;
  actifsCount: number;
  aRaci: boolean;
  aContinuite: boolean;
  contientDonneesPersonnelles: boolean;
  niveauConfidentialite: string;
  modifieLe: Date;
};

/** Fiche synthèse Processus pour le panneau droit (lecture épurée). */
export function ProcessusExplorerDetail({
  processus,
}: {
  processus: ProcessusPreviewData;
}) {
  const couverture = [
    { label: "Procédure", ok: Boolean(processus.reference) },
    { label: "RACI", ok: processus.aRaci },
    { label: "Risques", ok: processus.risquesCount > 0, warn: processus.risquesCount === 0 },
    {
      label: "Contrôles",
      ok: processus.controlesCount > 0,
      warn: processus.controlesCount === 0,
    },
    { label: "Actifs", ok: processus.actifsCount > 0 },
    { label: "Continuité", ok: processus.aContinuite, warn: !processus.aContinuite },
  ];

  return (
    <div className="processus-preview">
      <header className="processus-preview__header">
        <div>
          <p className="muted" style={{ margin: 0 }}>
            {processus.code}
            {processus.macroNom ? ` · ${processus.macroNom}` : ""}
          </p>
          <h2 className="processus-preview__title">{processus.nom}</h2>
        </div>
        <Link
          href={`/processus/${processus.id}`}
          className="btn btn--primary"
        >
          Ouvrir la fiche
        </Link>
      </header>

      <dl className="kv processus-preview__kv">
        <div>
          <dt>Statut</dt>
          <dd>{STATUT_PROCESSUS_LABELS[processus.statut] ?? processus.statut}</dd>
        </div>
        <div>
          <dt>Responsable</dt>
          <dd>{processus.responsableNom}</dd>
        </div>
        <div>
          <dt>Unité</dt>
          <dd>{processus.uniteNom}</dd>
        </div>
        <div>
          <dt>Criticité</dt>
          <dd>
            {processus.criticite != null ? `${processus.criticite} / 5` : "—"}
          </dd>
        </div>
      </dl>

      {processus.description ? (
        <p className="processus-preview__desc">{processus.description}</p>
      ) : (
        <p className="muted">Aucune présentation renseignée.</p>
      )}

      <div className="processus-preview__cover" aria-label="Couverture gouvernance">
        {couverture.map((c) => (
          <span
            key={c.label}
            className={`processus-preview__chip${c.ok ? " is-ok" : c.warn ? " is-warn" : ""}`}
          >
            <span aria-hidden>{c.ok ? "✓" : "○"}</span> {c.label}
          </span>
        ))}
      </div>

      <div className="processus-preview__stats">
        <div>
          <strong>{processus.etapesCount}</strong>
          <span>étapes</span>
        </div>
        <div>
          <strong>{processus.risquesCount}</strong>
          <span>risques</span>
        </div>
        <div>
          <strong>{processus.controlesCount}</strong>
          <span>contrôles</span>
        </div>
        <div>
          <strong>{processus.actifsCount}</strong>
          <span>actifs</span>
        </div>
      </div>

      <dl className="kv">
        <div>
          <dt>Protection des données</dt>
          <dd>
            {processus.contientDonneesPersonnelles
              ? `Oui · ${NIVEAU_CONFIDENTIALITE_LABELS[processus.niveauConfidentialite] ?? processus.niveauConfidentialite}`
              : "Non déclaré"}
          </dd>
        </div>
        <div>
          <dt>Dernière modification</dt>
          <dd>{formatDate(processus.modifieLe)}</dd>
        </div>
        <div>
          <dt>Documentation</dt>
          <dd>
            {processus.reference ? (
              /^https?:\/\//i.test(processus.reference) ? (
                <a href={processus.reference} target="_blank" rel="noreferrer">
                  Lien Confluence
                </a>
              ) : (
                processus.reference
              )
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
