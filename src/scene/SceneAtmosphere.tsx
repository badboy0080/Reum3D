import { Grid } from '@react-three/drei'
import {
  BACKGROUND_PRESETS,
  type BackgroundPresetId,
} from '../model/backgroundPresets'
import { SceneBackground } from './SceneBackground'

export function SceneAtmosphere({
  presetId,
}: {
  presetId: BackgroundPresetId
}) {
  const bg = BACKGROUND_PRESETS[presetId] ?? BACKGROUND_PRESETS['night-ink']

  return (
    <>
      <SceneBackground presetId={presetId} />
      <fog attach="fog" args={[bg.fogColor, bg.fogNear, bg.fogFar]} />
      <ambientLight intensity={bg.ambient} />
      <directionalLight
        castShadow
        position={[4, 8, 3]}
        intensity={bg.keyIntensity}
        color={bg.keyLight}
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight
        intensity={0.25}
        color={bg.keyLight}
        groundColor={bg.ground}
      />
      {bg.showGrid ? (
        <Grid
          position={[0, 0.02, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.6}
          sectionSize={2}
          sectionThickness={1.1}
          cellColor="#2a3a4d"
          sectionColor="#3d9cf0"
          fadeDistance={18}
          fadeStrength={1.5}
          infiniteGrid
        />
      ) : null}
    </>
  )
}
