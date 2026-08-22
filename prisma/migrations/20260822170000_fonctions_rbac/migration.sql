-- Fonctions organisationnelles + RBAC architecture (SQLite).
-- RoleUtilisateur.LECTURE_SEULE = valeur texte autorisée côté app.

CREATE TABLE "Fonction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "roleApplicatif" TEXT,
    "perimetre" TEXT NOT NULL DEFAULT 'MON_UNITE',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Fonction_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Fonction_uniteId_code_key" ON "Fonction"("uniteId", "code");
CREATE INDEX "Fonction_uniteId_archive_actif_idx" ON "Fonction"("uniteId", "archive", "actif");

CREATE TABLE "FonctionAffectation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fonctionId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TITULAIRE',
    "debut" DATETIME,
    "fin" DATETIME,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FonctionAffectation_fonctionId_fkey" FOREIGN KEY ("fonctionId") REFERENCES "Fonction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FonctionAffectation_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "FonctionAffectation_fonctionId_utilisateurId_type_key" ON "FonctionAffectation"("fonctionId", "utilisateurId", "type");
CREATE INDEX "FonctionAffectation_utilisateurId_idx" ON "FonctionAffectation"("utilisateurId");
CREATE INDEX "FonctionAffectation_fonctionId_type_idx" ON "FonctionAffectation"("fonctionId", "type");

CREATE TABLE "PermissionException" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "utilisateurId" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "accord" BOOLEAN NOT NULL DEFAULT true,
    "motif" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "PermissionException_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PermissionException_utilisateurId_permissionKey_key" ON "PermissionException"("utilisateurId", "permissionKey");
CREATE INDEX "PermissionException_utilisateurId_idx" ON "PermissionException"("utilisateurId");

ALTER TABLE "ProcessusRaciParticipant" ADD COLUMN "fonctionId" TEXT REFERENCES "Fonction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "ProcessusRaciParticipant_fonctionId_idx" ON "ProcessusRaciParticipant"("fonctionId");
