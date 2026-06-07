import { useState } from 'react'
import type { AvatarConfig, AvatarCategory } from './avatar.types.ts'
import { AVATAR_CATEGORIES, DEFAULT_AVATAR, randomAvatar } from './avatar.config.ts'
import AvatarPreview from './AvatarPreview.tsx'

interface Props {
  config: AvatarConfig
  onChange: (config: AvatarConfig) => void
}

export default function AvatarEditor({ config, onChange }: Props) {
  const [activeCategory, setActiveCategory] = useState<AvatarCategory>('background')

  const category = AVATAR_CATEGORIES.find((c) => c.key === activeCategory)!

  function set(key: AvatarCategory, value: string) {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="stack-sm">

      {/* Preview + Category tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>

        <AvatarPreview config={config} size={72} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Personnaliser
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {AVATAR_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '0.25rem 0.5rem',
                  border: activeCategory === cat.key
                    ? '1.5px solid var(--accent)'
                    : '1.5px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  background: activeCategory === cat.key ? 'var(--accent)' : 'transparent',
                  color: activeCategory === cat.key ? 'var(--accent-on)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.08s',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Options grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {category.options.map((opt) => {
          const isSelected = config[activeCategory] === opt.value
          const hasColor = !!opt.color && opt.color !== 'transparent'
          const isTransparent = opt.color === 'transparent'

          return (
            <button
              key={opt.value}
              title={opt.label}
              onClick={() => set(activeCategory, opt.value)}
              style={{
                width: hasColor || isTransparent ? 36 : 'auto',
                minWidth: 36,
                height: 36,
                padding: hasColor || isTransparent ? 0 : '0 8px',
                border: isSelected
                  ? '2px solid var(--accent)'
                  : '2px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: hasColor ? opt.color : 'var(--bg-raised)',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: isSelected ? '2px 2px 0 var(--accent)' : 'none',
                transform: isSelected ? 'translate(-1px,-1px)' : 'none',
                transition: 'transform 0.08s, box-shadow 0.08s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {isTransparent && (
                <svg width="28" height="28" viewBox="0 0 28 28">
                  <line x1="4" y1="4" x2="24" y2="24" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              {!hasColor && !isTransparent && (
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.55rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                  textAlign: 'center',
                  lineHeight: 1.1,
                  padding: '0 2px',
                }}>
                  {opt.label}
                </span>
              )}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  border: '1px solid var(--accent-on)',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Random + Reset */}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button
          className="btn btn-ghost"
          style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem 0.75rem' }}
          onClick={() => onChange(randomAvatar())}
        >
          Aléatoire
        </button>
        <button
          className="btn btn-ghost"
          style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem 0.75rem' }}
          onClick={() => onChange(DEFAULT_AVATAR)}
        >
          Réinitialiser
        </button>
      </div>
    </div>
  )
}
