import type { Project } from '../model/types'
import {
  BACKGROUND_PRESETS,
  backgroundClearColor,
  backgroundCss,
} from '../model/backgroundPresets'
import { BLEED_FRAME_COLOR, BLEED_FRAME_STROKE, BLEED_INSET_PX, BLEED_STYLES } from '../model/bleedStyles'
import { TEXT_FONTS } from '../model/textStyles'
import { CHARACTERS } from '../model/characters'
import { DEFAULT_TEXT_STYLE } from '../model/defaults'
import imageCardPoseRuntime from '../model/imageCardPoseRuntime.js?raw'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

/** Above this, embed as single HTML becomes too heavy — export zip instead. */
const EMBED_MAX_BYTES = 8 * 1024 * 1024

async function fetchGlb(glbUrl: string): Promise<ArrayBuffer> {
  const res = await fetch(glbUrl)
  if (!res.ok) {
    throw new Error(`无法加载形象文件：${glbUrl}（${res.status}）`)
  }
  return res.arrayBuffer()
}

function arrayBufferToDataUri(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return `data:model/gltf-binary;base64,${btoa(binary)}`
}

function glbFileName(glbUrl: string): string {
  const part = glbUrl.split('/').pop()
  return part && part.endsWith('.glb') ? part : 'character.glb'
}

/**
 * Build export HTML. `glbUri` is either a data URI (embedded) or a relative
 * path like `./characters/chao_model.glb` (for zip packages).
 */
