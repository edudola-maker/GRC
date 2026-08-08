-- Modèles de tâches + checklist d'occurrence
-- MODELE_TACHE ajouté à TypeObjetMetier (SQLite = TEXT libre)

-- AlterTable
ALTER TABLE "Tache" ADD COLUMN "modeleTacheId" TEXT;

-- CreateTable
CREATE TABLE "TacheChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tacheId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "fait" BOOLEAN NOT NULL DEFAULT false,
    "faitParId" TEXT,
    "faitLe" DATETIME,
    "sourceModeleEtapeId" TEXT,
    CONSTRAINT "TacheChecklistItem_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "Tache" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TacheChecklistItem_faitParId_fkey" FOREIGN KEY ("faitParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModeleTache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "delaiJours" INTEGER,
    "responsableDefautId" TEXT,
    "categorieDefaut" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "ModeleTache_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ModeleTache_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ModeleTache_responsableDefautId_fkey" FOREIGN KEY ("responsableDefautId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModeleTacheEtape" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modeleTacheId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "libelle" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "ModeleTacheEtape_modeleTacheId_fkey" FOREIGN KEY ("modeleTacheId") REFERENCES "ModeleTache" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModeleTacheProcessus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modeleTacheId" TEXT NOT NULL,
    "processusId" TEXT NOT NULL,
    "lieParId" TEXT NOT NULL,
    "lieLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModeleTacheProcessus_modeleTacheId_fkey" FOREIGN KEY ("modeleTacheId") REFERENCES "ModeleTache" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModeleTacheProcessus_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModeleTacheProcessus_lieParId_fkey" FOREIGN KEY ("lieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TacheChecklistItem_tacheId_ordre_idx" ON "TacheChecklistItem"("tacheId", "ordre");

-- CreateIndex
CREATE INDEX "Tache_modeleTacheId_idx" ON "Tache"("modeleTacheId");

-- CreateIndex
CREATE INDEX "ModeleTache_uniteId_actif_idx" ON "ModeleTache"("uniteId", "actif");

-- CreateIndex
CREATE INDEX "ModeleTache_uniteId_nom_idx" ON "ModeleTache"("uniteId", "nom");

-- CreateIndex
CREATE UNIQUE INDEX "ModeleTache_uniteId_code_key" ON "ModeleTache"("uniteId", "code");

-- CreateIndex
CREATE INDEX "ModeleTacheEtape_modeleTacheId_ordre_idx" ON "ModeleTacheEtape"("modeleTacheId", "ordre");

-- CreateIndex
CREATE INDEX "ModeleTacheProcessus_processusId_idx" ON "ModeleTacheProcessus"("processusId");

-- CreateIndex
CREATE INDEX "ModeleTacheProcessus_modeleTacheId_idx" ON "ModeleTacheProcessus"("modeleTacheId");

-- CreateIndex
CREATE UNIQUE INDEX "ModeleTacheProcessus_modeleTacheId_processusId_key" ON "ModeleTacheProcessus"("modeleTacheId", "processusId");
