import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { GlbCharacter } from './GlbCharacter'
import { CameraRig } from './CameraRig'
import { CameraPanZoomControls } from './CameraPanZoomControls'
import { SceneAtmosphere } from './SceneAtmosphere'
import { BleedOverlay } from './BleedOverlay'
import { TextOverlay } from './TextOverlay'
import { ImageCardOverlay } from './ImageCardOverlay'
import { CameraHintBar } from '../editor/CameraHintBar'
import { useProjectStore } from '../store/projectStore'

function SceneBody() {
  const pages = useProjectStore((s) => s.project.pages)
  const activePageId = useProjectStore((s) => s.activePageId)
  const page = pages.find((p) => p.id === activePageId) ?? pages[0]

  return (
    <>
      <SceneAtmosphere
        presetId={page.backgroundPresetId ?? 'night-ink'}
      />
      <GlbCharacter />
      <ContactShadows opacity={0.35} scale={10} blur={2.4} far={4} />
      <CameraRig pageId={page.id} pose={page.camera} />
      <CameraPanZoomControls pageId={page.id} />
    </>
  )
}

export function ResumeScene() {
  const project = useProjectStore((s) => s.project)
  const activePageId = useProjectStore((s) => s.activePageId)
  const editMode = useProjectStore((s) => s.editMode)
  const page =
    project.pages.find((p) => p.id === activePageId) ?? project.pages[0]

  return (
    <div className="stage-frame relative h-full w-full overflow-hidden">
      <Canvas
        shadows
        camera={{ fov: 40, near: 0.1, far: 100, position: [0, 1.4, 3.2] }}
        dpr={[1, 1.5]}
      >
        <SceneBody />
      </Canvas>
      <BleedOverlay styleId={project.bleedStyleId ?? 'corner-gold'} />
      <TextOverlay
        texts={page.texts}
        primary={project.theme.primary}
        pageId={page.id}
      />
      <ImageCardOverlay
        groups={page.imageCardGroups ?? []}
        primary={project.theme.primary}
        pageId={page.id}
      />
      {editMode ? <CameraHintBar /> : null}
    </div>
  )
}
