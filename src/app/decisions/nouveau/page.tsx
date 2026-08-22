import { FlashBanner, BackLink } from "@/components/Flash";
import { SubmitButton } from "@/components/FormControls";
import { PageHeader } from "@/components/ui";
import { peekNextCode } from "@/lib/codes";
import { STATUT_DECISION_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { createDecision } from "../actions";

export const dynamic = "force-dynamic";

export default async function NouvelleDecisionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [suggested, users, processus, decisions] = await Promise.all([
    peekNextCode("DECISION", user.uniteId),
    listUtilisateursActifsForCurrentUnite(),
    prisma.processus.findMany({
      where: { uniteId: user.uniteId, archive: false },
      select: { id: true, code: true, nom: true },
      orderBy: { code: "asc" },
    }),
    prisma.decision.findMany({
      where: { uniteId: user.uniteId, archive: false },
      select: { id: true, code: true, titre: true },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <>
      <BackLink href="/decisions" label="← Retour aux décisions" />
      <PageHeader title="Nouvelle décision" />
      <FlashBanner erreur={sp.erreur} />
      <form action={createDecision} className="entity-form">
        <label>
          Code
          <input name="code" defaultValue={suggested} placeholder="DEC-0001" />
        </label>
        <label>
          Titre *
          <input name="titre" required placeholder="Ex. Adoption revue qualité" />
        </label>
        <label>
          Problématique
          <textarea name="problematique" rows={2} />
        </label>
        <label>
          Analyse
          <textarea name="analyse" rows={3} />
        </label>
        <label>
          Décision *
          <textarea name="decisionTexte" rows={3} required />
        </label>
        <label>
          Décideur
          <select name="decideurId" defaultValue={user.id}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {formatUtilisateurNom(u)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date de décision
          <input name="dateDecision" type="date" />
        </label>
        <label>
          Statut
          <select name="statut" defaultValue="PROPOSEE">
            {Object.entries(STATUT_DECISION_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
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
          Décision précédente
          <select name="decisionPrecedenteId" defaultValue="">
            <option value="">—</option>
            {decisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} — {d.titre}
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
