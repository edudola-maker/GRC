import Link from "next/link";
import { FlashBanner } from "@/components/Flash";
import { PageHeader, BtnLink } from "@/components/ui";
import { SubmitButton } from "@/components/FormControls";
import {
  createAxeStrategique,
  updateOrganisationStrategie,
} from "@/app/strategie/actions";
import { getOrgContext, whereOrgUnites } from "@/lib/organisation";
import { isResponsableOuAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatUtilisateurNom } from "@/lib/session";
import { STATUT_OBJECTIF_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function StrategiePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await getOrgContext();
  const canEdit = isResponsableOuAdmin({ role: ctx.role });
  const editing = sp.edit === "1" && canEdit;

  const [org, axes, objectifs, users] = await Promise.all([
    prisma.organisation.findUniqueOrThrow({
      where: { id: ctx.organisationId },
    }),
    prisma.axeStrategique.findMany({
      where: { organisationId: ctx.organisationId, statut: "ACTIF" },
      include: {
        responsable: { select: { id: true, nom: true, prenom: true } },
        _count: { select: { objectifs: true } },
      },
      orderBy: [{ ordre: "asc" }, { code: "asc" }],
    }),
    prisma.objectif.findMany({
      where: whereOrgUnites(ctx),
      include: {
        responsable: { select: { id: true, nom: true, prenom: true } },
        axeStrategique: { select: { id: true, code: true, titre: true } },
        attributions: {
          include: { attribution: { select: { id: true, titre: true } } },
        },
      },
      orderBy: [{ annee: "desc" }, { code: "asc" }],
    }),
    prisma.utilisateur.findMany({
      where: { uniteId: { in: ctx.uniteIds }, actif: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  const attributions = await prisma.uniteAttribution.findMany({
    where: { uniteId: { in: ctx.uniteIds }, actif: true },
    orderBy: { ordre: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Stratégie"
        actions={
          canEdit ? (
            editing ? (
              <BtnLink href="/strategie">Terminer</BtnLink>
            ) : (
              <BtnLink href="/strategie?edit=1">Modifier</BtnLink>
            )
          ) : undefined
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <p className="muted" style={{ marginTop: 0 }}>
        Chaîne : Mission → Vision → Axes → Objectifs → projets / actions.
        Les missions d’assurance restent dans le module Métier.
      </p>

      <div className="strategie-chain">
        <section className="strategie-block">
          <h2>Mission</h2>
          <p className="muted">Pourquoi existons-nous ?</p>
          {editing ? (
            <form action={updateOrganisationStrategie} className="stack-panels">
              <label className="field">
                <span className="field__label">Raison d’être / mission</span>
                <textarea
                  name="mission"
                  rows={4}
                  defaultValue={org.mission ?? ""}
                  placeholder="Raison d’être permanente de l’organisation…"
                />
              </label>
              <label className="field">
                <span className="field__label">Vision (3–5 ans)</span>
                <textarea
                  name="vision"
                  rows={3}
                  defaultValue={org.vision ?? ""}
                  placeholder="Où voulons-nous être dans 3 à 5 ans ?"
                />
              </label>
              <SubmitButton>Enregistrer mission & vision</SubmitButton>
            </form>
          ) : (
            <>
              <p className="strategie-prose">
                {org.mission?.trim() || (
                  <span className="muted">
                    Mission non formalisée.
                    {canEdit ? " Utilisez Modifier pour la définir." : null}
                  </span>
                )}
              </p>
              {attributions.length > 0 ? (
                <div className="strategie-attributions">
                  <h3>Missions permanentes (unité)</h3>
                  <ul>
                    {attributions.map((a) => (
                      <li key={a.id}>
                        <strong>{a.titre}</strong>
                        {a.description ? (
                          <span className="muted"> — {a.description}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <p className="muted">
                    <Link href="/unite">Voir la fiche Unité</Link>
                  </p>
                </div>
              ) : null}
            </>
          )}
        </section>

        {!editing ? (
          <section className="strategie-block">
            <h2>Vision</h2>
            <p className="muted">Où voulons-nous être dans 3 à 5 ans ?</p>
            <p className="strategie-prose">
              {org.vision?.trim() || (
                <span className="muted">Vision non formalisée.</span>
              )}
            </p>
          </section>
        ) : null}

        <section className="strategie-block">
          <div className="strategie-block__head">
            <div>
              <h2>Axes stratégiques</h2>
              <p className="muted">Priorités structurantes de la période.</p>
            </div>
          </div>

          {axes.length === 0 ? (
            <p className="muted">Aucun axe pour cette Organisation.</p>
          ) : (
            <ul className="strategie-axes">
              {axes.map((axe) => (
                <li key={axe.id}>
                  <div>
                    <span className="code-pill">{axe.code}</span>{" "}
                    <strong>{axe.titre}</strong>
                    {axe.periode ? (
                      <span className="muted"> · {axe.periode}</span>
                    ) : null}
                  </div>
                  {axe.description ? (
                    <p className="muted">{axe.description}</p>
                  ) : null}
                  <p className="muted" style={{ marginBottom: 0 }}>
                    {axe.responsable
                      ? `Resp. ${formatUtilisateurNom(axe.responsable)} · `
                      : null}
                    {axe._count.objectifs} objectif
                    {axe._count.objectifs === 1 ? "" : "s"}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {canEdit ? (
            <form action={createAxeStrategique} className="strategie-axe-form">
              <h3>Ajouter un axe</h3>
              <div className="inventory__advanced-grid">
                <label className="field">
                  <span className="field__label">Titre</span>
                  <input name="titre" required placeholder="Ex. Fiabiliser les opérations" />
                </label>
                <label className="field">
                  <span className="field__label">Période</span>
                  <input name="periode" placeholder="2026–2028" />
                </label>
                <label className="field">
                  <span className="field__label">Responsable</span>
                  <select name="responsableId" defaultValue="">
                    <option value="">—</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {formatUtilisateurNom(u)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  <span className="field__label">Description</span>
                  <textarea name="description" rows={2} />
                </label>
              </div>
              <SubmitButton>Créer l’axe</SubmitButton>
            </form>
          ) : null}
        </section>

        <section className="strategie-block">
          <div className="strategie-block__head">
            <div>
              <h2>Objectifs</h2>
              <p className="muted">
                Indicateur, cible, échéance, responsable — SMART léger.
              </p>
            </div>
            <BtnLink href="/objectifs/nouveau">Nouvel objectif</BtnLink>
          </div>

          {objectifs.length === 0 ? (
            <p className="muted">Aucun objectif.</p>
          ) : (
            <ul className="strategie-objectifs">
              {objectifs.map((o) => {
                const smart = [
                  o.indicateur || o.smartMesurable ? "Mesurable" : null,
                  o.cible ? "Cible" : null,
                  o.dateEcheance || o.smartTemporel ? "Échéance" : null,
                  o.responsableId ? "Responsable" : null,
                  o.axeStrategiqueId || o.attributions.length
                    ? "Mission / Axe"
                    : null,
                ].filter(Boolean) as string[];
                return (
                  <li key={o.id}>
                    <Link href={`/objectifs/${o.id}`}>
                      <span className="code-pill">{o.code}</span> {o.intitule}
                    </Link>
                    <div className="strategie-obj-meta muted">
                      {o.axeStrategique
                        ? `${o.axeStrategique.code} · `
                        : null}
                      {STATUT_OBJECTIF_LABELS[o.statut] ?? o.statut}
                      {" · "}
                      {o.progression}%
                      {o.indicateur ? ` · ${o.indicateur}` : null}
                      {o.cible ? ` → ${o.cible}` : null}
                      {o.uniteMesure ? ` ${o.uniteMesure}` : null}
                    </div>
                    {smart.length ? (
                      <div className="strategie-smart">
                        {smart.map((s) => (
                          <span key={s} className="strategie-smart__chip">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
