export default function Clothes({ value }: { value: string }) {
  switch (value) {
    case 'none':
      return null

    case 'red':
      return (
        <>
          <path d="M0 78 L28 72 Q50 80 72 72 L100 78 L100 105 L0 105 Z" fill="#CC2020" />
          <path d="M28 72 Q50 80 72 72" fill="none" stroke="#AA1A10" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )

    case 'blue':
      return (
        <>
          <path d="M0 78 L28 72 Q50 80 72 72 L100 78 L100 105 L0 105 Z" fill="#2060CC" />
          <path d="M28 72 Q50 80 72 72" fill="none" stroke="#1040AA" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )

    case 'black':
      return (
        <>
          <path d="M0 78 L28 72 Q50 80 72 72 L100 78 L100 105 L0 105 Z" fill="#1A1A1A" />
          <path d="M28 72 Q50 80 72 72" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )

    case 'striped':
      return (
        <>
          <path d="M0 78 L28 72 Q50 80 72 72 L100 78 L100 105 L0 105 Z" fill="#E8E8E8" />
          <path d="M0 83 L100 83 L100 88 L0 88 Z" fill="#2060CC" opacity="0.7" />
          <path d="M0 92 L100 92 L100 97 L0 97 Z" fill="#2060CC" opacity="0.7" />
          <path d="M0 101 L100 101 L100 106 L0 106 Z" fill="#2060CC" opacity="0.7" />
          <path d="M28 72 Q50 80 72 72" fill="none" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )

    default:
      return null
  }
}
