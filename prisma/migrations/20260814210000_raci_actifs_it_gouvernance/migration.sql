-- CreateTable
CREATE TABLE "ProcessusRaciLigne" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processusId" TEXT NOT NULL,
    "etapeId" TEXT,
    "activite" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "ProcessusRaciLigne_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessusRaciLigne_etapeId_fkey" FOREIGN KEY ("etapeId") REFERENCES "ProcessusEtape" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessusRaciParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ligneId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "utilisateurId" TEXT,
    "libelleFonction" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessusRaciParticipant_ligneId_fkey" FOREIGN KEY ("ligneId") REFERENCES "ProcessusRaciLigne" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessusRaciParticipant_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActifIT" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'APPLICATION',
    "description" TEXT,
    "responsableId" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'ACTIF',
    "fournisseur" TEXT,
    "hebergement" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "ActifIT_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActifIT_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActifIT_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActifIT_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessusActifIT" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processusId" TEXT NOT NULL,
    "actifITId" TEXT NOT NULL,
    "lieParId" TEXT NOT NULL,
    "lieLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessusActifIT_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessusActifIT_actifITId_fkey" FOREIGN KEY ("actifITId") REFERENCES "ActifIT" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessusActifIT_lieParId_fkey" FOREIGN KEY ("lieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProcessusRaciLigne_processusId_ordre_idx" ON "ProcessusRaciLigne"("processusId", "ordre");

-- CreateIndex
CREATE INDEX "ProcessusRaciLigne_etapeId_idx" ON "ProcessusRaciLigne"("etapeId");

-- CreateIndex
CREATE INDEX "ProcessusRaciParticipant_ligneId_role_idx" ON "ProcessusRaciParticipant"("ligneId", "role");

-- CreateIndex
CREATE INDEX "ProcessusRaciParticipant_utilisateurId_idx" ON "ProcessusRaciParticipant"("utilisateurId");

-- CreateIndex
CREATE INDEX "ActifIT_uniteId_archive_statut_idx" ON "ActifIT"("uniteId", "archive", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "ActifIT_uniteId_code_key" ON "ActifIT"("uniteId", "code");

-- CreateIndex
CREATE INDEX "ProcessusActifIT_actifITId_idx" ON "ProcessusActifIT"("actifITId");

-- CreateIndex
CREATE INDEX "ProcessusActifIT_processusId_idx" ON "ProcessusActifIT"("processusId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessusActifIT_processusId_actifITId_key" ON "ProcessusActifIT"("processusId", "actifITId");
