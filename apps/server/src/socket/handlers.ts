import type { Server, Socket } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '@ratioparty/shared'
import { roomManager } from '../room/RoomManager.js'

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export function registerHandlers(io: AppServer, socket: AppSocket): void {

  // ── Créer une room ──────────────────────────────────────────────────────────
  socket.on('create_room', (playerName) => {
    if (!playerName?.trim()) {
      socket.emit('error', { message: 'Pseudo invalide.' })
      return
    }
    const room = roomManager.create({ socketId: socket.id, name: playerName.trim() })
    const token = room.getReconnectToken(socket.id)!
    socket.join(room.id)
    socket.emit('room_joined', { room: room.toSnapshot(), playerId: socket.id, reconnectToken: token })
    console.log(`[room] créée : ${room.id} par "${playerName}"`)
  })

  // ── Rejoindre une room ──────────────────────────────────────────────────────
  socket.on('join_room', ({ code, playerName }) => {
    if (!playerName?.trim()) {
      socket.emit('error', { message: 'Pseudo invalide.' })
      return
    }
    const room = roomManager.get(code)
    if (!room) {
      socket.emit('error', { message: `Room "${code}" introuvable.` })
      return
    }
    if (room.status !== 'lobby') {
      socket.emit('error', { message: 'La partie a déjà commencé.' })
      return
    }
    const token = room.addPlayer(socket.id, playerName.trim())
    socket.join(room.id)
    socket.emit('room_joined', { room: room.toSnapshot(), playerId: socket.id, reconnectToken: token })
    socket.to(room.id).emit('room_updated', room.toSnapshot())
    console.log(`[room] ${socket.id} "${playerName}" a rejoint ${room.id}`)
  })

  // ── Reconnexion ─────────────────────────────────────────────────────────────
  socket.on('reconnect_room', ({ code, reconnectToken }) => {
    const room = roomManager.get(code)
    if (!room) {
      socket.emit('error', { message: 'Room introuvable.' })
      return
    }
    const player = room.reconnect(reconnectToken, socket.id)
    if (!player) {
      socket.emit('error', { message: 'Session expirée ou invalide.' })
      return
    }
    socket.join(room.id)
    socket.emit('room_joined', { room: room.toSnapshot(), playerId: socket.id, reconnectToken })
    socket.to(room.id).emit('room_updated', room.toSnapshot())
    console.log(`[room] ${player.name} reconnecté dans ${room.id}`)
  })

  // ── Déconnexion ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const found = roomManager.findBySocketId(socket.id)
    if (!found) return

    const { room, code } = found
    room.markDisconnected(socket.id)
    io.to(room.id).emit('room_updated', room.toSnapshot())
    console.log(`[room] ${socket.id} déconnecté de ${room.id}`)

    // Nettoyage différé si la room reste vide 5 minutes
    setTimeout(() => {
      if (room.isEmpty) {
        roomManager.delete(code)
        console.log(`[room] ${code} supprimée (vide)`)
      }
    }, 5 * 60 * 1000)
  })
}
