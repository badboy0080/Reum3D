import * as THREE from 'three'

/** Target standing height in world units (matches BODY_CENTER ≈ 1.15). */
export const CHARACTER_TARGET_HEIGHT = 2.05

/**
 * Scale a loaded GLB so feet sit on y=0 and height ≈ CHARACTER_TARGET_HEIGHT,
 * then center on XZ. Call after the object is in the scene graph.
 */
export function fitCharacterRoot(
  root: THREE.Object3D,
  targetHeight = CHARACTER_TARGET_HEIGHT,
): void {
  root.position.set(0, 0, 0)
  root.scale.set(1, 1, 1)
  root.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3())
  if (size.y < 1e-4) return

  const s = targetHeight / size.y
  root.scale.setScalar(s)
  root.updateMatrixWorld(true)

  const fitted = new THREE.Box3().setFromObject(root)
  root.position.x = -(fitted.min.x + fitted.max.x) / 2
  root.position.z = -(fitted.min.z + fitted.max.z) / 2
  root.position.y = -fitted.min.y
}

/** Prefer an idle / stand clip; otherwise first animation. */
export function pickIdleClip(
  animations: THREE.AnimationClip[],
): THREE.AnimationClip | null {
  if (!animations.length) return null
  return (
    animations.find((c) => /idle/i.test(c.name)) ??
    animations.find((c) => /stand/i.test(c.name)) ??
    animations[0]
  )
}
