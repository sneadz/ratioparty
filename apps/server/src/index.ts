import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import type { ClientToServerEvents, ServerToClientEvents } from '@ratioparty/shared'
import { registerHandlers } from './socket/handlers.js'
import { roomManager } from './room/RoomManager.js'
import { gameEngine } from './engine/GameEngine.js'
import { wavelengthPlugin } from './games/wavelength/index.js'

// ── Enregistrement des plugins ────────────────────────────────────────────────
gameEngine.register(wavelengthPlugin)

// ── Serveur HTTP + Socket.io ──────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

const app = express()
app.use(cors({ origin: CLIENT_URL }))
app.get('/health', (_req, res) => res.json({ ok: true }))

const httpServer = createServer(app)
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_URL },
})

io.on('connection', (socket) => {
  console.log(`[socket] connecté : ${socket.id}`)
  registerHandlers(io, socket)
})

setInterval(() => roomManager.cleanup(), 30 * 60 * 1000)

httpServer.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`)
})
