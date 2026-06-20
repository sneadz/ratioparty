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

function newRoundState(
  prev: Pick<WavelengthServerState, 'captainOrder' | 'cumulativeScores' | 'usedSpectra'>,
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
      ...newRoundState({ captainOrder, cumulativeScores, usedSpectra: [] }, 1, maxRounds, 0, timer),
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

        const nonCaptainIds = state.captainOrder.filter((id) => id !== captainId)
        const avgPosition = averageCursor(state.cursorPositions, nonCaptainIds)
        const roundScore = computeScore(state.target, avgPosition)

        // Tous les joueurs non-capitaines reçoivent le score de la manche
        const newCumulative = { ...state.cumulativeScores }
        for (const id of state.captainOrder) {
          if (id !== captainId) {
            newCumulative[id] = (newCumulative[id] ?? 0) + roundScore
          }
        }

        return {
          ...state,
          phase: 'reveal',
          roundScore,
          cumulativeScores: newCumulative,
        }
      }

      case 'next_round': {
        if (state.phase !== 'reveal') return state

        const nextRound = state.round + 1
        if (nextRound > state.maxRounds) {
          // Partie terminée — on laisse le serveur gérer le retour au lobby
          return { ...state, phase: 'reveal', round: nextRound }
        }

        const nextCaptainIndex = (state.currentCaptainIndex + 1) % state.captainOrder.length
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

    return {
      phase: state.phase,
      captainId,
      spectrum: state.spectrum,
      // La cible est visible uniquement pour le capitaine ou en révélation
      target: (isCaptain || isReveal) ? state.target : null,
      clue: state.clue,
      cursorPosition: avgCursor,
      myCursorPosition: state.cursorPositions[playerId] ?? 50,
      cursorPositions: state.cursorPositions,
      roundScore: isReveal ? state.roundScore : null,
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
