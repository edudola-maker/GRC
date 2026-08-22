-- CreateTable
CREATE TABLE "ProjetEtape" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projetId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "poids" INTEGER NOT NULL DEFAULT 0,
    "avancement" INTEGER NOT NULL DEFAULT 0,
    "termine" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "ProjetEtape_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ProjetEtape_projetId_ordre_idx" ON "ProjetEtape"("projetId", "ordre");
