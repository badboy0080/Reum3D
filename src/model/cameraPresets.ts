import * as THREE from 'three'
import type { CameraPresetId, CameraPose } from './types'

export interface ResolvedCamera {
  position: [number, number, number]
  lookAt: [number, number, number]
}

/**
 * Character body center — fixed Blender-like orbit center.
 * Never moved by middle-mouse pan.
 */
export const BODY_CENTER: [number, number, number] = [0, 1.15, 0]

const PAN_MAX = 6

const PRESETS: Record<
  CameraPresetId,
  { position: [number, number, number]; label: string }
> = {
  'front-bust': {
    label: '正面半身',
    position: [0, 1.35, 3.2],
  },
  'side-left': {
    label: '左侧侧面',
    position: [-3.1, 1.4, 1.2],
  },
  'top-wide': {
    label: '俯视全景',
    position: [0.6, 4.2, 4.0],
  },
  'close-up': {
    label: '特写',
    position: [0.2, 1.55, 1.7],
  },
}

export function listCameraPresets() {
  return (Object.keys(PRESETS) as CameraPresetId[]).map((id) => ({
    id,
    label: PRESETS[id].label,
  }))
}

function wrapAngle(a: number) {
  return ((((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI
}

export function clampCameraPose(pose: CameraPose): CameraPose {
  return {
    presetId: pose.presetId,
    distance: Math.min(2.4, Math.max(0.45, pose.distance)),
    height: Math.min(1.6, Math.max(-1.2, pose.height)),
    offsetX: Math.min(3.5, Math.max(-3.5, pose.offsetX)),
    orbitYaw: wrapAngle(pose.orbitYaw ?? 0),
    orbitPitch: Math.min(1.2, Math.max(-1.0, pose.orbitPitch ?? 0)),
    panU: Math.min(PAN_MAX, Math.max(-PAN_MAX, pose.panU ?? 0)),
    panV: Math.min(PAN_MAX, Math.max(-PAN_MAX, pose.panV ?? 0)),
  }
}

/**
 * Blender-like resolve:
 * - Turntable orbit on a sphere around BODY_CENTER
 * - panU/panV offset both camera and lookAt in the orbit-local plane
 *   so the view trucks, but the orbit center stays on the character
 */
export function resolveCamera(pose: CameraPose): ResolvedCamera {
  const safe = clampCameraPose(pose)
  const pivot = new THREE.Vector3(...BODY_CENTER)
  const base = PRESETS[safe.presetId]

  const presetPos = new THREE.Vector3(...base.position)
  const baseOffset = presetPos.clone().sub(pivot)
  const spherical = new THREE.Spherical().setFromVector3(baseOffset)

  // Dolly
  spherical.radius = Math.max(0.55, baseOffset.length() * safe.distance)

  // Turntable: yaw around world Y, pitch along polar angle
  spherical.theta += safe.orbitYaw
  spherical.phi = THREE.MathUtils.clamp(
    spherical.phi - safe.orbitPitch - safe.height * 0.12,
    0.15,
    Math.PI - 0.15,
  )
  spherical.makeSafe()

  const offset = new THREE.Vector3().setFromSpherical(spherical)

  // Orbit-local basis (camera looks roughly along -offset toward pivot).
  // right = forward × worldUp so +panU is camera-right (not left).
  const forward = offset.clone().negate().normalize()
  const worldUp = new THREE.Vector3(0, 1, 0)
  let right = new THREE.Vector3().crossVectors(forward, worldUp)
  if (right.lengthSq() < 1e-8) {
    right = new THREE.Vector3(1, 0, 0)
  } else {
    right.normalize()
  }
  const up = new THREE.Vector3().crossVectors(right, forward).normalize()

  // Slider offsetX + middle-drag pan share the local plane.
  // Moving camera/lookAt by +pan makes the character appear to slide -pan on screen.
  // Controls therefore use opposite mouse deltas so the character follows the cursor.
  const panU = safe.panU + safe.offsetX
  const panV = safe.panV
  const pan = right.multiplyScalar(panU).add(up.multiplyScalar(panV))

  const position = pivot.clone().add(offset).add(pan)
  const lookAt = pivot.clone().add(pan)

  return {
    position: [position.x, position.y, position.z],
    lookAt: [lookAt.x, lookAt.y, lookAt.z],
  }
}