export function buildExportHtml(project: Project, glbUri: string): string {
  const visiblePages = project.pages.filter((p) => !p.hidden)
  const character = CHARACTERS[project.characterId] ?? CHARACTERS.chao
  const payload = {
    title: project.title,
    theme: project.theme,
    characterId: project.characterId,
    pages: visiblePages,
  }

  const firstPageBgId =
    visiblePages[0]?.backgroundPresetId ?? 'night-ink'
  const bg =
    BACKGROUND_PRESETS[firstPageBgId] ?? BACKGROUND_PRESETS['night-ink']
  const bgPageCss = backgroundCss(bg)
  const bgSolid = backgroundClearColor(bg)
  const charMeta = {
    id: character.id,
    label: character.label,
    yaw: character.yaw,
  }
  const bleed =
    BLEED_STYLES[project.bleedStyleId] ?? BLEED_STYLES['corner-gold']
  const bleedFrame = {
    color: BLEED_FRAME_COLOR,
    stroke: BLEED_FRAME_STROKE,
  }
  const fontStacks = Object.fromEntries(
    Object.values(TEXT_FONTS).map((f) => [f.id, f.stack]),
  )
  const poseRuntimeJs = imageCardPoseRuntime.replace(/^export /gm, '')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(project.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Syne:wght@600;700&display=swap" rel="stylesheet" />
<style>
  :root {
    --bg: ${bgSolid};
    --bg-page: ${bgPageCss};
    --ink: #f7f7f5;
    --muted: #9a9a96;
    --primary: ${project.theme.primary};
    --panel: rgba(255,255,255,0.06);
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: var(--bg-page); color: var(--ink);
    font-family: "DM Sans", "PingFang SC", "Microsoft YaHei", sans-serif; }
  #app { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--bg-page); }
  canvas { display: block; width: 100%; height: 100%; }
  #overlay { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 2; }
  #bleed {
    position: absolute; inset: ${BLEED_INSET_PX}px; pointer-events: none; z-index: 1;
  }
  #bleed .arm {
    position: absolute; pointer-events: none;
  }
  .text-card {
    position: absolute; max-width: min(42rem, 92%);
    white-space: pre-wrap; line-height: 1.45;
    padding: 0; border: none; background: transparent;
    text-shadow: 0 1px 10px rgba(0,0,0,0.45);
  }
  .image-card-group {
    position: absolute; pointer-events: auto; min-width: 8rem;
  }
  .card-stack {
    position: relative; display: flex; align-items: center; justify-content: center;
    width: 100%; height: 11rem;
  }
  .card-stack.is-slide { height: 12rem; }
  .card-stack.is-time { height: 200px; max-width: 320px; margin: 0 auto; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.25); }
  .card-stack.is-cover { height: 180px; max-width: 280px; margin: 0 auto; border-radius: 1rem; background: rgba(9,9,11,0.4); perspective: 1000px; }
  .card-item {
    position: absolute; inset: 0; overflow: hidden; border-radius: 1rem;
    border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    transition: transform 0.45s cubic-bezier(0.215, 0.61, 0.355, 1), opacity 0.35s ease;
    transform-style: preserve-3d; will-change: transform;
  }
  .card-item.is-stamp { border: 2px dashed rgba(255,255,255,0.45); }
  .card-item.is-time { inset: auto; width: 220px; height: 135px; left: 50%; top: 50%; margin-left: -110px; margin-top: -67px; }
  .card-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .card-controls {
    position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
    display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.5rem;
    border-radius: 999px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);
    z-index: 300;
  }
  .card-controls button {
    border: 0; background: transparent; color: rgba(255,255,255,0.75); cursor: pointer; padding: 0.15rem 0.35rem;
  }
  .card-dot { width: 4px; height: 4px; border-radius: 999px; background: rgba(255,255,255,0.35); border: 0; cursor: pointer; padding: 0; }
  .card-dot.is-active { width: 16px; background: #fff; }
  .time-rail { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 3px; z-index: 300; }
  .time-rail button { width: 24px; height: 3px; border-radius: 999px; border: 0; background: rgba(255,255,255,0.35); cursor: pointer; padding: 0; }
  .time-rail button.is-active { background: #38bdf8; }
  #chrome {
    position: absolute; left: 0; right: 0; bottom: 0;
    display: flex; justify-content: space-between; align-items: flex-end;
    gap: 1rem; padding: 1.25rem 1.5rem; pointer-events: none;
    background: linear-gradient(transparent, rgba(0,0,0,0.55));
  }
  #tags { display: flex; flex-wrap: wrap; gap: 0.5rem; pointer-events: auto; max-width: 70%; }
  .tag {
    border: 1px solid rgba(255,255,255,0.14); background: var(--panel);
    color: var(--ink); border-radius: 999px; padding: 0.45rem 0.9rem;
    font-size: 0.75rem; letter-spacing: 0.06em; cursor: pointer;
    backdrop-filter: blur(10px);
  }
  .tag.active { border-color: var(--primary); color: #041016; background: var(--primary); }
  #nav { display: flex; gap: 0.5rem; pointer-events: auto; }
  #nav button {
    border: 0; border-radius: 999px; padding: 0.65rem 1.1rem; cursor: pointer;
    font-weight: 600; font-family: inherit;
  }
  #prev { background: rgba(255,255,255,0.1); color: var(--ink); }
  #next { background: var(--primary); color: #041016; }
  #brand {
    position: absolute; top: 1.1rem; left: 1.4rem; z-index: 2;
    font-family: Syne, DM Sans, sans-serif; font-weight: 700; letter-spacing: -0.02em;
  }
  #brand span { color: var(--muted); font-weight: 500; font-size: 0.8rem; margin-left: 0.5rem; }
  #loading {
    position: absolute; inset: 0; display: grid; place-items: center;
    background: var(--bg-page); z-index: 3; font-size: 0.9rem; color: var(--muted);
  }
  #loading.is-done { display: none; }
</style>
</head>
<body>
<div id="app">
  <div id="loading">正在加载 3D 形象…</div>
  <div id="brand">${escapeHtml(project.title)}<span>3D resume</span></div>
  <div id="bleed" aria-hidden="true"></div>
  <div id="overlay"></div>
  <div id="chrome">
    <div id="tags"></div>
    <div id="nav">
      <button id="prev" type="button">上一页</button>
      <button id="next" type="button">下一页</button>
    </div>
  </div>
