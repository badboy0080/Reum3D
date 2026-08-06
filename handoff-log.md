# 交接日志

## 当前接手摘要

- **产品**：动画简历制作器（页面中心，视觉参考 intro3d）
- **形象**：真实 GLB（Classic / Robot / Scout / Neo / Chao）
- **背景色板**：按页配置；纯色 + 深色渐变
- **图片卡片**：Amicro A1–A12 全量接入；每页可多组；2–12 张/组；URL + 本地上传
- **出血线**：距边 40px；20% 透明全框 + 四角
- **文字**：字号 / 字体 / 字重 / 颜色 / 对齐
- **存储键**：`resume-project-v8`
- **下一步建议**：硬刷新后添加卡片组，切换 12 种布局验收；导出 HTML 悬停/切卡
- **文档**：`CONTEXT.md`、`handoff-archive.md`

## 最近工作记录

### 2026-08-06 — 接入 Amicro A1–A12 图片卡片组

- **用户想做**：直接做 A1–A12；卡片数量、内容可自定义
- **已完成**：`ImageCardGroup` 数据模型；12 种布局 pose 引擎；Motion 舞台叠加；侧栏 CRUD；导出 HTML 原生悬停/切卡；`motion` 依赖
- **改动**：`types`、`imageCardLayouts.ts`、`imageCardPoseRuntime.js`、`defaults`（v8）、`projectStore`、`ImageCardOverlay`、`EditorShell`、`ResumeScene`、`buildExportHtml`、`CONTEXT.md`
- **验证**：`npm run build` 通过

### 2026-08-06 — 盘点 Amicro 图片卡片动画（待选型）

- **用户想做**：加图片模块；从 Amicro 选型
- **已完成**：清单与方案；用户确认全量 A1–A12
- **改动**：无（见上条实现）

### 2026-08-06 — 背景色改为每页独立

- **用户想做**：背景颜色允许每个页面不一样
- **已完成**：背景从项目级改为页面级；侧栏改当前页；3D/导出翻页同步
- **改动**：`types`、`defaults`、`projectStore`（v7）、`EditorShell`、`ResumeScene`、`buildExportHtml`
- **验证**：`npm run build` 通过

### 2026-08-06 — 出血线：角标缩小 + 常驻半透明全框

- **用户想做**：四角再小 50%；全框细线 50% 透明
- **已完成**：角臂减半；半透明全框常驻
- **改动**：`bleedStyles.ts`、`BleedOverlay.tsx`、`buildExportHtml.ts`
- **验证**：`npm run build` 通过

### 2026-08-06 — 出血线 + 文字样式编辑

- **用户想做**：出血线 + 文字样式
- **已完成**：5 套出血线；文字 style 字段与侧栏
- **改动**：`bleedStyles.ts`、`textStyles.ts`、`EditorShell` 等（v6）
- **验证**：`npm run build` 通过

更早记录见 `handoff-archive.md`。
