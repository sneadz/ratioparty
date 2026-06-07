import { create } from 'zustand'
import type { RoomSnapshot } from '@ratioparty/shared'

interface AppState {
  // Identité du joueur local
  playerId: string | null
  playerName: string
  reconnectToken: string | null

  // État de la room
  room: RoomSnapshot | null

  // Actions
  setPlayer: (id: string, name: string, token: string) => void
  setRoom: (room: RoomSnapshot) => void
  reset: () => void
}

export const useStore = create<AppState>((set) => ({
  playerId: null,
  playerName: '',
  reconnectToken: null,
  room: null,

  setPlayer: (playerId, playerName, reconnectToken) =>
    set({ playerId, playerName, reconnectToken }),

  setRoom: (room) => set({ room }),

  reset: () => set({ playerId: null, playerName: '', reconnectToken: null, room: null }),
}))
