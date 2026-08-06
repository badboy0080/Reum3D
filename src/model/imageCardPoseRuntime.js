/** Pure JS pose math — shared by editor TS wrapper and export HTML (?raw embed). */

function centerIndex(count) {
  return (count - 1) / 2
}

function arcParams(kind) {
  switch (kind) {
    case 'arc-wide':
      return { angle: 45, gap: 110, yOffset: 10 }
    case 'long-arc':
      return { angle: 15, gap: 140, yOffset: 10 }
    default:
      return { angle: 30, gap: 70, yOffset: 10 }
  }
}

function arcParabolaY(dist, maxDist, yOffset) {
  const ratio = Math.abs(dist) / Math.max(maxDist, 1)
  if (ratio >= 0.99) return yOffset
  if (ratio >= 0.49) return -0.2 * yOffset
  return -yOffset
}

function scatterOffsets(count) {
  const center = centerIndex(count)
  const maxSpread = 75
  const maxRotate = 15
  return Array.from({ length: count }, (_, i) => {
    const t = count <= 1 ? 0 : (i - center) / Math.max(center, 1)
    return {
      x: t * maxSpread,
      y: Math.sin(t * Math.PI * 0.85) * 25 + (t > 0 ? 8 : -5),
      rotate: t * maxRotate,
    }
  })
}

function stampPose(index, count) {
  const center = centerIndex(count)
  const dist = index - center
  const maxDist = Math.max(center, 1)
  const arc = 25
  const spread = 180
  const yOffset = 40
  const t = dist / maxDist
  return {
    x: t * spread,
    y: Math.abs(t) >= 0.99 ? yOffset : t === 0 ? -0.25 * yOffset : 0.25 * yOffset,
    rotate: t * arc,
    scale: dist === 0 ? 1.05 : 1,
    zIndex: count - Math.abs(Math.round(dist)),
    originX: 0.5,
    originY: 1,
  }
}

function wheelPose(index, count) {
  const center = centerIndex(count)
  const dist = index - center
  const maxDist = Math.max(center, 1)
  const fanAngle = 18
  const angleDeg = (dist / maxDist) * fanAngle * maxDist
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: Math.sin(rad) * 55,
    y: -Math.abs(Math.cos(rad)) * 8,
    rotate: angleDeg,
    scale: dist === 0 ? 1.05 : 1,
    zIndex: count - Math.abs(dist),
    originX: 0.5,
    originY: 1.1,
  }
}

function slidePose(kind, index, count, ctx) {
  const activeIndex = Math.min(Math.max(0, ctx.activeIndex), count - 1)
  const offset = index - activeIndex
  const absOffset = Math.abs(offset)
  const isPast = index < activeIndex
  const isActive = offset === 0

  if (kind === 'carousel') {
    const hovered = ctx.active
    const diff = offset
    return {
      x: diff * 160,
      y: hovered ? diff * 24 : 0,
      rotate: hovered ? diff * 20 : diff * 5,
      scale: isActive ? 1.05 : hovered ? 0.65 : 0.8,
      zIndex: 100 - absOffset,
      opacity: 1,
    }
  }

  if (kind === 'cover-flow') {
    return {
      x: offset * 32,
      y: 0,
      rotate: 0,
      rotateY: isActive ? 0 : isPast ? 38 : -38,
      z: isActive ? 50 : -absOffset * 50,
      scale: isActive ? 1.1 : 1 - absOffset * 0.08,
      zIndex: 100 - absOffset,
      opacity: absOffset > 2 ? 0 : 1 - absOffset * 0.25,
    }
  }

  return {
    x: 0,
    y: isPast ? 300 : -offset * 12,
    rotate: isPast ? -20 : offset * 2,
    rotateY: 0,
    z: isPast ? 200 : -offset * 60,
    scale: isPast ? 1.3 : 1,
    zIndex: count - index,
    opacity: isPast ? 0 : 1 - Math.abs(offset) * 0.2,
  }
}

export function isSlideLayout(kind) {
  return kind === 'carousel' || kind === 'cover-flow' || kind === 'time-machine'
}

export function resolveCardPose(kind, index, count, ctx) {
  const center = centerIndex(count)
  const dist = index - center
  const maxDist = Math.max(center, 1)
  const inactive = {
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    zIndex: count - Math.abs(dist),
    originX: 0.5,
    originY: 1,
  }

  if (kind === 'carousel' || kind === 'cover-flow' || kind === 'time-machine') {
    return slidePose(kind, index, count, ctx)
  }

  if (!ctx.active) return inactive

  switch (kind) {
    case 'arc':
    case 'arc-wide':
    case 'long-arc': {
      const { angle, gap, yOffset } = arcParams(kind)
      return {
        x: dist * (gap / maxDist),
        y: arcParabolaY(dist, maxDist, yOffset),
        rotate: dist * (angle / maxDist),
        scale: dist === 0 ? 1.05 : 1,
        zIndex: count - Math.abs(dist),
        originX: 0.5,
        originY: 1,
      }
    }
    case 'linear-spread':
      return {
        x: dist * (70 / maxDist),
        y: 0,
        rotate: 0,
        scale: dist === 0 ? 1.05 : 1,
        zIndex: count - Math.abs(dist),
        originX: 0.5,
        originY: 1,
      }
    case 'corner-fan': {
      const ratio = count <= 1 ? 0.5 : index / (count - 1)
      return {
        x: 0,
        y: 0,
        rotate: -10 + ratio * 40,
        scale: Math.round(dist) === 0 ? 1.03 : 1,
        zIndex: count - index,
        originX: 0,
        originY: 1,
      }
    }
    case 'stamp-arc':
      return stampPose(index, count)
    case 'cascade':
      return {
        x: dist * 25,
        y: dist * -18 + (dist < 0 ? 10 : dist > 0 ? -5 : -30),
        rotate: dist * 8,
        scale: dist === 0 ? 1.05 : 0.98,
        zIndex: count - Math.abs(dist),
        originX: 0.5,
        originY: 0.5,
      }
    case 'scatter': {
      const offsets = scatterOffsets(count)
      const o = offsets[index] || { x: 0, y: 0, rotate: 0 }
      return {
        x: o.x,
        y: o.y,
        rotate: o.rotate,
        scale: Math.round(dist) === 0 ? 1.05 : 0.98,
        zIndex: count - Math.abs(Math.round(dist)),
        originX: 0.5,
        originY: 0.5,
      }
    }
    case 'wheel-fan':
      return wheelPose(index, count)
    default:
      return inactive
  }
}
