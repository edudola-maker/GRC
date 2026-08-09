-- Administration : rôle ADMINISTRATEUR + champs utilisateur
-- RoleUtilisateur est stocké en TEXT (SQLite) — pas de table enum.

-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN "prenom" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN "fonction" TEXT;
