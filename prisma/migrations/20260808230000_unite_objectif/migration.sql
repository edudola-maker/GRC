-- Fiche Unité métier + Objectif stratégique (OBJ-xxxx)
-- UNITE / OBJECTIF ajoutés à TypeObjetMetier (SQLite = TEXT libre)

-- AlterTable Unite
ALTER TABLE "Unite" ADD COLUMN "description" TEXT;
ALTER TABLE "Unite" ADD COLUMN "responsableId" TEXT;
ALTER TABLE "Unite" ADD COLUMN "adjointId" TEXT;

-- CreateTable Objectif
CREATE TABLE "Objectif" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "description" TEXT,
    "annee" INTEGER NOT NULL,
    "responsableId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
    "priorite" TEXT NOT NULL DEFAULT 'MOYENNE',
    "dateEcheance" DATETIME,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Objectif_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Objectif_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Objectif_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Objectif_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Objectif_uniteId_code_key" ON "Objectif"("uniteId", "code");
CREATE INDEX "Objectif_uniteId_annee_statut_idx" ON "Objectif"("uniteId", "annee", "statut");
CREATE INDEX "Objectif_uniteId_intitule_idx" ON "Objectif"("uniteId", "intitule");

-- Migrate demo unit codes U-* → UNT-*
UPDATE "Unite" SET "code" = 'UNT-0001' WHERE "code" = 'U-GRC';
UPDATE "Unite" SET "code" = 'UNT-0002' WHERE "code" = 'U-FIN';
