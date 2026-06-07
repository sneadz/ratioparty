import type { AvatarConfig } from './avatar.types.ts'
import Background from './parts/Background.tsx'
import Skin from './parts/Skin.tsx'
import Hair from './parts/Hair.tsx'
import Eyes from './parts/Eyes.tsx'
import Mouth from './parts/Mouth.tsx'
import Clothes from './parts/Clothes.tsx'

interface Props {
  config: AvatarConfig
  size?: number
  style?: React.CSSProperties
}

export default function AvatarPreview({ config, size = 80, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        borderRadius: '50%',
        border: '2px solid var(--border-strong)',
        flexShrink: 0,
        display: 'block',
        ...style,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Contour fin noir autour de chaque calque */}
        <filter id="av-outline" x="-10%" y="-10%" width="120%" height="120%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="1.4" result="expanded" />
          <feFlood floodColor="#000000" floodOpacity="0.85" result="color" />
          <feComposite in="color" in2="expanded" operator="in" result="outline" />
          <feMerge>
            <feMergeNode in="outline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Stacking order: bg → clothes (behind face) → skin → hair → eyes → mouth */}
      <Background value={config.background} />
      <g filter="url(#av-outline)"><Clothes value={config.clothes} /></g>
      <g filter="url(#av-outline)"><Skin value={config.skin} /></g>
      <g filter="url(#av-outline)"><Hair value={config.hair} /></g>
      <Eyes value={config.eyes} />
      <Mouth value={config.mouth} />
    </svg>
  )
}
