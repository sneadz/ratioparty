import { Room } from './Room.js'

function generateCode(): string {
  // Code court alphanumérique lisible (sans O/0/I/1 confusables)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

class RoomManager {
  private rooms: Map<string, Room> = new Map()

  create(host: { socketId: string; name: string }): Room {
    let code: string
    do { code = generateCode() } while (this.rooms.has(code))

    const room = new Room(code, host)
    this.rooms.set(code, room)
    return room
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase())
  }

  findBySocketId(socketId: string): { room: Room; code: string } | null {
    for (const [code, room] of this.rooms) {
      if (room.players.has(socketId)) return { room, code }
    }
    return null
  }

  delete(code: string): void {
    this.rooms.delete(code)
  }

  /** Nettoyage des rooms abandonnées (appelé périodiquement) */
  cleanup(): void {
    const now = Date.now()
    for (const [code, room] of this.rooms) {
      const tooOld = now - room.createdAt > 4 * 60 * 60 * 1000 // 4h
      if (tooOld || room.isEmpty) this.rooms.delete(code)
    }
  }
}

export const roomManager = new RoomManager()
