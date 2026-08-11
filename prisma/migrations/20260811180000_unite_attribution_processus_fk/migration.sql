-- UniteAttribution + Risque.processusId + Projet.contenuVersion

CREATE TABLE "UniteAttribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "UniteAttribution_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "UniteAttribution_uniteId_ordre_idx" ON "UniteAttribution"("uniteId", "ordre");

ALTER TABLE "Risque" ADD COLUMN "processusId" TEXT;
CREATE INDEX "Risque_processusId_idx" ON "Risque"("processusId");

ALTER TABLE "Projet" ADD COLUMN "contenuVersion" INTEGER NOT NULL DEFAULT 1;
