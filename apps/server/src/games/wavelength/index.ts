import type { Player, WavelengthClientState, WavelengthAction, Spectrum } from '@ratioparty/shared'
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
  cursorPosition: number       // 0-100, curseur partagé
  cumulativeScores: Record<string, number>
  roundScore: number | null    // score obtenu ce round
  round: number                // commence à 1
  maxRounds: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomTarget(): number {
  // Évite les bords extrêmes (0-10 et 90-100) pour que ce soit jouable
  return Math.floor(Math.random() * 80) + 10
}

function newRoundState(
  prev: Pick<WavelengthServerState, 'captainOrder' | 'cumulativeScores' | 'usedSpectra'>,
  round: number,
  maxRounds: number,
  captainIndex: number,
): Omit<WavelengthServerState, 'captainOrder' | 'cumulativeScores'> {
  const spectrum = pickSpectrum(prev.usedSpectra)
  return {
    phase: 'giving_clue',
    currentCaptainIndex: captainIndex,
    spectrum,
    usedSpectra: [...prev.usedSpectra, spectrum],
    target: randomTarget(),
    clue: null,
    cursorPosition: 50,
    roundScore: null,
    round,
    maxRounds,
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

  init(players: Player[]): WavelengthServerState {
    const captainOrder = players.map((p) => p.id)
    const maxRounds = captainOrder.length  // chaque joueur est capitaine une fois
    const cumulativeScores = Object.fromEntries(captainOrder.map((id) => [id, 0]))

    return {
      captainOrder,
      cumulativeScores,
      ...newRoundState({ captainOrder, cumulativeScores, usedSpectra: [] }, 1, maxRounds, 0),
    }
  },

  handleAction(state: WavelengthServerState, playerId: string, action: WavelengthAction): WavelengthServerState {
    const captainId = state.captainOrder[state.currentCaptainIndex]

    switch (action.type) {

      case 'submit_clue': {
        if (playerId !== captainId) return state
        if (state.phase !== 'giving_clue') return state
        if (!action.clue?.trim()) return state
        return { ...state, phase: 'guessing', clue: action.clue.trim() }
      }

      case 'move_cursor': {
        if (playerId === captainId) return state  // capitaine ne peut pas bouger
        if (state.phase !== 'guessing') return state
        const position = Math.max(0, Math.min(100, action.position))
        return { ...state, cursorPosition: position }
      }

      case 'lock_guess': {
        if (playerId === captainId) return state  // capitaine ne valide pas
        if (state.phase !== 'guessing') return state

        const roundScore = computeScore(state.target, state.cursorPosition)

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
          ...newRoundState(state, nextRound, state.maxRounds, nextCaptainIndex),
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

    return {
      phase: state.phase,
      captainId,
      spectrum: state.spectrum,
      // La cible est visible uniquement pour le capitaine ou en révélation
      target: (isCaptain || isReveal) ? state.target : null,
      clue: state.clue,
      cursorPosition: state.cursorPosition,
      roundScore: isReveal ? state.roundScore : null,
      cumulativeScores: state.cumulativeScores,
      round: state.round,
      maxRounds: state.maxRounds,
    }
  },

  isRoundOver(state: WavelengthServerState): boolean {
    return state.phase === 'reveal' && state.round > state.maxRounds
  },
}
