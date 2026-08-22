-- AlterTable Unite
ALTER TABLE "Unite" ADD COLUMN "presentation" TEXT;

-- AlterTable Objectif
ALTER TABLE "Objectif" ADD COLUMN "cible" TEXT;
ALTER TABLE "Objectif" ADD COLUMN "progression" INTEGER NOT NULL DEFAULT 0;

-- AlterTable ActifIT
ALTER TABLE "ActifIT" ADD COLUMN "serviceFourni" TEXT;
ALTER TABLE "ActifIT" ADD COLUMN "criticite" INTEGER;
CREATE INDEX "ActifIT_uniteId_type_idx" ON "ActifIT"("uniteId", "type");

-- CreateTable Macroprocessus
CREATE TABLE "Macroprocessus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "responsableId" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Macroprocessus_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Macroprocessus_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Macroprocessus_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Macroprocessus_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Macroprocessus_uniteId_code_key" ON "Macroprocessus"("uniteId", "code");
CREATE INDEX "Macroprocessus_uniteId_archive_ordre_idx" ON "Macroprocessus"("uniteId", "archive", "ordre");

-- CreateTable MacroprocessusUniteApplicable
CREATE TABLE "MacroprocessusUniteApplicable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "macroprocessusId" TEXT NOT NULL,
    "uniteId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MacroprocessusUniteApplicable_macroprocessusId_fkey" FOREIGN KEY ("macroprocessusId") REFERENCES "Macroprocessus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MacroprocessusUniteApplicable_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MacroprocessusUniteApplicable_macroprocessusId_uniteId_key" ON "MacroprocessusUniteApplicable"("macroprocessusId", "uniteId");
CREATE INDEX "MacroprocessusUniteApplicable_uniteId_idx" ON "MacroprocessusUniteApplicable"("uniteId");

-- AlterTable Processus — macroprocessusId
ALTER TABLE "Processus" ADD COLUMN "macroprocessusId" TEXT;
CREATE INDEX "Processus_macroprocessusId_idx" ON "Processus"("macroprocessusId");

-- CreateTable ProcessusUniteApplicable
CREATE TABLE "ProcessusUniteApplicable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processusId" TEXT NOT NULL,
    "uniteId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessusUniteApplicable_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessusUniteApplicable_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProcessusUniteApplicable_processusId_uniteId_key" ON "ProcessusUniteApplicable"("processusId", "uniteId");
CREATE INDEX "ProcessusUniteApplicable_uniteId_idx" ON "ProcessusUniteApplicable"("uniteId");
