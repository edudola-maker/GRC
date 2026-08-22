import { FlashBanner, BackLink } from "@/components/Flash";
import { SubmitButton } from "@/components/FormControls";
import { PageHeader } from "@/components/ui";
import { peekNextCode } from "@/lib/codes";
import { STATUT_ARBITRAGE_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { createArbitrage } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouvelArbitragePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [suggested, users, processus, risques] = await Promise.all([
    peekNextCode("ARBITRAGE", user.uniteId),
    listUtilisateursActifsForCurrentUnite(),
    prisma.processus.findMany({
      where: { uniteId: user.uniteId, archive: false },
      select: { id: true, code: true, nom: true },
      orderBy: { code: "asc" },
    }),
    prisma.risque.findMany({
      where: { uniteId: user.uniteId, archive: false },
      select: { id: true, code: true, nom: true },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <>
      <BackLink href="/arbitrages" label="← Retour aux arbitrages" />
      <PageHeader title="Nouvel arbitrage" />
      <FlashBanner erreur={sp.erreur} />
      <form action={createArbitrage} className="entity-form">
        <label>
          Code
          <input name="code" defaultValue={suggested} placeholder="ARB-0001" />
        </label>
        <label>
          Titre *
          <input name="titre" required placeholder="Ex. Tolérance résiduelle accès" />
        </label>
        <label>
          Problématique
          <textarea name="problematique" rows={3} />
        </label>
        <label>
          Règle retenue *
          <textarea name="regleRetenue" rows={3} required />
        </label>
        <label>
          Justification
          <textarea name="justification" rows={3} />
        </label>
        <label>
          Processus
          <select name="processusId" defaultValue="">
            <option value="">—</option>
            {processus.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.nom}
              </option>
            ))}
          </select>
        </label>
        <label>
          Risque (optionnel)
          <select name="risqueId" defaultValue="">
            <option value="">—</option>
            {risques.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} — {r.nom}
              </option>
            ))}
          </select>
        </label>
        <label>
          Statut
          <select name="statut" defaultValue="EN_VIGUEUR">
            {Object.entries(STATUT_ARBITRAGE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Responsable
          <select name="responsableId" defaultValue={user.id}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {formatUtilisateurNom(u)}
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
