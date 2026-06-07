import type { WavelengthClientState, RoomSnapshot } from '@ratioparty/shared'
import PhaseClue from './PhaseClue.tsx'
import PhaseGuess from './PhaseGuess.tsx'
import PhaseReveal from './PhaseReveal.tsx'

interface Props {
  state: WavelengthClientState
  playerId: string
  room: RoomSnapshot
}

export default function WavelengthGame({ state, playerId, room }: Props) {
  const isCaptain = playerId === state.captainId
  const captainName = room.players.find((p) => p.id === state.captainId)?.name ?? '?'

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>

      {/* ── Bloc scores (sidebar, pleine hauteur) ───────────────────────── */}
      <div style={{ flexShrink: 0, width: 180, padding: '2rem 1.25rem' }}>
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
                  <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: player.isConnected ? 1 : 0.4 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: isMe ? 'var(--accent)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 85 }}>
                        {player.name}
                      </p>
                      {isCap && (
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginTop: 1 }}>
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

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: 'auto' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Manche
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text)', lineHeight: 1 }}>
              {state.round}<span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>/{state.maxRounds}</span>
            </p>
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
              <h1 style={{ color: 'var(--accent)' }}>À toi<br />de jouer.</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Tu es le capitaine cette manche.</p>
            </div>
          ) : (
            <div>
              <h1>Devinez<br /><span style={{ color: 'var(--accent)' }}>{captainName}</span>.</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                {state.phase === 'giving_clue' ? `${captainName} prépare son indice…` : 'Placez le curseur sur le spectre.'}
              </p>
            </div>
          )}

          {state.phase === 'giving_clue' && <PhaseClue state={state} isCaptain={isCaptain} />}
          {state.phase === 'guessing'     && <PhaseGuess state={state} isCaptain={isCaptain} />}
          {state.phase === 'reveal'       && <PhaseReveal state={state} playerId={playerId} room={room} />}

        </div>
      </div>
    </div>
  )
}
