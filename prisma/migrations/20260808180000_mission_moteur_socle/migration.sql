-- Socle Mission (Type → Template → Instance). Routes /audits inchangées.
-- Soft-delete privilégié ; recommandations indépendantes de la clôture.

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- ─── Utilisateur.initiales ───────────────────────────────────
ALTER TABLE "Utilisateur" ADD COLUMN "initiales" TEXT;

-- ─── Référentiels mission ────────────────────────────────────
CREATE TABLE "MissionType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "MissionType_code_key" ON "MissionType"("code");

CREATE TABLE "MissionTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "definition" JSONB NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MissionTemplate_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "MissionType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MissionTemplate_code_key" ON "MissionTemplate"("code");

CREATE TABLE "MissionDescriptifPreset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "typeId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MissionDescriptifPreset_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "MissionType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "MissionDescriptifPreset_typeId_actif_idx" ON "MissionDescriptifPreset"("typeId", "actif");

CREATE TABLE "MissionRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX "MissionRole_code_key" ON "MissionRole"("code");

-- Seed minimal pour migrer les audits existants
INSERT INTO "MissionType" ("id", "code", "libelle", "description", "actif", "ordre") VALUES
  ('mtype_audit_general', 'AUDIT_GENERAL', 'Audit général', 'Mission d''audit général structurée', 1, 1),
  ('mtype_audit_cible', 'AUDIT_CIBLE', 'Audit ciblé / spécifique', 'Audit à périmètre restreint', 1, 2),
  ('mtype_revue_processus', 'REVUE_PROCESSUS', 'Revue de processus', 'Revue méthodologique d''un processus', 1, 3),
  ('mtype_audit_interne', 'AUDIT_INTERNE', 'Audit interne', 'Mission relevant de l''audit interne', 1, 4);

INSERT INTO "MissionTemplate" ("id", "code", "libelle", "typeId", "description", "actif", "definition") VALUES
  ('mtpl_audit_general_v1', 'AUDIT_GENERAL_V1', 'Audit général — structure standard', 'mtype_audit_general', 'Vue d''ensemble + Planification + Substantif + Recommandations + Rapport + Suivi', 1,
   '{"sections":[{"key":"VUE_ENSEMBLE","title":"Vue d''ensemble","order":0,"defaultOpen":true},{"key":"PLANIFICATION","title":"1. Planification","order":1,"defaultOpen":true},{"key":"SUBSTANTIF","title":"2. Substantif","order":2,"defaultOpen":false},{"key":"RECOMMANDATIONS","title":"3. Recommandations","order":3,"defaultOpen":false},{"key":"RAPPORT","title":"4. Rapport","order":4,"defaultOpen":false},{"key":"SUIVI","title":"5. Suivi des recommandations","order":5,"defaultOpen":false}],"roleCodes":["RESPONSABLE_MANDAT","AUDITEUR","RESPONSABLE_UNITE"],"checklistDefs":[],"validationDefs":[]}'),
  ('mtpl_revue_processus_v1', 'REVUE_PROCESSUS_V1', 'Revue de processus — structure standard', 'mtype_revue_processus', NULL, 1,
   '{"sections":[{"key":"VUE_ENSEMBLE","title":"Vue d''ensemble","order":0,"defaultOpen":true},{"key":"PLANIFICATION","title":"1. Planification","order":1,"defaultOpen":true},{"key":"SUBSTANTIF","title":"2. Substantif","order":2,"defaultOpen":false},{"key":"RECOMMANDATIONS","title":"3. Recommandations","order":3,"defaultOpen":false},{"key":"RAPPORT","title":"4. Rapport","order":4,"defaultOpen":false},{"key":"SUIVI","title":"5. Suivi des recommandations","order":5,"defaultOpen":false}],"roleCodes":["RESPONSABLE_MANDAT","AUDITEUR","RESPONSABLE_UNITE"],"checklistDefs":[],"validationDefs":[]}'),
  ('mtpl_audit_cible_v1', 'AUDIT_CIBLE_V1', 'Audit ciblé — structure standard', 'mtype_audit_cible', NULL, 1,
   '{"sections":[{"key":"VUE_ENSEMBLE","title":"Vue d''ensemble","order":0,"defaultOpen":true},{"key":"PLANIFICATION","title":"1. Planification","order":1,"defaultOpen":true},{"key":"SUBSTANTIF","title":"2. Substantif","order":2,"defaultOpen":false},{"key":"RECOMMANDATIONS","title":"3. Recommandations","order":3,"defaultOpen":false},{"key":"RAPPORT","title":"4. Rapport","order":4,"defaultOpen":false},{"key":"SUIVI","title":"5. Suivi des recommandations","order":5,"defaultOpen":false}],"roleCodes":["RESPONSABLE_MANDAT","AUDITEUR","RESPONSABLE_UNITE"],"checklistDefs":[],"validationDefs":[]}'),
  ('mtpl_audit_interne_v1', 'AUDIT_INTERNE_V1', 'Audit interne — structure standard', 'mtype_audit_interne', NULL, 1,
   '{"sections":[{"key":"VUE_ENSEMBLE","title":"Vue d''ensemble","order":0,"defaultOpen":true},{"key":"PLANIFICATION","title":"1. Planification","order":1,"defaultOpen":true},{"key":"SUBSTANTIF","title":"2. Substantif","order":2,"defaultOpen":false},{"key":"RECOMMANDATIONS","title":"3. Recommandations","order":3,"defaultOpen":false},{"key":"RAPPORT","title":"4. Rapport","order":4,"defaultOpen":false},{"key":"SUIVI","title":"5. Suivi des recommandations","order":5,"defaultOpen":false}],"roleCodes":["RESPONSABLE_MANDAT","AUDITEUR","RESPONSABLE_UNITE"],"checklistDefs":[],"validationDefs":[]}');

