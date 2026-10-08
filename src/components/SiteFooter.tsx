import { ScrollTrigger } from 'gsap/ScrollTrigger'
import useReducedMotion from '../hooks/useReducedMotion'

export default function SiteFooter() {
  const reduced = useReducedMotion()
  const preorderPage = new URLSearchParams(location.search).get('page') === 'dat-truoc'
  const chapterHref = (id: string) => `${preorderPage ? './' : ''}#${id}`
  const navigate = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    const trigger = ScrollTrigger.getAll().find((item) => item.pin && (item.trigger === target || item.trigger?.contains(target)))
    history.pushState(null, '', event.currentTarget.href)
    window.scrollTo({ top: trigger?.start ?? target.getBoundingClientRect().top + scrollY, behavior: reduced ? 'instant' : 'smooth' })
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1
    target.focus({ preventScroll: true })
  }

  return (
    <footer className="site-footer finale-footer relative z-10 text-card" aria-label="Thông tin Thủy Trận">
      <div className="finale-footer-grid">
        <div>
          <a className="display finale-wordmark" href={chapterHref('top')} onClick={(event) => navigate(event, 'top')}>Thủy Trận</a>
          <p className="finale-about">Boardgame chiến thuật hợp tác, lấy cảm hứng từ trận Bạch Đằng năm 938. Cùng đồng đội xoay chuyển thế trận trên dòng sông.</p>
        </div>
        <nav aria-label="Khám phá Thủy Trận">
          <p className="finale-eyebrow">Khám phá</p>
          {[['roles', 'Sáu nhân vật'], ['ke-sach', 'Bảy kế sách'], ['dia-diem', '24 địa điểm']].map(([id, label]) => (
            <a key={id} className="finale-link" href={chapterHref(id)} onClick={(event) => navigate(event, id)}>{label}<span aria-hidden="true">↗</span></a>
          ))}
          <a className="finale-link" href="?page=dat-truoc">Đặt trước boardgame<span aria-hidden="true">↗</span></a>
        </nav>
        <nav aria-label="Kết nối với Thủy Trận">
          <p className="finale-eyebrow">Giữ liên lạc</p>
          <a className="finale-link" href="https://www.facebook.com/daugiaothoi" target="_blank" rel="noopener noreferrer">Facebook <span aria-hidden="true">↗</span><span className="sr-only"> (mở tab mới)</span></a>
          <a className="finale-link" href="https://www.tiktok.com/@daugiaothoi" target="_blank" rel="noopener noreferrer">TikTok <span aria-hidden="true">↗</span><span className="sr-only"> (mở tab mới)</span></a>
        </nav>
      </div>
      <details className="finale-credits">
        <summary><span>Đội ngũ thực hiện <span className="finale-credit-count">/ 04</span></span><span className="finale-credit-toggle" aria-hidden="true">+</span></summary>
        <div className="finale-credit-grid">
          {[
            ['Lê Thị Như Quỳnh', 'Thiết kế · Nội dung · Lập kế hoạch truyền thông · Edit'],
            ['Lê Thị Quỳnh', 'Content · Edit'],
            ['Nguyễn Thị Minh Thu', 'Content · Edit'],
            ['Nguyễn Minh Đức', 'Thiết kế · Biên tập · Lập trình · UX/UI'],
          ].map(([name, responsibility]) => <div key={name}><p className="finale-credit-name">{name}</p><p className="finale-credit-role">{responsibility}</p></div>)}
        </div>
      </details>
      <div className="finale-colophon">
        <p className="finale-origin">Thủy Trận · Việt Nam · 2026</p>
        <a className="finale-link" href={preorderPage ? '#dat-truoc' : '#top'} onClick={(event) => navigate(event, preorderPage ? 'dat-truoc' : 'top')}>Về đầu trang <span aria-hidden="true">↑</span></a>
      </div>
    </footer>
  )
}
