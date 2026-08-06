import { useLayoutEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import { resolveCamera } from '../model/cameraPresets'
import type { CameraPose } from '../model/types'
import { useProjectStore } from '../store/projectStore'

const DURATION = 1.05

/**
 * Page / preset changes → smooth GSAP.
 * Orbit / pan / dolly tweaks → immediate snap.
 */
export function CameraRig({
  pageId,
  pose,
}: {
  pageId: string
  pose: CameraPose
}) {
  const { camera, invalidate } = useThree()
  const lookTarget = useRef(new THREE.Vector3())
  const setTransitioning = useProjectStore((s) => s.setTransitioning)
  const prevPageId = useRef(pageId)
  const prevPreset = useRef(pose.presetId)
  const first = useRef(true)
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const transitionGen = useRef(0)

  useLayoutEffect(() => {
    const resolved = resolveCamera(pose)
    const toPos = new THREE.Vector3(...resolved.position)
    const toLook = new THREE.Vector3(...resolved.lookAt)

    const pageChanged = prevPageId.current !== pageId
    const presetChanged = prevPreset.current !== pose.presetId
    const shouldAnimate = !first.current && (pageChanged || presetChanged)

    prevPageId.current = pageId
    prevPreset.current = pose.presetId

    const applyLook = (pos: THREE.Vector3, look: THREE.Vector3) => {
      camera.position.copy(pos)
      lookTarget.current.copy(look)
      camera.lookAt(lookTarget.current)
      invalidate()
    }

    if (first.current) {
      applyLook(toPos, toLook)
      first.current = false
      return
    }

    if (!shouldAnimate) {
      if (tweenRef.current) return
      applyLook(toPos, toLook)
      return
    }

    tweenRef.current?.kill()
    const gen = ++transitionGen.current
    setTransitioning(true)

    const fromPos = camera.position.clone()
    const fromLook = lookTarget.current.clone()
    const proxy = { t: 0 }

    tweenRef.current = gsap.to(proxy, {
      t: 1,
      duration: DURATION,
      ease: 'power2.inOut',
      immediateRender: false,
      onUpdate: () => {
        if (transitionGen.current !== gen) return
        camera.position.lerpVectors(fromPos, toPos, proxy.t)
        lookTarget.current.lerpVectors(fromLook, toLook, proxy.t)
        camera.lookAt(lookTarget.current)
        invalidate()
      },
      onComplete: () => {
        if (transitionGen.current !== gen) return
        applyLook(toPos, toLook)
        tweenRef.current = null
        setTransitioning(false)
      },
    })

    return () => {
      tweenRef.current?.kill()
      tweenRef.current = null
      if (transitionGen.current === gen) {
        setTransitioning(false)
      }
    }
  }, [
    pageId,
    pose.presetId,
    pose.distance,
    pose.height,
    pose.offsetX,
    pose.orbitYaw,
    pose.orbitPitch,
    pose.panU,
    pose.panV,
    camera,
    invalidate,
    setTransitioning,
  ])

  return null
}
