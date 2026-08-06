import type {
  Project,
  Page,
  TextBlock,
  TextStyle,
  CameraPose,
  TemplateId,
  EnterAnim,
  ExitAnim,
  ImageCardGroup,
  ImageCardItem,
} from './types'
import { resolveCharacterId } from './characters'
import { resolveBackgroundPresetId } from './backgroundPresets'
import { resolveBleedStyleId } from './bleedStyles'
import { resolveTextFontId } from './textStyles'
import {
  IMAGE_CARD_LAYOUTS,
  MAX_IMAGE_CARDS,
  MIN_IMAGE_CARDS,
  PLACEHOLDER_IMAGE_SRCS,
  type ImageCardLayoutId,
} from './imageCardLayouts'

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 22,
  fontFamily: 'sans',
  fontWeight: 500,
  color: '#f7f7f5',
}

function text(
  id: string,
  content: string,
  x: number,
  y: number,
  enter: EnterAnim = 'fade-in',
  exit: ExitAnim = 'fade-out',
  style?: Partial<TextStyle>,
): TextBlock {
  return {
    id,
    content,
    layout: { x, y, w: 40, align: 'left' },
    style: { ...DEFAULT_TEXT_STYLE, ...style },
    enter,
    exit,
  }
}

function cam(
  partial: Pick<CameraPose, 'presetId'> & Partial<CameraPose>,
): CameraPose {
  return {
    distance: 1,
    height: 0,
    offsetX: 0,
    orbitYaw: 0,
    orbitPitch: 0,
    panU: 0,
    panV: 0,
    ...partial,
  }
}

function page(
  partial: Omit<
    Page,
    'texts' | 'hidden' | 'tag' | 'backgroundPresetId' | 'imageCardGroups'
  > & {
    texts?: TextBlock[]
    hidden?: boolean
    tag?: string
    backgroundPresetId?: Page['backgroundPresetId']
    imageCardGroups?: ImageCardGroup[]
  },
): Page {
  return {
    hidden: false,
    texts: [],
    imageCardGroups: [],
    tag: partial.title.toUpperCase(),
    backgroundPresetId: partial.backgroundPresetId ?? 'night-ink',
    ...partial,
  }
}

export function imageCard(
  partial: Partial<ImageCardItem> & { id?: string },
  index = 0,
): ImageCardItem {
  return {
    id: partial.id ?? `ic-${Date.now()}-${index}`,
    src:
      partial.src ??
      PLACEHOLDER_IMAGE_SRCS[index % PLACEHOLDER_IMAGE_SRCS.length],
    title: partial.title ?? `卡片 ${index + 1}`,
    caption: partial.caption,
  }
}

export function imageCardGroup(
  partial?: Partial<ImageCardGroup> & {
    layoutKind?: ImageCardLayoutId
    cardCount?: number
  },
): ImageCardGroup {
  const kind = partial?.layoutKind ?? 'arc'
  const meta = IMAGE_CARD_LAYOUTS.find((l) => l.id === kind) ?? IMAGE_CARD_LAYOUTS[0]
  const count = Math.min(
    MAX_IMAGE_CARDS,
    Math.max(
      MIN_IMAGE_CARDS,
      partial?.cardCount ?? meta.defaultCount,
    ),
  )
  const cards =
    partial?.cards && partial.cards.length >= MIN_IMAGE_CARDS
      ? partial.cards.slice(0, MAX_IMAGE_CARDS)
      : Array.from({ length: count }, (_, i) => imageCard({}, i))
  return {
    id: partial?.id ?? `ig-${Date.now()}`,
    layoutKind: kind,
    layout: partial?.layout ?? { x: 55, y: 22, w: 28 },
    cards,
    enter: partial?.enter ?? 'fade-in',
    exit: partial?.exit ?? 'fade-out',
  }
}

export const MAX_CUSTOM_PAGES = 4

export function createDefaultProject(
  templateId: TemplateId = 'narrative',
): Project {
  if (templateId === 'showcase') {
    return createShowcaseProject()
  }
  return createNarrativeProject()
}

