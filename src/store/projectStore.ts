import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  createCustomPage,
  createDefaultProject,
  imageCard,
  imageCardGroup,
  MAX_CUSTOM_PAGES,
  normalizeProject,
} from '../model/defaults'
import { clampCameraPose } from '../model/cameraPresets'
import { applyTemplate } from '../model/templates'
import type { BackgroundPresetId } from '../model/backgroundPresets'
import type { BleedStyleId } from '../model/bleedStyles'
import type { ImageCardLayoutId } from '../model/imageCardLayouts'
import {
  MAX_IMAGE_CARDS,
  MIN_IMAGE_CARDS,
} from '../model/imageCardLayouts'
import { DEFAULT_TEXT_STYLE } from '../model/defaults'
import type {
  CameraPose,
  CameraPresetId,
  CharacterId,
  EnterAnim,
  ExitAnim,
  ImageCardEnterAnim,
  ImageCardExitAnim,
  ImageCardGroup,
  ImageCardItem,
  Project,
  TemplateId,
  TextAlign,
  TextBlock,
  TextStyle,
} from '../model/types'
import { createDebouncedStorage } from './debouncedStorage'

interface ProjectState {
  project: Project
  activePageId: string
  selectedTextId: string | null
  selectedImageGroupId: string | null
  isTransitioning: boolean
  editMode: boolean
  setTitle: (title: string) => void
  setActivePageId: (id: string) => void
  setSelectedTextId: (id: string | null) => void
  setSelectedImageGroupId: (id: string | null) => void
  setTransitioning: (v: boolean) => void
  setEditMode: (v: boolean) => void
  goNextPage: () => void
  goPrevPage: () => void
  setPageCameraPreset: (pageId: string, presetId: CameraPresetId) => void
  setPageCameraTweaks: (
    pageId: string,
    tweaks: Partial<
      Pick<
        CameraPose,
        | 'distance'
        | 'height'
        | 'offsetX'
        | 'orbitYaw'
        | 'orbitPitch'
        | 'panU'
        | 'panV'
      >
    >,
  ) => void
  setBackgroundPreset: (pageId: string, id: BackgroundPresetId) => void
  setBleedStyleId: (id: BleedStyleId) => void
  setCharacterId: (id: CharacterId) => void
  setTemplate: (id: TemplateId) => void
  setThemePrimary: (color: string) => void
  setPageTitle: (pageId: string, title: string) => void
  setPageTag: (pageId: string, tag: string) => void
  setPageHidden: (pageId: string, hidden: boolean) => void
  addCustomPage: () => void
  removeCustomPage: (pageId: string) => void
  addTextBlock: (pageId: string) => void
  removeTextBlock: (pageId: string, textId: string) => void
  updateTextContent: (pageId: string, textId: string, content: string) => void
  updateTextLayout: (
    pageId: string,
    textId: string,
    layout: Partial<TextBlock['layout']>,
  ) => void
  updateTextAnim: (
    pageId: string,
    textId: string,
    anim: { enter?: EnterAnim; exit?: ExitAnim; align?: TextAlign },
  ) => void
  updateTextStyle: (
    pageId: string,
    textId: string,
    style: Partial<TextStyle>,
  ) => void
  addImageCardGroup: (pageId: string) => void
  removeImageCardGroup: (pageId: string, groupId: string) => void
  updateImageGroupLayoutKind: (
    pageId: string,
    groupId: string,
    kind: ImageCardLayoutId,
  ) => void
  updateImageGroupLayout: (
    pageId: string,
    groupId: string,
    layout: Partial<ImageCardGroup['layout']>,
  ) => void
  updateImageGroupAnim: (
    pageId: string,
    groupId: string,
    anim: { enter?: ImageCardEnterAnim; exit?: ImageCardExitAnim },
  ) => void
  setImageGroupCardCount: (
    pageId: string,
    groupId: string,
    count: number,
  ) => void
  updateImageCard: (
    pageId: string,
    groupId: string,
    cardId: string,
    partial: Partial<Pick<ImageCardItem, 'src' | 'title' | 'caption'>>,
  ) => void
  visiblePages: () => Project['pages']
  customPageCount: () => number
  resetProject: () => void
}

function visible(project: Project) {
  return project.pages.filter((p) => !p.hidden)
}

