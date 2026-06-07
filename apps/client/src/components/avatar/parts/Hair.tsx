const PINK = '#C97A9A'
const GREY = '#A8A8B0'

function Cap({ color }: { color: string }) {
  return (
    <>
      <ellipse cx="50" cy="30" rx="26" ry="14" fill={color} />
      <rect x="24" y="30" width="52" height="9" fill={color} />
    </>
  )
}

function Long({ color }: { color: string }) {
  return (
    <>
      <Cap color={color} />
      <rect x="14" y="32" width="13" height="40" rx="6" fill={color} />
      <rect x="73" y="32" width="13" height="40" rx="6" fill={color} />
    </>
  )
}

function Bun({ color }: { color: string }) {
  return (
    <>
      <Cap color={color} />
      <circle cx="50" cy="15" r="11" fill={color} />
      <circle cx="50" cy="15" r="7" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
    </>
  )
}

export default function Hair({ value }: { value: string }) {
  switch (value) {
    case 'short-dark':  return <Cap color="#2D1A0C" />
    case 'short-light': return <Cap color="#D4A050" />
    case 'short-pink':  return <Cap color={PINK} />
    case 'short-grey':  return <Cap color={GREY} />
    case 'long-dark':   return <Long color="#2D1A0C" />
    case 'long-light':  return <Long color="#D4A050" />
    case 'long-pink':   return <Long color={PINK} />
    case 'long-grey':   return <Long color={GREY} />
    case 'bun-dark':    return <Bun color="#6B3820" />
    case 'bun-light':   return <Bun color="#D4A050" />
    case 'bun-pink':    return <Bun color={PINK} />
    case 'bun-grey':    return <Bun color={GREY} />
    default:            return null
  }
}
