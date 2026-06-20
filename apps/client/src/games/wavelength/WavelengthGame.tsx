import { useState, useEffect } from 'react'
import type { WavelengthClientState, RoomSnapshot } from '@ratioparty/shared'
import { TIMER_DURATIONS } from '@ratioparty/shared'
import PhaseClue from './PhaseClue.tsx'
import PhaseGuess from './PhaseGuess.tsx'
import PhaseReveal from './PhaseReveal.tsx'
import { setVolume, getVolume } from '../../sounds.ts'
import AvatarPreview from '../../components/avatar/AvatarPreview.tsx'
import { DEFAULT_AVATAR } from '../../components/avatar/avatar.config.ts'

interface Props {
  state: WavelengthClientState
  playerId: string
  room: RoomSnapshot
}

export default function WavelengthGame({ state, playerId, room }: Props) {
  const isCaptain = playerId === state.captainId
  const captainName = room.players.find((p) => p.id === state.captainId)?.name ?? '?'
  const [volume, setVolumeState] = useState(getVolume)

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>

      {/* ── Bloc scores (sidebar, pleine hauteur) ───────────────────────── */}
      <div style={{ flexShrink: 0, width: 220, padding: '2rem 1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-raised)', border: '2px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '4px 0 0 var(--border-strong), 0 4px 0 var(--border-strong)' }}>

          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Scores
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {room.players
              .slice()
              .sort((a, b) => (state.cumulativeScores[b.id] ?? 0) - (state.cumulativeScores[a.id] ?? 0))
              .map((player) => {
                const pts = state.cumulativeScores[player.id] ?? 0
                const isMe = player.id === playerId
                const isCap = player.id === state.captainId
                return (
                  <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', opacity: player.isConnected ? 1 : 0.4 }}>
                    <AvatarPreview config={player.avatarConfig ?? DEFAULT_AVATAR} size={28} style={{ border: '1.5px solid var(--border)', flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: isMe ? 'var(--accent)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>
                        {player.name}
                      </p>
                      {isCap && (
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginTop: 1 }}>
                          cap.
                        </p>
                      )}
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', color: isMe ? 'var(--accent)' : 'var(--text)', flexShrink: 0 }}>
                      {pts}
                    </span>
                  </div>
                )
              })}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Manche
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text)', lineHeight: 1 }}>
                {state.round}<span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>/{state.maxRounds}</span>
              </p>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Volume
              </p>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setVolumeState(v)
                  setVolume(v)
                }}
                className="volume-slider"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Contenu principal (pleine hauteur, centré) ──────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, margin: '0 auto', padding: '2rem 3rem', background: 'var(--bg-raised)', border: '2px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflowY: 'auto' }}>

          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Wavelength
          </p>

          {isCaptain ? (
            <div>
              <h1 style={{ color: 'var(--accent)' }}>
                {state.phase === 'guessing' ? 'Sous indice prime,' : 'À toi de'}<br />
                {state.phase === 'guessing' ? 'maintenant on attend.' : 'jouer ma foi.'}
              </h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>C'est toi le/la capichef.</p>
            </div>
          ) : (
            <div>
              <h1>Devine,<br />c'est facile...</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                {state.phase === 'giving_clue' ? `${captainName} choisit (il ou elle est si long(ue)...)` : 'Soit précis(e) bon sang !'}
              </p>
            </div>
          )}

          <TimerBar state={state} />

          {state.phase === 'giving_clue' && <PhaseClue state={state} isCaptain={isCaptain} />}
          {state.phase === 'guessing'     && <PhaseGuess state={state} isCaptain={isCaptain} playerId={playerId} />}
          {state.phase === 'reveal'       && <PhaseReveal state={state} playerId={playerId} room={room} />}

        </div>
      </div>
    </div>
  )
}

function TimerBar({ state }: { state: WavelengthClientState }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (state.timer === 'off' || state.phase === 'reveal') return
    const id = setInterval(() => setTick((t) => t + 1), 500)
    return () => clearInterval(id)
  }, [state.timer, state.phase, state.phaseStartedAt])

  if (state.timer === 'off' || state.phase === 'reveal') return null

  const durations = TIMER_DURATIONS[state.timer]
  const duration = state.phase === 'giving_clue' ? durations.clue : durations.guess
  const elapsed = (Date.now() - state.phaseStartedAt) / 1000
  const remaining = Math.max(0, duration - elapsed)
  const pct = (remaining / duration) * 100
  const color = pct > 50 ? 'var(--success, #4caf50)' : pct > 20 ? '#c25010' : '#e74c3c'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s linear, background 0.3s' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color, minWidth: 36, textAlign: 'right' }}>
        {Math.ceil(remaining)}s
      </span>
    </div>
  )
}
