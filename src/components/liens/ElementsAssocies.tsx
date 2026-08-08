import Link from "next/link";
import { deleteLienObjet } from "@/app/liens/actions";
import { AssocierObjetForm } from "@/components/liens/AssocierObjetForm";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import {
  TYPE_OBJET_LABELS,
  listCandidatsLien,
  listLiensFor,
  type LienVue,
} from "@/lib/liens";
import type { TypeObjetMetier } from "@/generated/prisma/client";

const LINKABLE: TypeObjetMetier[] = [
  "PROCESSUS",
  "PROJET",
  "CONSEIL",
  "MISSION",
  "RISQUE",
  "CONTROLE_SCI",
  "DOCUMENT",
  "TACHE",
];

/**
 * Section Éléments associés.
 * Consultation : liste navigable uniquement.
 * Édition : associer / retirer (page Modifier).
 */
export async function ElementsAssocies({
  uniteId,
  type,
  id,
  retour,
  editable = false,
}: {
  uniteId: string;
  type: TypeObjetMetier;
  id: string;
  retour: string;
  /** false = mode consultation (défaut) */
  editable?: boolean;
}) {
  const liens = await listLiensFor(uniteId, type, id);
  const otherTypes = LINKABLE.filter((t) => t !== type);

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

  return (
    <CollapsibleSection
      title="Éléments associés"
      defaultOpen={editable || liens.length > 0}
      badge={`${liens.length}`}
      className="elements-associes"
    >
      <p className="muted" style={{ marginTop: 0 }}>
        {editable
          ? "Liez librement cet objet à d’autres objets métier."
          : "Navigation croisée — pour modifier les liens, utilisez Modifier."}
      </p>

      {liens.length === 0 ? (
        <p className="empty">Aucun élément associé pour le moment.</p>
      ) : (
        <ul className="elements-associes__list">
          {liens.map((lien) => (
            <LienRow
              key={lien.lienId}
              lien={lien}
              retour={retour}
              editable={editable}
            />
          ))}
        </ul>
      )}

      {editable ? (
        <AssocierObjetForm
          retour={retour}
          typeSource={type}
          idSource={id}
          otherTypes={otherTypes}
          candidatsParType={candidatsParType}
        />
      ) : null}
    </CollapsibleSection>
  );
}

function LienRow({
  lien,
  retour,
  editable,
}: {
  lien: LienVue;
  retour: string;
  editable: boolean;
}) {
  return (
    <li className="elements-associes__row">
      <Link href={lien.autre.href} className="elements-associes__link">
        <span className="inventory-cell__value--code">{lien.autre.code}</span>
        <span className="elements-associes__title">{lien.autre.titre}</span>
        <span className="muted">{TYPE_OBJET_LABELS[lien.autre.type]}</span>
        {lien.libelle ? <span className="muted">{lien.libelle}</span> : null}
      </Link>
      {editable ? (
        <form action={deleteLienObjet}>
          <input type="hidden" name="retour" value={retour} />
          <input type="hidden" name="id" value={lien.lienId} />
          <button type="submit" className="btn btn--ghost">
            Retirer
          </button>
        </form>
      ) : null}
    </li>
  );
}
