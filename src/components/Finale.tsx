import { useLayoutEffect, useRef, useState } from "react"

import gsap from "gsap"

import SiteFooter from "./SiteFooter"

import SplitChars from "./SplitChars"

import Wave from "./Wave"

import { cards } from "../data/cards"

import useReducedMotion from "../hooks/useReducedMotion"

export default function Finale() {
  const root = useRef<HTMLElement>(null)

  const btn = useRef<HTMLAnchorElement>(null)

  const reduced = useReducedMotion()

  const [departing, setDeparting] = useState(false)

  const [selected, setSelected] = useState<string | null>(null)

  const chosen = cards.find((card) => card.id === selected)

  const stow = () => {
    if (!selected) return

    root.current
      ?.querySelector<HTMLButtonElement>('.finale-pick[aria-pressed="true"]')
      ?.focus({ preventScroll: true })

    setSelected(null)
  }

  const preorder = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      reduced
    )
      return

    event.preventDefault()

    if (departing) return

    const href = event.currentTarget.href

    setDeparting(true)

    gsap
      .timeline({ onComplete: () => window.location.assign(href) })

      .to(root.current!.querySelectorAll(".hand-slot"), {
        yPercent: -120,
        rotation: (i) => (i - 2.5) * 8,
        scale: 0.85,

        duration: 0.45,
        stagger: 0.025,
        ease: "power2.in",
      })
  }

  useLayoutEffect(() => {
    if (reduced) return

    const ctx = gsap.context(
      () => {
        gsap.from(".f-title .ch", {
          yPercent: 115,

          duration: 1.2,

          ease: "expo.out",

          stagger: 0.04,

          scrollTrigger: { trigger: root.current, start: "top 55%" },
        })

        gsap.from(".f-fade", {
          opacity: 0,

          y: 20,

          duration: 1,

          stagger: 0.12,

          ease: "power3.out",

          scrollTrigger: { trigger: root.current, start: "top 45%" },
        })

        gsap.from(".hand-slot", {
          yPercent: 70,

          opacity: 0,

          rotate: 0,

          xPercent: (i) => (2.5 - i) * 60,

          duration: 1.5,

          ease: "expo.out",

          stagger: 0.07,

          scrollTrigger: { trigger: ".hand", start: "top 92%" },
        })

        // magnetic CTA

        const mm = gsap.matchMedia()

        mm.add("(hover: hover) and (pointer: fine)", () => {
          const el = btn.current!

          const qx = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" })

          const qy = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" })

          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect()

            qx((e.clientX - (r.left + r.width / 2)) * 0.3)

            qy((e.clientY - (r.top + r.height / 2)) * 0.3)
          }

          const leave = () => {
            qx(0)

            qy(0)
          }

          el.addEventListener("pointermove", move)

          el.addEventListener("pointerleave", leave)

          return () => {
            el.removeEventListener("pointermove", move)

            el.removeEventListener("pointerleave", leave)
          }
        })
      },
      root,
    )

    return () => ctx.revert()
  }, [reduced])

  const mid = (cards.length - 1) / 2

  return (
    <section
      ref={root}
      id="nhan-lenh"
      className="finale relative overflow-hidden bg-ink text-card min-h-svh flex flex-col"
      onKeyDown={(event) => {
        if (event.key === "Escape") stow()
      }}
    >
      <div className="finale-wave relative z-10 shrink-0 -mb-px bg-river pointer-events-none">
        <Wave fill="var(--color-ink)" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 bottom-[-20vw] size-[90vw] -translate-x-1/2 rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(closest-side, #d99a2b, rgba(181,54,43,.5) 50%, transparent 75%)",
        }}
      />
      <div className="finale-intro relative z-10">
        <h2 className="f-title display">
          <span className="block">
            <SplitChars text="Nhận" />
          </span>
          <span className="block pl-[8vw] text-ochre">
            <SplitChars text="Lệnh." />
          </span>
        </h2>

        <div className="finale-invitation flex flex-col gap-5 items-start">
          <p className="f-fade font-serif italic font-normal text-[clamp(1.2rem,1.65vw,1.55rem)] leading-relaxed">
            Rút một lá. Ban một lệnh. Xem cả dòng sông đổi hướng.
          </p>
          <a
            ref={btn}
            href="?page=dat-truoc"
            onClick={preorder}
            aria-busy={departing}
            className="f-fade hero-cta finale-cta"
          >
            <span>{departing ? "Ra quân…" : "Đặt trước boardgame"}</span>
            <span aria-hidden="true" className="nav-diamond" />
          </a>
          <p className="f-fade finale-sales-note">
            Giá và lịch giao sẽ được công bố khi mở đặt trước.
          </p>
        </div>
      </div>

      <div className="finale-hand-area relative z-10">
        <p className="finale-eyebrow text-center" id="finale-hand-title">
          Chọn người cùng ra quân
        </p>
        <div className="hand" role="group" aria-labelledby="finale-hand-title">
          {cards.map((c, i) => {
            const t = i - mid

            return (
              <div
                key={c.id}
                className="hand-slot"
                style={{ zIndex: selected === c.id ? 30 : i }}
              >
                <button
                  type="button"
                  className="finale-pick card-feel"
                  aria-pressed={selected === c.id}
                  aria-label={`${c.prefix ? c.prefix + " " : ""}${c.role} — ${
                    selected === c.id ? "Cất thẻ" : "Xem kỹ năng"
                  }`}
                  aria-controls="finale-card-detail"
                  onClick={() => setSelected(selected === c.id ? null : c.id)}
                >
                  <img
                    src={c.image}
                    alt={`Lá bài ${c.role} — ${c.skill}`}
                    className="hand-card card-shadow w-full rounded-[3%]"
                    style={
                      {
                        "--r": `${t * 5.5}deg`,

                        "--y": `${t * t * 1.1}vw`,
                      } as React.CSSProperties
                    }
                    draggable={false}
                    loading="eager"
                    decoding="async"
                  />
                </button>
              </div>
            )
          })}
        </div>
        <div
          id="finale-card-detail"
          className="finale-card-detail"
          aria-live="polite"
          aria-atomic="true"
        >
          {chosen ? (
            <div key={chosen.id} className="finale-card-copy">
              <p className="display finale-character">
                {chosen.prefix} {chosen.role}
              </p>
              <p className="finale-skill">{chosen.skill}</p>
              <p>{chosen.text}</p>
              <button
                type="button"
                onClick={stow}
                className="finale-link finale-stow"
              >
                Cất thẻ <span aria-hidden="true">↘</span>
              </button>
            </div>
          ) : (
            <p className="finale-hand-hint">
              Sáu nhân vật. Sáu cách cùng xoay chuyển thế trận.
            </p>
          )}
        </div>
      </div>

      <SiteFooter />
    </section>
  )
}
