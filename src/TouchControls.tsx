import { useRef, useState } from 'react'
import type { Controls } from './flight'
import { type Lang, t } from './i18n'

const RADIUS = 52 // px the knob can travel

/**
 * On-screen joystick (bottom-left: left/right turns, up/down climbs and dives) and a
 * hold-to-boost button (bottom-right). Writes into `controls.current` every move.
 */
export default function TouchControls({ controls, lang }: { controls: React.RefObject<Controls>; lang: Lang }) {
  const base = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const pointer = useRef<number | null>(null)

  function move(e: React.PointerEvent) {
    const rect = base.current?.getBoundingClientRect()
    if (!rect) return
    let dx = e.clientX - (rect.left + rect.width / 2)
    let dy = e.clientY - (rect.top + rect.height / 2)
    const len = Math.hypot(dx, dy)
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS
      dy = (dy / len) * RADIUS
    }
    setKnob({ x: dx, y: dy })
    controls.current.turn = dx / RADIUS
    controls.current.climb = -dy / RADIUS
  }

  function release() {
    pointer.current = null
    setKnob({ x: 0, y: 0 })
    controls.current.turn = 0
    controls.current.climb = 0
  }

  return (
    <>
      <div
        ref={base}
        role="application"
        aria-label={t('joystickLabel', lang)}
        className="pointer-events-auto absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-[max(1.25rem,env(safe-area-inset-left))] grid size-36 touch-none place-items-center rounded-full border-2 border-white/50 bg-hud/40"
        onPointerDown={(e) => {
          pointer.current = e.pointerId
          e.currentTarget.setPointerCapture(e.pointerId)
          move(e)
        }}
        onPointerMove={(e) => pointer.current === e.pointerId && move(e)}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <div
          className="size-16 rounded-full bg-white/85 shadow-lg"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>

      <button
        type="button"
        aria-label={t('boost', lang)}
        className="pointer-events-auto absolute right-[max(1.25rem,env(safe-area-inset-right))] bottom-[max(2.25rem,env(safe-area-inset-bottom))] size-20 touch-none rounded-full bg-sun text-sm font-bold text-ink shadow-lg active:scale-95"
        onPointerDown={() => (controls.current.boost = true)}
        onPointerUp={() => (controls.current.boost = false)}
        onPointerCancel={() => (controls.current.boost = false)}
        onPointerLeave={() => (controls.current.boost = false)}
      >
        {t('boost', lang)}
      </button>
    </>
  )
}
