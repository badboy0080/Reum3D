# 交接日志

## 当前接手摘要

- **产品**：动画简历制作器（页面中心，视觉参考 intro3d）
- **设计**：深色壳 + Cursor DESIGN.md 适配 → 见 `DESIGN.md`
- **形象**：仅 Chao（`chao_model.glb`）
- **图片卡片**：A1–A12；编辑可拖移 + 四角等比缩放；链接 / 本地上传
- **本地预览**：http://localhost:5174/
- **最近修复**：关掉 WebGL shadow map，消除控制台 `PCFSoftShadowMap` 刷屏
- **文档**：`DESIGN.md`、`CONTEXT.md`、`handoff-archive.md`

## 最近工作记录

### 2026-08-06 — 推送到 GitHub

- **用户想做**：推送
- **已完成**：提交 `e32efbd` 并推送到 `origin/main`（https://github.com/badboy0080/Reum3D.git）
- **改动**：无新功能；本轮仅 git 提交/推送
- **验证**：`git push` 成功 `58c4931..e32efbd`

### 2026-08-06 — 消除 Three 阴影弃用警告刷屏

- **用户想做**：理解 / 处理控制台大量红色/黄色警告
- **已完成**：关闭 Canvas `shadows`；灯光不再 `castShadow`；地面改用一次性 `ContactShadows`（`frames={1}`）
- **改动**：`ResumeScene.tsx`、`SceneAtmosphere.tsx`、`GlbCharacter.tsx`、`fitCharacter.ts`
- **验证**：`npm run build` 通过
- **说明**：`THREE.Clock` 弃用来自 R3F 内部，等库升级；React DevTools 提示可忽略

### 2026-08-06 — 重启前端开发服务

- **用户想做**：无法打开前端
- **已完成**：杀掉残留进程后重启 `npm run dev`
- **验证**：5174 HTTP 200

### 2026-08-06 — 图片卡片：等比缩放 + 上传体验

- **已完成**：四角等比缩放；本地上传 + 链接
- **验证**：构建通过

### 2026-08-06 — 只保留 Chao 模型 + 显存减负

- **已完成**：仅 Chao；贴图/阴影减负
- **验证**：构建通过

### 2026-08-06 — Cursor DESIGN.md 深色适配重设计

- **已完成**：深色壳 + 橙 CTA
- **验证**：构建与截图

更早记录见 `handoff-archive.md`。
