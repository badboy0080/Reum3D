export type PageKind = 'home' | 'about' | 'works' | 'contact' | 'custom'

export type CameraPresetId =
  | 'front-bust'
  | 'side-left'
  | 'top-wide'
  | 'close-up'

export type EnterAnim =
  | 'fade-in'
  | 'slide-up'
  | 'slide-left'
  | 'zoom-in'
  | 'typewriter'
  | 'stagger-lines'

export type ExitAnim = 'fade-out' | 'slide-down' | 'none'

export type TextAlign = 'left' | 'center' | 'right'

export type CharacterId = 'chao'

export type TemplateId = 'narrative' | 'showcase'

export type { BackgroundPresetId } from './backgroundPresets'
export type { BleedStyleId } from './bleedStyles'
export type { TextFontId } from './textStyles'
export type {
  ImageCardLayoutId,
  ImageCardEnterAnim,
  ImageCardExitAnim,
} from './imageCardLayouts'

/**
 * Editor / export camera pose.
 * Orbit is ALWAYS around the character body center (Blender-like orbit center).
 * panU / panV truck the camera in the orbit-local plane without moving that center.
 */
export interface CameraPose {
  presetId: CameraPresetId
  /** Dolly scale relative to preset radius (wheel). */
  distance: number
  /** Extra vertical framing tweak (slider). */
  height: number
  /** Extra horizontal framing tweak (slider) → feeds panU. */
  offsetX: number
  /** Turntable yaw around world Y through body center. */
  orbitYaw: number
  /** Turntable pitch (radians). */
  orbitPitch: number
  /** Orbit-local horizontal pan (middle-drag). Does not move orbit center. */
  panU: number
  /** Orbit-local vertical pan (middle-drag). Does not move orbit center. */
  panV: number
}

export interface TextStyle {
  /** Pixel size at desktop; scales slightly on small screens via CSS. */
  fontSize: number
  fontFamily: import('./textStyles').TextFontId
  fontWeight: 400 | 500 | 700
  color: string
}

export interface TextBlock {
  id: string
  content: string
  layout: {
    x: number
    y: number
    w: number
    align: TextAlign
  }
  style: TextStyle
  enter: EnterAnim
  exit: ExitAnim
}

export interface ImageCardItem {
  id: string
  src: string
  title: string
  caption?: string
}

export interface ImageCardGroup {
  id: string
  layoutKind: import('./imageCardLayouts').ImageCardLayoutId
  layout: {
    x: number
    y: number
    w: number
  }
  cards: ImageCardItem[]
  enter: import('./imageCardLayouts').ImageCardEnterAnim
  exit: import('./imageCardLayouts').ImageCardExitAnim
}

export interface Page {
  id: string
  kind: PageKind
  title: string
  tag: string
  hidden: boolean
  camera: CameraPose
  /** Per-page stage background palette. */
  backgroundPresetId: import('./backgroundPresets').BackgroundPresetId
  texts: TextBlock[]
  imageCardGroups: ImageCardGroup[]
}

export interface Theme {
  primary: string
  background: string
  fontFamily: string
}

export interface Project {
  id: string
  title: string
  characterId: CharacterId
  templateId: TemplateId
  theme: Theme
  /** Always-on stage bleed / crop guide style. */
  bleedStyleId: import('./bleedStyles').BleedStyleId
  pages: Page[]
}

export const ENTER_OPTIONS: { id: EnterAnim; label: string }[] = [
  { id: 'fade-in', label: '淡入' },
  { id: 'slide-up', label: '上滑' },
  { id: 'slide-left', label: '左滑' },
  { id: 'zoom-in', label: '缩放' },
  { id: 'typewriter', label: '打字机' },
  { id: 'stagger-lines', label: '逐行' },
]

export const EXIT_OPTIONS: { id: ExitAnim; label: string }[] = [
  { id: 'fade-out', label: '淡出' },
  { id: 'slide-down', label: '下滑' },
  { id: 'none', label: '无' },
]

export const IMAGE_CARD_ENTER_OPTIONS: {
  id: import('./imageCardLayouts').ImageCardEnterAnim
  label: string
}[] = [
  { id: 'fade-in', label: '淡入' },
  { id: 'zoom-in', label: '缩放' },
]

export const IMAGE_CARD_EXIT_OPTIONS: {
  id: import('./imageCardLayouts').ImageCardExitAnim
  label: string
}[] = [
  { id: 'fade-out', label: '淡出' },
  { id: 'none', label: '无' },
]
