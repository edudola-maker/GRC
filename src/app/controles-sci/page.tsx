import Link from "next/link";
import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import {
  FREQUENCE_LABELS,
  STATUT_CONTROLE_LABELS,
  formatDate,
  startOfToday,
  urgenceEcheance,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  tone,
  suffix,
}: {
  label: string;
  value: number | string | null;
  tone?: "warn" | "danger" | "info";
  suffix?: string;
}) {
  return (
    <div className={`stat${tone ? ` stat--${tone}` : ""}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">
        {value ?? "—"}
        {suffix && value != null ? (
          <span className="stat__suffix">{suffix}</span>
        ) : null}
      </span>
    </div>
  );
}

export default async function ControlesSCIPage({
  searchParams,
}: {
  searchParams: Promise<{ archives?: string; ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const archives = sp.archives === "1";
  const today = startOfToday();

  const controles = await prisma.controleSCI.findMany({
    where: { archive: archives },
    include: {
      responsable: true,
      _count: { select: { taches: true, preuves: true, risques: true } },
    },
    orderBy: { dateProchaineEcheance: "asc" },
  });

  const actifs = archives
    ? []
    : await prisma.controleSCI.findMany({
        where: { archive: false },
        select: {
          statut: true,
          dateProchaineEcheance: true,
        },
      });

  const planifies = actifs.filter((c) =>
    c.statut === "A_REALISER" || c.statut === "EN_COURS",
  ).length;
  const realises = actifs.filter((c) => c.statut === "REALISE").length;
  const enRetard = actifs.filter(
    (c) =>
      c.statut === "EN_RETARD" ||
      (c.statut !== "REALISE" &&
        c.dateProchaineEcheance != null &&
        c.dateProchaineEcheance < today),
  ).length;
  const denom = planifies + realises;
  const tauxRealisation =
    denom > 0 ? Math.round((realises / denom) * 100) : null;

  return (
    <>
      <PageHeader
        title="Contrôles SCI"
        description="Registre des contrôles périodiques du système de contrôle interne : fréquences, échéances, preuves et validation."
        actions={
          <BtnLink href="/controles-sci/nouveau">Nouveau contrôle</BtnLink>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {!archives ? (
        <div className="stats-grid stats-grid--dense" style={{ marginBottom: "1rem" }}>
          <Stat label="Planifiés" value={planifies} />
          <Stat label="Réalisés" value={realises} />
          <Stat label="En retard" value={enRetard} tone="danger" />
          <Stat
            label="Taux de réalisation"
            value={tauxRealisation}
            suffix=" %"
            tone="info"
          />
        </div>
      ) : null}

      <div className="filter-bar">
        <Link
          href="/controles-sci"
          className={`chip${!archives ? " is-active" : ""}`}
        >
          Actifs
        </Link>
        <Link
          href="/controles-sci?archives=1"
          className={`chip${archives ? " is-active" : ""}`}
        >
          Archivés
        </Link>
      </div>

      <div className="panel">
        {controles.length === 0 ? (
          <p className="empty">
            Aucun contrôle.{" "}
            <Link href="/controles-sci/nouveau">Créer le premier</Link>
          </p>
        ) : (
          <ul className="entity-list">
            {controles.map((c) => {
              const clos = c.statut === "REALISE";
              const retardEffectif =
                c.statut === "EN_RETARD" ||
                (!clos &&
                  c.dateProchaineEcheance != null &&
                  c.dateProchaineEcheance < today);
              const urgence = retardEffectif
                ? "retard"
                : urgenceEcheance(c.dateProchaineEcheance, clos);
              return (
                <li key={c.id}>
                  <Link
                    href={`/controles-sci/${c.id}`}
                    className={`entity-row entity-row--${urgence}`}
                  >
                    <div className="entity-row__main">
                      <strong>{c.nom}</strong>
                      <span className="entity-row__meta">
                        {c.responsable.nom}
                        {" · "}
                        {c.processusConcerne}
                        {" · "}
                        {FREQUENCE_LABELS[c.frequence]}
                        {" · "}
                        {STATUT_CONTROLE_LABELS[c.statut]}
                        {" · "}
                        {c._count.preuves} preuve
                        {c._count.preuves > 1 ? "s" : ""}
                        {" · "}
                        {c._count.taches} tâche
                        {c._count.taches > 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="entity-row__date">
                      {formatDate(c.dateProchaineEcheance)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
