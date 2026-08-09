-- Pilote versioning : HistoriqueModification générique + contenuVersion sur Risque

CREATE TABLE "HistoriqueModification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT,
    "typeObjet" TEXT NOT NULL,
    "objetId" TEXT NOT NULL,
    "champ" TEXT NOT NULL,
    "ancienneValeur" TEXT,
    "nouvelleValeur" TEXT,
    "modifieParId" TEXT NOT NULL,
    "modifieLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motif" TEXT,
    "versionObjet" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "HistoriqueModification_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HistoriqueModification_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "HistoriqueModification_typeObjet_objetId_modifieLe_idx"
  ON "HistoriqueModification"("typeObjet", "objetId", "modifieLe");
CREATE INDEX "HistoriqueModification_uniteId_modifieLe_idx"
  ON "HistoriqueModification"("uniteId", "modifieLe");
CREATE INDEX "HistoriqueModification_typeObjet_objetId_versionObjet_idx"
  ON "HistoriqueModification"("typeObjet", "objetId", "versionObjet");

ALTER TABLE "Risque" ADD COLUMN "contenuVersion" INTEGER NOT NULL DEFAULT 1;
