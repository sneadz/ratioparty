import type { Server, Socket } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '@ratioparty/shared'
import { roomManager } from '../room/RoomManager.js'
import { gameEngine } from '../engine/GameEngine.js'

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>

/** Broadcast l'état de jeu filtré à chaque joueur de la room */
function broadcastGameState(io: AppServer, roomId: string, pluginId: string, gameState: unknown): void {
  const room = roomManager.get(roomId)
  if (!room) return
  const plugin = gameEngine.get(pluginId)

  for (const player of room.players.values()) {
    if (!player.isConnected) continue
    const clientState = plugin.getStateForPlayer(gameState, player.id)
    io.to(player.id).emit('game_state_update', clientState)
  }
}

export function registerHandlers(io: AppServer, socket: AppSocket): void {

  // ── Créer une room ──────────────────────────────────────────────────────────
  socket.on('create_room', ({ playerName, avatarConfig }) => {
    if (!playerName?.trim()) { socket.emit('error', { message: 'Pseudo invalide.' }); return }
    const room = roomManager.create({ socketId: socket.id, name: playerName.trim(), avatarConfig })
    const token = room.getReconnectToken(socket.id)!
    socket.join(room.id)
    socket.emit('room_joined', { room: room.toSnapshot(), playerId: socket.id, reconnectToken: token })
    console.log(`[room] créée : ${room.id} par "${playerName}"`)
  })

  // ── Rejoindre une room ──────────────────────────────────────────────────────
  socket.on('join_room', ({ code, playerName, avatarConfig }) => {
    if (!playerName?.trim()) { socket.emit('error', { message: 'Pseudo invalide.' }); return }
    const room = roomManager.get(code)
    if (!room) { socket.emit('error', { message: `Room "${code}" introuvable.` }); return }
    if (room.status !== 'lobby') { socket.emit('error', { message: 'La partie a déjà commencé.' }); return }
    const token = room.addPlayer(socket.id, playerName.trim(), avatarConfig)
    socket.join(room.id)
    socket.emit('room_joined', { room: room.toSnapshot(), playerId: socket.id, reconnectToken: token })
    socket.to(room.id).emit('room_updated', room.toSnapshot())
    console.log(`[room] "${playerName}" a rejoint ${room.id}`)
  })

  // ── Reconnexion ─────────────────────────────────────────────────────────────
  socket.on('reconnect_room', ({ code, reconnectToken }) => {
    const room = roomManager.get(code)
    if (!room) { socket.emit('error', { message: 'Room introuvable.' }); return }
    const player = room.reconnect(reconnectToken, socket.id)
    if (!player) { socket.emit('error', { message: 'Session expirée.' }); return }
    socket.join(room.id)
    socket.emit('room_joined', { room: room.toSnapshot(), playerId: socket.id, reconnectToken })
    socket.to(room.id).emit('room_updated', room.toSnapshot())
    // Si une partie est en cours, renvoyer l'état du jeu
    if (room.gameSession) {
      broadcastGameState(io, room.id, room.gameSession.pluginId, room.gameSession.state)
    }
    console.log(`[room] ${player.name} reconnecté dans ${room.id}`)
  })

  // ── Lancer la partie ────────────────────────────────────────────────────────
  socket.on('game_start', () => {
    const found = roomManager.findBySocketId(socket.id)
    if (!found) return
    const { room } = found

    if (socket.id !== room.hostId) { socket.emit('error', { message: 'Seul le host peut lancer.' }); return }
    if (room.status !== 'lobby') { socket.emit('error', { message: 'Partie déjà lancée.' }); return }

    const connected = room.getConnectedPlayers()
    const plugin = gameEngine.get('wavelength')

    if (connected.length < plugin.minPlayers) {
      socket.emit('error', { message: `Il faut au moins ${plugin.minPlayers} joueurs.` })
      return
    }

    const gameState = plugin.init(connected)
    room.gameSession = { pluginId: 'wavelength', state: gameState }
    room.status = 'playing'
    room.cumulativeScores = { ...gameState.cumulativeScores }

    io.to(room.id).emit('room_updated', room.toSnapshot())
    broadcastGameState(io, room.id, 'wavelength', gameState)
    console.log(`[game] partie Wavelength lancée dans ${room.id} (${connected.length} joueurs)`)
  })

  // ── Action de jeu ───────────────────────────────────────────────────────────
  socket.on('game_action', (action) => {
    const found = roomManager.findBySocketId(socket.id)
    if (!found) return
    const { room } = found

    if (!room.gameSession) { socket.emit('error', { message: 'Pas de partie en cours.' }); return }

    const plugin = gameEngine.get(room.gameSession.pluginId)
    const newState = plugin.handleAction(room.gameSession.state, socket.id, action)
    room.gameSession.state = newState

    // Synchroniser les scores cumulatifs dans la room
    if (newState.cumulativeScores) {
      room.cumulativeScores = { ...newState.cumulativeScores }
    }

    // Fin de partie — retour au lobby en conservant les joueurs
    if (plugin.isRoundOver(newState)) {
      room.status = 'lobby'
      room.gameSession = null
      room.cumulativeScores = {}
      io.to(room.id).emit('room_updated', room.toSnapshot())
      console.log(`[game] partie terminée dans ${room.id}, retour au lobby`)
      return
    }

    broadcastGameState(io, room.id, room.gameSession.pluginId, newState)
  })

  // ── Déconnexion ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const found = roomManager.findBySocketId(socket.id)
    if (!found) return
    const { room, code } = found

    room.markDisconnected(socket.id)
    io.to(room.id).emit('room_updated', room.toSnapshot())
    console.log(`[room] ${socket.id} déconnecté de ${room.id}`)

    setTimeout(() => {
      if (room.isEmpty) {
        roomManager.delete(code)
        console.log(`[room] ${code} supprimée (vide)`)
      }
    }, 5 * 60 * 1000)
  })
}
