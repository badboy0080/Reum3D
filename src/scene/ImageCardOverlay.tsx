import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import gsap from 'gsap'
import type { ImageCardGroup } from '../model/types'
import { isSlideLayout, resolveCardPose } from '../model/imageCardLayouts'
import { BLEED_INSET_PX } from '../model/bleedStyles'
import { useProjectStore } from '../store/projectStore'

/** Default layout.w used as scale baseline (see imageCardGroup defaults). */
const BASE_LAYOUT_W = 28
const MIN_W = 18
const MAX_W = 55

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

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

const SPRING = { type: 'spring' as const, stiffness: 180, damping: 20, mass: 0.8 }

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      {dir === 'left' ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  )
}

function CardStack({
  group,
  active,
  activeIndex,
  onActiveIndex,
}: {
  group: ImageCardGroup
  active: boolean
  activeIndex: number
  onActiveIndex: (i: number) => void
}) {
  const kind = group.layoutKind
  const count = group.cards.length
  const slide = isSlideLayout(kind)

  return (
    <div
      className={`relative flex items-center justify-center ${
        kind === 'time-machine'
          ? 'h-[200px] w-full max-w-[320px] rounded-2xl border border-white/5 bg-black/30 p-2'
          : kind === 'cover-flow'
            ? 'h-[180px] w-full max-w-[280px] rounded-2xl bg-zinc-950/40'
            : kind === 'carousel'
              ? 'h-[200px] w-full max-w-[280px]'
              : 'h-[11rem] w-[8rem]'
      }`}
      style={
        kind === 'cover-flow' || kind === 'time-machine'
          ? { perspective: '1000px' }
          : undefined
      }
    >
      {group.cards.map((card, i) => {
        const pose = resolveCardPose(kind, i, count, {
          active: slide ? true : active,
          activeIndex,
        })
        const isStamp = kind === 'stamp-arc'
        return (
          <motion.div
            key={card.id}
            className={`absolute overflow-hidden rounded-2xl border shadow-lg ${
              isStamp
                ? 'border-2 border-dashed border-white/50'
                : 'border-white/15'
            } ${kind === 'time-machine' ? 'h-[135px] w-[220px]' : 'inset-0'}`}
            animate={{
              x: pose.x,
              y: pose.y,
              rotate: pose.rotate,
              rotateY: pose.rotateY ?? 0,
              scale: pose.scale,
              opacity: pose.opacity ?? 1,
              z: pose.z ?? 0,
            }}
            transition={SPRING}
            style={{
              zIndex: pose.zIndex,
              transformOrigin: `${(pose.originX ?? 0.5) * 100}% ${(pose.originY ?? 1) * 100}%`,
              transformStyle: 'preserve-3d',
            }}
            onClick={(e) => {
              if (!slide) return
              e.stopPropagation()
              onActiveIndex(i)
            }}
          >
            <img
              src={card.src}
              alt={card.title}
              className="h-full w-full object-cover"
              draggable={false}
              referrerPolicy="no-referrer"
            />
            {slide && activeIndex === i && card.title ? (
              <div className="absolute -bottom-5 left-0 right-0 truncate text-center text-[10px] font-semibold text-white/80">
                {card.title}
              </div>
            ) : null}
          </motion.div>
        )
      })}

      {slide && kind !== 'time-machine' ? (
        <div className="absolute bottom-0 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/50 px-2 py-1 backdrop-blur-md">
          <button
            type="button"
            className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={(e) => {
              e.stopPropagation()
              onActiveIndex(Math.max(0, activeIndex - 1))
            }}
          >
            <ChevronIcon dir="left" />
          </button>
          <div className="flex items-center gap-1">
            {group.cards.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`h-1 rounded-full transition-all ${
                  activeIndex === i ? 'w-4 bg-white' : 'w-1 bg-white/30'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  onActiveIndex(i)
                }}
              />
            ))}
          </div>
          <button
            type="button"
            className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={(e) => {
              e.stopPropagation()
              onActiveIndex(Math.min(count - 1, activeIndex + 1))
            }}
          >
            <ChevronIcon dir="right" />
          </button>
        </div>
      ) : null}

      {kind === 'time-machine' ? (
        <div className="absolute right-1 top-1/2 z-[200] flex -translate-y-1/2 flex-col gap-0.5 py-2">
          {group.cards.map((card, i) => (
            <button
              key={card.id}
              type="button"
              className={`h-[3px] w-6 rounded-full transition-colors ${
                activeIndex === i ? 'bg-sky-400' : 'bg-white/40 hover:bg-white/70'
              }`}
              title={card.title}
              onClick={(e) => {
                e.stopPropagation()
                onActiveIndex(i)
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

const HANDLE_CLASS =
  'pointer-events-auto absolute z-30 h-3 w-3 rounded-sm border border-white bg-[var(--primary)] shadow-none'

function ImageCardGroupView({
  group,
  primary,
  pageId,
  editable,
  selected,
}: {
  group: ImageCardGroup
  primary: string
  pageId: string
  editable: boolean
  selected: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [activeIndex, setActiveIndex] = useState(
    Math.floor((group.cards.length - 1) / 2),
  )
  const setSelectedImageGroupId = useProjectStore((s) => s.setSelectedImageGroupId)
  const updateImageGroupLayout = useProjectStore((s) => s.updateImageGroupLayout)

  const drag = useRef<{
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)

  const resize = useRef<{
    handle: ResizeHandle
    startX: number
    startY: number
    origX: number
    origY: number
    origW: number
    vw: number
    vh: number
  } | null>(null)

  useEffect(() => {
    setActiveIndex(Math.floor((group.cards.length - 1) / 2))
  }, [group.cards.length, group.layoutKind])

  const slide = isSlideLayout(group.layoutKind)
  const scale = group.layout.w / BASE_LAYOUT_W
  const showHandles = editable && selected

  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.killTweensOf(el)
    if (group.enter === 'zoom-in') {
      gsap.fromTo(
        el,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.5, ease: 'power2.out' },
      )
    } else {
      gsap.fromTo(
        el,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.45, ease: 'power1.out' },
      )
    }
    return () => {
      gsap.killTweensOf(el)
      if (group.exit === 'fade-out') {
        gsap.set(el, { autoAlpha: 0 })
      }
    }
  }, [pageId, group.id, group.enter, group.exit])

  const startResize = (handle: ResizeHandle, e: React.PointerEvent) => {
    if (!editable) return
    e.stopPropagation()
    e.preventDefault()
    setSelectedImageGroupId(group.id)
    const el = ref.current
    const parentEl = el?.parentElement
    if (!el || !parentEl) return
    const parent = parentEl.getBoundingClientRect()
    const card = el.getBoundingClientRect()
    resize.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origX: group.layout.x,
      origY: group.layout.y,
      origW: group.layout.w,
      vw: (card.width / parent.width) * 100,
      vh: (card.height / parent.height) * 100,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onResizeMove = (e: React.PointerEvent) => {
    if (!resize.current) return
    const parentEl = ref.current?.parentElement
    if (!parentEl) return
    const parent = parentEl.getBoundingClientRect()
    const { handle, startX, startY, origX, origY, origW, vw, vh } =
      resize.current

    const dxPct = ((e.clientX - startX) / parent.width) * 100
    const dyPct = ((e.clientY - startY) / parent.height) * 100

    // Use the dominant axis so drag feels stable; keep aspect via uniform w.
    const signed =
      handle === 'se' || handle === 'ne'
        ? Math.abs(dxPct) >= Math.abs(dyPct)
          ? dxPct
          : dyPct * (handle === 'ne' ? -1 : 1)
        : Math.abs(dxPct) >= Math.abs(dyPct)
          ? -dxPct
          : handle === 'nw'
            ? -dyPct
            : dyPct

    const newW = clamp(origW + signed, MIN_W, MAX_W)
    const ratio = newW / origW
    const newVw = vw * ratio
    const newVh = vh * ratio

    let nextX = origX
    let nextY = origY
    if (handle === 'se') {
      nextX = origX
      nextY = origY
    } else if (handle === 'sw') {
      nextX = origX + (vw - newVw)
      nextY = origY
    } else if (handle === 'ne') {
      nextX = origX
      nextY = origY + (vh - newVh)
    } else {
      nextX = origX + (vw - newVw)
      nextY = origY + (vh - newVh)
    }

    const minX = (BLEED_INSET_PX / parent.width) * 100
    const minY = (BLEED_INSET_PX / parent.height) * 100
    const maxX = Math.max(minX, 100 - minX - newVw)
    const maxY = Math.max(minY, 100 - minY - newVh)

    updateImageGroupLayout(pageId, group.id, {
      w: newW,
      x: clamp(nextX, minX, maxX),
      y: clamp(nextY, minY, maxY),
    })
  }

  const endResize = (e: React.PointerEvent) => {
    resize.current = null
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      ref={ref}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      className={`image-card-group absolute ${
        editable ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : 'pointer-events-auto'
      }`}
      style={{
        left: `${group.layout.x}%`,
        top: `${group.layout.y}%`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        boxShadow: selected ? `0 0 0 1px ${primary}` : 'none',
        borderRadius: 4,
      }}
      onMouseEnter={() => {
        if (!slide) setHovered(true)
      }}
      onMouseLeave={() => {
        if (!slide) setHovered(false)
      }}
      onPointerDown={(e) => {
        if (!editable) return
        if ((e.target as HTMLElement).closest('[data-resize-handle]')) return
        if ((e.target as HTMLElement).closest('button')) return
        e.stopPropagation()
        setSelectedImageGroupId(group.id)
        drag.current = {
          startX: e.clientX,
          startY: e.clientY,
          origX: group.layout.x,
          origY: group.layout.y,
        }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (resize.current) {
          onResizeMove(e)
          return
        }
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
        updateImageGroupLayout(pageId, group.id, next)
      }}
      onPointerUp={(e) => {
        if (resize.current) {
          endResize(e)
          return
        }
        drag.current = null
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }}
    >
      <CardStack
        group={group}
        active={hovered || slide}
        activeIndex={activeIndex}
        onActiveIndex={setActiveIndex}
      />

      {showHandles ? (
        <>
          <div
            data-resize-handle
            className={`${HANDLE_CLASS} -left-1.5 -top-1.5 cursor-nwse-resize`}
            onPointerDown={(e) => startResize('nw', e)}
            onPointerMove={onResizeMove}
            onPointerUp={endResize}
          />
          <div
            data-resize-handle
            className={`${HANDLE_CLASS} -right-1.5 -top-1.5 cursor-nesw-resize`}
            onPointerDown={(e) => startResize('ne', e)}
            onPointerMove={onResizeMove}
            onPointerUp={endResize}
          />
          <div
            data-resize-handle
            className={`${HANDLE_CLASS} -bottom-1.5 -left-1.5 cursor-nesw-resize`}
            onPointerDown={(e) => startResize('sw', e)}
            onPointerMove={onResizeMove}
            onPointerUp={endResize}
          />
          <div
            data-resize-handle
            className={`${HANDLE_CLASS} -bottom-1.5 -right-1.5 cursor-nwse-resize`}
            onPointerDown={(e) => startResize('se', e)}
            onPointerMove={onResizeMove}
            onPointerUp={endResize}
          />
        </>
      ) : null}
    </div>
  )
}

export function ImageCardOverlay({
  groups,
  primary,
  pageId,
}: {
  groups: ImageCardGroup[]
  primary: string
  pageId: string
}) {
  const editMode = useProjectStore((s) => s.editMode)
  const selectedImageGroupId = useProjectStore((s) => s.selectedImageGroupId)

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
      {groups.map((group) => (
        <ImageCardGroupView
          key={`${pageId}-${group.id}`}
          group={group}
          primary={primary}
          pageId={pageId}
          editable={editMode}
          selected={selectedImageGroupId === group.id}
        />
      ))}
    </div>
  )
}
