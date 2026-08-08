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
    </>
  );

  return (
    <CollapsibleSection
      title={title}
      defaultOpen={open}
      badge={headerBadge}
      className={editing ? "collapsible-section--editing" : undefined}
    >
      {canEdit && !edit ? (
        <p style={{ marginTop: 0, marginBottom: "0.85rem" }}>
          <Link href={`${baseHref}?edit=${sectionKey}`}>Modifier</Link>
        </p>
      ) : null}

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
    <div className="form-actions">
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