</div>
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.170.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.170.0/examples/jsm/"
  }
}
</script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const DATA = ${JSON.stringify(payload)};
const BG_PRESETS = ${JSON.stringify(BACKGROUND_PRESETS)};
const CHAR = ${JSON.stringify(charMeta)};
const GLB_URI = ${JSON.stringify(glbUri)};
const BLEED = ${JSON.stringify(bleed)};
const BLEED_FRAME = ${JSON.stringify(bleedFrame)};
const FONTS = ${JSON.stringify(fontStacks)};
const DEFAULT_STYLE = ${JSON.stringify(DEFAULT_TEXT_STYLE)};

${poseRuntimeJs}

function applyCardTransform(el, pose) {
  const ox = (pose.originX != null ? pose.originX : 0.5) * 100;
  const oy = (pose.originY != null ? pose.originY : 1) * 100;
  el.style.transformOrigin = ox + '% ' + oy + '%';
  el.style.zIndex = String(pose.zIndex);
  el.style.opacity = pose.opacity != null ? String(pose.opacity) : '1';
  var ry = pose.rotateY || 0;
  var z = pose.z || 0;
  el.style.transform = 'translate3d(' + pose.x + 'px,' + pose.y + 'px,0) rotate(' + pose.rotate + 'deg) rotateY(' + ry + 'deg) translateZ(' + z + 'px) scale(' + pose.scale + ')';
}

function mountImageGroups(page) {
  const groups = page.imageCardGroups || [];
  groups.forEach(function(group) {
    const wrap = document.createElement('div');
    wrap.className = 'image-card-group';
    wrap.style.left = group.layout.x + '%';
    wrap.style.top = group.layout.y + '%';
    wrap.style.width = group.layout.w + '%';
    const stack = document.createElement('div');
    const kind = group.layoutKind;
    const slide = isSlideLayout(kind);
    stack.className = 'card-stack' + (kind === 'time-machine' ? ' is-time' : kind === 'cover-flow' ? ' is-cover' : slide ? ' is-slide' : '');
    const state = { active: slide, activeIndex: Math.floor((group.cards.length - 1) / 2) };
    const items = [];
    group.cards.forEach(function(card, i) {
      const item = document.createElement('div');
      item.className = 'card-item' + (kind === 'stamp-arc' ? ' is-stamp' : '') + (kind === 'time-machine' ? ' is-time' : '');
      const img = document.createElement('img');
      img.src = card.src;
      img.alt = card.title || '';
      img.referrerPolicy = 'no-referrer';
      item.appendChild(img);
      stack.appendChild(item);
      items.push(item);
    });
    function repaint() {
      group.cards.forEach(function(_card, i) {
        const pose = resolveCardPose(kind, i, group.cards.length, state);
        applyCardTransform(items[i], pose);
      });
    }
    if (!slide) {
      wrap.addEventListener('mouseenter', function() { state.active = true; repaint(); });
      wrap.addEventListener('mouseleave', function() { state.active = false; repaint(); });
    }
    if (slide && kind !== 'time-machine') {
      const controls = document.createElement('div');
      controls.className = 'card-controls';
      const prev = document.createElement('button');
      prev.textContent = '‹';
      prev.onclick = function(e) { e.stopPropagation(); state.activeIndex = Math.max(0, state.activeIndex - 1); repaint(); };
      const next = document.createElement('button');
      next.textContent = '›';
      next.onclick = function(e) { e.stopPropagation(); state.activeIndex = Math.min(group.cards.length - 1, state.activeIndex + 1); repaint(); };
      controls.appendChild(prev);
      group.cards.forEach(function(_c, di) {
        const dot = document.createElement('button');
        dot.className = 'card-dot' + (state.activeIndex === di ? ' is-active' : '');
        dot.onclick = function(e) { e.stopPropagation(); state.activeIndex = di; repaint(); controls.querySelectorAll('.card-dot').forEach(function(d, j) { d.className = 'card-dot' + (state.activeIndex === j ? ' is-active' : ''); }); };
        controls.appendChild(dot);
      });
      controls.appendChild(next);
      stack.appendChild(controls);
      items.forEach(function(el, i) {
        el.style.cursor = 'pointer';
        el.onclick = function(e) { e.stopPropagation(); state.activeIndex = i; repaint(); controls.querySelectorAll('.card-dot').forEach(function(d, j) { d.className = 'card-dot' + (state.activeIndex === j ? ' is-active' : ''); }); };
      });
    }
    if (kind === 'time-machine') {
      const rail = document.createElement('div');
      rail.className = 'time-rail';
      group.cards.forEach(function(card, ti) {
        const btn = document.createElement('button');
        btn.title = card.title || '';
        btn.onclick = function(e) { e.stopPropagation(); state.activeIndex = ti; repaint(); rail.querySelectorAll('button').forEach(function(b, j) { b.className = state.activeIndex === j ? 'is-active' : ''; }); };
        if (state.activeIndex === ti) btn.className = 'is-active';
        rail.appendChild(btn);
      });
      stack.appendChild(rail);
    }
    wrap.appendChild(stack);
    overlay.appendChild(wrap);
    if (group.enter === 'zoom-in') {
      gsap.fromTo(wrap, { autoAlpha: 0, scale: 0.86 }, { autoAlpha: 1, scale: 1, duration: 0.5 });
    } else {
      gsap.fromTo(wrap, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45 });
    }
    repaint();
  });
}

