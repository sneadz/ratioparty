import type { Player, GameOptions } from '@ratioparty/shared'

export interface IGamePlugin<TState, TAction, TClientState> {
  readonly id: string
  readonly minPlayers: number
  readonly maxPlayers: number

  /** Crée l'état initial de la partie */
  init(players: Player[], options?: GameOptions): TState

  /**
   * Applique une action et retourne le nouvel état.
   * Doit être pur (pas de mutations) — retourner un nouvel objet.
   */
  handleAction(state: TState, playerId: string, action: TAction): TState

  /** Retourne la vue de l'état filtrée pour un joueur donné */
  getStateForPlayer(state: TState, playerId: string): TClientState

  /** True quand la manche en cours est terminée */
  isRoundOver(state: TState): boolean
}
