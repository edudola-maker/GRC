/**
 * Tests d’isolation cross-tenant (Organisation).
 * Vérifie qu’aucune requête filtrée par org A ne renvoie des objets d’org B.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const filePath = databaseUrl.startsWith("file:")
  ? databaseUrl.slice("file:".length)
  : databaseUrl;
const absolutePath = path.isAbsolute(filePath)
  ? filePath
  : path.join(process.cwd(), filePath);

const adapter = new PrismaBetterSqlite3({ url: absolutePath });
const prisma = new PrismaClient({ adapter });

async function uniteIdsForOrg(organisationId: string) {
  const rows = await prisma.unite.findMany({
    where: { organisationId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

async function main() {
  const orgs = await prisma.organisation.findMany({
    orderBy: { code: "asc" },
  });
  assert.ok(orgs.length >= 4, `Attendu ≥4 orgs, trouvé ${orgs.length}`);

  const byCode = Object.fromEntries(orgs.map((o) => [o.code, o]));
  assert.ok(byCode["ORG-PME-SIMPLE"], "ORG-PME-SIMPLE manquante");
  assert.ok(byCode["ORG-PME-STRUCT"], "ORG-PME-STRUCT manquante");
  assert.ok(byCode["ORG-UCAE"], "ORG-UCAE manquante");
  assert.ok(byCode["ORG-FINANCE"], "ORG-FINANCE manquante");

  const pmeIds = await uniteIdsForOrg(byCode["ORG-PME-SIMPLE"]!.id);
  const ucaeIds = await uniteIdsForOrg(byCode["ORG-UCAE"]!.id);
  const finIds = await uniteIdsForOrg(byCode["ORG-FINANCE"]!.id);

  assert.ok(pmeIds.length >= 1);
  assert.ok(ucaeIds.length >= 1);
  assert.ok(finIds.length >= 1);

  // Tâches PME ne doivent pas inclure UCAE / Finance
  const tachesPme = await prisma.tache.findMany({
    where: { uniteId: { in: pmeIds } },
    select: { id: true, uniteId: true, titre: true },
  });
  assert.ok(tachesPme.length >= 1, "Petite PME sans tâches");
  for (const t of tachesPme) {
    assert.ok(pmeIds.includes(t.uniteId), `Fuite tâche ${t.id} hors PME`);
    assert.ok(!ucaeIds.includes(t.uniteId));
    assert.ok(!finIds.includes(t.uniteId));
  }

  const tachesUcae = await prisma.tache.findMany({
    where: { uniteId: { in: ucaeIds } },
    select: { id: true, uniteId: true },
  });
  assert.ok(tachesUcae.length >= 1, "UCAE sans tâches");
  for (const t of tachesUcae) {
    assert.ok(ucaeIds.includes(t.uniteId));
    assert.ok(!pmeIds.includes(t.uniteId));
  }

  // Projets : codes peuvent se répéter entre orgs (PRO-0001), isolation par uniteId
  const proPme = await prisma.projet.findMany({
    where: { uniteId: { in: pmeIds }, code: "PRO-0001" },
  });
  const proFin = await prisma.projet.findMany({
    where: { uniteId: { in: finIds }, code: "PRO-0001" },
  });
  assert.equal(proPme.length, 1);
  assert.equal(proFin.length, 1);
  assert.notEqual(proPme[0]!.id, proFin[0]!.id);

  // Accès direct par ID : un objet Finance n’est pas dans le scope PME
  const projetFinance = proFin[0]!;
  const leak = await prisma.projet.findFirst({
    where: {
      id: projetFinance.id,
      uniteId: { in: pmeIds },
    },
  });
  assert.equal(leak, null, "Projet Finance visible dans scope PME");

  // Modules : Petite PME n’a pas MISSIONS ; UCAE oui
  const modPme = await prisma.organisationModule.findMany({
    where: { organisationId: byCode["ORG-PME-SIMPLE"]!.id, actif: true },
  });
  const modUcae = await prisma.organisationModule.findMany({
    where: { organisationId: byCode["ORG-UCAE"]!.id, actif: true },
  });
  assert.ok(!modPme.some((m) => m.module === "MISSIONS"));
  assert.ok(modUcae.some((m) => m.module === "MISSIONS"));
  assert.ok(modPme.some((m) => m.module === "TACHES"));

  // Memberships Alice (bridge) sur plusieurs orgs
  const alice = await prisma.utilisateur.findFirst({
    where: { email: "alice.martin@exemple.fr" },
  });
  assert.ok(alice);
  const mems = await prisma.organisationMembership.findMany({
    where: { utilisateurId: alice!.id, actif: true },
  });
  assert.ok(mems.length >= 4, `Alice devrait avoir ≥4 memberships, a ${mems.length}`);

  console.log("✅ Isolation cross-tenant OK");
  console.log(
    `   Orgs: ${orgs.map((o) => o.nomCourt || o.code).join(", ")}`,
  );
  console.log(`   Tâches PME=${tachesPme.length}, UCAE=${tachesUcae.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
