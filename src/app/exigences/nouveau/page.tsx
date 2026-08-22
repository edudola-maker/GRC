import { FlashBanner, BackLink } from "@/components/Flash";
import { SubmitButton } from "@/components/FormControls";
import { PageHeader } from "@/components/ui";
import { peekNextCode } from "@/lib/codes";
import { STATUT_CONFORMITE_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { createExigence } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouvelleExigencePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [suggested, users, processus] = await Promise.all([
    peekNextCode("EXIGENCE", user.uniteId),
    listUtilisateursActifsForCurrentUnite(),
    prisma.processus.findMany({
      where: { uniteId: user.uniteId, archive: false },
      select: { id: true, code: true, nom: true },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <>
      <BackLink href="/exigences" label="← Retour aux exigences" />
      <PageHeader title="Nouvelle exigence" />
      <FlashBanner erreur={sp.erreur} />
      <form action={createExigence} className="entity-form">
        <label>
          Code
          <input name="code" defaultValue={suggested} placeholder="EXI-0001" />
        </label>
        <label>
          Titre *
          <input name="titre" required placeholder="Ex. Revue annuelle des accès" />
        </label>
        <label>
          Description
          <textarea name="description" rows={3} />
        </label>
        <label>
          Source
          <input name="source" placeholder="Ex. LPD, ISO 27001, politique interne" />
        </label>
        <label>
          Statut de conformité
          <select name="statut" defaultValue="A_EVALUER">
            {Object.entries(STATUT_CONFORMITE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Responsable
          <select name="responsableId" defaultValue="">
            <option value="">—</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {formatUtilisateurNom(u)}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="field">
          <legend className="field__label">Processus liés</legend>
          {processus.length === 0 ? (
            <p className="muted">Aucun processus actif.</p>
          ) : (
            <div className="checkbox-list">
              {processus.map((p) => (
                <label key={p.id} className="checkbox-label">
                  <input type="checkbox" name="processusIds" value={p.id} />
                  {p.code} — {p.nom}
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <div className="form-actions">
          <SubmitButton>Créer</SubmitButton>
        </div>
      </form>
    </>
  );
}
