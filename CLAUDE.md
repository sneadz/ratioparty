# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes essentielles

```bash
# Installer toutes les dépendances (depuis la racine)
pnpm install

# Lancer en développement (server + client en parallèle)
pnpm dev

# Build complet (dans l'ordre : shared → server → client)
pnpm build

# Travailler sur un package isolé
pnpm --filter shared build
pnpm --filter server dev
pnpm --filter client dev
```

Le serveur tourne sur `http://localhost:3001`, le client sur `http://localhost:5173`.

## Stack

- **Monorepo** : pnpm workspaces (`apps/*`, `packages/*`)
- **Backend** (`apps/server`) : Node.js + Express + Socket.io, TypeScript compilé avec `tsx watch` en dev
- **Frontend** (`apps/client`) : React 18 + Vite + React Router v6, état global via Zustand
- **Types partagés** (`packages/shared`) : package `@ratioparty/shared`, importé des deux côtés — toujours faire les modifications de types ici en premier

## Architecture

### Séparation autoritaire serveur / client

Le serveur est la **seule source de vérité**. Le client ne déduit jamais d'état — il reçoit des snapshots via Socket.io.

- `Room` (serveur) contient l'état interne complet, dont les `reconnectToken` (UUID, jamais envoyés au client en clair sauf au joueur concerné via `room_joined`)
- `RoomSnapshot` (shared) est la vue publique envoyée à tous — sans données sensibles
- Chaque client reçoit `room_updated` après toute mutation d'état côté serveur

### Flux Socket.io

Tous les événements sont typés dans `packages/shared/src/events.ts` :

```
ClientToServerEvents : create_room | join_room | reconnect_room
ServerToClientEvents : room_joined | room_updated | error
```

Sur le client, les listeners globaux (`room_joined`, `room_updated`, `error`) vivent dans le composant `SocketBridge` dans `App.tsx`. Les pages ne s'abonnent pas directement aux events socket — elles lisent le store Zustand.

### Reconnexion

À la déconnexion, le joueur reste dans la room avec `isConnected: false`. À la reconnexion (`reconnect_room`), le serveur retrouve le joueur via son `reconnectToken` et lui réattribue le nouveau `socket.id`. Le token est persisté dans `localStorage` (`rp_code` + `rp_token`) et lu au montage de `SocketBridge`.

### Game Engine (à implémenter)

L'architecture prévue pour ajouter des jeux est un système de plugins. Chaque jeu doit implémenter `IGamePlugin` :

```typescript
interface IGamePlugin<TState, TAction> {
  id: string
  minPlayers: number
  maxPlayers: number
  init(players: Player[], options?: unknown): TState
  handleAction(state: TState, playerId: string, action: TAction): TState
  getStateForPlayer(state: TState, playerId: string): Partial<TState>
  computeRoundScores(state: TState): Record<string, number>
  isRoundOver(state: TState): boolean
}
```

Les plugins se placent dans `apps/server/src/games/<nom-du-jeu>/index.ts` et s'enregistrent dans `GameEngine`. Le `GameEngine` dispatch les actions reçues via socket au plugin actif, puis broadcast l'état filtré par joueur (`getStateForPlayer`). Les vues des jeux côté client vont dans `apps/client/src/games/<nom-du-jeu>/`.

## Roadmap des jeux

### Priorité 1 — En cours
**Wavelength** (`wavelength`)
- Spectre à deux extrêmes (ex: "Surcoté ↔ Sous-coté"), cible cachée placée aléatoirement
- Le capitaine du tour voit la cible et donne un indice ; les autres placent un curseur 0–100
- Score selon la proximité avec la cible ; rotation du capitaine chaque manche
- Banque de ~30 spectres en français dans `apps/server/src/games/wavelength/spectra.ts`
- `getStateForPlayer` doit masquer la position de la cible aux non-capitaines

### Priorité 2 — Architecture à anticiper
Ces jeux partagent le pattern "soumission cachée → révélation → vote/score" :

- **Quiplash** : prompt absurde → chacun soumet une réponse → vote anonyme
- **Balderdash** : mot rare → chacun invente une définition → vote (mélangée avec la vraie)

Ces deux jeux doivent être des **configurations** du même moteur générique, pas des plugins séparés.

- **Undercover / Mr. White** : rôles cachés, descriptions à tour de rôle, vote d'élimination — plugin indépendant, réutilise uniquement le lobby/vote

## Conventions

- **Langue** : commentaires et messages UI en français ; noms de variables/fonctions/types en anglais
- **Imports serveur** : toujours ajouter l'extension `.js` (ex: `./room/Room.js`) — requis par ESM Node.js même pour des fichiers `.ts`
- **Imports client** : extensions `.ts`/`.tsx` explicites (Vite + `allowImportingTsExtensions`)
- **Types Socket.io** : instancier `Server` et `Socket` avec les génériques `<ClientToServerEvents, ServerToClientEvents>` — ne jamais utiliser les types non-typés
- **Mutations de room** : toujours terminer par un `io.to(room.id).emit('room_updated', room.toSnapshot())` pour que tous les clients soient synchronisés
- **État in-memory** : les rooms n'ont pas de persistance (RAM uniquement). `RoomManager` est un singleton exporté — ne pas en créer d'autres instances
