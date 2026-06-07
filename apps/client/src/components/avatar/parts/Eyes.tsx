const LX = 38
const RX = 62
const EY = 49

export default function Eyes({ value }: { value: string }) {
  switch (value) {
    case 'open':
      return (
        <>
          <circle cx={LX} cy={EY} r="5.5" fill="white" />
          <circle cx={LX} cy={EY} r="3.5" fill="#3A3A3A" />
          <circle cx={LX} cy={EY} r="2" fill="#111" />
          <circle cx={LX - 1.5} cy={EY - 1.5} r="1.2" fill="white" />

          <circle cx={RX} cy={EY} r="5.5" fill="white" />
          <circle cx={RX} cy={EY} r="3.5" fill="#3A3A3A" />
          <circle cx={RX} cy={EY} r="2" fill="#111" />
          <circle cx={RX - 1.5} cy={EY - 1.5} r="1.2" fill="white" />
        </>
      )

    case 'closed':
      return (
        <>
          <path d={`M${LX-5} ${EY} Q${LX} ${EY-5} ${LX+5} ${EY}`} stroke="#2D1A0C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d={`M${RX-5} ${EY} Q${RX} ${EY-5} ${RX+5} ${EY}`} stroke="#2D1A0C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )

    case 'dot':
      return (
        <>
          <circle cx={LX} cy={EY} r="3.5" fill="#2D1A0C" />
          <circle cx={RX} cy={EY} r="3.5" fill="#2D1A0C" />
        </>
      )

    case 'heart':
      return (
        <>
          <text x={LX} y={EY + 4} textAnchor="middle" fontSize="11" fill="#E8395A">♥</text>
          <text x={RX} y={EY + 4} textAnchor="middle" fontSize="11" fill="#E8395A">♥</text>
        </>
      )

    case 'star':
      return (
        <>
          <text x={LX} y={EY + 4} textAnchor="middle" fontSize="11" fill="#F0D840">★</text>
          <text x={RX} y={EY + 4} textAnchor="middle" fontSize="11" fill="#F0D840">★</text>
        </>
      )

    default:
      return null
  }
}
