-- AlterTable Risque : résiduel
ALTER TABLE "Risque" ADD COLUMN "probabiliteResiduelle" INTEGER;
ALTER TABLE "Risque" ADD COLUMN "impactResiduel" INTEGER;
ALTER TABLE "Risque" ADD COLUMN "criticiteResiduelle" INTEGER;

-- AlterTable Audit : type de mission
ALTER TABLE "Audit" ADD COLUMN "typeMission" TEXT NOT NULL DEFAULT 'AUDIT';

-- CreateTable LienObjet
CREATE TABLE "LienObjet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "typeA" TEXT NOT NULL,
    "idA" TEXT NOT NULL,
    "typeB" TEXT NOT NULL,
    "idB" TEXT NOT NULL,
    "libelle" TEXT,
    "creeParId" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LienObjet_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "LienObjet_uniteId_typeA_idA_typeB_idB_key" ON "LienObjet"("uniteId", "typeA", "idA", "typeB", "idB");
CREATE INDEX "LienObjet_uniteId_typeA_idA_idx" ON "LienObjet"("uniteId", "typeA", "idA");
CREATE INDEX "LienObjet_uniteId_typeB_idB_idx" ON "LienObjet"("uniteId", "typeB", "idB");
