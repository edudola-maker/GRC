-- Dépendances tâches Projet + réévaluations Risque

CREATE TABLE "TacheDependance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projetId" TEXT NOT NULL,
    "tacheId" TEXT NOT NULL,
    "prerequisId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TacheDependance_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TacheDependance_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "Tache" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TacheDependance_prerequisId_fkey" FOREIGN KEY ("prerequisId") REFERENCES "Tache" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TacheDependance_tacheId_prerequisId_key" ON "TacheDependance"("tacheId", "prerequisId");
CREATE INDEX "TacheDependance_projetId_idx" ON "TacheDependance"("projetId");
CREATE INDEX "TacheDependance_prerequisId_idx" ON "TacheDependance"("prerequisId");

CREATE TABLE "RisqueReevaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "risqueId" TEXT NOT NULL,
    "uniteId" TEXT NOT NULL,
    "dateReevaluation" DATETIME NOT NULL,
    "auteurId" TEXT NOT NULL,
    "probabiliteAvant" INTEGER NOT NULL,
    "impactAvant" INTEGER NOT NULL,
    "criticiteAvant" INTEGER NOT NULL,
    "probabiliteApres" INTEGER NOT NULL,
    "impactApres" INTEGER NOT NULL,
    "criticiteApres" INTEGER NOT NULL,
    "probabiliteResiduelleAvant" INTEGER,
    "impactResiduelAvant" INTEGER,
    "criticiteResiduelleAvant" INTEGER,
    "probabiliteResiduelleApres" INTEGER,
    "impactResiduelApres" INTEGER,
    "criticiteResiduelleApres" INTEGER,
    "commentaire" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RisqueReevaluation_risqueId_fkey" FOREIGN KEY ("risqueId") REFERENCES "Risque" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RisqueReevaluation_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RisqueReevaluation_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "RisqueReevaluation_risqueId_dateReevaluation_idx" ON "RisqueReevaluation"("risqueId", "dateReevaluation");
CREATE INDEX "RisqueReevaluation_uniteId_dateReevaluation_idx" ON "RisqueReevaluation"("uniteId", "dateReevaluation");
