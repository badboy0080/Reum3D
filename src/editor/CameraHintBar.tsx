import { useEffect, useState } from 'react'

const STORAGE_KEY = 'resume-camera-hint-dismissed'

function MouseLeftIcon() {
  return (
    <svg
      width="16"
      height="20"
      viewBox="0 0 16 20"
      fill="none"
      aria-hidden
      className="shrink-0 opacity-90"
    >
      <rect
        x="1.25"
        y="1.25"
        width="13.5"
        height="17.5"
        rx="6.75"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 1.4V8.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2.2 8.2H13.8"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.5"
      />
      <path
        d="M2.4 2.6C2.4 2.05 2.85 1.6 3.4 1.6H8V8.1H2.4V2.6Z"
        fill="currentColor"
      />
    </svg>
  )
}

function PanIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className="shrink-0 text-[var(--primary)]"
    >
      <path
        d="M7 1.2V12.8M1.2 7H12.8M7 1.2L5.2 3M7 1.2L8.8 3M7 12.8L5.2 11M7 12.8L8.8 11M1.2 7L3 5.2M1.2 7L3 8.8M12.8 7L11 5.2M12.8 7L11 8.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Floating camera-control hint — hairline pill, no shadow. */
export function CameraHintBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== '1')
    } catch {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-3">
      <div
        className="pointer-events-auto mono flex max-w-full items-center gap-2.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-3.5 py-2 text-[12px] text-[var(--body)] sm:gap-3 sm:px-4 sm:text-[13px]"
        role="note"
        aria-label="Camera controls hint"
      >
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <MouseLeftIcon />
          <span>Drag to rotate</span>
        </span>

        <span className="text-[var(--muted)]" aria-hidden>
          ·
        </span>

        <span className="whitespace-nowrap">Scroll to zoom</span>

        <span className="text-[var(--muted)]" aria-hidden>
          ·
        </span>

        <span className="flex items-center gap-1.5 rounded-[var(--radius-btn)] border border-[var(--line)] bg-[var(--panel-strong)] px-2.5 py-1 font-medium text-[var(--ink)] whitespace-nowrap">
          <PanIcon />
          <span>Middle-drag to pan (orbit center stays)</span>
        </span>

        <button
          type="button"
          onClick={dismiss}
          className="ml-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-btn)] text-[var(--muted)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--ink)]"
          aria-label="关闭说明"
          title="关闭"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
