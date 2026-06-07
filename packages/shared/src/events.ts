import type { RoomSnapshot } from './types.js'

// ─── Client → Serveur ────────────────────────────────────────────────────────

export interface ClientToServerEvents {
  /** Crée une nouvelle room et y entre comme hôte */
  create_room: (playerName: string) => void

  /** Rejoint une room existante via son code */
  join_room: (data: { code: string; playerName: string }) => void

  /** Reconnexion après déconnexion (token stocké en localStorage) */
  reconnect_room: (data: { code: string; reconnectToken: string }) => void
}

// ─── Serveur → Client ────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  /** Confirmation d'entrée dans une room (état initial complet) */
  room_joined: (data: {
    room: RoomSnapshot
    playerId: string
    reconnectToken: string
  }) => void

  /** Mise à jour de l'état de la room (join/leave/start…) */
  room_updated: (room: RoomSnapshot) => void

  /** Erreur métier (room introuvable, pseudo invalide…) */
  error: (data: { message: string }) => void
}