function resolveBg(page) {
  const id = page && page.backgroundPresetId;
  return BG_PRESETS[id] || BG_PRESETS['night-ink'];
}
function bgClearColor(bg) {
  return (bg.colors && bg.colors[0]) || '#0a0a0b';
}
function bgCssValue(bg) {
  if (bg.kind === 'gradient' && bg.colors && bg.colors.length >= 2) {
    return 'linear-gradient(180deg, ' + bg.colors.join(', ') + ')';
  }
  return bgClearColor(bg);
}

const PRESETS = {
  'front-bust': { position: [0, 1.35, 3.2], lookAt: [0, 1.2, 0] },
  'side-left': { position: [-3.1, 1.4, 1.2], lookAt: [0, 1.2, 0] },
  'top-wide': { position: [0.6, 4.2, 4.0], lookAt: [0, 0.8, 0] },
  'close-up': { position: [0.2, 1.55, 1.7], lookAt: [0, 1.45, 0] },
};

const BODY = new THREE.Vector3(0, 1.15, 0);
const TARGET_HEIGHT = 2.05;

function resolveCamera(pose) {
  const base = PRESETS[pose.presetId] || PRESETS['front-bust'];
  const dist = Math.min(2.4, Math.max(0.45, pose.distance ?? 1));
  const height = Math.min(1.6, Math.max(-1.2, pose.height ?? 0));
  const offsetX = Math.min(3.5, Math.max(-3.5, pose.offsetX ?? 0));
  const orbitYaw = pose.orbitYaw ?? 0;
  const orbitPitch = Math.min(1.2, Math.max(-1.0, pose.orbitPitch ?? 0));
  const panU = (pose.panU ?? 0) + offsetX;
  const panV = pose.panV ?? 0;
  const [bx, by, bz] = base.position;
  const baseOffset = new THREE.Vector3(bx, by, bz).sub(BODY);
  const spherical = new THREE.Spherical().setFromVector3(baseOffset);
  spherical.radius = Math.max(0.55, baseOffset.length() * dist);
  spherical.theta += orbitYaw;
  spherical.phi = THREE.MathUtils.clamp(spherical.phi - orbitPitch - height * 0.12, 0.15, Math.PI - 0.15);
  spherical.makeSafe();
  const offset = new THREE.Vector3().setFromSpherical(spherical);
  const forward = offset.clone().negate().normalize();
  const worldUp = new THREE.Vector3(0, 1, 0);
  let right = new THREE.Vector3().crossVectors(forward, worldUp);
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0); else right.normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  const pan = right.multiplyScalar(panU).add(up.multiplyScalar(panV));
  const position = BODY.clone().add(offset).add(pan);
  const lookAt = BODY.clone().add(pan);
  return {
    position: [position.x, position.y, position.z],
    lookAt: [lookAt.x, lookAt.y, lookAt.z],
  };
}

