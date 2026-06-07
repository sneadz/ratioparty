import { io, Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@ratioparty/shared'

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001'

// Singleton : une seule connexion pour toute l'app
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: false,
})
