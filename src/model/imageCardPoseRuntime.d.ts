export function isSlideLayout(kind: string): boolean
export function resolveCardPose(
  kind: string,
  index: number,
  count: number,
  ctx: { active: boolean; activeIndex: number },
): {
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
