import type { CSSProperties } from 'react'
import {
  BLEED_FRAME_COLOR,
  BLEED_FRAME_STROKE,
  BLEED_INSET_PX,
  BLEED_STYLES,
  type BleedStyleId,
} from '../model/bleedStyles'

function CornerL({
  color,
  stroke,
  arm,
  withCross,
  top,
  left,
}: {
  color: string
  stroke: number
  arm: number
  withCross: boolean
  top: boolean
  left: boolean
}) {
  const box: CSSProperties = {
    position: 'absolute',
    width: arm,
    height: arm,
    top: top ? 0 : 'auto',
    bottom: top ? 'auto' : 0,
    left: left ? 0 : 'auto',
    right: left ? 'auto' : 0,
    borderTop: top ? `${stroke}px solid ${color}` : 'none',
    borderBottom: top ? 'none' : `${stroke}px solid ${color}`,
    borderLeft: left ? `${stroke}px solid ${color}` : 'none',
    borderRight: left ? 'none' : `${stroke}px solid ${color}`,
  }
  const cross = arm * 0.45
  return (
    <div style={box} aria-hidden>
      {withCross ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: left ? 0 : 'auto',
              right: left ? 'auto' : 0,
              top: top ? 0 : 'auto',
              bottom: top ? 'auto' : 0,
              width: cross * 2,
              height: stroke,
              background: color,
              ...(left
                ? { marginLeft: -cross }
                : { marginRight: -cross, right: 0 }),
              ...(top
                ? { marginTop: -stroke / 2 }
                : { marginBottom: -stroke / 2 }),
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: left ? 0 : 'auto',
              right: left ? 'auto' : 0,
              top: top ? 0 : 'auto',
              bottom: top ? 'auto' : 0,
              width: stroke,
              height: cross * 2,
              background: color,
              ...(left
                ? { marginLeft: -stroke / 2 }
                : { marginRight: -stroke / 2, right: 0 }),
              ...(top
                ? { marginTop: -cross }
                : { marginBottom: -cross, bottom: 0 }),
            }}
          />
        </>
      ) : null}
    </div>
  )
}

const CORNERS = [
  { top: true, left: true },
  { top: true, left: false },
  { top: false, left: true },
  { top: false, left: false },
] as const

/**
 * Fixed bleed guides: always a 50%-opacity full frame + corner marks.
 * Corner style is user-selectable; frame is always on.
 */
export function BleedOverlay({ styleId }: { styleId: BleedStyleId }) {
  const style = BLEED_STYLES[styleId] ?? BLEED_STYLES['corner-gold']
  const withCross = style.variant === 'corners' && style.id === 'corner-gold'

  return (
    <div
      className="pointer-events-none absolute z-[1]"
      style={{ inset: BLEED_INSET_PX }}
      aria-hidden
    >
      {/* Always-on full frame at 50% opacity */}
      <div
        className="absolute inset-0"
        style={{
          border: `${BLEED_FRAME_STROKE}px solid ${BLEED_FRAME_COLOR}`,
        }}
      />

      {style.variant === 'cross'
        ? CORNERS.map((c, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: style.arm * 2,
                height: style.arm * 2,
                top: c.top ? 0 : 'auto',
                bottom: c.top ? 'auto' : 0,
                left: c.left ? 0 : 'auto',
                right: c.left ? 'auto' : 0,
                transform: `translate(${c.left ? '-50%' : '50%'}, ${c.top ? '-50%' : '50%'})`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  width: style.stroke,
                  height: '100%',
                  marginLeft: -style.stroke / 2,
                  background: style.color,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  height: style.stroke,
                  width: '100%',
                  marginTop: -style.stroke / 2,
                  background: style.color,
                }}
              />
            </div>
          ))
        : CORNERS.map((c, i) => (
            <CornerL
              key={i}
              color={style.color}
              stroke={style.stroke}
              arm={style.arm}
              withCross={withCross}
              top={c.top}
              left={c.left}
            />
          ))}
    </div>
  )
}
