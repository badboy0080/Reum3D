export type TextFontId = 'sans' | 'display' | 'serif' | 'mono'

export interface TextFontOption {
  id: TextFontId
  label: string
  /** CSS font-family stack */
  stack: string
}

export const TEXT_FONTS: Record<TextFontId, TextFontOption> = {
  sans: {
    id: 'sans',
    label: '无衬线',
    stack: '"DM Sans", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  display: {
    id: 'display',
    label: '标题体',
    stack: '"Syne", "DM Sans", "PingFang SC", sans-serif',
  },
  serif: {
    id: 'serif',
    label: '衬线',
    stack: 'Georgia, "Noto Serif SC", "Songti SC", serif',
  },
  mono: {
    id: 'mono',
    label: '等宽',
    stack: '"SF Mono", "Cascadia Code", Consolas, monospace',
  },
}

export const TEXT_WEIGHT_OPTIONS = [
  { id: 400, label: '常规' },
  { id: 500, label: '中等' },
  { id: 700, label: '粗体' },
] as const

export function listTextFonts() {
  return Object.values(TEXT_FONTS)
}

export function resolveTextFontId(raw: unknown): TextFontId {
  if (typeof raw === 'string' && raw in TEXT_FONTS) {
    return raw as TextFontId
  }
  return 'sans'
}