function createNarrativeProject(): Project {
  const pages: Page[] = [
    page({
      id: 'page-home',
      kind: 'home',
      title: '首页',
      tag: 'OVERVIEW',
      camera: cam({ presetId: 'front-bust' }),
      texts: [
        text('t-home-1', '你好，我是 [姓名]', 7, 16, 'slide-up'),
        text('t-home-2', '产品经理 · 用镜头讲故事', 7, 30, 'fade-in'),
      ],
    }),
    page({
      id: 'page-about',
      kind: 'about',
      title: '简介',
      tag: 'ABOUT',
      camera: cam({ presetId: 'side-left' }),
      texts: [
        text(
          't-about-1',
          '擅长把复杂需求讲清楚，并推进落地。',
          8,
          22,
          'stagger-lines',
        ),
      ],
    }),
    page({
      id: 'page-works',
      kind: 'works',
      title: '作品',
      tag: 'WORKS',
      camera: cam({ presetId: 'top-wide' }),
      texts: [
        text('t-works-1', '01 作品集\n02 案例研究\n03 开源尝试', 10, 18, 'slide-left'),
      ],
    }),
    page({
      id: 'page-contact',
      kind: 'contact',
      title: '联系',
      tag: 'CONTACT',
      camera: cam({ presetId: 'close-up' }),
      texts: [
        text('t-contact-1', '邮箱：you@example.com', 8, 28, 'typewriter'),
      ],
    }),
  ]

  return {
    id: `proj-${Date.now()}`,
    title: '我的 3D 简历',
    characterId: 'chao',
    templateId: 'narrative',
    bleedStyleId: 'corner-gold',
    theme: {
      primary: '#f54e00',
      background: '#0c0c0b',
      fontFamily: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
    },
    pages,
  }
}

function createShowcaseProject(): Project {
  const base = createNarrativeProject()
  return {
    ...base,
    id: `proj-${Date.now()}`,
    templateId: 'showcase',
    theme: {
      ...base.theme,
      primary: '#f54e00',
    },
    pages: base.pages.map((p) => {
      const withBg = {
        ...p,
        backgroundPresetId: 'grid-stage' as const,
      }
      if (p.kind === 'home') {
        return {
          ...withBg,
          tag: 'SHOWCASE',
          camera: cam({ presetId: 'close-up', distance: 0.9 }),
          texts: [
            text('t-home-1', '精选作品展', 8, 18, 'zoom-in'),
            text('t-home-2', '滑动标签，镜头带你看项目', 8, 32, 'fade-in'),
          ],
        }
      }
      if (p.kind === 'works') {
        return {
          ...withBg,
          tag: 'PROJECTS',
          camera: cam({ presetId: 'front-bust', offsetX: 0.4 }),
          texts: [
            text(
              't-works-1',
              'Flagship · Case A\nGrowth · Case B\nCraft · Case C',
              8,
              20,
              'stagger-lines',
            ),
          ],
        }
      }
      return withBg
    }),
  }
}

