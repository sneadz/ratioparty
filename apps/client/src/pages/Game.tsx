import { useParams, Navigate } from 'react-router-dom'
import { useStore } from '../store.ts'
import WavelengthGame from '../games/wavelength/WavelengthGame.tsx'

export default function Game() {
  const { code } = useParams<{ code: string }>()
  const { room, gameState, playerId } = useStore()

  if (!room || room.id !== code) return <Navigate to="/" replace />
  if (!gameState || !playerId)   return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Chargement…
      </p>
    </div>
  )

  return <WavelengthGame state={gameState} playerId={playerId} room={room} />
}