function mapPage(
  project: Project,
  pageId: string,
  fn: (page: Project['pages'][number]) => Project['pages'][number],
): Project {
  return {
    ...project,
    pages: project.pages.map((p) => (p.id === pageId ? fn(p) : p)),
  }
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => {
      const project = createDefaultProject()
      return {
        project,
        activePageId: project.pages[0].id,
        selectedTextId: null,
        selectedImageGroupId: null,
        isTransitioning: false,
        editMode: true,

        setTitle: (title) =>
          set((s) => ({ project: { ...s.project, title } })),

        setActivePageId: (id) =>
          set({ activePageId: id, selectedTextId: null, selectedImageGroupId: null }),

        setSelectedTextId: (id) =>
          set({ selectedTextId: id, selectedImageGroupId: id ? null : get().selectedImageGroupId }),

        setSelectedImageGroupId: (id) =>
          set({ selectedImageGroupId: id, selectedTextId: id ? null : get().selectedTextId }),

        setTransitioning: (v) => set({ isTransitioning: v }),

        setEditMode: (v) =>
          set({ editMode: v, selectedTextId: null, selectedImageGroupId: null }),

        visiblePages: () => visible(get().project),

        customPageCount: () =>
          get().project.pages.filter((p) => p.kind === 'custom').length,

        goNextPage: () => {
          const pages = visible(get().project)
          const idx = pages.findIndex((p) => p.id === get().activePageId)
          if (idx < 0 || idx >= pages.length - 1) return
          set({ activePageId: pages[idx + 1].id, selectedTextId: null, selectedImageGroupId: null })
        },

        goPrevPage: () => {
          const pages = visible(get().project)
          const idx = pages.findIndex((p) => p.id === get().activePageId)
          if (idx <= 0) return
          set({ activePageId: pages[idx - 1].id, selectedTextId: null, selectedImageGroupId: null })
        },

        setPageCameraPreset: (pageId, presetId) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              // Switching preset resets orbit so framing stays predictable.
              camera: {
                ...p.camera,
                presetId,
                orbitYaw: 0,
                orbitPitch: 0,
                panU: 0,
                panV: 0,
              },
            })),
          })),

        setPageCameraTweaks: (pageId, tweaks) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              camera: clampCameraPose({ ...p.camera, ...tweaks }),
            })),
          })),

        setBackgroundPreset: (pageId, id) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              backgroundPresetId: id,
            })),
          })),

        setBleedStyleId: (id) =>
          set((s) => ({
            project: { ...s.project, bleedStyleId: id },
          })),

        setCharacterId: (id) =>
          set((s) => ({ project: { ...s.project, characterId: id } })),

        setTemplate: (id) =>
          set((s) => {
            const next = applyTemplate(s.project, id)
            const activeStill =
              next.pages.find((p) => p.id === s.activePageId) ?? next.pages[0]
            return { project: next, activePageId: activeStill.id }
          }),

        setThemePrimary: (color) =>
          set((s) => ({
            project: {
              ...s.project,
              theme: { ...s.project.theme, primary: color },
            },
          })),

        setPageTitle: (pageId, title) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({ ...p, title })),
          })),

        setPageTag: (pageId, tag) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({ ...p, tag })),
          })),

        setPageHidden: (pageId, hidden) =>
          set((s) => {
            const page = s.project.pages.find((p) => p.id === pageId)
            if (!page || page.kind === 'custom') {
              // custom can be hidden too; default pages use hide not delete
            }
            if (page && page.kind !== 'custom' && hidden) {
              const vis = s.project.pages.filter(
                (p) => !p.hidden && p.id !== pageId,
              )
              if (vis.length === 0) return s
            }
            const project = mapPage(s.project, pageId, (p) => ({
              ...p,
              hidden,
            }))
            let activePageId = s.activePageId
            if (hidden && activePageId === pageId) {
              activePageId = visible(project)[0]?.id ?? project.pages[0].id
            }
            return { project, activePageId }
          }),

        addCustomPage: () =>
          set((s) => {
            const count = s.project.pages.filter((p) => p.kind === 'custom')
              .length
            if (count >= MAX_CUSTOM_PAGES) return s
            const neo = createCustomPage(count + 1)
            return {
              project: { ...s.project, pages: [...s.project.pages, neo] },
              activePageId: neo.id,
            }
          }),

        removeCustomPage: (pageId) =>
          set((s) => {
            const target = s.project.pages.find((p) => p.id === pageId)
            if (!target || target.kind !== 'custom') return s
            const pages = s.project.pages.filter((p) => p.id !== pageId)
            const activePageId =
              s.activePageId === pageId
                ? pages.filter((p) => !p.hidden)[0]?.id ?? pages[0].id
                : s.activePageId
            return { project: { ...s.project, pages }, activePageId }
          }),

        addTextBlock: (pageId) =>
          set((s) => {
            const id = `t-${Date.now()}`
            const block: TextBlock = {
              id,
              content: '新文本',
              layout: { x: 12, y: 40, w: 36, align: 'left' },
              style: { ...DEFAULT_TEXT_STYLE },
              enter: 'fade-in',
              exit: 'fade-out',
            }
            return {
              project: mapPage(s.project, pageId, (p) => ({
                ...p,
                texts: [...p.texts, block],
              })),
              selectedTextId: id,
            }
          }),

        removeTextBlock: (pageId, textId) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              texts: p.texts.filter((t) => t.id !== textId),
            })),
            selectedTextId:
              s.selectedTextId === textId ? null : s.selectedTextId,
          })),

        updateTextContent: (pageId, textId, content) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              texts: p.texts.map((t) =>
                t.id === textId ? { ...t, content } : t,
              ),
            })),
          })),

        updateTextLayout: (pageId, textId, layout) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              texts: p.texts.map((t) =>
                t.id === textId
                  ? { ...t, layout: { ...t.layout, ...layout } }
                  : t,
              ),
            })),
          })),

        updateTextAnim: (pageId, textId, anim) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              texts: p.texts.map((t) =>
                t.id === textId
                  ? {
                      ...t,
                      enter: anim.enter ?? t.enter,
                      exit: anim.exit ?? t.exit,
                      layout: {
                        ...t.layout,
                        align: anim.align ?? t.layout.align,
                      },
                    }
                  : t,
              ),
            })),
          })),

        updateTextStyle: (pageId, textId, style) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              texts: p.texts.map((t) =>
                t.id === textId
                  ? { ...t, style: { ...t.style, ...style } }
                  : t,
              ),
            })),
          })),

        addImageCardGroup: (pageId) =>
          set((s) => {
            const group = imageCardGroup()
            return {
              project: mapPage(s.project, pageId, (p) => ({
                ...p,
                imageCardGroups: [...p.imageCardGroups, group],
              })),
              selectedImageGroupId: group.id,
              selectedTextId: null,
            }
          }),

        removeImageCardGroup: (pageId, groupId) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              imageCardGroups: p.imageCardGroups.filter((g) => g.id !== groupId),
            })),
            selectedImageGroupId:
              s.selectedImageGroupId === groupId ? null : s.selectedImageGroupId,
          })),

        updateImageGroupLayoutKind: (pageId, groupId, kind) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              imageCardGroups: p.imageCardGroups.map((g) =>
                g.id === groupId ? { ...g, layoutKind: kind } : g,
              ),
            })),
          })),

        updateImageGroupLayout: (pageId, groupId, layout) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              imageCardGroups: p.imageCardGroups.map((g) =>
                g.id === groupId
                  ? { ...g, layout: { ...g.layout, ...layout } }
                  : g,
              ),
            })),
          })),

        updateImageGroupAnim: (pageId, groupId, anim) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              imageCardGroups: p.imageCardGroups.map((g) =>
                g.id === groupId
                  ? {
                      ...g,
                      enter: anim.enter ?? g.enter,
                      exit: anim.exit ?? g.exit,
                    }
                  : g,
              ),
            })),
          })),

        setImageGroupCardCount: (pageId, groupId, count) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              imageCardGroups: p.imageCardGroups.map((g) => {
                if (g.id !== groupId) return g
                const nextCount = Math.min(
                  MAX_IMAGE_CARDS,
                  Math.max(MIN_IMAGE_CARDS, Math.round(count)),
                )
                if (nextCount === g.cards.length) return g
                if (nextCount > g.cards.length) {
                  const extra = Array.from(
                    { length: nextCount - g.cards.length },
                    (_, i) => imageCard({}, g.cards.length + i),
                  )
                  return { ...g, cards: [...g.cards, ...extra] }
                }
                return { ...g, cards: g.cards.slice(0, nextCount) }
              }),
            })),
          })),

        updateImageCard: (pageId, groupId, cardId, partial) =>
          set((s) => ({
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              imageCardGroups: p.imageCardGroups.map((g) =>
                g.id === groupId
                  ? {
                      ...g,
                      cards: g.cards.map((c) =>
                        c.id === cardId ? { ...c, ...partial } : c,
                      ),
                    }
                  : g,
              ),
            })),
          })),

        resetProject: () => {
          const next = createDefaultProject()
          set({
            project: next,
            activePageId: next.pages[0].id,
            selectedTextId: null,
            selectedImageGroupId: null,
          })
        },
      }
    },
    {
      name: 'resume-project-v8',
      storage: createJSONStorage(() => createDebouncedStorage(450)),
      partialize: (s) => ({
        project: s.project,
        activePageId: s.activePageId,
      }),
      merge: (persisted, current) => {
        const p = persisted as {
          project?: unknown
          activePageId?: string
        } | null
        if (!p?.project) return current
        const project = normalizeProject(p.project)
        const activePageId =
          typeof p.activePageId === 'string' &&
          project.pages.some((page) => page.id === p.activePageId)
            ? p.activePageId
            : project.pages[0].id
        return { ...current, project, activePageId }
      },
    },
  ),
)
