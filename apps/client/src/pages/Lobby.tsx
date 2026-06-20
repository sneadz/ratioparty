import { useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../store.ts'
import { socket } from '../socket.ts'
import type { Player } from '@ratioparty/shared'
import AvatarPreview from '../components/avatar/AvatarPreview.tsx'
import { DEFAULT_AVATAR } from '../components/avatar/avatar.config.ts'
import WavelengthLobby from '../games/wavelength/WavelengthLobby.tsx'

const GAMES = [
  { id: 'wavelength', label: 'Wavelength', description: '2–8 joueurs · Donner des indices sur un spectre' },
]

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

  function selectGame(gameId: string | null) {
    socket.emit('select_game', gameId)
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
            <PlayerRow
              key={player.id}
              player={player}
              isMe={player.id === playerId}
              canKick={isHost && !player.isConnected && player.id !== playerId}
              onKick={() => socket.emit('kick_player', player.id)}
            />
          ))}
        </div>

        {room.selectedGame === null ? (
          isHost ? (
            <div className="stack-sm">
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Choisir un jeu
              </p>
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  className="card-brutal"
                  style={{ cursor: 'pointer', textAlign: 'left', width: '100%', background: 'none', border: '2px solid var(--border-strong)' }}
                  onClick={() => selectGame(game.id)}
                >
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{game.label}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{game.description}</p>
                </button>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              L'hôte choisit un jeu…
            </p>
          )
        ) : (
          <div className="stack-sm">
            {isHost && (
              <button className="btn btn-ghost" style={{ width: 'auto', alignSelf: 'flex-start' }} onClick={() => selectGame(null)}>
                ← Changer de jeu
              </button>
            )}
            {room.selectedGame === 'wavelength' && <WavelengthLobby isHost={isHost} room={room} />}
          </div>
        )}

      </div>
    </div>
  )
}

function PlayerRow({ player, isMe, canKick, onKick }: { player: Player; isMe: boolean; canKick?: boolean; onKick?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', opacity: player.isConnected ? 1 : 0.4 }}>
      <AvatarPreview config={player.avatarConfig ?? DEFAULT_AVATAR} size={36} style={{ border: '1.5px solid var(--border-strong)' }} />
      <span style={{ flex: 1, fontFamily: 'var(--font-body)' }}>{player.name}</span>
      <div className="row" style={{ gap: '0.4rem' }}>
        {player.isHost && <span className="badge badge-accent">hôte</span>}
        {isMe          && <span className="badge badge-muted">toi</span>}
        {canKick && (
          <button
            className="btn btn-ghost"
            style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', color: 'var(--text-muted)' }}
            onClick={onKick}
          >
            Exclure
          </button>
        )}
        <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: player.isConnected ? 'var(--success)' : 'var(--text-muted)', boxShadow: player.isConnected ? '0 0 6px var(--success)' : 'none' }} />
      </div>
    </div>
  )
}
