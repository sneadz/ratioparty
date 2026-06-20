import type { Player, WavelengthClientState, WavelengthAction, Spectrum, GameOptions, TimerPreset } from '@ratioparty/shared'
import { computeScore } from '@ratioparty/shared'
import type { IGamePlugin } from '../../engine/IGamePlugin.js'
import { pickSpectrum } from './spectra.js'

// ─── État serveur (complet, autoritaire) ─────────────────────────────────────

export interface WavelengthServerState {
  phase: 'giving_clue' | 'guessing' | 'reveal'
  captainOrder: string[]       // IDs dans l'ordre de rotation
  currentCaptainIndex: number
  spectrum: Spectrum
  usedSpectra: Spectrum[]
  target: number               // 0-100
  clue: string | null
  cursorPositions: Record<string, number>  // 0-100, par playerId (non-capitaines uniquement)
  cumulativeScores: Record<string, number>
  roundScore: number | null    // score obtenu ce round
  roundWinnerId: string | null // joueur le plus proche ce round
  disconnectedIds: string[]    // joueurs actuellement déconnectés
  round: number                // commence à 1
  maxRounds: number
  timer: TimerPreset
  phaseStartedAt: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomTarget(): number {
  return Math.floor(Math.random() * 101)
}

function averageCursor(positions: Record<string, number>, nonCaptainIds: string[]): number {
  if (nonCaptainIds.length === 0) return 50
  const sum = nonCaptainIds.reduce((acc, id) => acc + (positions[id] ?? 50), 0)
  return Math.round(sum / nonCaptainIds.length)
}

function nextConnectedCaptainIndex(captainOrder: string[], currentIndex: number, disconnectedIds: string[]): number {
  const disconnected = new Set(disconnectedIds)
  for (let i = 1; i <= captainOrder.length; i++) {
    const idx = (currentIndex + i) % captainOrder.length
    if (!disconnected.has(captainOrder[idx])) return idx
  }
  return (currentIndex + 1) % captainOrder.length // fallback
}

function newRoundState(
  prev: Pick<WavelengthServerState, 'captainOrder' | 'cumulativeScores' | 'usedSpectra' | 'disconnectedIds'>,
  round: number,
  maxRounds: number,
  captainIndex: number,
  timer: TimerPreset,
): Omit<WavelengthServerState, 'captainOrder' | 'cumulativeScores'> {
  const spectrum = pickSpectrum(prev.usedSpectra)
  return {
    phase: 'giving_clue',
    currentCaptainIndex: captainIndex,
    spectrum,
    usedSpectra: [...prev.usedSpectra, spectrum],
    target: randomTarget(),
    clue: null,
    cursorPositions: {},
    roundScore: null,
    roundWinnerId: null,
    disconnectedIds: prev.disconnectedIds,
    round,
    maxRounds,
    timer,
    phaseStartedAt: Date.now(),
  }
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export const wavelengthPlugin: IGamePlugin<
  WavelengthServerState,
  WavelengthAction,
  WavelengthClientState
> = {
  id: 'wavelength',
  minPlayers: 2,
  maxPlayers: 8,

  init(players: Player[], options?: GameOptions): WavelengthServerState {
    const captainOrder = players.map((p) => p.id)
    const rounds = options?.rounds ?? 1
    const maxRounds = captainOrder.length * rounds
    const timer = options?.timer ?? 'medium'
    const cumulativeScores = Object.fromEntries(captainOrder.map((id) => [id, 0]))

    return {
      captainOrder,
      cumulativeScores,
      ...newRoundState({ captainOrder, cumulativeScores, usedSpectra: [], disconnectedIds: [] }, 1, maxRounds, 0, timer),
    }
  },

  handleAction(state: WavelengthServerState, playerId: string, action: WavelengthAction): WavelengthServerState {
    const captainId = state.captainOrder[state.currentCaptainIndex]

    switch (action.type) {

      case 'submit_clue': {
        if (playerId !== captainId) return state
        if (state.phase !== 'giving_clue') return state
        if (!action.clue?.trim()) return state
        return { ...state, phase: 'guessing', clue: action.clue.trim(), phaseStartedAt: Date.now() }
      }

      case 'move_cursor': {
        if (playerId === captainId) return state  // capitaine ne peut pas bouger
        if (state.phase !== 'guessing') return state
        const position = Math.max(0, Math.min(100, action.position))
        return { ...state, cursorPositions: { ...state.cursorPositions, [playerId]: position } }
      }

      case 'lock_guess': {
        if (playerId === captainId) return state  // capitaine ne valide pas
        if (state.phase !== 'guessing') return state

        const nonCaptainIds = state.captainOrder.filter((id) => id !== captainId && !state.disconnectedIds.includes(id))

        // Trouver le joueur le plus proche de la cible
        let winnerId: string | null = null
        let bestDist = Infinity
        for (const id of nonCaptainIds) {
          const pos = state.cursorPositions[id] ?? 50
          const dist = Math.abs(state.target - pos)
          if (dist < bestDist) { bestDist = dist; winnerId = id }
        }

        const winnerPos = winnerId !== null ? (state.cursorPositions[winnerId] ?? 50) : 50
        const roundScore = computeScore(state.target, winnerPos)

        // Seul le gagnant reçoit les points (0 pour tout le monde si score = 0)
        const newCumulative = { ...state.cumulativeScores }
        if (winnerId && roundScore > 0) {
          newCumulative[winnerId] = (newCumulative[winnerId] ?? 0) + roundScore
        }

        return {
          ...state,
          phase: 'reveal',
          roundScore,
          roundWinnerId: winnerId,
          cumulativeScores: newCumulative,
        }
      }

      case 'next_round': {
        if (state.phase !== 'reveal') return state

        const nextRound = state.round + 1
        if (nextRound > state.maxRounds) {
          return { ...state, phase: 'reveal', round: nextRound }
        }

        const nextCaptainIndex = nextConnectedCaptainIndex(state.captainOrder, state.currentCaptainIndex, state.disconnectedIds)
        return {
          captainOrder: state.captainOrder,
          cumulativeScores: state.cumulativeScores,
          ...newRoundState(state, nextRound, state.maxRounds, nextCaptainIndex, state.timer),
        }
      }

      case 'skip_captain': {
        if (state.phase !== 'giving_clue') return state

        const nextRound = state.round + 1
        if (nextRound > state.maxRounds) {
          return { ...state, phase: 'reveal', round: nextRound }
        }

        const nextCaptainIndex = nextConnectedCaptainIndex(state.captainOrder, state.currentCaptainIndex, state.disconnectedIds)
        return {
          captainOrder: state.captainOrder,
          cumulativeScores: state.cumulativeScores,
          ...newRoundState(state, nextRound, state.maxRounds, nextCaptainIndex, state.timer),
        }
      }

      default:
        return state
    }
  },

  getStateForPlayer(state: WavelengthServerState, playerId: string): WavelengthClientState {
    const captainId = state.captainOrder[state.currentCaptainIndex]
    const isCaptain = playerId === captainId
    const isReveal = state.phase === 'reveal'
    const nonCaptainIds = state.captainOrder.filter((id) => id !== captainId)
    const avgCursor = averageCursor(state.cursorPositions, nonCaptainIds)

    const winnerPos = isReveal && state.roundWinnerId
      ? (state.cursorPositions[state.roundWinnerId] ?? 50)
      : avgCursor

    return {
      phase: state.phase,
      captainId,
      spectrum: state.spectrum,
      // La cible est visible uniquement pour le capitaine ou en révélation
      target: (isCaptain || isReveal) ? state.target : null,
      clue: state.clue,
      cursorPosition: isReveal ? winnerPos : avgCursor,
      myCursorPosition: state.cursorPositions[playerId] ?? 50,
      cursorPositions: state.cursorPositions,
      roundScore: isReveal ? state.roundScore : null,
      roundWinnerId: isReveal ? state.roundWinnerId : null,
      cumulativeScores: state.cumulativeScores,
      round: state.round,
      maxRounds: state.maxRounds,
      timer: state.timer,
      phaseStartedAt: state.phaseStartedAt,
    }
  },

  isRoundOver(state: WavelengthServerState): boolean {
    return state.phase === 'reveal' && state.round > state.maxRounds
  },
}