function fitCharacterRoot(root) {
  root.position.set(0, 0, 0);
  root.scale.set(1, 1, 1);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  if (size.y < 1e-4) return;
  const s = TARGET_HEIGHT / size.y;
  root.scale.setScalar(s);
  root.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(root);
  root.position.x = -(fitted.min.x + fitted.max.x) / 2;
  root.position.z = -(fitted.min.z + fitted.max.z) / 2;
  root.position.y = -fitted.min.y;
  root.traverse((obj) => {
    if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
  });
}

const app = document.getElementById('app');
const overlay = document.getElementById('overlay');
const tagsEl = document.getElementById('tags');
const loadingEl = document.getElementById('loading');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
app.insertBefore(renderer.domElement, overlay);

const scene = new THREE.Scene();
function applySceneBackground(bg) {
  const colors = Array.isArray(bg.colors) ? bg.colors : [];
  if (bg.kind === 'gradient' && colors.length >= 2) {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      const last = Math.max(colors.length - 1, 1);
      colors.forEach((c, i) => g.addColorStop(i / last, c));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      scene.background = tex;
      return;
    }
  }
  scene.background = new THREE.Color(colors[0] || '#0a0a0b');
}
const ambient = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambient);
const key = new THREE.DirectionalLight('#ffffff', 1.2);
key.position.set(4, 8, 3);
key.castShadow = true;
scene.add(key);

function applyAtmosphere(bg) {
  applySceneBackground(bg);
  scene.fog = new THREE.Fog(bg.fogColor || '#0a0a0b', bg.fogNear || 8, bg.fogFar || 22);
  ambient.intensity = bg.ambient || 0.45;
  key.color.set(bg.keyLight || '#ffffff');
  key.intensity = bg.keyIntensity || 1.2;
  document.documentElement.style.setProperty('--bg', bgClearColor(bg));
  document.documentElement.style.setProperty('--bg-page', bgCssValue(bg));
}
applyAtmosphere(resolveBg(DATA.pages[0]));

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
const look = new THREE.Vector3();
let index = 0;
let busy = false;
let mixer = null;
const clock = new THREE.Clock();

function applyPose(pose, animate) {
  const resolved = resolveCamera(pose);
  const toPos = new THREE.Vector3(...resolved.position);
  const toLook = new THREE.Vector3(...resolved.lookAt);
  if (!animate) {
    camera.position.copy(toPos);
    look.copy(toLook);
    camera.lookAt(look);
    return Promise.resolve();
  }
  busy = true;
  const fromPos = camera.position.clone();
  const fromLook = look.clone();
  const proxy = { t: 0 };
  return new Promise((resolve) => {
    gsap.to(proxy, {
      t: 1, duration: 1.05, ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.lerpVectors(fromPos, toPos, proxy.t);
        look.lerpVectors(fromLook, toLook, proxy.t);
        camera.lookAt(look);
      },
      onComplete: () => { busy = false; resolve(); },
    });
  });
}

function playEnter(el, kind, content) {
  if (kind === 'slide-up') return gsap.fromTo(el, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.55 });
  if (kind === 'slide-left') return gsap.fromTo(el, { autoAlpha: 0, x: 36 }, { autoAlpha: 1, x: 0, duration: 0.55 });
  if (kind === 'zoom-in') return gsap.fromTo(el, { autoAlpha: 0, scale: 0.86 }, { autoAlpha: 1, scale: 1, duration: 0.5 });
  if (kind === 'typewriter') {
    el.textContent = '';
    const proxy = { i: 0 };
    return gsap.to(proxy, {
      i: content.length,
      duration: Math.min(1.6, 0.04 * content.length + 0.3),
      ease: 'none',
      onUpdate: () => { el.textContent = content.slice(0, Math.floor(proxy.i)); },
    });
  }
  if (kind === 'stagger-lines') {
    const lines = content.split('\\n');
    el.innerHTML = lines.map((line) => '<span style="display:block;opacity:0;transform:translateY(12px)">' + (line || '&nbsp;') + '</span>').join('');
    return gsap.to(el.children, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' });
  }
  return gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45 });
}

