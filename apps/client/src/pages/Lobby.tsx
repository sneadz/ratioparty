import { useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../store.ts'
import { socket } from '../socket.ts'
import type { Player } from '@ratioparty/shared'
import AvatarPreview from '../components/avatar/AvatarPreview.tsx'
import { DEFAULT_AVATAR } from '../components/avatar/avatar.config.ts'

export default function Lobby() {
  const { code } = useParams<{ code: string }>()
  const { room, playerId, reset } = useStore()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  if (!room || room.id !== code) return <Navigate to="/" replace />

  const inviteUrl = `${window.location.origin}/?join=${room.id}`
  const isHost = playerId === room.hostId
  const connectedCount = room.players.filter((p) => p.isConnected).length

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function startGame() {
    socket.emit('game_start')
  }

  function leaveRoom() {
    localStorage.removeItem('rp_code')
    localStorage.removeItem('rp_token')
    reset()
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }} className="stack-lg">

        <button className="btn btn-ghost" style={{ width: 'auto', alignSelf: 'flex-start' }} onClick={leaveRoom}>
          ← Accueil
        </button>

        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Code de la room
          </p>
          <h1 style={{ color: 'var(--accent)', letterSpacing: '0.08em' }}>{room.id}</h1>
        </div>

        <div className="card stack-sm">
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Lien d'invitation
          </p>
          <div className="row">
            <input className="input" type="text" readOnly value={inviteUrl} style={{ fontSize: '0.8rem' }} />
            <button className="btn btn-secondary" style={{ width: 'auto', flexShrink: 0 }} onClick={copyInviteLink}>
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
        </div>

        <div className="card-brutal stack-sm">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h2>Joueurs</h2>
            <span className="badge badge-accent">{connectedCount}/{room.players.length}</span>
          </div>
          {room.players.map((player: Player) => (
            <PlayerRow key={player.id} player={player} isMe={player.id === playerId} />
          ))}
        </div>

        {isHost ? (
          <div className="stack-sm">
            <button className="btn btn-primary" disabled={connectedCount < 2} onClick={startGame}>
              {connectedCount < 2 ? 'En attente de joueurs…' : 'Lancer Wavelength'}
            </button>
            {connectedCount < 2 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Il faut au moins 2 joueurs pour commencer.
              </p>
            )}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            En attente que l'hôte lance…
          </p>
        )}

      </div>
    </div>
  )
}

function PlayerRow({ player, isMe }: { player: Player; isMe: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', opacity: player.isConnected ? 1 : 0.4 }}>
      <AvatarPreview config={player.avatarConfig ?? DEFAULT_AVATAR} size={36} style={{ border: '1.5px solid var(--border-strong)' }} />
      <span style={{ flex: 1, fontFamily: 'var(--font-body)' }}>{player.name}</span>
      <div className="row" style={{ gap: '0.4rem' }}>
        {player.isHost && <span className="badge badge-accent">hôte</span>}
        {isMe          && <span className="badge badge-muted">toi</span>}
        <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: player.isConnected ? 'var(--success)' : 'var(--text-muted)', boxShadow: player.isConnected ? '0 0 6px var(--success)' : 'none' }} />
      </div>
    </div>
  )
}
