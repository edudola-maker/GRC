import { AssocierObjetForm } from "@/components/liens/AssocierObjetForm";
import {
  ElementsAssociesList,
  type ElementAssocieItem,
} from "@/components/liens/ElementsAssociesList";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import {
  TYPE_OBJET_LABELS,
  listCandidatsLien,
  listLiensFor,
} from "@/lib/liens";
import type { TypeObjetMetier } from "@/generated/prisma/client";

const LINKABLE: TypeObjetMetier[] = [
  "PROCESSUS",
  "PROCESSUS_ETAPE",
  "MACROPROCESSUS",
  "PROJET",
  "CONSEIL",
  "MISSION",
  "RISQUE",
  "CONTROLE_SCI",
  "DOCUMENT",
  "TACHE",
  "OBJECTIF",
  "MODELE_TACHE",
  "ACTIF_IT",
  "UNITE",
];

/**
 * Section Éléments associés unifiée (type · code · nom).
 * Consultation : liste + filtre par type.
 * Édition : uniquement quand `editable` (mode Modifier de la box).
 */
export async function ElementsAssocies({
  uniteId,
  type,
  id,
  retour,
  editable = false,
  /** Éléments « owned » (ex. tâches du projet) fusionnés dans la même liste. */
  ownedItems = [],
  wrapInSection = true,
  redactionBadge,
}: {
  uniteId: string;
  type: TypeObjetMetier;
  id: string;
  retour: string;
  editable?: boolean;
  ownedItems?: ElementAssocieItem[];
  /** false = contenu seul (déjà dans EditableSection). */
  wrapInSection?: boolean;
  redactionBadge?: string | null;
}) {
  const liens = await listLiensFor(uniteId, type, id);
  const otherTypes = LINKABLE.filter((t) => t !== type);

  const fromLiens: ElementAssocieItem[] = liens.map((lien) => ({
    key: `lien-${lien.lienId}`,
    type: lien.autre.type,
    code: lien.autre.code,
    titre: lien.autre.titre,
    href: lien.autre.href,
    libelle: lien.libelle,
    lienId: lien.lienId,
  }));

  // Owned d’abord (ex. tâches du projet), puis liens — dédup par type+href.
  const seen = new Set<string>();
  const items: ElementAssocieItem[] = [];
  for (const item of [...ownedItems, ...fromLiens]) {
    const sig = `${item.type}:${item.href}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    items.push(item);
  }

  const candidatsParType: Record<string, Array<{ id: string; label: string }>> =
    {};
  if (editable) {
    await Promise.all(
      otherTypes.map(async (t) => {
        candidatsParType[t] = await listCandidatsLien(
          uniteId,
          t,
          type === t ? id : undefined,
        );
      }),
    );
  }

  const body = (
    <>
      <p className="muted" style={{ marginTop: 0 }}>
        {editable
          ? "Liez librement cet objet à d’autres objets métier (y compris une étape de processus)."
          : "Relations libres — type, code et nom. Passez en Modifier pour associer ou retirer."}
      </p>

      <ElementsAssociesList
        items={items}
        retour={retour}
        editable={editable}
      />

      {editable ? (
        <AssocierObjetForm
          retour={retour}
          typeSource={type}
          idSource={id}
          otherTypes={otherTypes}
          candidatsParType={candidatsParType}
        />
      ) : null}
    </>
  );

  if (!wrapInSection) return body;

  const badgeParts = [`${items.length}`];
  if (redactionBadge) badgeParts.push(redactionBadge);

  return (
    <CollapsibleSection
      title="Éléments associés"
      defaultOpen={editable || items.length > 0}
      badge={badgeParts.join(" · ")}
      className="elements-associes"
    >
      {body}
    </CollapsibleSection>
  );
}

export { TYPE_OBJET_LABELS };
export type { ElementAssocieItem };
