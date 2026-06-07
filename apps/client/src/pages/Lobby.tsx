import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useStore } from '../store.ts'
import type { Player } from '@ratioparty/shared'

export default function Lobby() {
  const { code } = useParams<{ code: string }>()
  const { room, playerId } = useStore()
  const [copied, setCopied] = useState(false)

  if (!room || room.id !== code) {
    return <Navigate to="/" replace />
  }

  const inviteUrl = `${window.location.origin}/?join=${room.id}`
  const isHost = playerId === room.hostId
  const connectedCount = room.players.filter((p) => p.isConnected).length

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="stack">
      {/* En-tête */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Code de la room</p>
        <h1 style={{ letterSpacing: '0.15em', fontSize: '2.5rem' }}>{room.id}</h1>
      </div>

      {/* Lien d'invitation */}
      <div className="card stack-sm">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Lien d'invitation</p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            readOnly
            value={inviteUrl}
            style={{ fontSize: '0.8rem', cursor: 'text' }}
          />
          <button
            className="btn-secondary"
            style={{ width: 'auto', whiteSpace: 'nowrap', padding: '0.75rem 1rem' }}
            onClick={copyInviteLink}
          >
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>
      </div>

      {/* Liste des joueurs */}
      <div className="card stack-sm">
        <h2 style={{ marginBottom: '0.25rem' }}>
          Joueurs ({connectedCount}/{room.players.length})
        </h2>
        {room.players.map((player: Player) => (
          <PlayerRow key={player.id} player={player} isMe={player.id === playerId} />
        ))}
      </div>

      {/* Bouton hôte */}
      {isHost && (
        <button
          className="btn-primary"
          disabled={connectedCount < 2}
          title={connectedCount < 2 ? 'Il faut au moins 2 joueurs' : ''}
        >
          {connectedCount < 2 ? 'En attente de joueurs…' : 'Lancer la partie'}
        </button>
      )}

      {!isHost && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          En attente que l'hôte lance la partie…
        </p>
      )}
    </div>
  )
}

function PlayerRow({ player, isMe }: { player: Player; isMe: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.5rem 0',
        borderBottom: '1px solid var(--border)',
        opacity: player.isConnected ? 1 : 0.4,
      }}
    >
      {/* Indicateur de connexion */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: player.isConnected ? 'var(--success)' : 'var(--text-muted)',
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1 }}>
        {player.name}
        {player.isHost && (
          <span style={{ color: 'var(--accent)', fontSize: '0.75rem', marginLeft: '0.4rem' }}>
            hôte
          </span>
        )}
        {isMe && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.4rem' }}>
            (toi)
          </span>
        )}
      </span>
      {!player.isConnected && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>déconnecté</span>
      )}
    </div>
  )
}
