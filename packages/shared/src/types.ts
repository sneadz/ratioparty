// Représentation publique d'un joueur (envoyée aux clients)
export interface Player {
  id: string
  name: string
  isConnected: boolean
  isHost: boolean
}

// Snapshot de la room envoyé aux clients (pas de données sensibles)
export interface RoomSnapshot {
  id: string         // le code court "XK92F"
  hostId: string
  players: Player[]
  status: 'lobby' | 'playing' | 'results'
}
