// ─── Game options ─────────────────────────────────────────────────────────────

export type TimerPreset = 'off' | 'fast' | 'medium' | 'long'

export interface GameOptions {
  rounds: number       // nombre de manches complètes (chaque joueur capitaine N fois)
  timer: TimerPreset
}

export const TIMER_DURATIONS: Record<Exclude<TimerPreset, 'off'>, { clue: number; guess: number }> = {
  fast:   { clue: 30,  guess: 20 },
  medium: { clue: 60,  guess: 45 },
  long:   { clue: 120, guess: 90 },
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export interface AvatarConfig {
  background: string
  skin: string
  hair: string
  eyes: string
  mouth: string
  clothes: string
}

// ─── Lobby ───────────────────────────────────────────────────────────────────

export interface Player {
  id: string
  name: string
  isConnected: boolean
  isHost: boolean
  avatarConfig?: AvatarConfig
}

export interface RoomSnapshot {
  id: string
  hostId: string
  players: Player[]
  status: 'lobby' | 'playing' | 'results'
  selectedGame: string | null
  cumulativeScores: Record<string, number>
}

// ─── Wavelength ───────────────────────────────────────────────────────────────

export interface Spectrum {
  left: string
  right: string
}

/** Zones de score autour de la cible (valeurs en unités 0-100) */
export const SCORE_ZONES = {
  BULLSEYE: 3,  // ±3  → 4 pts
  CLOSE:    7,  // ±7  → 3 pts
  NEAR:    12,  // ±12 → 2 pts
  // au-delà → 0 pt
} as const

export function computeScore(target: number, guess: number): number {
  const diff = Math.abs(target - guess)
  if (diff <= SCORE_ZONES.BULLSEYE) return 4
  if (diff <= SCORE_ZONES.CLOSE)    return 3
  if (diff <= SCORE_ZONES.NEAR)     return 2
  return 0
}

/** État du jeu filtré pour un joueur donné */
export interface WavelengthClientState {
  phase: 'giving_clue' | 'guessing' | 'reveal'
  captainId: string
  spectrum: Spectrum
  /** null pour les non-capitaines pendant giving_clue et guessing */
  target: number | null
  clue: string | null
  /** Curseur partagé (0-100) — tout le monde le voit en temps réel */
  cursorPosition: number
  roundScore: number | null       // score obtenu ce round, visible en reveal
  cumulativeScores: Record<string, number>
  round: number
  maxRounds: number
  timer: TimerPreset
  phaseStartedAt: number
}

export type WavelengthAction =
  | { type: 'submit_clue'; clue: string }
  | { type: 'move_cursor'; position: number }
  | { type: 'lock_guess' }
  | { type: 'next_round' }
