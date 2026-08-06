# 交接日志归档

从 `handoff-log.md` 移出的较早记录（保留最近 5 次以外）。

### 2026-08-05 — 替换 4 套渐变色板

- **用户想做**：用参考图 4 套深色渐变替换晨曦/深海/石墨/叶绿
- **已完成**：改为 可可 / 墨蓝 / 松烟 / 暮紫（ID 不变，旧项目仍可识别）
- **改动**：`backgroundPresets.ts`
- **验证**：硬刷新后点色板目视

### 2026-08-05 — 去掉圆盘底座与文字底框

- **用户想做**：去掉模型脚下圆盘；去掉文字底框
- **已完成**：编辑器与导出均去掉地面圆盘；文字改为透明无边框（保留轻微字影与选中描边）
- **改动**：`GlbCharacter.tsx`、`TextOverlay.tsx`、`buildExportHtml.ts`
- **验证**：待热更新目视

### 2026-08-05 — 新增叶绿渐变色板

- **用户想做**：按参考图加「上绿下白」渐变背景
- **已完成**：新增 `leaf-mist`（叶绿）；浅色雾/灯光/地面配套
- **改动**：`backgroundPresets.ts`、`EditorShell` 文案、`CONTEXT.md`
- **验证**：待 `npm run build`

### 2026-08-05 — ask-matt 下一步建议

- **用户想做**：问接下来还能做什么（按 Matt 流程）
- **已完成**：梳理当前 MVP 状态；给出验收 → 小刀实现 → 大需求 grill/spec 的分流建议（见本轮对话）
- **改动**：本摘要
- **验证**：无代码改动

### 2026-08-02 — 背景色板（8 套，含渐变）

- **用户想做**：背景色配置；默认 8 色板；支持渐变
- **已完成**：色板数据 + 侧栏 4×2 色块 UI；3D/导出渐变纹理；旧背景 ID 兼容
- **改动**：`backgroundPresets.ts`、`SceneBackground.tsx`、`SceneAtmosphere.tsx`、`EditorShell.tsx`、`buildExportHtml.ts`、`defaults.ts`、`CONTEXT.md`
- **验证**：`npm run build` 通过

### 2026-08-02 — 修复中键左右平移（第二次）

- **用户想做**：中键左右仍反
- **已完成**：修正 `resolveCamera` 的 right 向量（`forward × up`）；中键 `panU` 按「角色跟鼠标同向」取值；导出 HTML 同步
- **改动**：`cameraPresets.ts`、`CameraPanZoomControls.tsx`、`buildExportHtml.ts`
- **验证**：请硬刷新后再试中键左右

### 2026-08-02 — 修复镜头拖拽方向

- **用户想做**：左键上下俯仰反了；中键左右平移反了
- **已完成**：俯仰 `orbitPitch` 符号已对；平移根因在 right 向量（见上一条）
- **改动**：`CameraPanZoomControls.tsx` 等

### 2026-08-02 — 接入真实 GLB 形象

- **用户想做**：读 Temp handoff 后开始做 GLB 形象
- **已完成**：4 个 GLB 入库；编辑器 `GlbCharacter` 加载+归一化身高+idle；旧 Clay/Matte 等 ID 自动迁移；导出嵌 GLB
- **改动**：`public/characters/*`、`characters.ts`、`fitCharacter.ts`、`GlbCharacter.tsx`、`ResumeScene.tsx`、`buildExportHtml.ts`、`EditorShell.tsx`、`defaults.ts`、`types.ts`、`projectStore`（v5）、`CONTEXT.md`；删除 `PlaceholderCharacter.tsx`
- **验证**：`npm run build` 通过；`dist/characters` 含 4 个 GLB
- **提示**：硬刷新；若本地还是旧胶囊人，点「重置项目」或清站点数据（存储键已到 v5）

### 2026-08-02 — /handoff 跨会话交接

- **用户想做**：生成交接文档，方便新会话继续
- **已完成**：完整交接写到系统临时目录；约定下一步为 GLB 形象
- **改动**：本文件摘要；临时文件见 AppData Local Temp
- **验证**：文件已写入 Temp

### 2026-08-02 — grill-with-docs 重写镜头

- **用户想做**：镜头紊乱；要对齐 Blender
- **已完成**：ADR-0002 + `resolveCamera` 身体中心 + panU/panV
- **验证**：`npm run build` 通过
