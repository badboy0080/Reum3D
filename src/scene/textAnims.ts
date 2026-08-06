import gsap from 'gsap'
import type { EnterAnim, ExitAnim } from '../model/types'

export function playEnter(
  el: HTMLElement,
  kind: EnterAnim,
  content: string,
): gsap.core.Tween | gsap.core.Timeline {
  gsap.killTweensOf(el)
  const tl = gsap.timeline()

  switch (kind) {
    case 'slide-up':
      return tl.fromTo(
        el,
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' },
      )
    case 'slide-left':
      return tl.fromTo(
        el,
        { autoAlpha: 0, x: 36 },
        { autoAlpha: 1, x: 0, duration: 0.55, ease: 'power2.out' },
      )
    case 'zoom-in':
      return tl.fromTo(
        el,
        { autoAlpha: 0, scale: 0.86 },
        { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power2.out' },
      )
    case 'typewriter': {
      el.textContent = ''
      el.style.opacity = '1'
      const proxy = { i: 0 }
      return tl.to(proxy, {
        i: content.length,
        duration: Math.min(1.6, 0.04 * content.length + 0.3),
        ease: 'none',
        onUpdate: () => {
          el.textContent = content.slice(0, Math.floor(proxy.i))
        },
        onComplete: () => {
          el.textContent = content
        },
      })
    }
    case 'stagger-lines': {
      const lines = content.split('\n')
      el.innerHTML = lines
        .map(
          (line) =>
            `<span class="line-chunk" style="display:block;opacity:0;transform:translateY(12px)">${line || '&nbsp;'}</span>`,
        )
        .join('')
      return tl.to(el.querySelectorAll('.line-chunk'), {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'transform',
      })
    }
    case 'fade-in':
    default:
      return tl.fromTo(
        el,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.45, ease: 'power1.out' },
      )
  }
}

export function playExit(
  el: HTMLElement,
  kind: ExitAnim,
): gsap.core.Tween | gsap.core.Timeline | null {
  gsap.killTweensOf(el)
  if (kind === 'none') {
    gsap.set(el, { autoAlpha: 0 })
    return null
  }
  if (kind === 'slide-down') {
    return gsap.to(el, {
      autoAlpha: 0,
      y: 24,
      duration: 0.35,
      ease: 'power1.in',
    })
  }
  return gsap.to(el, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' })
}
