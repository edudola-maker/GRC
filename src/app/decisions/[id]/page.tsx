import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
  SubmitButton,
} from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { toDateInputValue } from "@/lib/form";
import { STATUT_DECISION_LABELS, formatDate } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import {
  archiveDecision,
  deleteDecision,
  updateDecision,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function DecisionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();

  const [decision, users, processus, autres] = await Promise.all([
    prisma.decision.findFirst({
      where: { id, uniteId: user.uniteId },
      include: {
        decideur: true,
        processus: { select: { id: true, code: true, nom: true } },
        decisionPrecedente: {
          select: { id: true, code: true, titre: true },
        },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
    prisma.processus.findMany({
      where: { uniteId: user.uniteId, archive: false },
      select: { id: true, code: true, nom: true },
      orderBy: { code: "asc" },
    }),
    prisma.decision.findMany({
      where: { uniteId: user.uniteId, archive: false, id: { not: id } },
      select: { id: true, code: true, titre: true },
      orderBy: { code: "asc" },
    }),
  ]);

  if (!decision) notFound();

  return (
    <>
      <BackLink href="/decisions" label="← Retour aux décisions" />
      <PageHeader
        title={`${decision.code} — ${decision.titre}`}
        actions={
          <>
            {!decision.archive ? (
              <ConfirmActionButton
                action={archiveDecision}
                id={decision.id}
                label="Archiver"
                confirmMessage="Archiver cette décision ?"
              />
            ) : null}
            <ConfirmDeleteButton
              action={deleteDecision}
              id={decision.id}
              confirmMessage="Supprimer définitivement cette décision ?"
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {decision.archive ? (
        <div className="flash flash--warn">Cette décision est archivée.</div>
      ) : null}

      <form action={updateDecision} className="entity-form">
        <input type="hidden" name="id" value={decision.id} />
        <label>
          Code
          <input name="code" defaultValue={decision.code} required />
        </label>
        <label>
          Titre *
          <input name="titre" defaultValue={decision.titre} required />
        </label>
        <label>
          Problématique
          <textarea
            name="problematique"
            rows={2}
            defaultValue={decision.problematique ?? ""}
          />
        </label>
        <label>
          Analyse
          <textarea
            name="analyse"
            rows={3}
            defaultValue={decision.analyse ?? ""}
          />
        </label>
        <label>
          Décision *
          <textarea
            name="decisionTexte"
            rows={3}
            required
            defaultValue={decision.decisionTexte}
          />
        </label>
        <label>
          Décideur
          <select
            name="decideurId"
            defaultValue={decision.decideurId ?? user.id}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {formatUtilisateurNom(u)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date de décision
          <input
            name="dateDecision"
            type="date"
            defaultValue={toDateInputValue(decision.dateDecision)}
          />
        </label>
        <label>
          Statut
          <select name="statut" defaultValue={decision.statut}>
            {Object.entries(STATUT_DECISION_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Processus
          <select
            name="processusId"
            defaultValue={decision.processusId ?? ""}
          >
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
          <select
            name="decisionPrecedenteId"
            defaultValue={decision.decisionPrecedenteId ?? ""}
          >
            <option value="">—</option>
            {autres.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} — {d.titre}
              </option>
            ))}
          </select>
        </label>
        <div className="form-actions">
          <SubmitButton>Enregistrer</SubmitButton>
        </div>
      </form>

      {decision.decisionPrecedente ? (
        <p className="muted" style={{ marginTop: "1rem" }}>
          Remplace{" "}
          <Link href={`/decisions/${decision.decisionPrecedente.id}`}>
            {decision.decisionPrecedente.code} —{" "}
            {decision.decisionPrecedente.titre}
          </Link>
        </p>
      ) : null}

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Créée {formatDate(decision.creeLe)} · modifiée{" "}
        {formatDate(decision.modifieLe)}
      </p>
    </>
  );
}
