import { useEffect, useState } from 'react'
import { ResumeScene } from '../scene/ResumeScene'
import { useProjectStore } from '../store/projectStore'
import { listCameraPresets } from '../model/cameraPresets'
import {
  backgroundCss,
  listBackgroundPresets,
} from '../model/backgroundPresets'
import { listBleedStyles, BLEED_FRAME_COLOR } from '../model/bleedStyles'
import {
  listTextFonts,
  TEXT_WEIGHT_OPTIONS,
  type TextFontId,
} from '../model/textStyles'
import { TEMPLATES } from '../model/templates'
import { MAX_CUSTOM_PAGES } from '../model/defaults'
import {
  ENTER_OPTIONS,
  EXIT_OPTIONS,
  IMAGE_CARD_ENTER_OPTIONS,
  IMAGE_CARD_EXIT_OPTIONS,
  type BackgroundPresetId,
  type BleedStyleId,
  type CameraPresetId,
  type EnterAnim,
  type ExitAnim,
  type ImageCardEnterAnim,
  type ImageCardExitAnim,
  type ImageCardLayoutId,
  type TemplateId,
  type TextAlign,
} from '../model/types'
import {
  IMAGE_CARD_LAYOUTS,
  MAX_IMAGE_CARDS,
  MIN_IMAGE_CARDS,
} from '../model/imageCardLayouts'
import { exportProject } from '../export/buildExportHtml'

const MAX_UPLOAD_BYTES = 500 * 1024

