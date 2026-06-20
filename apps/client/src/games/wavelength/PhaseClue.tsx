import { useState } from 'react'
import type { WavelengthClientState } from '@ratioparty/shared'
import { SCORE_ZONES } from '@ratioparty/shared'
import { socket } from '../../socket.ts'

interface Props {
  state: WavelengthClientState
  isCaptain: boolean
}

export default function PhaseClue({ state, isCaptain }: Props) {
  const [clue, setClue] = useState('')
  const [error, setError] = useState('')

  function submit() {
    if (!clue.trim()) { setError("L'indice ne peut pas être vide."); return }
    socket.emit('game_action', { type: 'submit_clue', clue: clue.trim() })
  }

  return (
    <div className="stack-lg">

      {/* Spectre */}
      <SpectrumBar
        state={state}
        showTarget={isCaptain}
        showZones={false}
        showCursor={false}
      />

      {isCaptain ? (
        <div className="card-brutal stack" style={{ width: 560, margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Ton indice (un mot ou une courte phrase)
          </p>
          <input
            className="input"
            type="text"
            placeholder="Ex: Superman…"
            maxLength={50}
            value={clue}
            onChange={(e) => { setClue(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoFocus
          />
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" onClick={submit}>
            Donner l'indice →
          </button>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            Le capitaine prépare son indice…
          </p>
        </div>
      )}

    </div>
  )
}

// ─── Composant spectre partagé ────────────────────────────────────────────────

interface SpectrumBarProps {
  state: WavelengthClientState
  showTarget: boolean
  showZones: boolean
  showCursor: boolean
  onCursorChange?: (pos: number) => void
  cursorDraggable?: boolean
  individualCursors?: { position: number; isMe: boolean }[]
}

export function SpectrumBar({ state, showTarget, showZones, showCursor, onCursorChange, cursorDraggable, individualCursors }: SpectrumBarProps) {
  const { spectrum, target, cursorPosition } = state

  function buildGradient() {
    if (!showZones || target === null) return 'var(--bg-raised)'
    const t = target
    const { BULLSEYE, CLOSE, NEAR } = SCORE_ZONES
    const clamp = (v: number) => Math.max(0, Math.min(100, v))
    const p = (v: number) => `${clamp(v)}%`

    return `linear-gradient(to right,
      transparent ${p(t - NEAR)},
      #7a2a0e ${p(t - NEAR)},
      #7a2a0e ${p(t - CLOSE)},
      #c25010 ${p(t - CLOSE)},
      #c25010 ${p(t - BULLSEYE)},
      var(--accent) ${p(t - BULLSEYE)},
      var(--accent) ${p(t + BULLSEYE)},
      #c25010 ${p(t + BULLSEYE)},
      #c25010 ${p(t + CLOSE)},
      #7a2a0e ${p(t + CLOSE)},
      #7a2a0e ${p(t + NEAR)},
      transparent ${p(t + NEAR)}
    )`
  }

  function handleBarClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!cursorDraggable || !onCursorChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    onCursorChange(Math.max(0, Math.min(100, pos)))
  }

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
    color: 'var(--text)',
    background: 'var(--bg-raised)',
    border: '2px solid var(--border-strong)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-sm)',
    padding: '0 0.75rem',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

      {/* Barre centrée — les labels débordent en dehors */}
      <div style={{ position: 'relative', margin: '0 auto', width: 560 }}>

        {/* Label gauche : ancré à droite du bord gauche de la barre */}
        <div style={{ ...labelStyle, right: 'calc(100% + 12px)' }}>{spectrum.left}</div>

        {/* Barre — toujours la même largeur */}
        <div
          style={{
            position: 'relative',
            height: 48,
            background: showZones ? buildGradient() : 'var(--bg-raised)',
            border: '2px solid var(--border-strong)',
            borderRadius: 'var(--radius)',
            cursor: cursorDraggable ? 'pointer' : 'default',
            overflow: 'visible',
            boxShadow: 'var(--shadow-sm)',
          }}
          onClick={handleBarClick}
        >
          {/* Cible */}
          {showTarget && target !== null && (
            <div style={{
              position: 'absolute',
              left: `${target}%`,
              top: -10,
              bottom: -10,
              width: 4,
              background: '#fff',
              transform: 'translateX(-50%)',
              borderRadius: 2,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
              zIndex: 2,
            }}>
              <div style={{
                position: 'absolute',
                top: -7,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '7px solid rgba(255,255,255,0.9)',
              }} />
            </div>
          )}

          {/* Curseurs individuels (phase guess, plusieurs joueurs) */}
          {individualCursors?.map((c, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${c.position}%`,
              top: 0,
              bottom: 0,
              width: 2,
              background: c.isMe ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
              transform: 'translateX(-50%)',
              borderRadius: 1,
              zIndex: 1,
              transition: 'left 0.1s',
            }} />
          ))}

          {/* Curseur moyen (équipe) */}
          {showCursor && (
            <div style={{
              position: 'absolute',
              left: `${cursorPosition}%`,
              top: -6,
              bottom: -6,
              width: 4,
              background: 'var(--border-strong)',
              transform: 'translateX(-50%)',
              borderRadius: 2,
              transition: cursorDraggable ? 'none' : 'left 0.1s',
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 16,
                height: 16,
                background: 'var(--border-strong)',
                borderRadius: '50%',
                border: '2px solid var(--bg)',
              }} />
            </div>
          )}
        </div>

        {/* Label droit : ancré à gauche du bord droit de la barre */}
        <div style={{ ...labelStyle, left: 'calc(100% + 12px)' }}>{spectrum.right}</div>
      </div>

      {/* Légende zones (reveal uniquement) */}
      {showZones && target !== null && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>■ 4 pts</span>
          <span style={{ color: '#c25010' }}>■ 3 pts</span>
          <span style={{ color: '#7a2a0e' }}>■ 2 pts</span>
        </div>
      )}
    </div>
  )
}
