import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { socket } from './socket.ts'
import { useStore } from './store.ts'
import Home from './pages/Home.tsx'
import Lobby from './pages/Lobby.tsx'
import Game from './pages/Game.tsx'

function SocketBridge() {
  const { setPlayer, setRoom, setGameState, reset } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    socket.connect()

    socket.on('room_joined', ({ room, playerId, reconnectToken }) => {
      setPlayer(playerId, '', reconnectToken)
      setRoom(room)
      localStorage.setItem('rp_code', room.id)
      localStorage.setItem('rp_token', reconnectToken)
      if (room.status === 'playing') {
        navigate(`/game/${room.id}`)
      } else {
        navigate(`/lobby/${room.id}`)
      }
    })

    socket.on('room_updated', (room) => {
      setRoom(room)
      // Redirection automatique selon le statut de la room
      if (room.status === 'playing') navigate(`/game/${room.id}`)
      if (room.status === 'lobby')   navigate(`/lobby/${room.id}`)
    })

    socket.on('game_state_update', (state) => {
      setGameState(state)
    })

    socket.on('error', ({ message }) => {
      console.error('[socket error]', message)
    })

    const savedCode  = localStorage.getItem('rp_code')
    const savedToken = localStorage.getItem('rp_token')
    if (savedCode && savedToken) {
      socket.emit('reconnect_room', { code: savedCode, reconnectToken: savedToken })
    }

    return () => {
      socket.off('room_joined')
      socket.off('room_updated')
      socket.off('game_state_update')
      socket.off('error')
      socket.disconnect()
      reset()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <SocketBridge />
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/lobby/:code"  element={<Lobby />} />
        <Route path="/game/:code"   element={<Game />} />
      </Routes>
    </BrowserRouter>
  )
}
