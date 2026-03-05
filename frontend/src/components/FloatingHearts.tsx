const HEARTS = [
  { left: '8%',  delay: '0s',   dur: '7s',  size: 14, opacity: 0.18 },
  { left: '22%', delay: '1.5s', dur: '9s',  size: 10, opacity: 0.13 },
  { left: '38%', delay: '3s',   dur: '8s',  size: 18, opacity: 0.15 },
  { left: '52%', delay: '0.8s', dur: '11s', size: 12, opacity: 0.12 },
  { left: '67%', delay: '2.2s', dur: '7.5s',size: 16, opacity: 0.17 },
  { left: '80%', delay: '4s',   dur: '10s', size: 11, opacity: 0.14 },
  { left: '92%', delay: '1s',   dur: '8.5s',size: 20, opacity: 0.10 },
  { left: '14%', delay: '5s',   dur: '9.5s',size: 9,  opacity: 0.16 },
]

export default function FloatingHearts() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none',
      overflow: 'hidden', zIndex: 0,
    }}>
      {HEARTS.map((h, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: h.left,
            fontSize: h.size,
            opacity: h.opacity,
            animation: `floatHeart ${h.dur} ${h.delay} infinite ease-in-out`,
            willChange: 'transform, opacity',
            userSelect: 'none',
          }}
        >
          ♥
        </div>
      ))}
    </div>
  )
}
