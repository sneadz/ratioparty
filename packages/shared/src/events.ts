import type { RoomSnapshot, WavelengthClientState, WavelengthAction, GameOptions } from './types.js'

// ─── Client → Serveur ────────────────────────────────────────────────────────

export interface ClientToServerEvents {
  create_room:    (data: { playerName: string; avatarConfig?: import('./types.js').AvatarConfig }) => void
  join_room:      (data: { code: string; playerName: string; avatarConfig?: import('./types.js').AvatarConfig }) => void
  reconnect_room: (data: { code: string; reconnectToken: string }) => void
  select_game:    (gameId: string | null) => void
  game_start:     (options?: GameOptions) => void
  game_action:    (action: WavelengthAction) => void
  game_abort:     () => void
  kick_player:    (playerId: string) => void
}

// ─── Serveur → Client ────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  room_joined:      (data: { room: RoomSnapshot; playerId: string; reconnectToken: string }) => void
  room_updated:     (room: RoomSnapshot) => void
  game_state_update:(state: WavelengthClientState) => void
  error:            (data: { message: string }) => void
}
