-- Multi-organisations / tenants — migration non-destructive.
-- 1) Créer Organisation + tables membership/modules
-- 2) Organisation par défaut pour données existantes
-- 3) Recréer Unite avec organisationId + unicité (organisationId, code)

CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomCourt" TEXT,
    "description" TEXT,
    "vision" TEXT,
    "profilInitial" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'ACTIF',
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "Organisation_code_key" ON "Organisation"("code");

-- Organisation par défaut (UCAE / données existantes)
INSERT INTO "Organisation" ("id", "code", "nom", "nomCourt", "description", "vision", "profilInitial", "statut", "creeLe", "modifieLe")
VALUES (
  'org_default_ucae',
  'ORG-UCAE',
  'UCAE — Unité Contrôle & Assurance (démo)',
  'UCAE',
  'Organisation démo transverse GRC — données historiques migrées.',
  'Être la référence interne en matière de maîtrise des risques et de gouvernance.',
  'GRC_TRANSVERSE',
  'ACTIF',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

CREATE TABLE "OrganisationMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COLLABORATEUR',
    "unitePrincipaleId" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "OrganisationMembership_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganisationMembership_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "OrganisationModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganisationModule_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Unite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "presentation" TEXT,
    "responsableId" TEXT,
    "adjointId" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Unite_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Unite_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Unite_adjointId_fkey" FOREIGN KEY ("adjointId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Unite" (
  "id", "organisationId", "code", "nom", "description", "presentation",
  "responsableId", "adjointId", "actif", "creeLe", "modifieLe"
)
SELECT
  "id",
  'org_default_ucae',
  "code", "nom", "description", "presentation",
  "responsableId", "adjointId", "actif", "creeLe", "modifieLe"
FROM "Unite";

DROP TABLE "Unite";
ALTER TABLE "new_Unite" RENAME TO "Unite";

CREATE INDEX "Unite_organisationId_actif_idx" ON "Unite"("organisationId", "actif");
CREATE UNIQUE INDEX "Unite_organisationId_code_key" ON "Unite"("organisationId", "code");

-- FK membership → Unite (après recreation)
-- SQLite : table déjà créée sans FK unitePrincipale ; on recrée proprement.

CREATE TABLE "new_OrganisationMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COLLABORATEUR',
    "unitePrincipaleId" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "OrganisationMembership_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganisationMembership_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganisationMembership_unitePrincipaleId_fkey" FOREIGN KEY ("unitePrincipaleId") REFERENCES "Unite" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
DROP TABLE "OrganisationMembership";
ALTER TABLE "new_OrganisationMembership" RENAME TO "OrganisationMembership";

CREATE INDEX "OrganisationMembership_utilisateurId_idx" ON "OrganisationMembership"("utilisateurId");
CREATE INDEX "OrganisationMembership_organisationId_actif_idx" ON "OrganisationMembership"("organisationId", "actif");
CREATE UNIQUE INDEX "OrganisationMembership_organisationId_utilisateurId_key" ON "OrganisationMembership"("organisationId", "utilisateurId");

CREATE INDEX "OrganisationModule_organisationId_actif_idx" ON "OrganisationModule"("organisationId", "actif");
CREATE UNIQUE INDEX "OrganisationModule_organisationId_module_key" ON "OrganisationModule"("organisationId", "module");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Memberships pour utilisateurs existants (rôle = rôle user)
INSERT INTO "OrganisationMembership" ("id", "organisationId", "utilisateurId", "role", "unitePrincipaleId", "actif", "creeLe", "modifieLe")
SELECT
  'mem_' || u."id",
  'org_default_ucae',
  u."id",
  u."role",
  u."uniteId",
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Utilisateur" u;

-- Modules GRC_TRANSVERSE complets pour org défaut
INSERT INTO "OrganisationModule" ("id", "organisationId", "module", "actif", "creeLe")
SELECT
  'mod_ucae_' || m.module,
  'org_default_ucae',
  m.module,
  1,
  CURRENT_TIMESTAMP
FROM (
  SELECT 'TACHES' AS module UNION ALL SELECT 'PLANNING' UNION ALL SELECT 'PROJETS'
  UNION ALL SELECT 'STRATEGIE' UNION ALL SELECT 'OBJECTIFS' UNION ALL SELECT 'PROCESSUS'
  UNION ALL SELECT 'RISQUES' UNION ALL SELECT 'CONTROLES' UNION ALL SELECT 'CONFORMITE'
  UNION ALL SELECT 'QUALITE' UNION ALL SELECT 'CONTINUITE' UNION ALL SELECT 'ACTIFS'
  UNION ALL SELECT 'DECISIONS' UNION ALL SELECT 'ARBITRAGES' UNION ALL SELECT 'MISSIONS'
  UNION ALL SELECT 'CONSEILS' UNION ALL SELECT 'DOCUMENTS' UNION ALL SELECT 'FONCTIONS'
  UNION ALL SELECT 'RAPPORTS' UNION ALL SELECT 'GUIDE' UNION ALL SELECT 'EQUIPE'
  UNION ALL SELECT 'ADMINISTRATION'
) m;