INSERT INTO "MissionDescriptifPreset" ("id", "typeId", "libelle", "description", "actif", "ordre") VALUES
  ('mdesc_subventions', 'mtype_audit_general', 'Audit de conformité des subventions', NULL, 1, 1),
  ('mdesc_achats', 'mtype_audit_general', 'Audit du cycle Achats', NULL, 1, 2),
  ('mdesc_paie', 'mtype_audit_general', 'Audit du processus Paie', NULL, 1, 3);

INSERT INTO "MissionRole" ("id", "code", "libelle", "actif", "ordre") VALUES
  ('mrole_resp_mandat', 'RESPONSABLE_MANDAT', 'Responsable de mandat', 1, 1),
  ('mrole_auditeur', 'AUDITEUR', 'Auditeur', 1, 2),
  ('mrole_resp_unite', 'RESPONSABLE_UNITE', 'Responsable d''unité', 1, 3);

-- ─── Mission (copie depuis Audit) ────────────────────────────
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "descriptifPresetId" TEXT,
    "descriptifLibre" TEXT,
    "nature" TEXT,
    "tags" TEXT,
    "responsableId" TEXT NOT NULL,
    "dateDebut" DATETIME,
    "dateFin" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'PLANIFIE',
    "commentaires" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "Mission_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mission_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "MissionType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MissionTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mission_descriptifPresetId_fkey" FOREIGN KEY ("descriptifPresetId") REFERENCES "MissionDescriptifPreset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Mission_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mission_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mission_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "Mission" (
  "id", "uniteId", "code", "titre", "typeId", "templateId", "descriptifPresetId", "descriptifLibre",
  "nature", "tags", "responsableId", "dateDebut", "dateFin", "statut", "commentaires",
  "archive", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta"
)
SELECT
  a."id",
  a."uniteId",
  REPLACE(a."code", 'AUD-', 'MIS-'),
  a."titre",
  CASE WHEN a."typeMission" = 'REVUE_PROCESSUS' THEN 'mtype_revue_processus' ELSE 'mtype_audit_general' END,
  CASE WHEN a."typeMission" = 'REVUE_PROCESSUS' THEN 'mtpl_revue_processus_v1' ELSE 'mtpl_audit_general_v1' END,
  NULL,
  NULL,
  a."perimetre",
  a."tags",
  a."responsableId",
  a."dateDebut",
  a."dateFin",
  a."statut",
  a."commentaires",
  a."archive",
  a."creeParId",
  a."modifieParId",
  a."creeLe",
  a."modifieLe",
  a."meta"
