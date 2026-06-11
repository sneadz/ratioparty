import { io, Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@ratioparty/shared'

// En prod (même origine), undefined connecte au host courant
const SERVER_URL = import.meta.env.VITE_SERVER_URL || undefined

// Singleton : une seule connexion pour toute l'app
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL as string, {
  autoConnect: false,
})
