import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import Wave from './Wave'
import { cards } from '../data/cards'
import useReducedMotion from '../hooks/useReducedMotion'

const roles = [...new Set(cards.map((c) => c.role))]
const opening = 'Hoằng Thao là đứa trẻ khờ dại, đem quân từ xa đến, quân lính còn mỏi mệt, lại nghe Công Tiễn đã chết, không có người làm nội ứng, đã mất vía trước rồi.'
const closing = 'Quân ta lấy sức còn khỏe địch với quân mỏi mệt, tất phá được.'
const source = 'https://baotanglichsuquocgia.vn/vi/Articles/2002/68092/ky-niem-1075-nam-11-938-11-2013-chien-thang-bach-djang-lan-thu-nhat.html'

export default function Manifesto() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>('.m-word')
      // Initialize every word before creating the stagger, including the closing sentence.
      gsap.set(words, { opacity: 0.14 })
      gsap.to(
        words,
        {
          opacity: 1,
          duration: 0.5,
          stagger: 0.12,
          ease: 'none',
          scrollTrigger: {
            trigger: '.m-text',
            start: 'top 78%',
            end: 'bottom 45%',
            scrub: true,
          },
        },
      )
      gsap.fromTo(
        '.m-track',
        { xPercent: 0 },
        {
          xPercent: -33,
          ease: 'none',
          scrollTrigger: { trigger: '.m-track', start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section
      ref={root}
      id="loi-lenh"
      aria-labelledby="loi-lenh-title"
      className="manifesto-ground relative min-h-svh overflow-hidden pt-[clamp(6rem,8vw,8rem)] pb-[clamp(5rem,10vw,10rem)]"
    >
      <div className="px-[clamp(1rem,3vw,2.5rem)]">
        <p className="mb-10 text-[0.76rem] font-medium tracking-[0.25em] uppercase">
          <span className="text-vermilion">01</span> — Lời lệnh
        </p>

        <div className="m-text w-full">
          <h2 id="loi-lenh-title" className="sr-only">Lời cổ động của Ngô Quyền</h2>
          <blockquote className="display !font-semibold !leading-[1.08] text-[clamp(2rem,4.8vw,5.4rem)]">
            <p>
              {`“${opening} ${closing}”`.split(' ').map((word, i) => (
                <span key={i} className="m-word inline-block mr-[0.22em]">{word}{' '}</span>
              ))}
            </p>
          </blockquote>
          <p className="mt-7 text-[0.8rem] font-medium tracking-[0.16em] uppercase">
            <span className="text-vermilion">Ngô Quyền</span> · Bạch Đằng, 938
          </p>
          <a href={source} target="_blank" rel="noopener noreferrer"
            className="mt-2 inline-block text-sm underline decoration-ink/35 underline-offset-4 transition-colors hover:text-vermilion">
            Nguồn: Bảo tàng Lịch sử Quốc gia ↗
          </a>
        </div>
      </div>

      {/* role marquee */}
      <div className="mt-[clamp(3rem,7vw,7rem)] overflow-hidden text-vermilion select-none" aria-hidden="true">
        <div className="m-track flex w-max items-center gap-[0.5em] display text-[clamp(4.5rem,13vw,15rem)] pr-[0.5em]">
          {[0, 1, 2].flatMap((k) =>
            roles.map((r, i) => (
              <span key={`${k}-${r}`} className="flex items-center gap-[0.5em]">
                <span className={i % 2 ? 'text-outline' : ''}>{r}</span>
                <span className="inline-block size-[0.16em] rotate-45 bg-ochre" />
              </span>
            )),
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 translate-y-[1px]">
        <Wave fill={cards[0].bg} />
      </div>
    </section>
  )
}