FROM "Audit" a;

CREATE INDEX "Mission_uniteId_archive_statut_idx" ON "Mission"("uniteId", "archive", "statut");
CREATE UNIQUE INDEX "Mission_uniteId_code_key" ON "Mission"("uniteId", "code");

CREATE TABLE "MissionMembre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    CONSTRAINT "MissionMembre_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MissionMembre_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "MissionMembre" ("id", "missionId", "utilisateurId")
SELECT "id", "auditId", "utilisateurId" FROM "AuditMembre";
CREATE UNIQUE INDEX "MissionMembre_missionId_utilisateurId_key" ON "MissionMembre"("missionId", "utilisateurId");

CREATE TABLE "MissionMembreRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "membreId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    CONSTRAINT "MissionMembreRole_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "MissionMembre" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MissionMembreRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "MissionRole" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MissionMembreRole_membreId_roleId_key" ON "MissionMembreRole"("membreId", "roleId");

CREATE TABLE "MissionDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MissionDocument_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MissionDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "MissionDocument" ("id", "missionId", "documentId", "creeLe")
SELECT "id", "auditId", "documentId", "creeLe" FROM "AuditDocument";
CREATE UNIQUE INDEX "MissionDocument_missionId_documentId_key" ON "MissionDocument"("missionId", "documentId");

CREATE TABLE "MissionChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "fait" BOOLEAN NOT NULL DEFAULT false,
    "faitParId" TEXT,
    "faitLe" DATETIME,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MissionChecklistItem_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MissionChecklistItem_faitParId_fkey" FOREIGN KEY ("faitParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "MissionChecklistItem_missionId_sectionKey_idx" ON "MissionChecklistItem"("missionId", "sectionKey");
CREATE UNIQUE INDEX "MissionChecklistItem_missionId_code_key" ON "MissionChecklistItem"("missionId", "code");

