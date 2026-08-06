import type { CharacterId } from './types'

export interface CharacterOption {
  id: CharacterId
  label: string
  blurb: string
  /** Public URL under Vite `public/` (also used when embedding for export). */
  glbUrl: string
  /** Extra yaw so the figure faces the default camera (+Z toward viewer → face -Z). */
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
  classic: {
    id: 'classic',
    label: 'Classic',
    blurb: '经典示例外形',
    glbUrl: '/characters/classic.glb',
    yaw: 0,
  },
  robot: {
    id: 'robot',
    label: 'Robot',
    blurb: '表情机器人',
    glbUrl: '/characters/robot.glb',
    yaw: 0,
  },
  soldier: {
    id: 'soldier',
    label: 'Scout',
    blurb: '战术人形',
    glbUrl: '/characters/soldier.glb',
    yaw: Math.PI,
  },
  xbot: {
    id: 'xbot',
    label: 'Neo',
    blurb: '现代人形',
    glbUrl: '/characters/xbot.glb',
    yaw: Math.PI,
  },
}

const LEGACY_CHARACTER_MAP: Record<string, CharacterId> = {
  clay: 'classic',
  matte: 'soldier',
  mini: 'robot',
  rounded: 'xbot',
}

export function listCharacters() {
  return Object.values(CHARACTERS)
}

export function resolveCharacterId(raw: unknown): CharacterId {
  if (typeof raw === 'string' && raw in CHARACTERS) {
    return raw as CharacterId
  }
  if (typeof raw === 'string' && raw in LEGACY_CHARACTER_MAP) {
    return LEGACY_CHARACTER_MAP[raw]
  }
  return 'chao'
}
