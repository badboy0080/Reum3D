import { useEffect, useRef } from 'react'
import type { TextBlock } from '../model/types'
import { TEXT_FONTS } from '../model/textStyles'
import { DEFAULT_TEXT_STYLE } from '../model/defaults'
import { BLEED_INSET_PX } from '../model/bleedStyles'
import { playEnter, playExit } from './textAnims'
import { useProjectStore } from '../store/projectStore'

/** Keep text card fully inside the bleed rectangle (inset from stage edge). */
function clampInsideBleed(
  x: number,
  y: number,
  parent: DOMRect,
  card: DOMRect,
): { x: number; y: number } {
  const minX = (BLEED_INSET_PX / parent.width) * 100
  const minY = (BLEED_INSET_PX / parent.height) * 100
  const maxX = Math.max(
    minX,
    ((parent.width - BLEED_INSET_PX - card.width) / parent.width) * 100,
  )
  const maxY = Math.max(
    minY,
    ((parent.height - BLEED_INSET_PX - card.height) / parent.height) * 100,
  )
  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y)),
  }
}

function TextCard({
  block,
  primary,
  pageId,
  editable,
  selected,
}: {
  block: TextBlock
  primary: string
  pageId: string
  editable: boolean
  selected: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const setSelectedTextId = useProjectStore((s) => s.setSelectedTextId)
  const updateTextLayout = useProjectStore((s) => s.updateTextLayout)
  const drag = useRef<{
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)

  const style = block.style ?? DEFAULT_TEXT_STYLE
  const font = TEXT_FONTS[style.fontFamily] ?? TEXT_FONTS.sans

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (block.enter !== 'stagger-lines' && block.enter !== 'typewriter') {
      el.textContent = block.content
    }
    playEnter(el, block.enter, block.content)
    return () => {
      playExit(el, block.exit)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-enter when page/block identity changes
  }, [pageId, block.id, block.enter])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (block.enter === 'typewriter' || block.enter === 'stagger-lines') return
    if (el.textContent !== block.content) el.textContent = block.content
  }, [block.content, block.enter])

  return (
    <div
      ref={ref}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      className={`text-card absolute max-w-[min(42rem,92%)] text-balance ${
        editable ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''
      } ${selected ? 'is-selected' : ''}`}
      style={{
        left: `${block.layout.x}%`,
        top: `${block.layout.y}%`,
        width: `${block.layout.w}%`,
        textAlign: block.layout.align,
        color: style.color,
        fontSize: `clamp(${Math.max(10, style.fontSize * 0.75)}px, 1.6vw, ${style.fontSize}px)`,
        fontFamily: font.stack,
        fontWeight: style.fontWeight,
        lineHeight: 1.45,
        padding: 0,
        background: 'transparent',
        border: 'none',
        borderRadius: 0,
        boxShadow: selected ? `0 0 0 1px ${primary}` : 'none',
        textShadow: '0 1px 10px rgba(0,0,0,0.45)',
        whiteSpace: 'pre-wrap',
      }}
      onPointerDown={(e) => {
        if (!editable) return
        e.stopPropagation()
        setSelectedTextId(block.id)
        drag.current = {
          startX: e.clientX,
          startY: e.clientY,
          origX: block.layout.x,
          origY: block.layout.y,
        }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (!editable || !drag.current) return
        const parentEl = e.currentTarget.parentElement
        if (!parentEl) return
        const parent = parentEl.getBoundingClientRect()
        const card = e.currentTarget.getBoundingClientRect()
        const dx = ((e.clientX - drag.current.startX) / parent.width) * 100
        const dy = ((e.clientY - drag.current.startY) / parent.height) * 100
        const next = clampInsideBleed(
          drag.current.origX + dx,
          drag.current.origY + dy,
          parent,
          card,
        )
        updateTextLayout(pageId, block.id, next)
      }}
      onPointerUp={(e) => {
        drag.current = null
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }}
    >
      {block.enter === 'typewriter' || block.enter === 'stagger-lines'
        ? null
        : block.content}
    </div>
  )
}

export function TextOverlay({
  texts,
  primary,
  pageId,
}: {
  texts: TextBlock[]
  primary: string
  pageId: string
}) {
  const editMode = useProjectStore((s) => s.editMode)
  const selectedTextId = useProjectStore((s) => s.selectedTextId)

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
      {texts.map((block) => (
        <TextCard
          key={`${pageId}-${block.id}`}
          block={block}
          primary={primary}
          pageId={pageId}
          editable={editMode}
          selected={selectedTextId === block.id}
        />
      ))}
    </div>
  )
}
