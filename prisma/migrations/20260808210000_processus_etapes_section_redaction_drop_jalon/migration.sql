-- Processus étapes, section rédaction (brouillon), Projet.reflexion, drop Jalon
-- PROCESSUS_ETAPE ajouté à TypeObjetMetier (SQLite = TEXT libre)

-- AlterTable
ALTER TABLE "Projet" ADD COLUMN "reflexion" TEXT;

-- DropTable
DROP TABLE IF EXISTS "Jalon";

-- CreateTable
CREATE TABLE "ProcessusEtape" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processusId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProcessusEtape_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SectionRedaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "typeObjet" TEXT NOT NULL,
    "objetId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "etat" TEXT NOT NULL DEFAULT 'BROUILLON',
    "contenuVersion" INTEGER NOT NULL DEFAULT 1,
    "modifieParId" TEXT NOT NULL,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "SectionRedaction_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SectionRedaction_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProcessusEtape_processusId_ordre_idx" ON "ProcessusEtape"("processusId", "ordre");

-- CreateIndex
CREATE INDEX "SectionRedaction_typeObjet_objetId_idx" ON "SectionRedaction"("typeObjet", "objetId");

-- CreateIndex
CREATE INDEX "SectionRedaction_uniteId_etat_idx" ON "SectionRedaction"("uniteId", "etat");

-- CreateIndex
CREATE UNIQUE INDEX "SectionRedaction_typeObjet_objetId_sectionKey_key" ON "SectionRedaction"("typeObjet", "objetId", "sectionKey");
