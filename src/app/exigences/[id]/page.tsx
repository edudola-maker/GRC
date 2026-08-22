import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
  SubmitButton,
} from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { STATUT_CONFORMITE_LABELS, formatDate } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import {
  archiveExigence,
  deleteExigence,
  updateExigence,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function ExigenceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();

  const [exigence, users, processus] = await Promise.all([
    prisma.exigence.findFirst({
      where: { id, uniteId: user.uniteId },
      include: {
        responsable: true,
        processus: {
          include: {
            processus: { select: { id: true, code: true, nom: true } },
          },
        },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
    prisma.processus.findMany({
      where: { uniteId: user.uniteId, archive: false },
      select: { id: true, code: true, nom: true },
      orderBy: { code: "asc" },
    }),
  ]);

  if (!exigence) notFound();

  const linked = new Set(exigence.processus.map((l) => l.processusId));

  return (
    <>
      <BackLink href="/exigences" label="← Retour aux exigences" />
      <PageHeader
        title={`${exigence.code} — ${exigence.titre}`}
        actions={
          <>
            {!exigence.archive ? (
              <ConfirmActionButton
                action={archiveExigence}
                id={exigence.id}
                label="Archiver"
                confirmMessage="Archiver cette exigence ?"
              />
            ) : null}
            <ConfirmDeleteButton
              action={deleteExigence}
              id={exigence.id}
              confirmMessage="Supprimer définitivement cette exigence ?"
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {exigence.archive ? (
        <div className="flash flash--warn">Cette exigence est archivée.</div>
      ) : null}

      <form action={updateExigence} className="entity-form">
        <input type="hidden" name="id" value={exigence.id} />
        <label>
          Code
          <input name="code" defaultValue={exigence.code} required />
        </label>
        <label>
          Titre *
          <input name="titre" defaultValue={exigence.titre} required />
        </label>
        <label>
          Description
          <textarea
            name="description"
            rows={3}
            defaultValue={exigence.description ?? ""}
          />
        </label>
        <label>
          Source
          <input name="source" defaultValue={exigence.source ?? ""} />
        </label>
        <label>
          Statut de conformité
          <select name="statut" defaultValue={exigence.statut}>
            {Object.entries(STATUT_CONFORMITE_LABELS).map(([v, l]) => (
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
            defaultValue={exigence.responsableId ?? ""}
          >
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
          <div className="checkbox-list">
            {processus.map((p) => (
              <label key={p.id} className="checkbox-label">
                <input
                  type="checkbox"
                  name="processusIds"
                  value={p.id}
                  defaultChecked={linked.has(p.id)}
                />
                {p.code} — {p.nom}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="form-actions">
          <SubmitButton>Enregistrer</SubmitButton>
        </div>
      </form>

      {exigence.processus.length > 0 ? (
        <section style={{ marginTop: "1.25rem" }}>
          <h2 className="section-title">Processus</h2>
          <ul className="compact-list">
            {exigence.processus.map((l) => (
              <li key={l.id}>
                <Link href={`/processus/${l.processus.id}`}>
                  {l.processus.code} — {l.processus.nom}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Créée {formatDate(exigence.creeLe)} · modifiée{" "}
        {formatDate(exigence.modifieLe)}
      </p>
    </>
  );
}