export function normalizeProject(raw: unknown): Project {
  const fallback = createDefaultProject()
  if (!raw || typeof raw !== 'object') return fallback
  const p = raw as Partial<Project> & {
    backgroundPresetId?: string
  }
  const legacyBg = resolveBackgroundPresetId(p.backgroundPresetId)
  const pages = Array.isArray(p.pages)
    ? p.pages.map((pageItem, i) => {
        const base = fallback.pages[Math.min(i, fallback.pages.length - 1)]
        const camera = {
          ...base.camera,
          ...(pageItem.camera ?? {}),
          offsetX: pageItem.camera?.offsetX ?? 0,
          orbitYaw: pageItem.camera?.orbitYaw ?? 0,
          orbitPitch: pageItem.camera?.orbitPitch ?? 0,
          panU:
            pageItem.camera?.panU ??
            (pageItem.camera as { camShiftX?: number } | undefined)?.camShiftX ??
            0,
          panV:
            pageItem.camera?.panV ??
            (pageItem.camera as { camShiftY?: number } | undefined)?.camShiftY ??
            0,
        }
        return {
          ...base,
          ...pageItem,
          tag: pageItem.tag || pageItem.title?.toUpperCase() || base.tag,
          camera,
          backgroundPresetId: resolveBackgroundPresetId(
            pageItem.backgroundPresetId ?? legacyBg ?? base.backgroundPresetId,
          ),
          texts: Array.isArray(pageItem.texts)
            ? pageItem.texts.map((t, ti) => {
                const baseText =
                  base.texts[Math.min(ti, Math.max(base.texts.length - 1, 0))] ??
                  text('t-fallback', '文本', 10, 20)
                const rawStyle = (t as Partial<TextBlock>).style
                return {
                  ...baseText,
                  ...t,
                  layout: {
                    ...baseText.layout,
                    ...(t.layout ?? {}),
                    align: t.layout?.align ?? baseText.layout.align,
                  },
                  style: {
                    ...DEFAULT_TEXT_STYLE,
                    ...(baseText.style ?? {}),
                    ...(rawStyle ?? {}),
                    fontFamily: resolveTextFontId(
                      rawStyle?.fontFamily ?? baseText.style?.fontFamily,
                    ),
                    fontWeight: ([400, 500, 700] as const).includes(
                      (rawStyle?.fontWeight ??
                        baseText.style?.fontWeight ??
                        500) as 400,
                    )
                      ? ((rawStyle?.fontWeight ??
                          baseText.style?.fontWeight ??
                          500) as 400 | 500 | 700)
                      : 500,
                    fontSize: Math.min(
                      200,
                      Math.max(
                        10,
                        Number(
                          rawStyle?.fontSize ??
                            baseText.style?.fontSize ??
                            DEFAULT_TEXT_STYLE.fontSize,
                        ) || DEFAULT_TEXT_STYLE.fontSize,
                      ),
                    ),
                    color:
                      typeof rawStyle?.color === 'string'
                        ? rawStyle.color
                        : (baseText.style?.color ?? DEFAULT_TEXT_STYLE.color),
                  },
                }
              })
            : base.texts,
          imageCardGroups: Array.isArray(pageItem.imageCardGroups)
            ? pageItem.imageCardGroups.map((g, gi) => {
                const raw = g as Partial<ImageCardGroup>
                const fallbackGroup = imageCardGroup({ layoutKind: 'arc' })
                const kind = IMAGE_CARD_LAYOUTS.some((l) => l.id === raw.layoutKind)
                  ? (raw.layoutKind as ImageCardLayoutId)
                  : fallbackGroup.layoutKind
                const cardsRaw = Array.isArray(raw.cards) ? raw.cards : []
                const cards =
                  cardsRaw.length >= MIN_IMAGE_CARDS
                    ? cardsRaw.slice(0, MAX_IMAGE_CARDS).map((c, ci) =>
                        imageCard(
                          {
                            id:
                              typeof c.id === 'string'
                                ? c.id
                                : `ic-${gi}-${ci}`,
                            src:
                              typeof c.src === 'string' && c.src
                                ? c.src
                                : PLACEHOLDER_IMAGE_SRCS[ci % PLACEHOLDER_IMAGE_SRCS.length],
                            title:
                              typeof c.title === 'string'
                                ? c.title
                                : `卡片 ${ci + 1}`,
                            caption:
                              typeof c.caption === 'string'
                                ? c.caption
                                : undefined,
                          },
                          ci,
                        ),
                      )
                    : imageCardGroup({ layoutKind: kind }).cards
                return {
                  ...fallbackGroup,
                  ...raw,
                  id:
                    typeof raw.id === 'string'
                      ? raw.id
                      : `ig-${gi}-${Date.now()}`,
                  layoutKind: kind,
                  layout: {
                    ...fallbackGroup.layout,
                    ...(raw.layout ?? {}),
                  },
                  cards,
                  enter: raw.enter === 'zoom-in' ? ('zoom-in' as const) : ('fade-in' as const),
                  exit: raw.exit === 'none' ? ('none' as const) : ('fade-out' as const),
                }
              })
            : [],
        }
      })
    : fallback.pages

  return {
    ...fallback,
    ...p,
    id: typeof p.id === 'string' ? p.id : fallback.id,
    title: typeof p.title === 'string' ? p.title : fallback.title,
    characterId: resolveCharacterId(p.characterId),
    templateId: p.templateId ?? 'narrative',
    bleedStyleId: resolveBleedStyleId(p.bleedStyleId),
    theme: { ...fallback.theme, ...(p.theme ?? {}) },
    pages,
  }
}

export function createCustomPage(index: number): Page {
  return page({
    id: `page-custom-${Date.now()}`,
    kind: 'custom',
    title: `自定义 ${index}`,
    tag: `STOP ${index}`,
    camera: cam({ presetId: 'front-bust', offsetX: 0.3 * index }),
    texts: [
      text(
        `t-custom-${Date.now()}`,
        '在这里写下这一站想说的话',
        10,
        24,
        'fade-in',
      ),
    ],
  })
}
