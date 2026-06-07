const COLORS: Record<string, string> = {
  light:  '#FDDCB0',
  fair:   '#F5BA88',
  medium: '#D48C60',
  tan:    '#A85E30',
  dark:   '#6B3820',
}

export default function Skin({ value }: { value: string }) {
  const c = COLORS[value] ?? COLORS.fair
  return (
    <>
      {/* Ears */}
      <ellipse cx="24" cy="51" rx="5" ry="6.5" fill={c} />
      <ellipse cx="76" cy="51" rx="5" ry="6.5" fill={c} />
      {/* Face */}
      <ellipse cx="50" cy="51" rx="26" ry="27" fill={c} />
    </>
  )
}