CREATE TABLE "MissionValidationPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    "contenuVersion" INTEGER NOT NULL DEFAULT 1,
    "prepareParId" TEXT,
    "prepareLe" DATETIME,
    "soumisParId" TEXT,
    "soumisLe" DATETIME,
    CONSTRAINT "MissionValidationPoint_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MissionValidationPoint_prepareParId_fkey" FOREIGN KEY ("prepareParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MissionValidationPoint_soumisParId_fkey" FOREIGN KEY ("soumisParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "MissionValidationPoint_missionId_sectionKey_statut_idx" ON "MissionValidationPoint"("missionId", "sectionKey", "statut");
CREATE UNIQUE INDEX "MissionValidationPoint_missionId_code_key" ON "MissionValidationPoint"("missionId", "code");

CREATE TABLE "MissionValidationVisa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pointId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "versionVisee" INTEGER NOT NULL DEFAULT 1,
    "commentaire" TEXT,
    CONSTRAINT "MissionValidationVisa_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "MissionValidationPoint" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MissionValidationVisa_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "MissionValidationVisa_pointId_niveau_idx" ON "MissionValidationVisa"("pointId", "niveau");

-- ─── Recommandation (REC + missionId, Restrict) ──────────────
CREATE TABLE "new_Recommandation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "responsableId" TEXT,
    "dateEcheance" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'OUVERTE',
    "commentaires" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Recommandation_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recommandation_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recommandation_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Recommandation" (
  "id", "uniteId", "code", "missionId", "titre", "description", "responsableId",
  "dateEcheance", "statut", "commentaires", "archive", "creeLe", "modifieLe"
)
SELECT
  r."id",
  a."uniteId",
  'REC-' || printf('%04d', ROW_NUMBER() OVER (PARTITION BY a."uniteId" ORDER BY r."creeLe", r."id")),
  r."auditId",
  r."titre",
  r."description",
  r."responsableId",
  r."dateEcheance",
  r."statut",
  r."commentaires",
  0,
  r."creeLe",
  r."modifieLe"
FROM "Recommandation" r
JOIN "Audit" a ON a."id" = r."auditId";
DROP TABLE "Recommandation";
ALTER TABLE "new_Recommandation" RENAME TO "Recommandation";
CREATE INDEX "Recommandation_missionId_statut_idx" ON "Recommandation"("missionId", "statut");
CREATE UNIQUE INDEX "Recommandation_uniteId_code_key" ON "Recommandation"("uniteId", "code");

-- ─── Tache.auditId → missionId ───────────────────────────────
CREATE TABLE "new_Tache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "responsableId" TEXT NOT NULL,
    "projetId" TEXT,
    "conseilId" TEXT,
    "controleSCIId" TEXT,
    "missionId" TEXT,
    "documentId" TEXT,
    "recommandationId" TEXT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'A_FAIRE',
    "priorite" TEXT NOT NULL DEFAULT 'MOYENNE',
    "categorie" TEXT NOT NULL DEFAULT 'AUTRE',
    "commentaires" TEXT,
    "soumisParId" TEXT,
    "valideParId" TEXT,
    "dateSoumission" DATETIME,
    "dateValidation" DATETIME,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "Tache_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_conseilId_fkey" FOREIGN KEY ("conseilId") REFERENCES "Conseil" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_controleSCIId_fkey" FOREIGN KEY ("controleSCIId") REFERENCES "ControleSCI" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_recommandationId_fkey" FOREIGN KEY ("recommandationId") REFERENCES "Recommandation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_soumisParId_fkey" FOREIGN KEY ("soumisParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tache" (
  "id", "uniteId", "titre", "description", "responsableId", "projetId", "conseilId", "controleSCIId",
  "missionId", "documentId", "recommandationId", "dateCreation", "dateEcheance", "statut", "priorite",
  "categorie", "commentaires", "soumisParId", "valideParId", "dateSoumission", "dateValidation",
  "creeParId", "modifieParId", "creeLe", "modifieLe", "meta"
)
SELECT
  "id", "uniteId", "titre", "description", "responsableId", "projetId", "conseilId", "controleSCIId",
  "auditId", "documentId", "recommandationId", "dateCreation", "dateEcheance", "statut", "priorite",
  CASE WHEN "categorie" = 'AUDIT' THEN 'MISSION' ELSE "categorie" END,
  "commentaires", "soumisParId", "valideParId", "dateSoumission", "dateValidation",
  "creeParId", "modifieParId", "creeLe", "modifieLe", "meta"
FROM "Tache";
DROP TABLE "Tache";
ALTER TABLE "new_Tache" RENAME TO "Tache";
CREATE INDEX "Tache_uniteId_statut_dateEcheance_idx" ON "Tache"("uniteId", "statut", "dateEcheance");

-- ─── Drop anciennes tables Audit ─────────────────────────────
DROP TABLE "AuditDocument";
DROP TABLE "AuditMembre";
DROP TABLE "Audit";

-- ─── Codes / liens / objectifs ───────────────────────────────
UPDATE "SequenceCode" SET "prefixe" = 'MIS' WHERE "prefixe" = 'AUD';
UPDATE "LienObjet" SET "typeA" = 'MISSION' WHERE "typeA" = 'AUDIT';
UPDATE "LienObjet" SET "typeB" = 'MISSION' WHERE "typeB" = 'AUDIT';
UPDATE "ObjectifModule" SET "module" = 'MISSION' WHERE "module" = 'AUDIT';
UPDATE "JournalEvenement" SET "typeObjet" = 'MISSION' WHERE "typeObjet" = 'AUDIT';

-- Sequences REC
INSERT INTO "SequenceCode" ("id", "uniteId", "prefixe", "dernier")
SELECT lower(hex(randomblob(8))), u."id", 'REC',
  COALESCE((SELECT COUNT(*) FROM "Recommandation" r WHERE r."uniteId" = u."id"), 0)
FROM "Unite" u
WHERE NOT EXISTS (
  SELECT 1 FROM "SequenceCode" s WHERE s."uniteId" = u."id" AND s."prefixe" = 'REC'
);

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
