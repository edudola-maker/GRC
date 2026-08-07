import Link from "next/link";
import { deleteLienObjet } from "@/app/liens/actions";
import { AssocierObjetForm } from "@/components/liens/AssocierObjetForm";
import {
  TYPE_OBJET_LABELS,
  listCandidatsLien,
  listLiensFor,
  type LienVue,
} from "@/lib/liens";
import type { TypeObjetMetier } from "@/generated/prisma/client";

const LINKABLE: TypeObjetMetier[] = [
  "PROJET",
  "CONSEIL",
  "AUDIT",
  "RISQUE",
  "CONTROLE_SCI",
  "DOCUMENT",
  "TACHE",
];

export async function ElementsAssocies({
  uniteId,
  type,
  id,
  retour,
}: {
  uniteId: string;
  type: TypeObjetMetier;
  id: string;
  retour: string;
}) {
  const liens = await listLiensFor(uniteId, type, id);
  const otherTypes = LINKABLE.filter((t) => t !== type);

  const candidatsParType: Record<string, Array<{ id: string; label: string }>> =
    {};
  await Promise.all(
    otherTypes.map(async (t) => {
      candidatsParType[t] = await listCandidatsLien(uniteId, t);
    }),
  );

  return (
    <section className="panel elements-associes">
      <h2 className="panel-title">Éléments associés</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Liens libres entre objets métier — navigation croisée.
      </p>

      {liens.length === 0 ? (
        <p className="empty">Aucun élément associé pour le moment.</p>
      ) : (
        <ul className="elements-associes__list">
          {liens.map((lien) => (
            <LienRow key={lien.lienId} lien={lien} retour={retour} />
          ))}
        </ul>
      )}

      <AssocierObjetForm
        retour={retour}
        typeSource={type}
        idSource={id}
        otherTypes={otherTypes}
        candidatsParType={candidatsParType}
      />
    </section>
  );
}

function LienRow({ lien, retour }: { lien: LienVue; retour: string }) {
  return (
    <li className="elements-associes__row">
      <Link href={lien.autre.href} className="elements-associes__link">
        <span className="inventory-cell__value--code">{lien.autre.code}</span>
        <span className="elements-associes__title">{lien.autre.titre}</span>
        <span className="muted">{TYPE_OBJET_LABELS[lien.autre.type]}</span>
        {lien.libelle ? (
          <span className="muted">{lien.libelle}</span>
        ) : null}
      </Link>
      <form action={deleteLienObjet}>
        <input type="hidden" name="retour" value={retour} />
        <input type="hidden" name="id" value={lien.lienId} />
        <button type="submit" className="btn btn--ghost">
          Retirer
        </button>
      </form>
    </li>
  );
}
