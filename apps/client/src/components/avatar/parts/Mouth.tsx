const MX = 50
const MY = 64

export default function Mouth({ value }: { value: string }) {
  switch (value) {
    case 'smile':
      return (
        <path
          d={`M${MX-9} ${MY-2} Q${MX} ${MY+7} ${MX+9} ${MY-2}`}
          stroke="#2D1A0C"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      )

    case 'big-smile':
      return (
        <>
          {/* Forme D fermée : lèvre haute + lèvre basse */}
          <path
            d={`M${MX-12} ${MY-2} Q${MX} ${MY+13} ${MX+12} ${MY-2} Q${MX} ${MY+4} ${MX-12} ${MY-2} Z`}
            fill="#2D1A0C"
          />
          {/* Dents : bande blanche dans la partie haute */}
          <path
            d={`M${MX-11} ${MY-1} Q${MX} ${MY+5} ${MX+11} ${MY-1} L${MX+11} ${MY+3} Q${MX} ${MY+8} ${MX-11} ${MY+3} Z`}
            fill="white"
          />
        </>
      )

    case 'neutral':
      return (
        <line
          x1={MX - 9}
          y1={MY}
          x2={MX + 9}
          y2={MY}
          stroke="#2D1A0C"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )

    case 'surprised':
      return (
        <>
          <ellipse cx={MX} cy={MY + 2} rx="6" ry="7" fill="#2D1A0C" />
          <ellipse cx={MX} cy={MY + 2} rx="4" ry="5" fill="#7A3A3A" />
        </>
      )

    case 'smirk':
      return (
        <path
          d={`M${MX-8} ${MY+2} Q${MX+2} ${MY+8} ${MX+9} ${MY-2}`}
          stroke="#2D1A0C"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      )

    default:
      return null
  }
}
