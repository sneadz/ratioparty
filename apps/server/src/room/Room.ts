import { randomUUID } from 'crypto'
import type { Player, RoomSnapshot } from '@ratioparty/shared'

// Représentation interne d'un joueur (inclut le token de reconnexion, jamais envoyé au client)
interface InternalPlayer extends Player {
  reconnectToken: string
}

export class Room {
  readonly id: string
  readonly createdAt: number
  hostId: string
  status: RoomSnapshot['status'] = 'lobby'
  players: Map<string, InternalPlayer> = new Map()

  constructor(id: string, host: { socketId: string; name: string }) {
    this.id = id
    this.createdAt = Date.now()
    this.hostId = host.socketId

    this.players.set(host.socketId, {
      id: host.socketId,
      name: host.name,
      isConnected: true,
      isHost: true,
      reconnectToken: randomUUID(),
    })
  }

  addPlayer(socketId: string, name: string): string {
    const reconnectToken = randomUUID()
    this.players.set(socketId, {
      id: socketId,
      name,
      isConnected: true,
      isHost: false,
      reconnectToken,
    })
    return reconnectToken
  }

  markDisconnected(socketId: string): void {
    const p = this.players.get(socketId)
    if (p) p.isConnected = false
  }

  /** Retrouve un joueur via son token et lui attribue le nouveau socket ID */
  reconnect(reconnectToken: string, newSocketId: string): InternalPlayer | null {
    for (const [oldId, player] of this.players) {
      if (player.reconnectToken !== reconnectToken) continue

      this.players.delete(oldId)
      player.id = newSocketId
      player.isConnected = true
      this.players.set(newSocketId, player)

      if (this.hostId === oldId) this.hostId = newSocketId
      return player
    }
    return null
  }

  getReconnectToken(socketId: string): string | undefined {
    return this.players.get(socketId)?.reconnectToken
  }

  toSnapshot(): RoomSnapshot {
    return {
      id: this.id,
      hostId: this.hostId,
      status: this.status,
      players: Array.from(this.players.values()).map(({ reconnectToken: _t, ...pub }) => pub),
    }
  }

  /** True si tous les joueurs sont déconnectés */
  get isEmpty(): boolean {
    return [...this.players.values()].every((p) => !p.isConnected)
  }

  get size(): number {
    return this.players.size
  }
}
