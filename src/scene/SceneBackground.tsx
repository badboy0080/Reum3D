import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import {
  BACKGROUND_PRESETS,
  backgroundClearColor,
  type BackgroundPresetId,
} from '../model/backgroundPresets'

function makeGradientTexture(colors: string[]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return new THREE.CanvasTexture(canvas)
  }
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  const last = Math.max(colors.length - 1, 1)
  colors.forEach((color, i) => {
    gradient.addColorStop(i / last, color)
  })
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

/**
 * Scene clear / gradient backdrop. Gradients use a small canvas texture
 * so editor preview and export can share the same color stops.
 */
export function SceneBackground({
  presetId,
}: {
  presetId: BackgroundPresetId
}) {
  const bg = BACKGROUND_PRESETS[presetId] ?? BACKGROUND_PRESETS['night-ink']
  const colorKey = bg.colors.join('|')

  const gradientTexture = useMemo(() => {
    if (bg.kind !== 'gradient' || bg.colors.length < 2) return null
    return makeGradientTexture(bg.colors)
  }, [bg.kind, colorKey, bg.colors])

  useEffect(() => {
    return () => {
      gradientTexture?.dispose()
    }
  }, [gradientTexture])

  if (gradientTexture) {
    return <primitive attach="background" object={gradientTexture} />
  }

  return <color attach="background" args={[backgroundClearColor(bg)]} />
}
