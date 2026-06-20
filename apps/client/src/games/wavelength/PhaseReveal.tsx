import { useEffect } from 'react'
import type { WavelengthClientState, RoomSnapshot } from '@ratioparty/shared'
import { socket } from '../../socket.ts'
import { SpectrumBar } from './PhaseClue.tsx'
import { playScore, playGoNext } from '../../sounds.ts'

interface Props {
  state: WavelengthClientState
  playerId: string
  room: RoomSnapshot
}

const SCORE_LABELS: Record<number, { label: string; color: string }> = {
  4: { label: 'Goatesque 🐐',           color: 'var(--accent)' },
  3: { label: 'Nice 👌',                color: '#c25010' },
  2: { label: 'Ok tier 😐',             color: '#7a2a0e' },
  0: { label: 'Ahahah le/la mauvais(e) ! 😂', color: 'var(--text-muted)' },
}

export default function PhaseReveal({ state, playerId, room }: Props) {
  const isHost = playerId === room.hostId
  const score = state.roundScore ?? 0
  const scoreLabel = SCORE_LABELS[score] ?? SCORE_LABELS[0]
  const isGameOver = state.round >= state.maxRounds
  const winner = state.roundWinnerId ? room.players.find((p) => p.id === state.roundWinnerId) : null
  const iWon = state.roundWinnerId === playerId

  useEffect(() => {
    playScore(score)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function nextRound() {
    playGoNext()
    socket.emit('game_action', { type: 'next_round' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* Score de la manche */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="card-brutal" style={{ textAlign: 'center', borderColor: scoreLabel.color, padding: '0.75rem 1.5rem', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
          {state.clue && (
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {`"${state.clue}"`}
            </p>
          )}
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: scoreLabel.color, lineHeight: 1 }}>
            {score > 0 ? `+${score}` : '0'}
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, color: scoreLabel.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {winner
              ? iWon ? `${scoreLabel.label} — c'est toi !` : `${scoreLabel.label} — ${winner.name}`
              : scoreLabel.label}
          </p>
        </div>
      </div>

      {/* Spectre avec zones + tous les curseurs */}
      <SpectrumBar
        state={state}
        showTarget={true}
        showZones={true}
        showCursor={true}
        individualCursors={Object.entries(state.cursorPositions).map(([id, pos]) => ({
          position: pos,
          isMe: id === playerId,
        }))}
      />

      {/* Action hôte */}
      {isHost && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={nextRound}>
            {isGameOver ? 'Retour lobby' : 'Go next'}
          </button>
        </div>
      )}
      {!isHost && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Le/la capichef ronfle, on l'attend...
        </p>
      )}

    </div>
  )
}
