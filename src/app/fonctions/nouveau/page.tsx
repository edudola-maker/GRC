import { FlashBanner, BackLink } from "@/components/Flash";
import { SubmitButton } from "@/components/FormControls";
import { PageHeader } from "@/components/ui";
import { peekNextCode } from "@/lib/codes";
import {
  PERIMETRE_ACCES_LABELS,
  ROLE_UTILISATEUR_LABELS,
} from "@/lib/labels";
import { getCurrentUser } from "@/lib/session";
import { createFonction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouvelleFonctionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const suggested = await peekNextCode("FONCTION", user.uniteId);

  return (
    <>
      <BackLink href="/fonctions" label="← Retour aux fonctions" />
      <PageHeader title="Nouvelle fonction" />
      <FlashBanner erreur={sp.erreur} />
      <form action={createFonction} className="entity-form">
        <label>
          Code
          <input name="code" defaultValue={suggested} placeholder="FCT-0001" />
        </label>
        <label>
          Nom
          <input name="nom" required placeholder="Responsable d’unité" />
        </label>
        <label>
          Description
          <textarea name="description" rows={3} />
        </label>
        <label>
          Rôle applicatif associé (optionnel)
          <select name="roleApplicatif" defaultValue="">
            <option value="">—</option>
            {Object.entries(ROLE_UTILISATEUR_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Périmètre
          <select name="perimetre" defaultValue="MON_UNITE">
            {Object.entries(PERIMETRE_ACCES_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <div className="form-actions">
          <SubmitButton>Créer</SubmitButton>
        </div>
      </form>
    </>
  );
}
