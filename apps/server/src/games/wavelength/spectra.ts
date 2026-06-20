import type { Spectrum } from '@ratioparty/shared'

export const SPECTRA: Spectrum[] = [
  { left: 'Surcoté',           right: 'Sous-coté' },
  { left: 'Truc de riches',    right: 'Truc de pauvres' },
  { left: 'Courageux',         right: 'Lâche' },
  { left: 'Bon pour la santé', right: 'Mauvais pour la santé' },
  { left: 'Légal',             right: 'Illégal' },
  { left: 'Romantique',        right: 'Glauque' },
  { left: 'Impressionnant',    right: 'Pathétique' },
  { left: 'Réaliste',          right: 'Complètement irréaliste' },
  { left: 'Utile',             right: 'Totalement inutile' },
  { left: 'Ferait un bon film',right: 'Ferait un film nul' },
  { left: 'Serait interdit dans 10 ans', right: 'Existera encore dans 100 ans' },
  { left: 'Passerait au JT de 20h',      right: "N'intéresserait personne" },
  { left: 'Ferait un super prénom',      right: 'Ferait un prénom horrible' },
  { left: 'Satisfaisant',      right: 'Frustrant' },
  { left: 'Propre',            right: 'Dégoûtant' },
  { left: 'Calme',             right: 'Chaotique' },
  { left: 'Classe',            right: 'Ringard' },
  { left: 'Dangereux',         right: 'Inoffensif' },
  { left: 'Drôle',             right: 'Tragique' },
  { left: 'Simple',            right: 'Incompréhensible' },
  { left: 'Trop chaud',        right: 'Trop froid' },
  { left: 'Trop bruyant',      right: 'Trop silencieux' },
  { left: 'À faire seul',      right: 'À faire en groupe' },
  { left: 'Trop rapide',       right: 'Trop lent' },
  { left: 'Luxueux',           right: 'Misérable' },
  { left: 'Héroïque',          right: 'Honteux' },
  { left: 'Naturel',           right: 'Artificiel' },
  { left: 'Ça vieillit bien',  right: 'Ça vieillit mal' },
  { left: 'Ferait un bon super-héros',  right: 'Ferait un super-héros nul' },
  { left: 'Trop commun',       right: 'Trop bizarre' },
  { left: 'Trop sucré',        right: 'Pas assez sucré' },
  { left: 'Ferait un bon président',   right: 'Ferait un président catastrophique' },
  { left: 'Acceptable en public',      right: 'Honteux en public' },
  { left: 'Adulte',            right: 'Enfantin' },
  { left: 'Philosophique',     right: 'Superficiel' },
  { left: 'Ferait un bon voisin',      right: 'Ferait un voisin cauchemardesque' },
  { left: 'Trop sérieux',      right: 'Pas assez sérieux' },
  { left: 'Cliché',            right: 'Original' },
  { left: 'Stressant',         right: 'Relaxant' },
  { left: 'Ferait un bon tatouage',    right: 'Ferait un tatouage regrettable' },
  { left: 'Addict',            right: "On s'en lasse vite" },
  { left: 'Prévisible',        right: 'Imprévisible' },
  { left: 'Ferait un bon mot de passe', right: 'Ferait un mot de passe nul' },
  { left: 'Universel',         right: 'Très niché' },
  { left: 'Inspirant',         right: 'Déprimant' },
]

export function pickSpectrum(exclude: Spectrum[] = []): Spectrum {
  const excludeKeys = new Set(exclude.map((s) => `${s.left}|${s.right}`))
  const available = SPECTRA.filter((s) => !excludeKeys.has(`${s.left}|${s.right}`))
  const pool = available.length > 0 ? available : SPECTRA
  return pool[Math.floor(Math.random() * pool.length)]
}
