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
      {/* ContactShadows 自带模糊贴图，不走 WebGLShadowMap，避免 PCFSoft 弃用刷屏 */}
      <ContactShadows
        opacity={0.28}
        scale={8}
        blur={1.8}
        far={3.5}
        resolution={256}
        frames={1}
      />
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
        // 不启用 WebGL shadow map，避免 Three r185+ 对 PCFSoftShadowMap 每帧警告
        shadows={false}
        camera={{ fov: 40, near: 0.1, far: 100, position: [0, 1.4, 3.2] }}
        dpr={1}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          stencil: false,
        }}
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
