import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import type { Group } from 'three'
import { CHARACTERS } from '../model/characters'
import { fitCharacterRoot, pickIdleClip } from '../model/fitCharacter'
import { useProjectStore } from '../store/projectStore'
import type { CharacterId } from '../model/types'

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
    <mesh position={[0, 1, 0]} castShadow>
      <capsuleGeometry args={[0.35, 0.9, 6, 12]} />
      <meshStandardMaterial color="#8a8a86" roughness={0.7} />
    </mesh>
  )
}

export function GlbCharacter() {
  const characterId = useProjectStore(
    (s) => s.project.characterId,
  ) as CharacterId
  const look = CHARACTERS[characterId] ?? CHARACTERS.chao

  return (
    <group>
      <Suspense fallback={<CharacterFallback />}>
        <CharacterModel key={look.id} url={look.glbUrl} yaw={look.yaw} />
      </Suspense>
    </group>
  )
}

// Skip preloading the custom Chao model (~57MB) — load on demand when selected.
for (const c of Object.values(CHARACTERS)) {
  if (c.id === 'chao') continue
  useGLTF.preload(c.glbUrl)
}
