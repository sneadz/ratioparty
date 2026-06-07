const COLORS: Record<string, string> = {
  pink:   '#FFB3CA',
  blue:   '#89BFEE',
  yellow: '#F5E155',
  green:  '#78D99A',
  purple: '#B89AEE',
  orange: '#F5A55A',
  mint:   '#72E0D0',
  slate:  '#7A8FBF',
}

export default function Background({ value }: { value: string }) {
  return <rect width="100" height="100" fill={COLORS[value] ?? COLORS.blue} />
}
