export type BleedStyleId =
  | 'corner-gold'
  | 'corner-silver'
  | 'frame-hairline'
  | 'bracket-warm'
  | 'cross-cyan'

/** Distance from stage outer edge to the bleed guide (px). */
export const BLEED_INSET_PX = 40

/** Always-on full rectangle around the bleed inset (20% opacity). */
export const BLEED_FRAME_COLOR = 'rgba(255, 255, 255, 0.2)'
export const BLEED_FRAME_STROKE = 1

export interface BleedStyle {
  id: BleedStyleId
  label: string
  blurb: string
  /** Corner / cross mark color */
  color: string
  /** How corner marks are drawn (frame is always drawn separately). */
  variant: 'corners' | 'brackets' | 'cross'
  /** Line thickness in CSS px */
  stroke: number
  /** Arm length for corner marks (px) — already at compact size */
  arm: number
}

export const BLEED_STYLES: Record<BleedStyleId, BleedStyle> = {
  'corner-gold': {
    id: 'corner-gold',
    label: '金角准星',
    blurb: '四角 L + 小十字 · 含半透明全框',
    color: '#c4a574',
    variant: 'corners',
    stroke: 1,
    arm: 14,
  },
  'corner-silver': {
    id: 'corner-silver',
    label: '银角细线',
    blurb: '浅灰四角 · 含半透明全框',
    color: 'rgba(230,230,225,0.7)',
    variant: 'corners',
    stroke: 1,
    arm: 12,
  },
  'frame-hairline': {
    id: 'frame-hairline',
    label: '细框银角',
    blurb: '更淡四角 · 含半透明全框',
    color: 'rgba(255,255,255,0.45)',
    variant: 'corners',
    stroke: 1,
    arm: 12,
  },
  'bracket-warm': {
    id: 'bracket-warm',
    label: '暖色括号',
    blurb: '短括号角标 · 含半透明全框',
    color: '#d4a28a',
    variant: 'brackets',
    stroke: 1.25,
    arm: 9,
  },
  'cross-cyan': {
    id: 'cross-cyan',
    label: '青十字',
    blurb: '四角十字 · 含半透明全框',
    color: '#7dd3fc',
    variant: 'cross',
    stroke: 1,
    arm: 7,
  },
}

export function listBleedStyles() {
  return Object.values(BLEED_STYLES)
}

export function resolveBleedStyleId(raw: unknown): BleedStyleId {
  if (typeof raw === 'string' && raw in BLEED_STYLES) {
    return raw as BleedStyleId
  }
  return 'corner-gold'
}
