-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Projet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "responsableId" TEXT NOT NULL,
    "dateDebut" DATETIME,
    "dateEcheance" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'A_FAIRE',
    "priorite" TEXT NOT NULL DEFAULT 'MOYENNE',
    "avancement" INTEGER NOT NULL DEFAULT 0,
    "commentaires" TEXT,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Projet_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Projet_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Projet_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "responsableId" TEXT NOT NULL,
    "projetId" TEXT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'A_FAIRE',
    "priorite" TEXT NOT NULL DEFAULT 'MOYENNE',
    "commentaires" TEXT,
    "soumisParId" TEXT,
    "valideParId" TEXT,
    "dateSoumission" DATETIME,
    "dateValidation" DATETIME,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Tache_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_soumisParId_fkey" FOREIGN KEY ("soumisParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoriqueTache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tacheId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "modifieLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "champModifie" TEXT NOT NULL,
    "ancienneValeur" TEXT,
    "nouvelleValeur" TEXT,
    CONSTRAINT "HistoriqueTache_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "Tache" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistoriqueTache_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ControleSCI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "processusConcerne" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "frequence" TEXT NOT NULL,
    "dateDerniereRealisation" DATETIME,
    "dateProchaineEcheance" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'A_REALISER',
    "commentaires" TEXT,
    "soumisParId" TEXT,
    "valideParId" TEXT,
    "dateSoumission" DATETIME,
    "dateValidation" DATETIME,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "ControleSCI_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ControleSCI_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ControleSCI_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ControleSCI_soumisParId_fkey" FOREIGN KEY ("soumisParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ControleSCI_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomFichier" TEXT NOT NULL,
    "nomStockage" TEXT NOT NULL,
    "chemin" TEXT NOT NULL,
    "typeMime" TEXT,
    "taille" INTEGER,
    "description" TEXT,
    "creeParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Document_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ControleDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "controleSCIId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "typeLien" TEXT NOT NULL DEFAULT 'preuve',
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ControleDocument_controleSCIId_fkey" FOREIGN KEY ("controleSCIId") REFERENCES "ControleSCI" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ControleDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ControleDocument_controleSCIId_documentId_key" ON "ControleDocument"("controleSCIId", "documentId");
