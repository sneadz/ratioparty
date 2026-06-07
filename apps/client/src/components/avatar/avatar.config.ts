import type { AvatarConfig, AvatarCategoryDef } from './avatar.types.ts'

export const DEFAULT_AVATAR: AvatarConfig = {
  background: 'blue',
  skin: 'fair',
  hair: 'short-dark',
  eyes: 'open',
  mouth: 'smile',
  clothes: 'red',
}

export const AVATAR_CATEGORIES: AvatarCategoryDef[] = [
  {
    key: 'background',
    label: 'Fond',
    options: [
      { value: 'pink',   label: 'Rose',   color: '#FFB3CA' },
      { value: 'blue',   label: 'Bleu',   color: '#89BFEE' },
      { value: 'yellow', label: 'Jaune',  color: '#F5E155' },
      { value: 'green',  label: 'Vert',   color: '#78D99A' },
      { value: 'purple', label: 'Violet', color: '#B89AEE' },
      { value: 'orange', label: 'Orange', color: '#F5A55A' },
      { value: 'mint',   label: 'Menthe', color: '#72E0D0' },
      { value: 'slate',  label: 'Ardoise',color: '#7A8FBF' },
    ],
  },
  {
    key: 'skin',
    label: 'Peau',
    options: [
      { value: 'light',  label: 'Clair',  color: '#FDDCB0' },
      { value: 'fair',   label: 'Doux',   color: '#F5BA88' },
      { value: 'medium', label: 'Doré',   color: '#D48C60' },
      { value: 'tan',    label: 'Bronzé', color: '#A85E30' },
      { value: 'dark',   label: 'Foncé',  color: '#6B3820' },
    ],
  },
  {
    key: 'hair',
    label: 'Coiff.',
    options: [
      { value: 'short-dark',  label: 'Court brun',    color: '#2D1A0C' },
      { value: 'short-light', label: 'Court blond',   color: '#D4A050' },
      { value: 'short-pink',  label: 'Court rose',    color: '#C97A9A' },
      { value: 'short-grey',  label: 'Court gris',    color: '#A8A8B0' },
      { value: 'long-dark',   label: 'Long brun',     color: '#2D1A0C' },
      { value: 'long-light',  label: 'Long blond',    color: '#D4A050' },
      { value: 'long-pink',   label: 'Long rose',     color: '#C97A9A' },
      { value: 'long-grey',   label: 'Long gris',     color: '#A8A8B0' },
      { value: 'bun-dark',    label: 'Chignon brun',  color: '#6B3820' },
      { value: 'bun-light',   label: 'Chignon blond', color: '#D4A050' },
      { value: 'bun-pink',    label: 'Chignon rose',  color: '#C97A9A' },
      { value: 'bun-grey',    label: 'Chignon gris',  color: '#A8A8B0' },
    ],
  },
  {
    key: 'eyes',
    label: 'Yeux',
    options: [
      { value: 'open',   label: 'Ouverts' },
      { value: 'closed', label: 'Fermés' },
      { value: 'dot',    label: 'Ronds' },
      { value: 'heart',  label: 'Cœurs' },
      { value: 'star',   label: 'Étoiles' },
    ],
  },
  {
    key: 'mouth',
    label: 'Bouche',
    options: [
      { value: 'smile',      label: 'Sourire' },
      { value: 'big-smile',  label: 'Grand' },
      { value: 'neutral',    label: 'Neutre' },
      { value: 'surprised',  label: 'Surpris' },
      { value: 'smirk',      label: 'Smirk' },
    ],
  },
  {
    key: 'clothes',
    label: 'Vêts.',
    options: [
      { value: 'red',     label: 'Rouge',  color: '#CC2020' },
      { value: 'blue',    label: 'Bleu',   color: '#2060CC' },
      { value: 'black',   label: 'Noir',   color: '#1A1A1A' },
      { value: 'striped', label: 'Rayé',   color: '#E8E8E8' },
    ],
  },
]

export function randomAvatar(): AvatarConfig {
  const pick = (cat: AvatarCategoryDef) => {
    const opts = cat.options
    return opts[Math.floor(Math.random() * opts.length)].value
  }
  const cats = Object.fromEntries(AVATAR_CATEGORIES.map((c) => [c.key, pick(c)])) as unknown as AvatarConfig
  return cats
}
