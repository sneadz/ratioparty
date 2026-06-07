import { useState } from 'react'
import { socket } from '../socket.ts'
import { useStore } from '../store.ts'

type Mode = 'idle' | 'create' | 'join'

export default function Home() {
  const [mode, setMode] = useState<Mode>('idle')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const { setPlayer } = useStore()

  function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) { setError('Entre un pseudo.'); return }
    setError('')
    setPlayer('', trimmed, '')
    socket.emit('create_room', trimmed)
  }

  function handleJoin() {
    const trimmedName = name.trim()
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedName) { setError('Entre un pseudo.'); return }
    if (trimmedCode.length < 4) { setError('Code invalide.'); return }
    setError('')
    setPlayer('', trimmedName, '')
    socket.emit('join_room', { code: trimmedCode, playerName: trimmedName })
  }

  return (
    <div className="stack">
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <h1>RatioParty</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          Mini-jeux en soirée, entre amis
        </p>
      </div>

      {mode === 'idle' && (
        <div className="stack">
          <button className="btn-primary" onClick={() => setMode('create')}>
            Créer une partie
          </button>
          <button className="btn-secondary" onClick={() => setMode('join')}>
            Rejoindre avec un code
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="card stack">
          <h2>Nouvelle partie</h2>
          <input
            type="text"
            placeholder="Ton pseudo"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          {error && <p className="error">{error}</p>}
          <button className="btn-primary" onClick={handleCreate}>
            Créer
          </button>
          <button className="btn-secondary" onClick={() => { setMode('idle'); setError('') }}>
            Retour
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="card stack">
          <h2>Rejoindre</h2>
          <input
            type="text"
            placeholder="Code de la room (ex: XK92F)"
            maxLength={5}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoFocus
          />
          <input
            type="text"
            placeholder="Ton pseudo"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          {error && <p className="error">{error}</p>}
          <button className="btn-primary" onClick={handleJoin}>
            Rejoindre
          </button>
          <button className="btn-secondary" onClick={() => { setMode('idle'); setError('') }}>
            Retour
          </button>
        </div>
      )}
    </div>
  )
}
