import type { Server, Socket } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '@ratioparty/shared'
import { TIMER_DURATIONS } from '@ratioparty/shared'
import { roomManager } from '../room/RoomManager.js'
import { gameEngine } from '../engine/GameEngine.js'
import type { WavelengthServerState } from '../games/wavelength/index.js'

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

// ─── Timer serveur ────────────────────────────────────────────────────────────

const activeTimers = new Map<string, ReturnType<typeof setTimeout>>()

function clearRoomTimer(roomId: string): void {
  const t = activeTimers.get(roomId)
  if (t) { clearTimeout(t); activeTimers.delete(roomId) }
}

function schedulePhaseTimer(io: AppServer, roomId: string, state: WavelengthServerState): void {
  clearRoomTimer(roomId)
  if (state.timer === 'off' || state.phase === 'reveal') return

  const durations = TIMER_DURATIONS[state.timer]
  const duration = state.phase === 'giving_clue' ? durations.clue : durations.guess
  const expectedPhase = state.phase

  const handle = setTimeout(() => {
    activeTimers.delete(roomId)
    const room = roomManager.get(roomId)
    if (!room?.gameSession) return

    const current = room.gameSession.state as WavelengthServerState
    if (current.phase !== expectedPhase) return

    const plugin = gameEngine.get(room.gameSession.pluginId)
    const captainId = current.captainOrder[current.currentCaptainIndex]
    let newState: WavelengthServerState

    if (current.phase === 'giving_clue') {
      newState = plugin.handleAction(current, captainId, { type: 'submit_clue', clue: '⌛' }) as WavelengthServerState
    } else {
      // guessing : on cherche un non-capitaine pour lock
      const nonCaptainId = current.captainOrder.find((id) => id !== captainId) ?? captainId
      newState = plugin.handleAction(current, nonCaptainId, { type: 'lock_guess' }) as WavelengthServerState
    }

    room.gameSession.state = newState
    if (newState.cumulativeScores) room.cumulativeScores = { ...newState.cumulativeScores }

    broadcastGameState(io, roomId, room.gameSession.pluginId, newState)
    schedulePhaseTimer(io, roomId, newState)
  }, duration * 1000)

  activeTimers.set(roomId, handle)
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
    const result = room.reconnect(reconnectToken, socket.id)
    if (!result) { socket.emit('error', { message: 'Session expirée.' }); return }
    const { player, oldId } = result

    // Mettre à jour les IDs dans l'état de jeu si une partie est en cours
    if (room.gameSession && oldId !== socket.id) {
      const gs = room.gameSession.state as WavelengthServerState
      const idx = gs.captainOrder.indexOf(oldId)
      if (idx !== -1) gs.captainOrder[idx] = socket.id
      if (oldId in gs.cursorPositions) {
        gs.cursorPositions[socket.id] = gs.cursorPositions[oldId]
        delete gs.cursorPositions[oldId]
      }
      if (oldId in gs.cumulativeScores) {
        gs.cumulativeScores[socket.id] = gs.cumulativeScores[oldId]
        delete gs.cumulativeScores[oldId]
      }
      if (oldId in room.cumulativeScores) {
        room.cumulativeScores[socket.id] = room.cumulativeScores[oldId]
        delete room.cumulativeScores[oldId]
      }
    }

    socket.join(room.id)
    socket.emit('room_joined', { room: room.toSnapshot(), playerId: socket.id, reconnectToken })
    socket.to(room.id).emit('room_updated', room.toSnapshot())
    if (room.gameSession) {
      broadcastGameState(io, room.id, room.gameSession.pluginId, room.gameSession.state)
    }
    console.log(`[room] ${player.name} reconnecté dans ${room.id}`)
  })

  // ── Sélectionner un jeu ─────────────────────────────────────────────────────
  socket.on('select_game', (gameId) => {
    const found = roomManager.findBySocketId(socket.id)
    if (!found) return
    const { room } = found

    if (socket.id !== room.hostId) return
    if (room.status !== 'lobby') return
    if (gameId !== null && !gameEngine.has(gameId)) { socket.emit('error', { message: `Jeu "${gameId}" inconnu.` }); return }

    room.selectedGame = gameId
    io.to(room.id).emit('room_updated', room.toSnapshot())
  })

  // ── Lancer la partie ────────────────────────────────────────────────────────
  socket.on('game_start', (options) => {
    const found = roomManager.findBySocketId(socket.id)
    if (!found) return
    const { room } = found

    if (socket.id !== room.hostId) { socket.emit('error', { message: 'Seul le host peut lancer.' }); return }
    if (room.status !== 'lobby') { socket.emit('error', { message: 'Partie déjà lancée.' }); return }
    if (!room.selectedGame) { socket.emit('error', { message: 'Aucun jeu sélectionné.' }); return }

    const connected = room.getConnectedPlayers()
    const plugin = gameEngine.get(room.selectedGame)

    if (connected.length < plugin.minPlayers) {
      socket.emit('error', { message: `Il faut au moins ${plugin.minPlayers} joueurs.` })
      return
    }

    const gameState = plugin.init(connected, options) as WavelengthServerState
    room.gameSession = { pluginId: room.selectedGame, state: gameState }
    room.status = 'playing'
    room.cumulativeScores = { ...gameState.cumulativeScores }

    io.to(room.id).emit('room_updated', room.toSnapshot())
    broadcastGameState(io, room.id, room.gameSession.pluginId, gameState)
    schedulePhaseTimer(io, room.id, gameState)
    console.log(`[game] partie ${room.selectedGame} lancée dans ${room.id} (${connected.length} joueurs, ${gameState.maxRounds} tours, timer: ${gameState.timer})`)
  })

  // ── Action de jeu ───────────────────────────────────────────────────────────
  socket.on('game_action', (action) => {
    const found = roomManager.findBySocketId(socket.id)
    if (!found) return
    const { room } = found

    if (!room.gameSession) { socket.emit('error', { message: 'Pas de partie en cours.' }); return }

    const plugin = gameEngine.get(room.gameSession.pluginId)
    const oldPhase = (room.gameSession.state as WavelengthServerState).phase
    const newState = plugin.handleAction(room.gameSession.state, socket.id, action) as WavelengthServerState
    room.gameSession.state = newState

    // Synchroniser les scores cumulatifs dans la room
    if (newState.cumulativeScores) {
      room.cumulativeScores = { ...newState.cumulativeScores }
    }

    // Fin de partie — retour au lobby en conservant les joueurs
    if (plugin.isRoundOver(newState)) {
      clearRoomTimer(room.id)
      room.status = 'lobby'
      room.gameSession = null
      room.cumulativeScores = {}
      io.to(room.id).emit('room_updated', room.toSnapshot())
      console.log(`[game] partie terminée dans ${room.id}, retour au lobby`)
      return
    }

    broadcastGameState(io, room.id, room.gameSession.pluginId, newState)
    if (newState.phase !== oldPhase) schedulePhaseTimer(io, room.id, newState)
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
