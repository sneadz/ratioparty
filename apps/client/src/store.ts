import { create } from 'zustand'
import type { RoomSnapshot, WavelengthClientState, AvatarConfig } from '@ratioparty/shared'
import { DEFAULT_AVATAR } from './components/avatar/avatar.config.ts'

function loadAvatar(): AvatarConfig {
  try {
    const raw = localStorage.getItem('rp_avatar')
    if (raw) return JSON.parse(raw) as AvatarConfig
  } catch { /* ignore */ }
  return DEFAULT_AVATAR
}

interface AppState {
  playerId: string | null
  playerName: string
  reconnectToken: string | null
  room: RoomSnapshot | null
  gameState: WavelengthClientState | null
  avatarConfig: AvatarConfig

  setPlayer:       (id: string, name: string, token: string) => void
  setRoom:         (room: RoomSnapshot) => void
  setGameState:    (state: WavelengthClientState) => void
  setAvatarConfig: (config: AvatarConfig) => void
  reset:           () => void
}

export const useStore = create<AppState>((set) => ({
  playerId:       null,
  playerName:     '',
  reconnectToken: null,
  room:           null,
  gameState:      null,
  avatarConfig:   loadAvatar(),

  setPlayer:    (playerId, playerName, reconnectToken) => set({ playerId, playerName, reconnectToken }),
  setRoom:      (room) => set({ room }),
  setGameState: (gameState) => set({ gameState }),
  setAvatarConfig: (avatarConfig) => {
    localStorage.setItem('rp_avatar', JSON.stringify(avatarConfig))
    set({ avatarConfig })
  },
  reset: () => set({ playerId: null, playerName: '', reconnectToken: null, room: null, gameState: null }),
}))
