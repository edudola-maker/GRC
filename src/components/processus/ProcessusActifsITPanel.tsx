"use client";

import Link from "next/link";
import { SubmitButton } from "@/components/FormControls";
import {
  linkProcessusActifIT,
  unlinkProcessusActifIT,
} from "@/app/processus/actions";

export type ProcessusActifItem = {
  lienId: string;
  id: string;
  code: string;
  nom: string;
  typeLabel: string;
  statutLabel: string;
};

type ActifOpt = { id: string; label: string };

export function ProcessusActifsITPanel({
  processusId,
  lies,
  disponibles,
  editable,
}: {
  processusId: string;
  lies: ProcessusActifItem[];
  disponibles: ActifOpt[];
  editable: boolean;
}) {
  return (
    <div className="processus-actifs">
      <p className="muted" style={{ marginTop: 0 }}>
        Systèmes / applications nécessaires au processus. La fiche Actif IT
        montre l’inverse : quels processus sont impactés en cas d’indisponibilité.
      </p>

      {lies.length === 0 ? (
        <p className="empty">Aucun actif IT lié.</p>
      ) : (
        <ul className="unite-activite__list">
          {lies.map((a) => (
            <li key={a.lienId}>
              <div>
                <Link href={`/actifs-it/${a.id}`}>
                  <strong>
                    {a.code} — {a.nom}
                  </strong>
                </Link>
                <span className="muted" style={{ marginLeft: "0.5rem" }}>
                  {a.typeLabel} · {a.statutLabel}
                </span>
              </div>
              {editable ? (
                <form action={unlinkProcessusActifIT}>
                  <input type="hidden" name="id" value={a.lienId} />
                  <input type="hidden" name="processusId" value={processusId} />
                  <SubmitButton variant="ghost">Retirer</SubmitButton>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {editable ? (
        disponibles.length === 0 ? (
          <p className="muted">
            Tous les actifs sont déjà liés, ou{" "}
            <Link href="/actifs-it/nouveau">créez un actif IT</Link>.
          </p>
        ) : (
          <form action={linkProcessusActifIT} className="inline-add-form">
            <input type="hidden" name="processusId" value={processusId} />
            <select name="actifITId" required defaultValue="">
              <option value="" disabled>
                Ajouter un actif IT…
              </option>
              {disponibles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
            <SubmitButton>Lier</SubmitButton>
          </form>
        )
      ) : null}
    </div>
  );
}
