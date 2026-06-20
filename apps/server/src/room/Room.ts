import { randomUUID } from 'crypto'
import type { Player, RoomSnapshot, AvatarConfig } from '@ratioparty/shared'

interface InternalPlayer extends Player {
  reconnectToken: string
}

interface GameSession {
  pluginId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any
}

export class Room {
  readonly id: string
  readonly createdAt: number
  hostId: string
  status: RoomSnapshot['status'] = 'lobby'
  selectedGame: string | null = null
  players: Map<string, InternalPlayer> = new Map()
  gameSession: GameSession | null = null
  cumulativeScores: Record<string, number> = {}

  constructor(id: string, host: { socketId: string; name: string; avatarConfig?: AvatarConfig }) {
    this.id = id
    this.createdAt = Date.now()
    this.hostId = host.socketId

    this.players.set(host.socketId, {
      id: host.socketId,
      name: host.name,
      isConnected: true,
      isHost: true,
      avatarConfig: host.avatarConfig,
      reconnectToken: randomUUID(),
    })
  }

  addPlayer(socketId: string, name: string, avatarConfig?: AvatarConfig): string {
    const reconnectToken = randomUUID()
    this.players.set(socketId, {
      id: socketId,
      name,
      isConnected: true,
      isHost: false,
      avatarConfig,
      reconnectToken,
    })
    return reconnectToken
  }

  markDisconnected(socketId: string): void {
    const p = this.players.get(socketId)
    if (p) p.isConnected = false
  }

  reconnect(reconnectToken: string, newSocketId: string): { player: InternalPlayer; oldId: string } | null {
    for (const [oldId, player] of this.players) {
      if (player.reconnectToken !== reconnectToken) continue
      this.players.delete(oldId)
      player.id = newSocketId
      player.isConnected = true
      this.players.set(newSocketId, player)
      if (this.hostId === oldId) this.hostId = newSocketId
      return { player, oldId }
    }
    return null
  }

  getReconnectToken(socketId: string): string | undefined {
    return this.players.get(socketId)?.reconnectToken
  }

  getConnectedPlayers(): InternalPlayer[] {
    return [...this.players.values()].filter((p) => p.isConnected)
  }

  toSnapshot(): RoomSnapshot {
    return {
      id: this.id,
      hostId: this.hostId,
      status: this.status,
      selectedGame: this.selectedGame,
      cumulativeScores: this.cumulativeScores,
      players: [...this.players.values()].map(({ reconnectToken: _t, ...pub }) => pub),
    }
  }

  get isEmpty(): boolean {
    return [...this.players.values()].every((p) => !p.isConnected)
  }

  get size(): number {
    return this.players.size
  }
}
