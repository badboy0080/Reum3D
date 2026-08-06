---
version: alpha
name: Resume3D Editor (Cursor-inspired, dark)
description: >
  Dark editor chrome adapted from Cursor marketing DESIGN.md
  (https://www.shadcn.io/design/cursor/raw). Keep dark studio surfaces;
  borrow Cursor Orange, compact radii, hairline-only depth, and Inter
  (CursorGothic substitute) + JetBrains Mono rhythm.
colors:
  primary: "#f54e00"
  primary-active: "#d04200"
  canvas: "#0c0c0b"
  canvas-soft: "#141413"
  surface-card: "#181816"
  surface-strong: "#22221f"
  ink: "#f5f5f2"
  body: "#c4c2ba"
  muted: "#8a877c"
  muted-soft: "#6b6960"
  hairline: "#2a2926"
  hairline-soft: "#1f1e1b"
  hairline-strong: "#3d3c37"
  on-primary: "#ffffff"
  semantic-error: "#cf2d56"
  semantic-success: "#1f8a65"
typography:
  display:
    fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif"
    fontWeight: 400
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
  caption-uppercase:
    fontSize: 11px
    fontWeight: 600
    letterSpacing: "0.08em"
    textTransform: uppercase
  code:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: 12px
rounded:
  md: 8px
  lg: 12px
  pill: 9999px
spacing:
  xs: 8px
  sm: 12px
  base: 16px
  md: 20px
  lg: 24px
---

## Overview

深色编辑器壳 + Cursor 营销站气质：

- **单强调色**：Cursor Orange `#f54e00`，主要用于主按钮（导出 / 关键确认）
- **无阴影**：面板与舞台框只用 1px hairline
- **圆角**：按钮 8px，面板 12px；标签可用 pill
- **字体**：Inter（代替授权字体 CursorGothic），字重 400 的标题；标签/代码感文字用 JetBrains Mono
- **不要**把 timeline 五色粉彩当系统按钮色

## Do's and Don'ts

### Do
- 主 CTA 用 `--primary`（橙），按下用 `--primary-active`
- 面板用 hairline 边框 + 扁平表面
- 标题字重保持 400，略收紧字距
- 主题色 `theme.primary` 只影响标签选中等次级强调，不抢走主 CTA 橙色

### Don't
- 不要大投影、毛玻璃叠多层
- 不要把按钮圆角做成大胶囊（主按钮用 8px）
- 不要引入第二套品牌色（紫、青霓虹等）作为 chrome 主色
- 不要把 timeline pastel 用在侧栏按钮上
