import type { ReactNode } from "react";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";

/**
 * Bloc thématique d’un formulaire d’édition unique.
 * Organisation visuelle uniquement — un seul Enregistrer / Annuler pour la fiche.
 * Repliable via le composant transversal CollapsibleSection.
 */
export function FormSection({
  title,
  description,
  children,
  defaultOpen = true,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <CollapsibleSection
      title={title}
      defaultOpen={defaultOpen}
      className="form-section collapsible-section--form"
    >
      {description ? (
        <p className="form-section__desc muted">{description}</p>
      ) : null}
      <div className="form-section__body">{children}</div>
    </CollapsibleSection>
  );
}
