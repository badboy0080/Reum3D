export type BackgroundPresetId =
  | 'night-ink'
  | 'slate-studio'
  | 'warm-amber'
  | 'mist-blue'
  | 'grid-stage'
  | 'dawn-glow'
  | 'deep-ocean'
  | 'graphite-fade'
  | 'leaf-mist'

export type BackgroundKind = 'solid' | 'gradient'

export interface BackgroundPreset {
  id: BackgroundPresetId
  label: string
  blurb: string
  kind: BackgroundKind
  /**
   * Solid: one color.
   * Gradient: top → bottom stops (CSS / canvas use the same order).
   */
  colors: string[]
  fogColor: string
  fogNear: number
  fogFar: number
  ambient: number
  keyLight: string
  keyIntensity: number
  ground: string
  showGrid: boolean
}

/** Primary clear / solid fallback (first stop). */
export function backgroundClearColor(preset: BackgroundPreset): string {
  return preset.colors[0] ?? '#0a0a0b'
}

/** CSS background value for 2D chrome / export page. */
export function backgroundCss(preset: BackgroundPreset): string {
  if (preset.kind === 'gradient' && preset.colors.length >= 2) {
    const stops = preset.colors.join(', ')
    return `linear-gradient(180deg, ${stops})`
  }
  return backgroundClearColor(preset)
}

export const BACKGROUND_PRESETS: Record<BackgroundPresetId, BackgroundPreset> = {
  'night-ink': {
    id: 'night-ink',
    label: '夜墨',
    blurb: '深色纯色',
    kind: 'solid',
    colors: ['#0c1218'],
    fogColor: '#0c1218',
    fogNear: 8,
    fogFar: 22,
    ambient: 0.4,
    keyLight: '#d7e6ff',
    keyIntensity: 1.25,
    ground: '#1a2430',
    showGrid: false,
  },
  'slate-studio': {
    id: 'slate-studio',
    label: '石板棚',
    blurb: '中性灰',
    kind: 'solid',
    colors: ['#1c2128'],
    fogColor: '#1c2128',
    fogNear: 10,
    fogFar: 28,
    ambient: 0.55,
    keyLight: '#ffffff',
    keyIntensity: 1.1,
    ground: '#2a313c',
    showGrid: false,
  },
  'warm-amber': {
    id: 'warm-amber',
    label: '暖琥珀',
    blurb: '暖色纯色',
    kind: 'solid',
    colors: ['#1a120e'],
    fogColor: '#2a1810',
    fogNear: 7,
    fogFar: 20,
    ambient: 0.42,
    keyLight: '#ffd2a1',
    keyIntensity: 1.35,
    ground: '#2b1d14',
    showGrid: false,
  },
  'mist-blue': {
    id: 'mist-blue',
    label: '薄雾蓝',
    blurb: '冷色纯色',
    kind: 'solid',
    colors: ['#0e1824'],
    fogColor: '#1a3048',
    fogNear: 5,
    fogFar: 18,
    ambient: 0.5,
    keyLight: '#b8d4ff',
    keyIntensity: 1.15,
    ground: '#152433',
    showGrid: false,
  },
  'grid-stage': {
    id: 'grid-stage',
    label: '网格舞台',
    blurb: '舞台+网格',
    kind: 'solid',
    colors: ['#0a0d12'],
    fogColor: '#0a0d12',
    fogNear: 12,
    fogFar: 30,
    ambient: 0.35,
    keyLight: '#9ad0ff',
    keyIntensity: 1.2,
    ground: '#121820',
    showGrid: true,
  },
  'dawn-glow': {
    id: 'dawn-glow',
    label: '可可',
    blurb: '暖褐深色渐变',
    kind: 'gradient',
    colors: ['#3b2a23', '#271c18', '#130f0d'],
    fogColor: '#1e1613',
    fogNear: 9,
    fogFar: 24,
    ambient: 0.48,
    keyLight: '#e8d5c8',
    keyIntensity: 1.15,
    ground: '#1a1411',
    showGrid: false,
  },
  'deep-ocean': {
    id: 'deep-ocean',
    label: '墨蓝',
    blurb: '青灰深色渐变',
    kind: 'gradient',
    colors: ['#262d3c', '#191e29', '#0c0f16'],
    fogColor: '#151922',
    fogNear: 8,
    fogFar: 22,
    ambient: 0.46,
    keyLight: '#c9d4e8',
    keyIntensity: 1.15,
    ground: '#12161e',
    showGrid: false,
  },
  'graphite-fade': {
    id: 'graphite-fade',
    label: '松烟',
    blurb: '墨绿深色渐变',
    kind: 'gradient',
    colors: ['#11211e', '#0e1c18', '#09110f'],
    fogColor: '#0c1614',
    fogNear: 10,
    fogFar: 26,
    ambient: 0.48,
    keyLight: '#d4e8e0',
    keyIntensity: 1.1,
    ground: '#0d1513',
    showGrid: false,
  },
  'leaf-mist': {
    id: 'leaf-mist',
    label: '暮紫',
    blurb: '暗紫深色渐变',
    kind: 'gradient',
    colors: ['#1c1320', '#14101a', '#08070b'],
    fogColor: '#120e18',
    fogNear: 10,
    fogFar: 26,
    ambient: 0.48,
    keyLight: '#e0d4ec',
    keyIntensity: 1.1,
    ground: '#100e16',
    showGrid: false,
  },
}

export function listBackgroundPresets() {
  return Object.values(BACKGROUND_PRESETS)
}

export function resolveBackgroundPresetId(raw: unknown): BackgroundPresetId {
  if (typeof raw === 'string' && raw in BACKGROUND_PRESETS) {
    return raw as BackgroundPresetId
  }
  return 'night-ink'
}
