import { useState } from 'react'
import type { RoomSnapshot, TimerPreset } from '@ratioparty/shared'
import { socket } from '../../socket.ts'

interface Props {
  isHost: boolean
  room: RoomSnapshot
}

export default function WavelengthLobby({ isHost, room }: Props) {
  const [rounds, setRounds] = useState(1)
  const [timer, setTimer] = useState<TimerPreset>('medium')
  const connectedCount = room.players.filter((p) => p.isConnected).length

  function startGame() {
    socket.emit('game_start', { rounds, timer })
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  }

  if (!isHost) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        En attente que l'hôte lance…
      </p>
    )
  }

  return (
    <div className="stack-sm">
      <div className="card-brutal stack-sm">
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Options
        </p>

        <div className="stack-sm" style={{ gap: '0.35rem' }}>
          <p style={labelStyle}>Manches</p>
          <div className="row" style={{ gap: '0.4rem' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`btn ${rounds === n ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, padding: '0.4rem 0', minWidth: 0 }}
                onClick={() => setRounds(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="stack-sm" style={{ gap: '0.35rem' }}>
          <p style={labelStyle}>Timer</p>
          <div className="row" style={{ gap: '0.4rem' }}>
            {([
              { value: 'off',    label: 'Sans'   },
              { value: 'fast',   label: 'Rapide' },
              { value: 'medium', label: 'Moyen'  },
              { value: 'long',   label: 'Long'   },
            ] as { value: TimerPreset; label: string }[]).map(({ value, label }) => (
              <button
                key={value}
                className={`btn ${timer === value ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, padding: '0.4rem 0', minWidth: 0, fontSize: '0.8rem' }}
                onClick={() => setTimer(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="btn btn-primary" disabled={connectedCount < 2} onClick={startGame}>
        {connectedCount < 2 ? 'En attente de joueurs…' : 'Lancer Wavelength'}
      </button>
      {connectedCount < 2 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Il faut au moins 2 joueurs pour commencer.
        </p>
      )}
    </div>
  )
}
