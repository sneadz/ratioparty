import { useState } from 'react'
import { socket } from '../socket.ts'
import { useStore } from '../store.ts'
import AvatarEditor from '../components/avatar/AvatarEditor.tsx'

type Mode = 'idle' | 'create' | 'join'

export default function Home() {
  const [mode, setMode] = useState<Mode>('idle')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setPlayer, avatarConfig, setAvatarConfig } = useStore()

  function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) { setError('Entre un pseudo.'); return }
    if (loading) return
    setError('')
    setLoading(true)
    localStorage.removeItem('rp_code')
    localStorage.removeItem('rp_token')
    setPlayer('', trimmed, '')
    socket.emit('create_room', { playerName: trimmed, avatarConfig })
  }

  function handleJoin() {
    const trimmedName = name.trim()
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedName) { setError('Entre un pseudo.'); return }
    if (trimmedCode.length < 4) { setError('Code invalide.'); return }
    if (loading) return
    setError('')
    setLoading(true)
    localStorage.removeItem('rp_code')
    localStorage.removeItem('rp_token')
    setPlayer('', trimmedName, '')
    socket.emit('join_room', { code: trimmedCode, playerName: trimmedName, avatarConfig })
  }

  function back() { setMode('idle'); setError(''); setName(''); setCode(''); setLoading(false) }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }} className="stack-lg">

        {/* Logo */}
        <div>
          <h1 style={{ color: 'var(--accent)' }}>Ratio<br />Party</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontFamily: 'var(--font-body)' }}>
            Mini-jeux en soirée, entre amis.
          </p>
        </div>

        {/* Idle */}
        {mode === 'idle' && (
          <div className="stack">
            <button className="btn btn-primary" onClick={() => setMode('create')}>
              Créer une partie
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('join')}>
              Rejoindre avec un code
            </button>
          </div>
        )}

        {/* Créer */}
        {mode === 'create' && (
          <div className="card-brutal stack">
            <h2>Nouvelle partie</h2>
            <input
              className="input"
              type="text"
              placeholder="Ton pseudo"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <AvatarEditor config={avatarConfig} onChange={setAvatarConfig} />
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
              {loading ? 'Création…' : 'Créer'}
            </button>
            <button className="btn btn-ghost" onClick={back}>
              Retour
            </button>
          </div>
        )}

        {/* Rejoindre */}
        {mode === 'join' && (
          <div className="card-brutal stack">
            <h2>Rejoindre</h2>
            <input
              className="input"
              type="text"
              placeholder="Code de la room (ex : XK92F)"
              maxLength={5}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoFocus
            />
            <input
              className="input"
              type="text"
              placeholder="Ton pseudo"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <AvatarEditor config={avatarConfig} onChange={setAvatarConfig} />
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary" onClick={handleJoin} disabled={loading}>
              {loading ? 'Connexion…' : 'Rejoindre'}
            </button>
            <button className="btn btn-ghost" onClick={back}>
              Retour
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
