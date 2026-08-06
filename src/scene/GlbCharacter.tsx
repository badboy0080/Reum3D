import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import type { Group, Object3D, Texture } from 'three'
import { CHARACTERS } from '../model/characters'
import { fitCharacterRoot, pickIdleClip } from '../model/fitCharacter'

/** Cap GPU texture size so large Chao maps don't blow WebGL memory. */
const MAX_TEX = 1024

function downscaleTexture(tex: Texture | null | undefined) {
  if (!tex?.image) return
  const img = tex.image as {
    width?: number
    height?: number
    close?: () => void
  }
  const w = img.width ?? 0
  const h = img.height ?? 0
  if (!w || !h || (w <= MAX_TEX && h <= MAX_TEX)) {
    tex.anisotropy = 1
    tex.generateMipmaps = true
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    return
  }
  const scale = MAX_TEX / Math.max(w, h)
  const nw = Math.max(1, Math.round(w * scale))
  const nh = Math.max(1, Math.round(h * scale))
  const canvas = document.createElement('canvas')
  canvas.width = nw
  canvas.height = nh
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(img as CanvasImageSource, 0, 0, nw, nh)
  if (typeof img.close === 'function') {
    try {
      img.close()
    } catch {
      /* ignore */
    }
  }
  tex.image = canvas
  tex.anisotropy = 1
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
}

function prepareModelForGpu(root: Object3D) {
  const seen = new Set<Texture>()
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const mats = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]
    for (const mat of mats) {
      if (!mat || typeof mat !== 'object') continue
      const record = mat as unknown as Record<string, unknown>
      for (const key of [
        'map',
        'normalMap',
        'roughnessMap',
        'metalnessMap',
        'aoMap',
        'emissiveMap',
        'bumpMap',
        'displacementMap',
      ]) {
        const tex = record[key] as Texture | undefined
        if (tex && !seen.has(tex)) {
          seen.add(tex)
          downscaleTexture(tex)
        }
      }
    }
  })
}

function CharacterModel({
  url,
  yaw,
}: {
  url: string
  yaw: number
}) {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(url)
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { actions, mixer } = useAnimations(animations, group)

  useLayoutEffect(() => {
    const root = group.current
    if (!root) return
    prepareModelForGpu(clone)
    fitCharacterRoot(root)
  }, [clone, yaw])

  useEffect(() => {
    const clip = pickIdleClip(animations)
    if (!clip) return
    const action = actions[clip.name]
    if (!action) return
    action.reset().fadeIn(0.25).play()
    return () => {
      action.fadeOut(0.15)
      mixer.stopAllAction()
    }
  }, [actions, animations, mixer])

  return (
    <group ref={group}>
      <group rotation={[0, yaw, 0]}>
        <primitive object={clone} />
      </group>
    </group>
  )
}

function CharacterFallback() {
  return (
    <mesh position={[0, 1, 0]}>
      <capsuleGeometry args={[0.35, 0.9, 6, 12]} />
      <meshStandardMaterial color="#8a8a86" roughness={0.7} />
    </mesh>
  )
}

export function GlbCharacter() {
  const look = CHARACTERS.chao

  return (
    <group>
      <Suspense fallback={<CharacterFallback />}>
        <CharacterModel key={look.id} url={look.glbUrl} yaw={look.yaw} />
      </Suspense>
    </group>
  )
}
