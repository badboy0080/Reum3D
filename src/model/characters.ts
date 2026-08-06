import type { CharacterId } from './types'

export interface CharacterOption {
  id: CharacterId
  label: string
  blurb: string
  /** Public URL under Vite `public/` (also used when embedding for export). */
  glbUrl: string
  /** Extra yaw so the figure faces the default camera. */
  yaw: number
}

export const CHARACTERS: Record<CharacterId, CharacterOption> = {
  chao: {
    id: 'chao',
    label: 'Chao',
    blurb: '自定义形象',
    glbUrl: '/characters/chao_model.glb',
    yaw: 0,
  },
}

export function listCharacters() {
  return Object.values(CHARACTERS)
}

/** Old projects may store other ids — always map to Chao. */
export function resolveCharacterId(_raw?: unknown): CharacterId {
  return 'chao'
}
