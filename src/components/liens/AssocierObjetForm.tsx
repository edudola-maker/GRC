"use client";

import { useMemo, useState } from "react";
import { createLienObjet } from "@/app/liens/actions";
import { BtnSubmit } from "@/components/ui";
import { TYPE_OBJET_LABELS } from "@/lib/labels";

/**
 * Sélecteur transversal : Type → Élément (une seule box, friction minimale).
 */
export function AssocierObjetForm({
  retour,
  typeSource,
  idSource,
  otherTypes,
  candidatsParType,
}: {
  retour: string;
  typeSource: string;
  idSource: string;
  otherTypes: string[];
  candidatsParType: Record<string, Array<{ id: string; label: string }>>;
}) {
  const [typeCible, setTypeCible] = useState(otherTypes[0] ?? "PROJET");
  const options = useMemo(
    () => candidatsParType[typeCible] ?? [],
    [candidatsParType, typeCible],
  );

  return (
    <form action={createLienObjet} className="elements-associes__form">
      <input type="hidden" name="retour" value={retour} />
      <input type="hidden" name="typeSource" value={typeSource} />
      <input type="hidden" name="idSource" value={idSource} />
      <div className="form-grid form-grid--2">
        <label className="field">
          <span className="field__label">Type d’élément</span>
          <select
            name="typeCible"
            required
            value={typeCible}
            onChange={(e) => setTypeCible(e.target.value)}
          >
            {otherTypes.map((t) => (
              <option key={t} value={t}>
                {TYPE_OBJET_LABELS[t] ?? t}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Élément</span>
          <select key={typeCible} name="idCible" required defaultValue="">
            <option value="" disabled>
              {options.length ? "Choisir…" : "Aucun élément disponible"}
            </option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-actions">
        <BtnSubmit>Associer</BtnSubmit>
      </div>
    </form>
  );
}
