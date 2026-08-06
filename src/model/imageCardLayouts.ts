export type ImageCardLayoutId =
  | 'arc'
  | 'arc-wide'
  | 'long-arc'
  | 'linear-spread'
  | 'corner-fan'
  | 'stamp-arc'
  | 'cascade'
  | 'scatter'
  | 'wheel-fan'
  | 'carousel'
  | 'cover-flow'
  | 'time-machine'

export type ImageCardEnterAnim = 'fade-in' | 'zoom-in'
export type ImageCardExitAnim = 'fade-out' | 'none'

export interface ImageCardLayoutMeta {
  id: ImageCardLayoutId
  label: string
  blurb: string
  interaction: 'hover' | 'slide'
  defaultCount: number
}

export const IMAGE_CARD_LAYOUTS: ImageCardLayoutMeta[] = [
  { id: 'arc', label: '扇形弧', blurb: '悬停扇开成弧', interaction: 'hover', defaultCount: 5 },
  { id: 'arc-wide', label: '宽扇形', blurb: '更大弧度展开', interaction: 'hover', defaultCount: 7 },
  { id: 'long-arc', label: '扁长弧', blurb: '横向更宽的弧', interaction: 'hover', defaultCount: 5 },
  { id: 'linear-spread', label: '横向拉开', blurb: '水平排开无旋转', interaction: 'hover', defaultCount: 5 },
  { id: 'corner-fan', label: '角落扇', blurb: '从左下角扇开', interaction: 'hover', defaultCount: 5 },
  { id: 'stamp-arc', label: '邮票弧', blurb: '邮票齿边弧形', interaction: 'hover', defaultCount: 5 },
  { id: 'cascade', label: '错落瀑布', blurb: '斜向错开', interaction: 'hover', defaultCount: 5 },
  { id: 'scatter', label: '发牌散开', blurb: '像发扑克散开', interaction: 'hover', defaultCount: 5 },
  { id: 'wheel-fan', label: '轮状扇', blurb: '半圆轮状展开', interaction: 'hover', defaultCount: 5 },
  { id: 'carousel', label: '轮播', blurb: '左右切换轮播', interaction: 'slide', defaultCount: 5 },
  { id: 'cover-flow', label: '封面流', blurb: '3D Cover Flow', interaction: 'slide', defaultCount: 5 },
  { id: 'time-machine', label: '时间机器', blurb: '透视堆叠时间轴', interaction: 'slide', defaultCount: 5 },
]

export const MIN_IMAGE_CARDS = 2
export const MAX_IMAGE_CARDS = 12

export const PLACEHOLDER_IMAGE_SRCS = [
  'https://picsum.photos/seed/resume-card-1/400/520',
  'https://picsum.photos/seed/resume-card-2/400/520',
  'https://picsum.photos/seed/resume-card-3/400/520',
  'https://picsum.photos/seed/resume-card-4/400/520',
  'https://picsum.photos/seed/resume-card-5/400/520',
  'https://picsum.photos/seed/resume-card-6/400/520',
  'https://picsum.photos/seed/resume-card-7/400/520',
  'https://picsum.photos/seed/resume-card-8/400/520',
  'https://picsum.photos/seed/resume-card-9/400/520',
  'https://picsum.photos/seed/resume-card-10/400/520',
  'https://picsum.photos/seed/resume-card-11/400/520',
  'https://picsum.photos/seed/resume-card-12/400/520',
]

export interface CardPose {
  x: number
  y: number
  rotate: number
  scale: number
  zIndex: number
  rotateY?: number
  z?: number
  opacity?: number
  originX?: number
  originY?: number
}

export interface PoseContext {
  active: boolean
  activeIndex: number
}

export {
  isSlideLayout,
  resolveCardPose,
} from './imageCardPoseRuntime.js'

export function resolveLayoutMeta(id: string): ImageCardLayoutMeta {
  return IMAGE_CARD_LAYOUTS.find((l) => l.id === id) ?? IMAGE_CARD_LAYOUTS[0]
}
