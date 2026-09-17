-- Stratégie : mission Organisation, axes stratégiques, enrichissement Objectif

-- AlterTable
ALTER TABLE "Organisation" ADD COLUMN "mission" TEXT;

-- CreateTable
CREATE TABLE "AxeStrategique" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "periode" TEXT,
    "responsableId" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'ACTIF',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "AxeStrategique_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AxeStrategique_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AxeStrategique_organisationId_code_key" ON "AxeStrategique"("organisationId", "code");
CREATE INDEX "AxeStrategique_organisationId_ordre_idx" ON "AxeStrategique"("organisationId", "ordre");

-- AlterTable Objectif
ALTER TABLE "Objectif" ADD COLUMN "indicateur" TEXT;
ALTER TABLE "Objectif" ADD COLUMN "uniteMesure" TEXT;
ALTER TABLE "Objectif" ADD COLUMN "axeStrategiqueId" TEXT;

CREATE INDEX "Objectif_axeStrategiqueId_idx" ON "Objectif"("axeStrategiqueId");
