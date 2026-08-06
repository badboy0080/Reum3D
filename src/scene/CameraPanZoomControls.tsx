import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { clampCameraPose, resolveCamera } from '../model/cameraPresets'
import { useProjectStore } from '../store/projectStore'

const PAN_SENS = 0.01
const WHEEL_SENS = 0.0012
const ORBIT_SENS = 0.005

type DragMode = 'orbit' | 'pan' | null

/**
 * Blender-like viewport controls:
 * - Left-drag: turntable orbit around character body center
 * - Middle-drag / Alt+Left: pan camera in orbit-local plane (orbit center unchanged)
 * - Wheel: dolly (distance to body center)
 */
export function CameraPanZoomControls({ pageId }: { pageId: string }) {
  const { gl, camera } = useThree()
  const pageIdRef = useRef(pageId)
  pageIdRef.current = pageId

  useEffect(() => {
    const el = gl.domElement
    el.style.touchAction = 'none'

    let mode: DragMode = null
    let activePointerId: number | null = null
    let lastX = 0
    let lastY = 0

    const applyPose = (next: ReturnType<typeof clampCameraPose>) => {
      const resolved = resolveCamera(next)
      camera.position.set(...resolved.position)
      camera.lookAt(...resolved.lookAt)
      camera.updateMatrixWorld()
    }

    const endDrag = (pointerId?: number) => {
      if (
        pointerId != null &&
        activePointerId != null &&
        pointerId !== activePointerId
      ) {
        return
      }
      mode = null
      activePointerId = null
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault()
    }

    const onPointerDown = (e: PointerEvent) => {
      if (useProjectStore.getState().isTransitioning) return
      if (activePointerId != null) return

      const altLeft = e.button === 0 && e.altKey
      if (e.button === 1 || altLeft) {
        e.preventDefault()
        mode = 'pan'
      } else if (e.button === 0) {
        mode = 'orbit'
      } else {
        return
      }

      activePointerId = e.pointerId
      lastX = e.clientX
      lastY = e.clientY
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (activePointerId == null || e.pointerId !== activePointerId || !mode) {
        return
      }
      e.preventDefault()
      if (useProjectStore.getState().isTransitioning) {
        endDrag(e.pointerId)
        return
      }

      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      if (dx === 0 && dy === 0) return

      const id = pageIdRef.current
      const page = useProjectStore
        .getState()
        .project.pages.find((p) => p.id === id)
      if (!page) return

      if (mode === 'orbit') {
        // Turntable: yaw around world Y, pitch up/down
        // Mouse up → pitch up (character tips up); mouse left → orbit left
        const next = clampCameraPose({
          ...page.camera,
          orbitYaw: (page.camera.orbitYaw ?? 0) - dx * ORBIT_SENS,
          orbitPitch: (page.camera.orbitPitch ?? 0) + dy * ORBIT_SENS,
        })
        useProjectStore.getState().setPageCameraTweaks(id, {
          orbitYaw: next.orbitYaw,
          orbitPitch: next.orbitPitch,
        })
        applyPose(next)
        return
      }

      // Pan in orbit-local U/V — does NOT move body-center orbit pivot.
      // Character on screen moves opposite to camera truck, so invert mouse dx
      // for “drag left → character goes left” (same for right).
      const next = clampCameraPose({
        ...page.camera,
        panU: (page.camera.panU ?? 0) - dx * PAN_SENS,
        panV: (page.camera.panV ?? 0) + dy * PAN_SENS,
      })
      useProjectStore.getState().setPageCameraTweaks(id, {
        panU: next.panU,
        panV: next.panV,
      })
      applyPose(next)
    }

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) return
      endDrag(e.pointerId)
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (useProjectStore.getState().isTransitioning) return
      const id = pageIdRef.current
      const page = useProjectStore
        .getState()
        .project.pages.find((p) => p.id === id)
      if (!page) return

      const next = clampCameraPose({
        ...page.camera,
        distance: page.camera.distance + e.deltaY * WHEEL_SENS,
      })
      useProjectStore.getState().setPageCameraTweaks(id, {
        distance: next.distance,
      })
      applyPose(next)
    }

    const blockMiddle = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault()
    }

    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('mouseup', blockMiddle)
    el.addEventListener('auxclick', blockMiddle)
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    el.addEventListener('lostpointercapture', onPointerUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('contextmenu', (e) => e.preventDefault())

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mouseup', blockMiddle)
      el.removeEventListener('auxclick', blockMiddle)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      el.removeEventListener('lostpointercapture', onPointerUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl, camera])

  return null
}
