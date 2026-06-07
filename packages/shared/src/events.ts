import type { RoomSnapshot, WavelengthClientState, WavelengthAction } from './types.js'

// ─── Client → Serveur ────────────────────────────────────────────────────────

export interface ClientToServerEvents {
  create_room:    (data: { playerName: string; avatarConfig?: import('./types.js').AvatarConfig }) => void
  join_room:      (data: { code: string; playerName: string; avatarConfig?: import('./types.js').AvatarConfig }) => void
  reconnect_room: (data: { code: string; reconnectToken: string }) => void
  game_start:     () => void
  game_action:    (action: WavelengthAction) => void
}

// ─── Serveur → Client ────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  room_joined:      (data: { room: RoomSnapshot; playerId: string; reconnectToken: string }) => void
  room_updated:     (room: RoomSnapshot) => void
  game_state_update:(state: WavelengthClientState) => void
  error:            (data: { message: string }) => void
}
