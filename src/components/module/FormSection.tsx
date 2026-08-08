import type { ReactNode } from "react";

/**
 * Bloc thématique d’un formulaire d’édition unique.
 * Organisation visuelle uniquement — un seul Enregistrer / Annuler pour la fiche.
 */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="form-section">
      <header className="form-section__head">
        <h3 className="form-section__title">{title}</h3>
        {description ? (
          <p className="form-section__desc muted">{description}</p>
        ) : null}
      </header>
      <div className="form-section__body">{children}</div>
    </section>
  );
}
