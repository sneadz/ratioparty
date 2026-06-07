import type { AvatarConfig } from '@ratioparty/shared'

export type { AvatarConfig }

export type AvatarCategory = 'background' | 'skin' | 'hair' | 'eyes' | 'mouth' | 'clothes'

export interface AvatarOption {
  value: string
  label: string
  color?: string
}

export interface AvatarCategoryDef {
  key: AvatarCategory
  label: string
  options: AvatarOption[]
}
