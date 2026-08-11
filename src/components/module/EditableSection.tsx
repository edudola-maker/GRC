import Link from "next/link";
import type { ReactNode } from "react";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { BtnLink } from "@/components/ui";
import { SubmitButton } from "@/components/FormControls";
import {
  formatSectionEtatLabel,
  type SectionRedactionVue,
} from "@/lib/section-redaction";

/**
 * Grande box : repliable, lecture seule par défaut, édition indépendante.
 * Le bouton Modifier reste dans l’en-tête (visible même box repliée).
 * Pattern : Lecture seule → Modifier (?edit=KEY) → Brouillon / Finaliser / Annuler.
 */
export function EditableSection({
  title,
  sectionKey,
  baseHref,
  edit,
  canEdit,
  redaction,
  defaultOpen = true,
  badge,
  children,
  editChildren,
  modifyLabel = "Modifier",
}: {
  title: string;
  sectionKey: string;
  baseHref: string;
  edit: string | null;
  canEdit: boolean;
  redaction?: SectionRedactionVue;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
  editChildren?: ReactNode;
  modifyLabel?: string;
}) {
  const editing = edit === sectionKey;
  const etatLabel = formatSectionEtatLabel(redaction);
  const open = editing || defaultOpen;

  const headerBadge = (
    <>
      {badge != null && badge !== "" ? badge : null}
      {etatLabel ? (
        <span className="section-etat-badge" title={etatLabel}>
          {etatLabel}
        </span>
      ) : null}
      {editing ? (
        <span className="section-etat-badge section-etat-badge--editing">
          En édition
        </span>
      ) : null}
    </>
  );

  // Ancre = sectionKey : évite le saut en haut de page au clic Modifier.
  const sectionId = sectionKey;
  const editHref = `${baseHref}?edit=${sectionKey}#${sectionId}`;

  const headerActions =
    canEdit && !edit ? (
      <Link
        href={editHref}
        className="btn btn--ghost collapsible-section__modify"
        scroll={false}
      >
        {modifyLabel}
      </Link>
    ) : null;

  return (
    <CollapsibleSection
      id={sectionId}
      title={title}
      defaultOpen={open}
      badge={headerBadge}
      className={editing ? "collapsible-section--editing" : undefined}
      headerActions={headerActions}
    >
      {editing && canEdit ? (editChildren ?? children) : children}
    </CollapsibleSection>
  );
}

/** Boutons Enregistrer comme brouillon / Finaliser / Annuler (dans un <form>). */
export function SectionSaveActions({
  cancelHref,
  draftLabel = "Enregistrer comme brouillon",
  finalizeLabel = "Finaliser",
}: {
  cancelHref: string;
  draftLabel?: string;
  finalizeLabel?: string;
}) {
  return (
    <div className="form-actions section-save-actions">
      <SubmitButton name="intent" value="brouillon" variant="ghost">
        {draftLabel}
      </SubmitButton>
      <SubmitButton name="intent" value="finaliser">{finalizeLabel}</SubmitButton>
      <BtnLink href={cancelHref} variant="ghost">
        Annuler
      </BtnLink>
    </div>
  );
}