function renderOverlay(page) {
  overlay.innerHTML = '';
  page.texts.forEach((block) => {
    const el = document.createElement('div');
    el.className = 'text-card';
    const st = Object.assign({}, DEFAULT_STYLE, block.style || {});
    const stack = FONTS[st.fontFamily] || FONTS.sans;
    el.style.left = block.layout.x + '%';
    el.style.top = block.layout.y + '%';
    el.style.width = block.layout.w + '%';
    el.style.textAlign = block.layout.align;
    el.style.color = st.color || '#f7f7f5';
    el.style.fontFamily = stack;
    el.style.fontWeight = String(st.fontWeight || 500);
    const fs = Number(st.fontSize) || 22;
    el.style.fontSize = 'clamp(' + Math.max(10, fs * 0.75) + 'px, 1.6vw, ' + fs + 'px)';
    if (block.enter !== 'typewriter' && block.enter !== 'stagger-lines') el.textContent = block.content;
    overlay.appendChild(el);
    playEnter(el, block.enter, block.content);
  });
  mountImageGroups(page);
}

function mountBleed() {
  const root = document.getElementById('bleed');
  if (!root || !BLEED) return;
  root.innerHTML = '';
  root.style.border = (BLEED_FRAME.stroke || 1) + 'px solid ' + (BLEED_FRAME.color || 'rgba(255,255,255,0.2)');
  const color = BLEED.color;
  const stroke = BLEED.stroke || 1;
  const arm = BLEED.arm || 12;
  const corners = [
    { top: '0', left: '0' },
    { top: '0', right: '0' },
    { bottom: '0', left: '0' },
    { bottom: '0', right: '0' },
  ];
  corners.forEach((pos) => {
    const box = document.createElement('div');
    box.className = 'arm';
    Object.assign(box.style, pos);
    if (BLEED.variant === 'cross') {
      box.style.width = (arm * 2) + 'px';
      box.style.height = (arm * 2) + 'px';
      box.style.transform = 'translate(' + ('left' in pos ? '-50%' : '50%') + ', ' + ('top' in pos ? '-50%' : '50%') + ')';
      box.innerHTML = '<div style="position:absolute;left:50%;top:0;width:' + stroke + 'px;height:100%;margin-left:-' + (stroke/2) + 'px;background:' + color + '"></div>' +
        '<div style="position:absolute;top:50%;left:0;height:' + stroke + 'px;width:100%;margin-top:-' + (stroke/2) + 'px;background:' + color + '"></div>';
    } else {
      const topEdge = 'top' in pos;
      const leftEdge = 'left' in pos;
      box.style.width = arm + 'px';
      box.style.height = arm + 'px';
      box.style.borderTop = topEdge ? stroke + 'px solid ' + color : 'none';
      box.style.borderBottom = topEdge ? 'none' : stroke + 'px solid ' + color;
      box.style.borderLeft = leftEdge ? stroke + 'px solid ' + color : 'none';
      box.style.borderRight = leftEdge ? 'none' : stroke + 'px solid ' + color;
      if (BLEED.variant === 'corners' && BLEED.id === 'corner-gold') {
        const cross = arm * 0.45;
        const cx = document.createElement('div');
        cx.style.cssText = 'position:absolute;left:' + (leftEdge ? '0' : 'auto') + ';right:' + (leftEdge ? 'auto' : '0') + ';top:' + (topEdge ? '0' : 'auto') + ';bottom:' + (topEdge ? 'auto' : '0') + ';width:' + (cross*2) + 'px;height:' + stroke + 'px;background:' + color + ';' + (leftEdge ? 'margin-left:-' + cross + 'px;' : 'margin-right:-' + cross + 'px;') + (topEdge ? 'margin-top:-' + (stroke/2) + 'px;' : 'margin-bottom:-' + (stroke/2) + 'px;');
        const cy = document.createElement('div');
        cy.style.cssText = 'position:absolute;left:' + (leftEdge ? '0' : 'auto') + ';right:' + (leftEdge ? 'auto' : '0') + ';top:' + (topEdge ? '0' : 'auto') + ';bottom:' + (topEdge ? 'auto' : '0') + ';width:' + stroke + 'px;height:' + (cross*2) + 'px;background:' + color + ';' + (leftEdge ? 'margin-left:-' + (stroke/2) + 'px;' : 'margin-right:-' + (stroke/2) + 'px;') + (topEdge ? 'margin-top:-' + cross + 'px;' : 'margin-bottom:-' + cross + 'px;');
        box.appendChild(cx);
        box.appendChild(cy);
      }
    }
    root.appendChild(box);
  });
}
mountBleed();

