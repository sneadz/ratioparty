import { useRef } from 'react'
import type { WavelengthClientState } from '@ratioparty/shared'
import { socket } from '../../socket.ts'
import { SpectrumBar } from './PhaseClue.tsx'
import { playTick, playLockGuess } from '../../sounds.ts'

interface Props {
  state: WavelengthClientState
  isCaptain: boolean
}

const THROTTLE_MS = 40

export default function PhaseGuess({ state, isCaptain }: Props) {
  const lastEmit = useRef(0)

  function handleCursorChange(pos: number) {
    if (isCaptain) return
    const now = Date.now()
    if (now - lastEmit.current > THROTTLE_MS) {
      lastEmit.current = now
      socket.emit('game_action', { type: 'move_cursor', position: pos })
      playTick()
    }
  }

  function lockGuess() {
    playLockGuess()
    socket.emit('game_action', { type: 'lock_guess' })
  }

  return (
    <div className="stack-lg">

      {/* Indice */}
      <div className="card-brutal" style={{ textAlign: 'center', width: 560, margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          L'indice un peu nul du capichef
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          {state.clue}
        </p>
      </div>

      {/* Spectre + curseur */}
      <SpectrumBar
        state={state}
        showTarget={false}
        showZones={false}
        showCursor={true}
        cursorDraggable={!isCaptain}
        onCursorChange={handleCursorChange}
      />

      {/* Slider natif pour précision */}
      {!isCaptain && (
        <div className="stack-sm" style={{ width: 560, margin: '0 auto' }}>
          <input
            type="range"
            min={0}
            max={100}
            value={state.cursorPosition}
            onChange={(e) => handleCursorChange(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: 'var(--accent)',
              height: 6,
              cursor: 'pointer',
            }}
          />
          <button className="btn btn-primary" onClick={lockGuess}>
            C'est mon dernier mot
          </button>
        </div>
      )}

      {isCaptain && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Les gros nooblards sont en train de voter...
        </p>
      )}

    </div>
  )
}
