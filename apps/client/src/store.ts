import { create } from 'zustand'
import type { RoomSnapshot, WavelengthClientState } from '@ratioparty/shared'

interface AppState {
  playerId: string | null
  playerName: string
  reconnectToken: string | null
  room: RoomSnapshot | null
  gameState: WavelengthClientState | null

  setPlayer:    (id: string, name: string, token: string) => void
  setRoom:      (room: RoomSnapshot) => void
  setGameState: (state: WavelengthClientState) => void
  reset:        () => void
}

export const useStore = create<AppState>((set) => ({
  playerId:      null,
  playerName:    '',
  reconnectToken: null,
  room:          null,
  gameState:     null,

  setPlayer:    (playerId, playerName, reconnectToken) => set({ playerId, playerName, reconnectToken }),
  setRoom:      (room) => set({ room }),
  setGameState: (gameState) => set({ gameState }),
  reset:        () => set({ playerId: null, playerName: '', reconnectToken: null, room: null, gameState: null }),
}))
