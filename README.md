# GRC — Pilotage & Monitoring

Application web interne de pilotage pour une unité administrative.

## Module 1 (MVP)

- **Pilotage** — tableau de bord (données réelles SQLite)
- **Backlog** — tâches à traiter + filtres
- **Tâches** — CRUD complet (dont catégorie Conseil sans projet)
- **Projets** — CRUD complet
- **Contrôles SCI** — placeholder (prochaine étape)

## Prérequis

- Node.js 20+
- npm

## Démarrage local

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js (App Router) + TypeScript
- Prisma + SQLite (`prisma/dev.db`)
- Tailwind CSS

## Notes

- Les fichiers joints (preuves SCI) seront stockés hors base dans `uploads/`.
- La vue **Équipe** et la personnalisation des listes (catégories, statuts) sont prévues dans l'architecture mais pas encore exposées.
- Sans authentification pour l'instant : le premier utilisateur actif sert d'auteur des créations/modifications.
