# GRC — Pilotage & Monitoring

Application web interne de pilotage pour une unité administrative.

## Module 1 (MVP en cours)

- **Pilotage** — tableau de bord (synthèse, à traiter, calendrier)
- **Backlog** — (à venir)
- **Projets** — (à venir)
- **Contrôles SCI** — (à venir)

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
- Prisma + SQLite (fichier local `prisma/dev.db`)
- Tailwind CSS

## Données

Les données de démonstration sont chargées via `npm run db:seed`.
Les fichiers joints (preuves SCI) seront stockés hors base dans `uploads/` ; la base ne conserve que les métadonnées.