function renderTags() {
  tagsEl.innerHTML = '';
  DATA.pages.forEach((page, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tag' + (i === index ? ' active' : '');
    btn.textContent = (i + 1).toString().padStart(2, '0') + '  ' + (page.tag || page.title);
    btn.onclick = () => goTo(i);
    tagsEl.appendChild(btn);
  });
}

async function goTo(i) {
  if (busy || i === index || i < 0 || i >= DATA.pages.length) return;
  index = i;
  renderTags();
  const page = DATA.pages[index];
  applyAtmosphere(resolveBg(page));
  renderOverlay(page);
  await applyPose(page.camera, true);
}

function tick() {
  const dt = clock.getDelta();
  if (mixer) mixer.update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

document.getElementById('prev').onclick = () => goTo(index - 1);
document.getElementById('next').onclick = () => goTo(index + 1);

const loader = new GLTFLoader();
loader.load(
  GLB_URI,
  (gltf) => {
    const wrap = new THREE.Group();
    const turn = new THREE.Group();
    turn.rotation.y = CHAR.yaw || 0;
    turn.add(gltf.scene);
    wrap.add(turn);
    fitCharacterRoot(wrap);
    scene.add(wrap);
    const clips = gltf.animations || [];
    const idle =
      clips.find((c) => /idle/i.test(c.name)) ||
      clips.find((c) => /stand/i.test(c.name)) ||
      clips[0];
    if (idle) {
      mixer = new THREE.AnimationMixer(gltf.scene);
      mixer.clipAction(idle).play();
    }
    loadingEl.classList.add('is-done');
    applyAtmosphere(resolveBg(DATA.pages[0]));
    applyPose(DATA.pages[0].camera, false);
    renderOverlay(DATA.pages[0]);
    renderTags();
    tick();
  },
  undefined,
  () => {
    loadingEl.textContent = '形象加载失败，请检查网络后重试导出。';
  },
);
</script>
</body>
</html>`
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function downloadHtml(filename: string, html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Export resume: small GLB → single HTML; large GLB (e.g. Chao ~57MB) → zip
 * with html + characters/*.glb so the browser does not freeze on base64.
 */
export async function exportProject(project: Project): Promise<'html' | 'zip'> {
  const character = CHARACTERS[project.characterId] ?? CHARACTERS.chao
  const buffer = await fetchGlb(character.glbUrl)
  const safe = project.title.replace(/[^\w\u4e00-\u9fa5-]+/g, '-') || 'resume'
  const file = glbFileName(character.glbUrl)

  if (buffer.byteLength > EMBED_MAX_BYTES) {
    const relativeUri = `./characters/${file}`
    const html = buildExportHtml(project, relativeUri)
    const zip = new JSZip()
    zip.file(`${safe}.html`, html)
    zip.folder('characters')?.file(file, buffer)
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, `${safe}.zip`)
    return 'zip'
  }

  const html = buildExportHtml(project, arrayBufferToDataUri(buffer))
  downloadHtml(`${safe}.html`, html)
  return 'html'
}
