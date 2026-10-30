import { useState } from 'react'
import { pieces } from '../data/pieces'

// These are renders of the supplied GLBs, including their original bases.
export default function PieceGallery({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState(-1)
  const [view, setView] = useState(0)
  return <section className={`piece-gallery ${compact ? 'piece-gallery-compact' : ''}`} aria-label="Sáu quân nhân vật và bốn dấu kế sách">
    <p className="box-inventory">6 quân nhân vật · 4 dấu kế sách</p>
    <h2 className="display">Dựng quân. Bày kế.</h2>
    <div className="piece-gallery-grid">
      {pieces.map((piece, index) => <button type="button" key={piece.id} aria-pressed={selected === index}
        onClick={() => { setSelected(index); setView(0) }}>
        <img src={piece.posters[selected === index ? view : 0]} alt="" draggable={false} />
        <span>{piece.name}</span>
      </button>)}
    </div>
    {selected >= 0 && <div className="piece-gallery-angles" aria-label={`Góc nhìn ${pieces[selected].name}`}>
      {['Mặt trước', 'Góc nghiêng', 'Mặt sau'].map((label, index) => <button type="button" key={label}
        aria-pressed={view === index} onClick={() => setView(index)}>{label}</button>)}
    </div>}
    <p className="piece-note">Bố trí trưng bày minh họa.</p>
  </section>
}