async function readImageDataUrl(file: File): Promise<string | null> {
  if (file.size > MAX_UPLOAD_BYTES) {
    window.alert('单张图片请小于 500KB，请压缩后再上传')
    return null
  }
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

export function EditorShell() {
  const project = useProjectStore((s) => s.project)
  const activePageId = useProjectStore((s) => s.activePageId)
  const selectedTextId = useProjectStore((s) => s.selectedTextId)
  const selectedImageGroupId = useProjectStore((s) => s.selectedImageGroupId)
  const isTransitioning = useProjectStore((s) => s.isTransitioning)
  const editMode = useProjectStore((s) => s.editMode)
  const setActivePageId = useProjectStore((s) => s.setActivePageId)
  const goNextPage = useProjectStore((s) => s.goNextPage)
  const goPrevPage = useProjectStore((s) => s.goPrevPage)
  const setPageCameraPreset = useProjectStore((s) => s.setPageCameraPreset)
  const setPageCameraTweaks = useProjectStore((s) => s.setPageCameraTweaks)
  const setBackgroundPreset = useProjectStore((s) => s.setBackgroundPreset)
  const setBleedStyleId = useProjectStore((s) => s.setBleedStyleId)
  const setTemplate = useProjectStore((s) => s.setTemplate)
  const setThemePrimary = useProjectStore((s) => s.setThemePrimary)
  const setTitle = useProjectStore((s) => s.setTitle)
  const setPageTitle = useProjectStore((s) => s.setPageTitle)
  const setPageTag = useProjectStore((s) => s.setPageTag)
  const setPageHidden = useProjectStore((s) => s.setPageHidden)
  const addCustomPage = useProjectStore((s) => s.addCustomPage)
  const removeCustomPage = useProjectStore((s) => s.removeCustomPage)
  const addTextBlock = useProjectStore((s) => s.addTextBlock)
  const removeTextBlock = useProjectStore((s) => s.removeTextBlock)
  const updateTextContent = useProjectStore((s) => s.updateTextContent)
  const updateTextLayout = useProjectStore((s) => s.updateTextLayout)
  const updateTextAnim = useProjectStore((s) => s.updateTextAnim)
  const updateTextStyle = useProjectStore((s) => s.updateTextStyle)
  const setSelectedTextId = useProjectStore((s) => s.setSelectedTextId)
  const setSelectedImageGroupId = useProjectStore((s) => s.setSelectedImageGroupId)
  const addImageCardGroup = useProjectStore((s) => s.addImageCardGroup)
  const removeImageCardGroup = useProjectStore((s) => s.removeImageCardGroup)
  const updateImageGroupLayoutKind = useProjectStore((s) => s.updateImageGroupLayoutKind)
  const updateImageGroupLayout = useProjectStore((s) => s.updateImageGroupLayout)
  const updateImageGroupAnim = useProjectStore((s) => s.updateImageGroupAnim)
  const setImageGroupCardCount = useProjectStore((s) => s.setImageGroupCardCount)
  const updateImageCard = useProjectStore((s) => s.updateImageCard)
  const setEditMode = useProjectStore((s) => s.setEditMode)
  const resetProject = useProjectStore((s) => s.resetProject)
  const visiblePages = useProjectStore((s) => s.visiblePages)
  const customPageCount = useProjectStore((s) => s.customPageCount)

  const pages = visiblePages()
  const allPages = project.pages
  const page = project.pages.find((p) => p.id === activePageId) ?? pages[0]
  const idx = pages.findIndex((p) => p.id === activePageId)
  const selected =
    page.texts.find((t) => t.id === selectedTextId) ?? page.texts[0] ?? null
  const selectedImageGroup =
    page.imageCardGroups?.find((g) => g.id === selectedImageGroupId) ??
    page.imageCardGroups?.[0] ??
    null

  const [draft, setDraft] = useState(page.camera)
  const [exporting, setExporting] = useState(false)
  useEffect(() => {
    setDraft(page.camera)
  }, [
    page.id,
    page.camera.presetId,
    page.camera.distance,
    page.camera.height,
    page.camera.offsetX,
    page.camera.orbitYaw,
    page.camera.orbitPitch,
    page.camera.panU,
    page.camera.panV,
  ])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', project.theme.primary)
  }, [project.theme.primary])

  const patchTweaks = (partial: Partial<typeof draft>) => {
    const next = { ...draft, ...partial }
    setDraft(next)
    setPageCameraTweaks(page.id, next)
  }

  const onExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const kind = await exportProject(project)
      if (kind === 'zip') {
        window.alert(
          '形象文件较大，已导出为压缩包（zip）。\n请解压后打开里面的 HTML（需和 characters 文件夹放在一起）。',
        )
      }
    } catch (err) {
      console.error(err)
      window.alert(
        err instanceof Error ? err.message : '导出失败，请稍后重试',
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 md:flex-row md:gap-4 md:p-5">
      {/* Left */}
      <aside className="ui-panel flex w-full shrink-0 flex-col gap-3 p-3 md:w-56">
        <div>
          <p className="ui-label">项目</p>
          <input
            className="ui-input mt-1"
            value={project.title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <p className="ui-label mb-1">形象</p>
          <p className="mono rounded-[var(--radius-btn)] border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--body)]">
            Chao · 自定义形象
          </p>
        </div>

        <div>
          <p className="ui-label mb-1">页面标签</p>
          <div className="flex flex-row gap-1.5 overflow-x-auto md:flex-col">
            {pages.map((p, i) => (
              <button
                key={p.id}
                type="button"
                disabled={isTransitioning}
                onClick={() => setActivePageId(p.id)}
                className={`tag-pill text-left ${p.id === activePageId ? 'is-active' : ''}`}
              >
                {(i + 1).toString().padStart(2, '0')} · {p.tag || p.title}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <button
            type="button"
            className="btn btn-ghost text-xs"
            disabled={customPageCount() >= MAX_CUSTOM_PAGES}
            onClick={addCustomPage}
          >
            + 自定义页（{customPageCount()}/{MAX_CUSTOM_PAGES}）
          </button>
          <button type="button" className="btn btn-ghost text-xs" onClick={resetProject}>
            重置项目
          </button>
        </div>
      </aside>

      {/* Center */}
      <main className="flex min-h-[380px] min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ui-label">动画简历制作器</p>
            <h1 className="display text-2xl md:text-3xl">
              Tap a tag, camera flies
            </h1>
            <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
              风格参考 intro3d：标签切换镜头。编辑时可拖拽文本；导出为可独立翻页的 HTML。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn ${editMode ? 'btn-ink' : 'btn-ghost'}`}
              onClick={() => setEditMode(true)}
            >
              编辑
            </button>
            <button
              type="button"
              className={`btn ${!editMode ? 'btn-ink' : 'btn-ghost'}`}
              onClick={() => setEditMode(false)}
            >
              预览
            </button>
            <button type="button" className="btn btn-ghost" disabled={isTransitioning || idx <= 0} onClick={goPrevPage}>
              上一页
            </button>
            <button type="button" className="btn btn-ghost" disabled={isTransitioning || idx >= pages.length - 1} onClick={goNextPage}>
              下一页
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={exporting}
              onClick={() => void onExport()}
            >
              {exporting ? '打包形象中…' : '导出 HTML'}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <ResumeScene />
        </div>

        <p className="text-xs text-[var(--muted)]">
          编辑模式可拖文本卡片（限出血线框内）；场景底部有镜头操作说明（可关闭）。导出 HTML 可独立翻页。
        </p>
      </main>

      {/* Right */}
      <aside className="ui-panel flex max-h-[100%] w-full shrink-0 flex-col gap-3 overflow-y-auto p-3 md:w-72">
        <div>
          <p className="ui-label">当前页</p>
          <h2 className="mt-1 text-base font-semibold">{page.title}</h2>
        </div>

        <label className="block text-sm">
          <span className="ui-label">页面标题</span>
          <input
            className="ui-input mt-1"
            value={page.title}
            onChange={(e) => setPageTitle(page.id, e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="ui-label">标签 Tag</span>
          <input
            className="ui-input mt-1"
            value={page.tag}
            onChange={(e) => setPageTag(page.id, e.target.value)}
          />
        </label>

        {page.kind !== 'custom' ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={page.hidden}
              onChange={(e) => setPageHidden(page.id, e.target.checked)}
            />
            隐藏此默认页（播放时跳过）
          </label>
        ) : (
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() => removeCustomPage(page.id)}
          >
            删除此自定义页
          </button>
        )}

        {/* Hidden page list quick toggle */}
        <details className="text-xs text-[var(--muted)]">
          <summary className="cursor-pointer">全部页面显隐</summary>
          <ul className="mt-2 space-y-1">
            {allPages.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <span>{p.title}</span>
                {p.kind !== 'custom' ? (
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setPageHidden(p.id, !p.hidden)}
                  >
                    {p.hidden ? '显示' : '隐藏'}
                  </button>
                ) : (
                  <span>自定义</span>
                )}
              </li>
            ))}
          </ul>
        </details>

        <hr className="border-[var(--line)]" />

        <label className="block text-sm">
          <span className="ui-label">模板</span>
          <select
            className="ui-select mt-1"
            value={project.templateId}
            onChange={(e) => setTemplate(e.target.value as TemplateId)}
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="ui-label mb-1">背景色板</p>
          <p className="mb-2 text-[0.65rem] leading-snug text-[var(--muted)]">
            只改当前这一页；每页可以选不同色板（纯色或渐变）。
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {listBackgroundPresets().map((b) => {
              const active =
                (page?.backgroundPresetId ?? 'night-ink') === b.id
              return (
                <button
                  key={b.id}
                  type="button"
                  title={`${b.label} · ${b.blurb}`}
                  aria-label={b.label}
                  aria-pressed={active}
                  className={`group flex flex-col gap-1 rounded-md border p-1 text-left transition ${
                    active
                      ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]'
                      : 'border-[var(--line)] hover:border-white/25'
                  }`}
                  onClick={() => {
                    if (!page) return
                    setBackgroundPreset(
                      page.id,
                      b.id as BackgroundPresetId,
                    )
                  }}
                >
                  <span
                    className="block h-8 w-full rounded-sm border border-white/10"
                    style={{ background: backgroundCss(b) }}
                  />
                  <span className="truncate px-0.5 text-[0.65rem] font-medium leading-none tracking-normal text-[var(--ink)]">
                    {b.label}
                  </span>
                  <span className="truncate px-0.5 text-[0.58rem] leading-none text-[var(--muted)]">
                    {b.kind === 'gradient' ? '渐变' : '纯色'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="ui-label mb-1">出血线</p>
          <p className="mb-2 text-[0.65rem] leading-snug text-[var(--muted)]">
            距外边框 40px；20% 透明全框 + 四角标记始终一起显示。
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {listBleedStyles().map((b) => {
              const active =
                (project.bleedStyleId ?? 'corner-gold') === b.id
              return (
                <button
                  key={b.id}
                  type="button"
                  className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition ${
                    active
                      ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]'
                      : 'border-[var(--line)] hover:border-white/25'
                  }`}
                  onClick={() => setBleedStyleId(b.id as BleedStyleId)}
                >
                  <span
                    className="relative h-8 w-10 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-black/40"
                    aria-hidden
                  >
                    <span
                      className="absolute inset-[3px]"
                      style={{
                        boxShadow: `inset 0 0 0 1px ${BLEED_FRAME_COLOR}`,
                        borderColor: b.color,
                        borderStyle: 'solid',
                        borderWidth: `${b.stroke}px 0 0 ${b.stroke}px`,
                      }}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[0.7rem] font-medium tracking-normal">
                      {b.label}
                    </span>
                    <span className="block truncate text-[0.58rem] text-[var(--muted)]">
                      {b.blurb}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <label className="block text-sm">
          <span className="ui-label">主题色</span>
          <input
            type="color"
            className="mt-1 h-9 w-full cursor-pointer rounded border border-[var(--line)] bg-transparent"
            value={project.theme.primary}
            onChange={(e) => setThemePrimary(e.target.value)}
          />
        </label>

        <hr className="border-[var(--line)]" />

        <label className="block text-sm">
          <span className="ui-label">运镜预设</span>
          <select
            className="ui-select mt-1"
            value={page.camera.presetId}
            disabled={isTransitioning}
            onChange={(e) =>
              setPageCameraPreset(page.id, e.target.value as CameraPresetId)
            }
          >
            {listCameraPresets().map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {(
          [
            ['X 左右', 'offsetX', -3.5, 3.5],
            ['距离', 'distance', 0.45, 2.4],
            ['高度', 'height', -1.2, 1.6],
          ] as const
        ).map(([label, key, min, max]) => (
          <label key={key} className="block text-sm">
            <span className="ui-label">
              {label} {draft[key].toFixed(2)}
            </span>
            <input
              type="range"
              className="mt-1 w-full"
              min={min}
              max={max}
              step={0.01}
              value={draft[key]}
              disabled={isTransitioning}
              onChange={(e) => patchTweaks({ [key]: Number(e.target.value) })}
            />
          </label>
        ))}

        <hr className="border-[var(--line)]" />

        <div className="flex items-center justify-between gap-2">
          <p className="ui-label">文本块</p>
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() => addTextBlock(page.id)}
          >
            + 添加
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {page.texts.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className={`tag-pill ${selectedTextId === t.id || (!selectedTextId && i === 0) ? 'is-active' : ''}`}
              onClick={() => setSelectedTextId(t.id)}
            >
              文本 {i + 1}
            </button>
          ))}
        </div>

        {selected ? (
          <>
            <label className="block text-sm">
              <span className="ui-label">内容</span>
              <textarea
                className="ui-textarea mt-1 min-h-24"
                value={selected.content}
                onChange={(e) =>
                  updateTextContent(page.id, selected.id, e.target.value)
                }
              />
            </label>
            <label className="block text-sm">
              <span className="ui-label">入场</span>
              <select
                className="ui-select mt-1"
                value={selected.enter}
                onChange={(e) =>
                  updateTextAnim(page.id, selected.id, {
                    enter: e.target.value as EnterAnim,
                  })
                }
              >
                {ENTER_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="ui-label">出场</span>
              <select
                className="ui-select mt-1"
                value={selected.exit}
                onChange={(e) =>
                  updateTextAnim(page.id, selected.id, {
                    exit: e.target.value as ExitAnim,
                  })
                }
              >
                {EXIT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="ui-label">字号 {selected.style?.fontSize ?? 22}px</span>
              <input
                type="range"
                className="mt-1 w-full"
                min={10}
                max={200}
                value={selected.style?.fontSize ?? 22}
                onChange={(e) =>
                  updateTextStyle(page.id, selected.id, {
                    fontSize: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="ui-label">字体</span>
              <select
                className="ui-select mt-1"
                value={selected.style?.fontFamily ?? 'sans'}
                onChange={(e) =>
                  updateTextStyle(page.id, selected.id, {
                    fontFamily: e.target.value as TextFontId,
                  })
                }
              >
                {listTextFonts().map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="ui-label">字重</span>
              <select
                className="ui-select mt-1"
                value={selected.style?.fontWeight ?? 500}
                onChange={(e) =>
                  updateTextStyle(page.id, selected.id, {
                    fontWeight: Number(e.target.value) as 400 | 500 | 700,
                  })
                }
              >
                {TEXT_WEIGHT_OPTIONS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="ui-label">文字颜色</span>
              <input
                type="color"
                className="mt-1 h-9 w-full cursor-pointer rounded border border-[var(--line)] bg-transparent"
                value={selected.style?.color ?? '#f7f7f5'}
                onChange={(e) =>
                  updateTextStyle(page.id, selected.id, {
                    color: e.target.value,
                  })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="ui-label">对齐</span>
              <select
                className="ui-select mt-1"
                value={selected.layout.align}
                onChange={(e) =>
                  updateTextLayout(page.id, selected.id, {
                    align: e.target.value as TextAlign,
                  })
                }
              >
                <option value="left">左</option>
                <option value="center">中</option>
                <option value="right">右</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="ui-label">宽度 {selected.layout.w}%</span>
              <input
                type="range"
                className="mt-1 w-full"
                min={18}
                max={80}
                value={selected.layout.w}
                onChange={(e) =>
                  updateTextLayout(page.id, selected.id, {
                    w: Number(e.target.value),
                  })
                }
              />
            </label>
            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={() => removeTextBlock(page.id, selected.id)}
            >
              删除此文本
            </button>
          </>
        ) : (
          <p className="text-xs text-[var(--muted)]">当前页还没有文本，点「添加」。</p>
        )}

        <hr className="border-[var(--line)]" />

        <div className="flex items-center justify-between gap-2">
          <p className="ui-label">图片卡片</p>
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() => addImageCardGroup(page.id)}
          >
            + 添加
          </button>
        </div>
        <p className="mb-2 text-[0.65rem] leading-snug text-[var(--muted)]">
          Amicro A1–A12 布局。编辑模式：拖动卡片移动；拖四角橙色手柄等比缩放。每张可填链接或上传本地图（≤500KB）。
        </p>

        <div className="flex flex-wrap gap-1">
          {(page.imageCardGroups ?? []).map((g, i) => (
            <button
              key={g.id}
              type="button"
              className={`tag-pill ${selectedImageGroupId === g.id || (!selectedImageGroupId && i === 0) ? 'is-active' : ''}`}
              onClick={() => setSelectedImageGroupId(g.id)}
            >
              卡片 {i + 1}
            </button>
          ))}
        </div>

        {selectedImageGroup ? (
          <>
            <label className="block text-sm">
              <span className="ui-label">布局</span>
              <select
                className="ui-select mt-1"
                value={selectedImageGroup.layoutKind}
                onChange={(e) =>
                  updateImageGroupLayoutKind(
                    page.id,
                    selectedImageGroup.id,
                    e.target.value as ImageCardLayoutId,
                  )
                }
              >
                {IMAGE_CARD_LAYOUTS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label} · {l.blurb}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="ui-label">
                卡片数量 {selectedImageGroup.cards.length}（{MIN_IMAGE_CARDS}–{MAX_IMAGE_CARDS}）
              </span>
              <input
                type="range"
                className="mt-1 w-full"
                min={MIN_IMAGE_CARDS}
                max={MAX_IMAGE_CARDS}
                value={selectedImageGroup.cards.length}
                onChange={(e) =>
                  setImageGroupCardCount(
                    page.id,
                    selectedImageGroup.id,
                    Number(e.target.value),
                  )
                }
              />
            </label>
            <label className="block text-sm">
              <span className="ui-label">入场</span>
              <select
                className="ui-select mt-1"
                value={selectedImageGroup.enter}
                onChange={(e) =>
                  updateImageGroupAnim(page.id, selectedImageGroup.id, {
                    enter: e.target.value as ImageCardEnterAnim,
                  })
                }
              >
                {IMAGE_CARD_ENTER_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="ui-label">出场</span>
              <select
                className="ui-select mt-1"
                value={selectedImageGroup.exit}
                onChange={(e) =>
                  updateImageGroupAnim(page.id, selectedImageGroup.id, {
                    exit: e.target.value as ImageCardExitAnim,
                  })
                }
              >
                {IMAGE_CARD_EXIT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="ui-label">宽度 {selectedImageGroup.layout.w}%</span>
              <input
                type="range"
                className="mt-1 w-full"
                min={18}
                max={55}
                value={selectedImageGroup.layout.w}
                onChange={(e) =>
                  updateImageGroupLayout(page.id, selectedImageGroup.id, {
                    w: Number(e.target.value),
                  })
                }
              />
            </label>

            <div className="space-y-3">
              {selectedImageGroup.cards.map((card, ci) => (
                <div
                  key={card.id}
                  className="rounded-md border border-[var(--line)] p-2"
                >
                  <p className="mb-1 text-[0.65rem] font-medium text-[var(--muted)]">
                    第 {ci + 1} 张
                  </p>
                  <label className="block text-sm">
                    <span className="ui-label">标题</span>
                    <input
                      className="ui-input mt-1"
                      value={card.title}
                      onChange={(e) =>
                        updateImageCard(page.id, selectedImageGroup.id, card.id, {
                          title: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="mt-2 block text-sm">
                    <span className="ui-label">图片链接</span>
                    <input
                      className="ui-input mt-1"
                      value={card.src.startsWith('data:') ? '' : card.src}
                      placeholder="https://... 粘贴网络图片地址"
                      onChange={(e) =>
                        updateImageCard(page.id, selectedImageGroup.id, card.id, {
                          src: e.target.value,
                        })
                      }
                    />
                  </label>
                  <div className="mt-2">
                    <p className="ui-label mb-1">本地上传</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="btn btn-ghost relative inline-flex cursor-pointer text-xs">
                        选择本地图片
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="absolute inset-0 cursor-pointer opacity-0"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const dataUrl = await readImageDataUrl(file)
                            if (dataUrl) {
                              updateImageCard(
                                page.id,
                                selectedImageGroup.id,
                                card.id,
                                { src: dataUrl },
                              )
                            }
                            e.target.value = ''
                          }}
                        />
                      </label>
                      {card.src.startsWith('data:') ? (
                        <span className="text-[0.65rem] text-[var(--muted)]">
                          已使用本地图片
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[0.6rem] text-[var(--muted)]">
                      支持 JPG / PNG / WebP / GIF，单张 ≤ 500KB
                    </p>
                  </div>
                  {card.src ? (
                    <img
                      src={card.src}
                      alt={card.title}
                      className="mt-2 h-16 w-full rounded object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={() =>
                removeImageCardGroup(page.id, selectedImageGroup.id)
              }
            >
              删除此卡片组
            </button>
          </>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            当前页还没有图片卡片，点「添加」。
          </p>
        )}
      </aside>
    </div>
  )
}
