import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
  SubmitButton,
} from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { STATUT_ARBITRAGE_LABELS, formatDate } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import {
  archiveArbitrage,
  deleteArbitrage,
  updateArbitrage,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function ArbitrageDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();

  const [arbitrage, users, processus, risques] = await Promise.all([
    prisma.arbitrage.findFirst({
      where: { id, uniteId: user.uniteId },
      include: {
        processus: { select: { id: true, code: true, nom: true } },
        risque: { select: { id: true, code: true, nom: true } },
        responsable: true,
      },
    }),
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

  if (!arbitrage) notFound();

  return (
    <>
      <BackLink href="/arbitrages" label="← Retour aux arbitrages" />
      <PageHeader
        title={`${arbitrage.code} — ${arbitrage.titre}`}
        actions={
          <>
            {!arbitrage.archive ? (
              <ConfirmActionButton
                action={archiveArbitrage}
                id={arbitrage.id}
                label="Archiver"
                confirmMessage="Archiver cet arbitrage ?"
              />
            ) : null}
            <ConfirmDeleteButton
              action={deleteArbitrage}
              id={arbitrage.id}
              confirmMessage="Supprimer définitivement cet arbitrage ?"
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {arbitrage.archive ? (
        <div className="flash flash--warn">Cet arbitrage est archivé.</div>
      ) : null}

      <form action={updateArbitrage} className="entity-form">
        <input type="hidden" name="id" value={arbitrage.id} />
        <label>
          Code
          <input name="code" defaultValue={arbitrage.code} required />
        </label>
        <label>
          Titre *
          <input name="titre" defaultValue={arbitrage.titre} required />
        </label>
        <label>
          Problématique
          <textarea
            name="problematique"
            rows={3}
            defaultValue={arbitrage.problematique ?? ""}
          />
        </label>
        <label>
          Règle retenue *
          <textarea
            name="regleRetenue"
            rows={3}
            required
            defaultValue={arbitrage.regleRetenue}
          />
        </label>
        <label>
          Justification
          <textarea
            name="justification"
            rows={3}
            defaultValue={arbitrage.justification ?? ""}
          />
        </label>
        <label>
          Processus
          <select
            name="processusId"
            defaultValue={arbitrage.processusId ?? ""}
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
          Risque (optionnel)
          <select name="risqueId" defaultValue={arbitrage.risqueId ?? ""}>
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
          <select name="statut" defaultValue={arbitrage.statut}>
            {Object.entries(STATUT_ARBITRAGE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Responsable
          <select
            name="responsableId"
            defaultValue={arbitrage.responsableId ?? user.id}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {formatUtilisateurNom(u)}
              </option>
            ))}
          </select>
        </label>
        <div className="form-actions">
          <SubmitButton>Enregistrer</SubmitButton>
        </div>
      </form>

      {(arbitrage.processus || arbitrage.risque) && (
        <p className="muted" style={{ marginTop: "1rem" }}>
          {arbitrage.processus ? (
            <>
              Processus :{" "}
              <Link href={`/processus/${arbitrage.processus.id}`}>
                {arbitrage.processus.code}
              </Link>
              {" · "}
            </>
          ) : null}
          {arbitrage.risque ? (
            <>
              Risque :{" "}
              <Link href={`/risques/${arbitrage.risque.id}`}>
                {arbitrage.risque.code}
              </Link>
            </>
          ) : null}
        </p>
      )}

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Créé {formatDate(arbitrage.creeLe)} · modifié{" "}
        {formatDate(arbitrage.modifieLe)}
      </p>
    </>
  );
}
