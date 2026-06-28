import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { STORE } from '../config'
import { db } from '../lib/db'
import type { Product } from '../lib/types'
import { formatMoney } from '../lib/format'
import Gift3D from '../components/Gift3D'

// URL de Google Maps embebible a partir de los datos de STORE (sin API key).
function mapEmbedSrc(): string | null {
  if (STORE.mapsUrl && STORE.mapsUrl.includes('output=embed')) return STORE.mapsUrl
  const q = [STORE.address, STORE.city].filter(Boolean).join(', ')
  if (q) return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`
  return null
}

// ── Landing pública de Caprichitos (página principal) ────────────────────────
// Diseño 2024-2025: tipografía fluida (clamp), gradiente "mesh" animado,
// glassmorphism, cursor personalizado, botones magnéticos, tilt 3D en tarjetas,
// contadores animados, marquee infinito y reveals escalonados al hacer scroll.
// Todo con transform/opacity (GPU, 60fps) y respeto a prefers-reduced-motion.

const HEADLINE = ['Regalos', 'y', 'novedades', 'que', 'hacen', 'sonreír']

const FEATURES: { t: string; d: string; icon: JSX.Element; span?: boolean }[] = [
  {
    t: 'Detalles para cada ocasión',
    d: 'Cumpleaños, San Valentín, graduaciones o un "solo porque sí". Siempre tenemos el regalo ideal esperándote.',
    span: true,
    icon: (
      <path d="M12 21s-7-4.35-9.2-8.5C1.3 9.6 2.6 6 6 6c2 0 3.2 1.3 4 2.4C10.8 7.3 12 6 14 6c3.4 0 4.7 3.6 3.2 6.5C19 16.65 12 21 12 21z" fill="#EC6F9C" />
    ),
  },
  {
    t: 'Atención cercana',
    d: 'Te ayudamos a elegir con una sonrisa.',
    icon: (
      <>
        <path d="M5 8h14l-1 11a2 2 0 01-2 2H8a2 2 0 01-2-2L5 8z" fill="#EC6F9C" />
        <path d="M9 8a3 3 0 116 0" stroke="#C04F7E" strokeWidth="2" fill="none" />
      </>
    ),
  },
  {
    t: 'Novedades cada semana',
    d: 'Siempre encuentras algo nuevo.',
    icon: (
      <>
        <path d="M12 2l2.4 6.9H21l-5.6 4 2.2 6.8L12 15.7 6.4 19.7l2.2-6.8L3 8.9h6.6z" fill="#EC6F9C" />
      </>
    ),
  },
  {
    t: 'Negocio ordenado',
    d: 'Inventario y ventas con sistema digital de punto de venta y códigos QR.',
    icon: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" fill="#EC6F9C" />
        <rect x="7" y="6" width="10" height="2" rx="1" fill="#fff" />
        <rect x="7" y="10" width="10" height="2" rx="1" fill="#fff" />
        <rect x="7" y="14" width="6" height="2" rx="1" fill="#fff" />
      </>
    ),
  },
  {
    t: 'Empaque bonito',
    d: 'Tu regalo listo para entregar y sorprender.',
    icon: (
      <>
        <rect x="3" y="8" width="18" height="13" rx="2" fill="#EC6F9C" />
        <rect x="3" y="8" width="18" height="4" rx="1" fill="#C04F7E" />
        <rect x="11" y="8" width="2" height="13" fill="#fff" />
      </>
    ),
  },
]

const CATS = [
  '🧸 Peluches', '🎁 Regalos', '🎈 Fiesta', '💄 Accesorios', '🏠 Hogar',
  '✏️ Papelería', '📿 Bisutería', '🍭 Dulces', '💝 San Valentín', '✨ Novedades',
]

const STEPS = [
  { n: '01', t: 'Explora', d: 'Navega el catálogo en línea y descubre las novedades de la semana.' },
  { n: '02', t: 'Elige', d: 'Encuentra el detalle perfecto con ayuda de nuestras categorías.' },
  { n: '03', t: 'Sorprende', d: 'Visítanos o contáctanos para apartarlo y llevártelo bonito.' },
]

const STATS = [
  { end: 11, suffix: '', label: 'Categorías' },
  { end: 120, suffix: '+', label: 'Productos' },
  { end: 100, suffix: '%', label: 'Atención personal' },
]

// Tarjetas que giran en 3D (flip) por ocasión
const FLIP = [
  { emoji: '🎂', t: 'Cumpleaños', d: 'El regalo perfecto para celebrar a quien quieres.' },
  { emoji: '💝', t: 'Amor', d: 'Detalles románticos para sorprender en grande.' },
  { emoji: '🎉', t: 'Fiesta', d: 'Todo para que la reunión brille de principio a fin.' },
  { emoji: '🌟', t: 'Solo porque sí', d: 'Porque un detalle bonito alegra cualquier día.' },
]

// Contador animado al entrar en pantalla
function AnimatedStat({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setVal(end)
      return
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        obs.disconnect()
        const dur = 1500
        const t0 = performance.now()
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur)
          const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
          setVal(Math.round(end * eased))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.5 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [end])
  return (
    <div className="stat" ref={ref}>
      <div className="stat-num">{val}{suffix}</div>
      <span>{label}</span>
    </div>
  )
}

export default function Landing() {
  const progressRef = useRef<HTMLDivElement>(null)
  const [products, setProducts] = useState<Product[]>([])

  // Productos reales para el ticker (catálogo activo y con existencias)
  useEffect(() => {
    db.listProducts()
      .then((all) => setProducts(all.filter((p) => p.active && p.stock > 0).slice(0, 14)))
      .catch(() => {})
  }, [])

  // Reveal escalonado + scroll progress
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    document.querySelectorAll('.lp .reveal').forEach((el) => obs.observe(el))

    const reduceMo = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const parallax = Array.from(document.querySelectorAll<HTMLElement>('.lp [data-depth]'))
    const onScroll = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      const p = max > 0 ? h.scrollTop / max : 0
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`
      document.querySelector('.lp nav')?.classList.toggle('shrink', h.scrollTop > 24)
      // Parallax de profundidad (capas se mueven a distinta velocidad)
      if (!reduceMo) {
        const y = h.scrollTop
        for (const el of parallax) {
          const d = parseFloat(el.dataset.depth || '0')
          el.style.transform = `translate3d(0, ${y * d}px, 0)`
        }
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    if (reduce) return () => { obs.disconnect(); window.removeEventListener('scroll', onScroll) }

    // Cursor personalizado (dot + ring) solo en dispositivos con puntero fino
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const cleanups: (() => void)[] = []
    if (finePointer) {
      const dot = document.createElement('div')
      const ring = document.createElement('div')
      dot.className = 'cap-cursor-dot'
      ring.className = 'cap-cursor-ring'
      document.body.append(dot, ring)
      let mx = innerWidth / 2, my = innerHeight / 2
      let rx = mx, ry = my
      const onMove = (e: MouseEvent) => {
        mx = e.clientX; my = e.clientY
        dot.style.transform = `translate(${mx}px, ${my}px)`
      }
      let raf = 0
      const loop = () => {
        rx += (mx - rx) * 0.18
        ry += (my - ry) * 0.18
        ring.style.transform = `translate(${rx}px, ${ry}px)`
        raf = requestAnimationFrame(loop)
      }
      window.addEventListener('mousemove', onMove)
      loop()
      const hov = document.querySelectorAll('.lp a, .lp button, .lp .tilt, .lp .chip')
      const enter = () => ring.classList.add('big')
      const leave = () => ring.classList.remove('big')
      hov.forEach((el) => { el.addEventListener('mouseenter', enter); el.addEventListener('mouseleave', leave) })
      cleanups.push(() => {
        window.removeEventListener('mousemove', onMove)
        cancelAnimationFrame(raf)
        hov.forEach((el) => { el.removeEventListener('mouseenter', enter); el.removeEventListener('mouseleave', leave) })
        dot.remove(); ring.remove()
      })

      // Botones magnéticos
      document.querySelectorAll<HTMLElement>('.lp .magnetic').forEach((el) => {
        const move = (e: MouseEvent) => {
          const r = el.getBoundingClientRect()
          const x = (e.clientX - (r.left + r.width / 2)) * 0.3
          const y = (e.clientY - (r.top + r.height / 2)) * 0.4
          el.style.transform = `translate(${x}px, ${y}px)`
        }
        const reset = () => { el.style.transform = 'translate(0,0)' }
        el.addEventListener('mousemove', move)
        el.addEventListener('mouseleave', reset)
        cleanups.push(() => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', reset) })
      })

      // Tilt 3D + spotlight que sigue al cursor en tarjetas
      document.querySelectorAll<HTMLElement>('.lp .tilt').forEach((el) => {
        const move = (e: MouseEvent) => {
          const r = el.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width - 0.5
          const py = (e.clientY - r.top) / r.height - 0.5
          el.style.transform = `perspective(800px) rotateX(${-py * 8}deg) rotateY(${px * 8}deg) translateY(-4px)`
          el.style.setProperty('--mx', `${(e.clientX - r.left)}px`)
          el.style.setProperty('--my', `${(e.clientY - r.top)}px`)
        }
        const reset = () => { el.style.transform = 'perspective(800px) rotateX(0) rotateY(0)' }
        el.addEventListener('mousemove', move)
        el.addEventListener('mouseleave', reset)
        cleanups.push(() => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', reset) })
      })

      // Parallax 3D del hero: toda la escena de regalo se inclina con el mouse
      const hero = document.querySelector<HTMLElement>('.lp .hero')
      const art = document.querySelector<HTMLElement>('.lp .hero-art')
      if (hero && art) {
        const move = (e: MouseEvent) => {
          const r = hero.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width - 0.5
          const py = (e.clientY - r.top) / r.height - 0.5
          art.style.transform = `perspective(900px) rotateY(${px * 12}deg) rotateX(${-py * 10}deg)`
        }
        const reset = () => { art.style.transform = 'perspective(900px) rotateY(0) rotateX(0)' }
        hero.addEventListener('mousemove', move)
        hero.addEventListener('mouseleave', reset)
        cleanups.push(() => { hero.removeEventListener('mousemove', move); hero.removeEventListener('mouseleave', reset) })
      }
    }

    return () => {
      obs.disconnect()
      window.removeEventListener('scroll', onScroll)
      cleanups.forEach((c) => c())
    }
  }, [])

  return (
    <div className="lp">
      <style>{CSS}</style>

      {/* Barra de progreso de lectura */}
      <div className="cap-progress" ref={progressRef} />

      {/* NAV */}
      <nav>
        <div className="wrap nav-in">
          <div className="logo magnetic">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-7-4.35-9.2-8.5C1.3 9.6 2.6 6 6 6c2 0 3.2 1.3 4 2.4C10.8 7.3 12 6 14 6c3.4 0 4.7 3.6 3.2 6.5C19 16.65 12 21 12 21z" fill="#fff" />
            </svg>
          </div>
          <div className="brand">Caprichitos<small>REGALOS Y NOVEDADES</small></div>
          <div className="nav-links">
            <a href="#nosotros">Nosotros</a>
            <a href="#productos">Productos</a>
            <a href="#contacto">Contacto</a>
            <Link to="/tienda" className="btn magnetic">Ver catálogo</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="mesh" aria-hidden="true">
          <span className="orb o1" /><span className="orb o2" /><span className="orb o3" />
        </div>
        <div className="wrap hero-grid">
          <div>
            <span className="pill reveal">✨ Detalles bonitos para cada ocasión</span>
            <h1 className="hero-title">
              {HEADLINE.map((w, i) => (
                <span className="word" key={i} style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
                  {w === 'sonreír' ? <em>{w}</em> : w}{' '}
                </span>
              ))}
            </h1>
            <p className="lead reveal">
              En <b>Caprichitos</b> encuentras el detalle perfecto: peluches, accesorios, artículos de fiesta y
              novedades para sorprender a quien quieres. Un negocio moderno, ordenado y con tecnología de punto de venta.
            </p>
            <div className="hero-cta reveal">
              <Link to="/tienda" className="btn lg magnetic">🛍️ Explorar catálogo</Link>
              <a href="#contacto" className="btn lg ghost magnetic">Contáctanos</a>
            </div>
          </div>

          <div className="hero-art reveal">
            <div className="glass-card">
              {/* Regalo 3D real con WebGL (Three.js), respaldo CSS adentro */}
              <Gift3D />
              <p>Hecho con amor 💗</p>
            </div>
            <span className="badge b-a float-s" data-depth="-0.06">🧸</span>
            <span className="badge b-b float-s" data-depth="0.05">🎀</span>
            <span className="badge b-c float-s" data-depth="-0.04">💝</span>
          </div>
        </div>

        <a href="#stats" className="scroll-ind" aria-label="Bajar">
          <span className="mouse"><span /></span>
        </a>
      </header>

      {/* STATS con contador animado */}
      <section className="stats-bar" id="stats">
        <div className="wrap stats-grid">
          {STATS.map((s) => <AnimatedStat key={s.label} {...s} />)}
        </div>
      </section>

      {/* NOSOTROS — bento con tilt */}
      <section className="block" id="nosotros">
        <div className="wrap">
          <p className="eyebrow reveal">Quiénes somos</p>
          <h2 className="title reveal">Una tienda hecha con cariño</h2>
          <p className="sub reveal">
            Caprichitos es una tienda de regalos y novedades donde cada producto está pensado para alegrar el día.
            Cuidamos la atención al cliente y operamos con un sistema digital que mantiene todo en orden.
          </p>
          <div className="bento">
            {FEATURES.map((f, i) => (
              <div className={`card tilt reveal${f.span ? ' wide' : ''}`} key={f.t} style={{ ['--d' as string]: `${i * 0.08}s` }}>
                <div className="ico">
                  <svg viewBox="0 0 24 24" fill="none">{f.icon}</svg>
                </div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FLIP CARDS 3D por ocasión */}
      <section className="block flip-sec">
        <div className="wrap">
          <p className="eyebrow reveal">Un detalle para cada momento</p>
          <h2 className="title reveal">¿Qué quieres celebrar?</h2>
          <p className="sub reveal">Pasa el cursor (o toca) cada tarjeta para descubrir más.</p>
          <div className="flips">
            {FLIP.map((f, i) => (
              <div className="flip reveal" key={f.t} style={{ ['--d' as string]: `${i * 0.08}s` }} tabIndex={0}>
                <div className="flip-inner">
                  <div className="flip-face flip-front">
                    <span className="flip-emoji">{f.emoji}</span>
                    <h3>{f.t}</h3>
                  </div>
                  <div className="flip-face flip-back">
                    <p>{f.d}</p>
                    <Link to="/tienda" className="flip-link">Ver opciones →</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TICKER de productos reales del catálogo */}
      {products.length > 0 && (
        <section className="ticker-sec">
          <div className="wrap">
            <p className="eyebrow reveal">Directo del catálogo</p>
            <h2 className="title reveal">Algunas de nuestras novedades</h2>
          </div>
          <div className="ticker" aria-hidden="true">
            <div className="ticker-track">
              {[...products, ...products].map((p, i) => (
                <Link to="/tienda" className="prod" key={i}>
                  <div className="prod-img">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} loading="lazy" />
                      : <span className="prod-ph">🎁</span>}
                  </div>
                  <div className="prod-info">
                    <span className="prod-name">{p.name}</span>
                    <span className="prod-price">{formatMoney(p.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MARQUEE de categorías */}
      <section className="marquee-sec" id="productos">
        <p className="eyebrow reveal">Lo que encontrarás</p>
        <h2 className="title reveal">Para todos los gustos</h2>
        <div className="marquee" aria-hidden="true">
          <div className="track">
            {[...CATS, ...CATS].map((c, i) => <span className="chip" key={i}>{c}</span>)}
          </div>
        </div>
        <div className="center reveal">
          <Link to="/tienda" className="btn lg magnetic">Ver catálogo completo →</Link>
        </div>
      </section>

      {/* CÓMO COMPRAR */}
      <section className="block steps-sec">
        <div className="wrap">
          <p className="eyebrow reveal">Así de fácil</p>
          <h2 className="title reveal">Cómo conseguir tu detalle</h2>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step reveal" key={s.n} style={{ ['--d' as string]: `${i * 0.1}s` }}>
                <div className="step-n">{s.n}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UBICACIÓN + CONTACTO */}
      <section className="block loc-sec" id="contacto">
        <div className="wrap">
          <p className="eyebrow reveal">Dónde encontrarnos</p>
          <h2 className="title reveal">Visítanos o escríbenos</h2>
          <div className="loc-grid reveal">
            <div className="loc-info">
              {(STORE.address || STORE.city) && (
                <div className="loc-row">
                  <span className="loc-ico">📍</span>
                  <div><b>Dirección</b><span>{[STORE.address, STORE.city].filter(Boolean).join(', ')}</span></div>
                </div>
              )}
              {STORE.hours && (
                <div className="loc-row">
                  <span className="loc-ico">🕒</span>
                  <div><b>Horario</b><span>{STORE.hours}</span></div>
                </div>
              )}
              {STORE.whatsapp && (
                <a className="loc-row link" href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noreferrer">
                  <span className="loc-ico">💬</span>
                  <div><b>WhatsApp</b><span>Escríbenos por WhatsApp</span></div>
                </a>
              )}
              {STORE.phone && (
                <a className="loc-row link" href={`tel:${STORE.phone.replace(/\s/g, '')}`}>
                  <span className="loc-ico">📞</span>
                  <div><b>Teléfono</b><span>{STORE.phone}</span></div>
                </a>
              )}
              <a className="loc-row link" href={`mailto:${STORE.email}`}>
                <span className="loc-ico">📧</span>
                <div><b>Correo</b><span>{STORE.email}</span></div>
              </a>
              {STORE.instagram && (
                <a className="loc-row link" href={`https://instagram.com/${STORE.instagram}`} target="_blank" rel="noreferrer">
                  <span className="loc-ico">📷</span>
                  <div><b>Instagram</b><span>@{STORE.instagram}</span></div>
                </a>
              )}
            </div>
            <div className="loc-map">
              {mapEmbedSrc() ? (
                <iframe
                  title="Ubicación de Caprichitos"
                  src={mapEmbedSrc() as string}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div className="map-ph">
                  <span>🗺️</span>
                  <b>Mapa próximamente</b>
                  <p>Agrega tu dirección en la configuración para mostrar el mapa aquí.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-wrap">
        <div className="cta-final reveal">
          <div className="shine" aria-hidden="true" />
          <h2>¿Buscas el regalo perfecto?</h2>
          <p>Visítanos o explora nuestro catálogo en línea. Tenemos novedades cada semana.</p>
          <div className="cta-row">
            <Link to="/tienda" className="btn lg magnetic">🛍️ Ver catálogo</Link>
            <a href={`mailto:${STORE.email}`} className="btn lg ghost-light magnetic">Escríbenos</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="foot-brand">
            <div className="logo small">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 21s-7-4.35-9.2-8.5C1.3 9.6 2.6 6 6 6c2 0 3.2 1.3 4 2.4C10.8 7.3 12 6 14 6c3.4 0 4.7 3.6 3.2 6.5C19 16.65 12 21 12 21z" fill="#fff" />
              </svg>
            </div>
            <div className="brand">Caprichitos</div>
          </div>
          <div className="foot-links">
            <a href="#nosotros">Nosotros</a>
            <a href="#productos">Productos</a>
            <Link to="/tienda">Catálogo</Link>
            <a href={`mailto:${STORE.email}`}>Correo</a>
          </div>
          <p className="foot-mail">📧 {STORE.email}</p>
          <p className="foot-copy">© 2026 Caprichitos · Regalos y Novedades · Hecho con 💗</p>
        </div>
      </footer>
    </div>
  )
}

const CSS = `
.lp{
  --bg:#FFF8FB;--text:#4A3F4A;--muted:#9B8A95;--pink:#EC6F9C;--pinkBright:#F072A0;--pinkDeep:#C04F7E;--blue:#8FBEEC;
  --card1:#FDE7F0;--card2:#FCD7E6;--border:#F4DEEA;--green:#5FB98E;
  --display:'Quicksand',sans-serif;--body:'Nunito',sans-serif;
  --ease-spring:cubic-bezier(.34,1.56,.64,1);--ease:cubic-bezier(.4,0,.2,1);
  --fs-h1:clamp(2.6rem,1.6rem+4.5vw,5rem);
  --fs-h2:clamp(1.9rem,1.4rem+2vw,2.6rem);
  --fs-lead:clamp(1rem,.92rem+.5vw,1.18rem);
  font-family:var(--body);color:var(--text);background:var(--bg);line-height:1.6;overflow-x:hidden
}
.lp *{box-sizing:border-box}
.lp a{text-decoration:none;color:inherit}
.lp h1,.lp h2,.lp h3{font-family:var(--display);font-weight:700;color:var(--pinkDeep);line-height:1.1;margin:0}
.lp .wrap{max-width:1120px;margin:0 auto;padding:0 22px}
.lp .center{text-align:center;margin-top:42px}
.lp :focus-visible{outline:3px solid var(--pink);outline-offset:3px;border-radius:8px}

/* progreso + cursor */
.cap-progress{position:fixed;top:0;left:0;height:3px;width:100%;transform:scaleX(0);transform-origin:left;z-index:60;background:linear-gradient(90deg,var(--pinkBright,#F072A0),var(--blue,#8FBEEC))}
.cap-cursor-dot,.cap-cursor-ring{position:fixed;top:0;left:0;border-radius:50%;pointer-events:none;z-index:9999;margin-left:-4px;margin-top:-4px}
.cap-cursor-dot{width:8px;height:8px;background:#C04F7E}
.cap-cursor-ring{width:34px;height:34px;margin-left:-17px;margin-top:-17px;border:2px solid rgba(236,111,156,.6);transition:width .25s,height .25s,margin .25s,background .25s}
.cap-cursor-ring.big{width:54px;height:54px;margin-left:-27px;margin-top:-27px;background:rgba(236,111,156,.12)}
@media(hover:none){.cap-cursor-dot,.cap-cursor-ring{display:none}}

/* reveal */
@keyframes lpUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
.lp .reveal{opacity:0}
.lp .reveal.in{animation:lpUp .7s var(--ease) forwards;animation-delay:var(--d,0s)}

/* NAV */
.lp nav{position:sticky;top:0;z-index:50;background:rgba(255,248,251,.7);backdrop-filter:blur(14px) saturate(160%);border-bottom:1px solid transparent;transition:.3s var(--ease)}
.lp nav.shrink{background:rgba(255,248,251,.88);border-bottom-color:var(--border);box-shadow:0 6px 22px rgba(236,111,156,.1)}
.lp .nav-in{display:flex;align-items:center;gap:14px;padding:14px 0;transition:padding .3s var(--ease)}
.lp nav.shrink .nav-in{padding:9px 0}
.lp .logo{width:46px;height:46px;flex:none;border-radius:15px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#F58FB4,var(--blue));box-shadow:0 6px 16px rgba(236,111,156,.34);transition:transform .3s var(--ease-spring)}
.lp .logo.small{width:40px;height:40px;border-radius:13px}
.lp .brand{font-family:var(--display);font-weight:700;font-size:22px;color:var(--pinkDeep);line-height:1}
.lp .brand small{display:block;font-family:var(--body);font-weight:600;font-size:11px;color:var(--muted);letter-spacing:.6px}
.lp .nav-links{margin-left:auto;display:flex;gap:26px;align-items:center}
.lp .nav-links a:not(.btn){font-weight:600;font-size:15px;opacity:.82;position:relative;transition:.2s}
.lp .nav-links a:not(.btn)::after{content:'';position:absolute;left:0;bottom:-5px;height:2px;width:0;background:var(--pink);transition:width .25s var(--ease)}
.lp .nav-links a:not(.btn):hover{opacity:1;color:var(--pinkDeep)}
.lp .nav-links a:not(.btn):hover::after{width:100%}
@media(max-width:720px){.lp .nav-links a:not(.btn){display:none}}

/* botones */
.lp .btn{display:inline-flex;align-items:center;gap:8px;font-family:var(--display);font-weight:600;font-size:15px;padding:11px 20px;border-radius:14px;background:linear-gradient(135deg,var(--pinkBright),var(--pink));color:#fff;box-shadow:0 8px 20px rgba(236,111,156,.34);transition:box-shadow .25s,filter .25s;cursor:pointer;border:none;will-change:transform}
.lp .btn:hover{box-shadow:0 14px 30px rgba(236,111,156,.45);filter:saturate(1.08);color:#fff}
.lp .btn:active{transform:scale(.96)!important}
.lp .btn.lg{padding:15px 28px;font-size:16px;border-radius:16px}
.lp .btn.ghost{background:#fff;color:var(--pinkDeep);box-shadow:0 4px 18px rgba(236,111,156,.12);border:1px solid var(--border)}
.lp .btn.ghost-light{background:rgba(255,255,255,.16);color:#fff;border:1px solid rgba(255,255,255,.5);box-shadow:none}

/* HERO */
.lp .hero{position:relative;overflow:hidden;padding:clamp(54px,7vw,96px) 0 clamp(70px,8vw,110px);background:linear-gradient(180deg,#FDE7F0 0%,#EAF3FD 100%)}
.lp .mesh{position:absolute;inset:0;z-index:0;filter:blur(60px);opacity:.85}
.lp .orb{position:absolute;border-radius:50%}
.lp .orb.o1{width:42vw;height:42vw;max-width:520px;max-height:520px;background:radial-gradient(circle,#F58FB4,transparent 70%);top:-8%;right:-6%;animation:drift 16s ease-in-out infinite}
.lp .orb.o2{width:32vw;height:32vw;max-width:420px;max-height:420px;background:radial-gradient(circle,#9FCBFF,transparent 70%);bottom:-12%;left:-8%;animation:drift 20s ease-in-out infinite reverse}
.lp .orb.o3{width:26vw;height:26vw;max-width:340px;max-height:340px;background:radial-gradient(circle,#FFC8DE,transparent 70%);top:30%;left:40%;animation:drift 24s ease-in-out infinite}
@keyframes drift{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(4%,6%) scale(1.08)}66%{transform:translate(-5%,-4%) scale(.95)}}
.lp .hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:1.12fr .88fr;gap:46px;align-items:center}
.lp .pill{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.7);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.8);color:var(--pinkDeep);font-weight:700;font-size:13px;padding:8px 16px;border-radius:999px;box-shadow:0 4px 18px rgba(236,111,156,.14)}
.lp .hero-title{font-size:var(--fs-h1);margin:18px 0 18px;letter-spacing:-.02em}
.lp .hero-title .word{display:inline-block;margin-right:.26em;opacity:0;animation:wordIn .7s var(--ease-spring) forwards}
.lp .hero-title em{font-style:normal;background:linear-gradient(135deg,var(--pinkBright),var(--pinkDeep) 60%,var(--blue));-webkit-background-clip:text;background-clip:text;color:transparent}
@keyframes wordIn{from{opacity:0;transform:translateY(28px) rotate(2deg)}to{opacity:1;transform:none}}
.lp .lead{font-size:var(--fs-lead);color:var(--text);opacity:.86;max-width:540px}
.lp .hero-cta{display:flex;gap:14px;margin-top:30px;flex-wrap:wrap}

/* arte hero */
.lp .hero-art{position:relative;height:clamp(280px,34vw,380px)}
.lp .glass-card{position:absolute;inset:14% 12%;background:rgba(255,255,255,.55);backdrop-filter:blur(16px) saturate(160%);border:1px solid rgba(255,255,255,.7);border-radius:30px;box-shadow:0 22px 60px rgba(192,79,126,.22);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
.lp .glass-card p{font-family:var(--display);font-weight:600;color:var(--pinkDeep)}
/* contenedor del regalo WebGL */
.lp .gift3d{width:min(86%,230px);height:clamp(180px,22vw,230px);display:flex;align-items:center;justify-content:center}
.lp .gift3d canvas{filter:drop-shadow(0 18px 26px rgba(192,79,126,.28))}
/* caja de regalo 3D (preserve-3d) — respaldo */
.lp .scene3d{width:160px;height:150px;perspective:700px;display:flex;align-items:center;justify-content:center}
.lp .box3d{position:relative;width:96px;height:96px;transform-style:preserve-3d;animation:spin3d 9s linear infinite}
@keyframes spin3d{from{transform:rotateX(-18deg) rotateY(0)}to{transform:rotateX(-18deg) rotateY(360deg)}}
.lp .face{position:absolute;width:96px;height:96px;background:
  linear-gradient(90deg,transparent 42%,rgba(255,255,255,.95) 42%,rgba(255,255,255,.95) 58%,transparent 58%),
  linear-gradient(0deg,transparent 42%,rgba(255,255,255,.85) 42%,rgba(255,255,255,.85) 58%,transparent 58%),
  linear-gradient(135deg,var(--pinkBright),var(--pinkDeep));
  border:1px solid rgba(192,79,126,.25);box-shadow:inset 0 0 22px rgba(192,79,126,.25)}
.lp .fx-front{transform:translateZ(48px)}
.lp .fx-back{transform:rotateY(180deg) translateZ(48px)}
.lp .fx-right{transform:rotateY(90deg) translateZ(48px)}
.lp .fx-left{transform:rotateY(-90deg) translateZ(48px)}
.lp .fx-top{transform:rotateX(90deg) translateZ(48px);background:linear-gradient(135deg,#FBA3C4,var(--pink))}
.lp .fx-bottom{transform:rotateX(-90deg) translateZ(48px);background:var(--pinkDeep)}
.lp .bow{position:absolute;top:-26px;left:50%;transform:translateX(-50%) translateZ(48px);font-size:34px;filter:drop-shadow(0 6px 8px rgba(192,79,126,.35))}
.lp .badge{position:absolute;width:54px;height:54px;border-radius:18px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:0 10px 26px rgba(236,111,156,.22)}
.lp .badge.b-a{top:2%;left:0}
.lp .badge.b-b{bottom:6%;right:2%}
.lp .badge.b-c{bottom:30%;left:-4%}
.lp .float{animation:float 7s ease-in-out infinite}
.lp .float-s{animation:float 5s ease-in-out infinite}
.lp .badge.b-b{animation-delay:-2s}
.lp .badge.b-c{animation-delay:-3.5s}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
.lp .hero-art{transition:transform .25s var(--ease);transform-style:preserve-3d;will-change:transform}
@media(max-width:860px){.lp .hero-grid{grid-template-columns:1fr}.lp .hero-art{display:none}}

/* scroll indicator */
.lp .scroll-ind{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);z-index:2}
.lp .mouse{display:block;width:24px;height:38px;border:2px solid var(--pinkDeep);border-radius:14px;position:relative;opacity:.6}
.lp .mouse span{position:absolute;left:50%;top:7px;width:4px;height:7px;margin-left:-2px;border-radius:2px;background:var(--pinkDeep);animation:wheel 1.5s infinite}
@keyframes wheel{0%{opacity:0;transform:translateY(0)}40%{opacity:1}100%{opacity:0;transform:translateY(12px)}}

/* STATS */
.lp .stats-bar{margin-top:-32px;position:relative;z-index:3}
.lp .stats-grid{background:#fff;border:1px solid var(--border);border-radius:26px;box-shadow:0 18px 50px rgba(236,111,156,.16);padding:30px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px;text-align:center}
.lp .stat-num{font-family:var(--display);font-weight:700;font-size:clamp(2.2rem,1.6rem+2vw,3.2rem);line-height:1;background:linear-gradient(135deg,var(--pinkBright),var(--pinkDeep));-webkit-background-clip:text;background-clip:text;color:transparent}
.lp .stat span{display:block;margin-top:6px;color:var(--muted);font-weight:700;font-size:14px;letter-spacing:.3px}
@media(max-width:560px){.lp .stats-grid{grid-template-columns:1fr;gap:24px}}

/* secciones */
.lp .block{padding:clamp(56px,8vw,90px) 0}
.lp .eyebrow{text-align:center;color:var(--pink);font-weight:800;letter-spacing:1.6px;text-transform:uppercase;font-size:13px;margin:0}
.lp .title{text-align:center;font-size:var(--fs-h2);margin:10px 0 14px}
.lp .sub{text-align:center;color:var(--muted);max-width:640px;margin:0 auto 48px;font-size:var(--fs-lead)}

/* bento */
.lp .bento{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.lp .bento .wide{grid-column:span 1;grid-row:span 2;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(150deg,#fff,#FDF0F6)}
.lp .card{position:relative;overflow:hidden;background:#fff;border:1px solid var(--border);border-radius:24px;padding:28px;box-shadow:0 6px 22px rgba(236,111,156,.1);transition:box-shadow .3s var(--ease),transform .25s var(--ease);transform-style:preserve-3d;will-change:transform}
.lp .card:hover{box-shadow:0 22px 50px rgba(236,111,156,.22)}
/* spotlight que sigue al cursor */
.lp .card::before{content:'';position:absolute;inset:0;border-radius:inherit;background:radial-gradient(220px circle at var(--mx,50%) var(--my,50%),rgba(236,111,156,.16),transparent 60%);opacity:0;transition:opacity .3s var(--ease);pointer-events:none;z-index:0}
.lp .card:hover::before{opacity:1}
.lp .card>*{position:relative;z-index:1}
.lp .ico{width:56px;height:56px;border-radius:17px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;background:linear-gradient(135deg,var(--card1),var(--card2))}
.lp .ico svg{width:28px;height:28px}
.lp .card h3{font-size:19px;margin-bottom:7px}
.lp .card p{color:var(--muted);font-size:15px}
.lp .bento .wide .ico{width:64px;height:64px}
.lp .bento .wide h3{font-size:23px}
@media(max-width:860px){.lp .bento{grid-template-columns:repeat(2,1fr)}.lp .bento .wide{grid-row:span 1;grid-column:span 2}}
@media(max-width:560px){.lp .bento{grid-template-columns:1fr}.lp .bento .wide{grid-column:span 1}}

/* flip cards 3D */
.lp .flip-sec{background:linear-gradient(180deg,#fff,#FDF0F6)}
.lp .flips{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.lp .flip{height:230px;perspective:1100px;outline:none}
.lp .flip-inner{position:relative;width:100%;height:100%;transition:transform .7s var(--ease-spring);transform-style:preserve-3d}
.lp .flip:hover .flip-inner,.lp .flip:focus-visible .flip-inner{transform:rotateY(180deg)}
.lp .flip-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center;border:1px solid var(--border);box-shadow:0 8px 26px rgba(236,111,156,.14)}
.lp .flip-front{background:#fff}
.lp .flip-emoji{font-size:54px;filter:drop-shadow(0 8px 10px rgba(192,79,126,.2))}
.lp .flip-front h3{font-size:21px}
.lp .flip-back{background:linear-gradient(150deg,var(--pinkBright),var(--pinkDeep));color:#fff;transform:rotateY(180deg)}
.lp .flip-back p{color:#fff;font-size:15px;opacity:.96}
.lp .flip-link{font-family:var(--display);font-weight:700;color:#fff;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.55);padding:9px 18px;border-radius:12px;transition:background .2s}
.lp .flip-link:hover{background:rgba(255,255,255,.32);color:#fff}
@media(max-width:860px){.lp .flips{grid-template-columns:repeat(2,1fr)}}
@media(max-width:430px){.lp .flips{grid-template-columns:1fr}}

/* marquee */
.lp .marquee-sec{padding:clamp(56px,8vw,90px) 0;background:linear-gradient(180deg,#FDF0F6,#FFF8FB)}
.lp .marquee{overflow:hidden;margin:36px 0 8px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.lp .track{display:flex;gap:14px;width:max-content;animation:scrollX 28s linear infinite}
.lp .marquee:hover .track{animation-play-state:paused}
@keyframes scrollX{to{transform:translateX(-50%)}}
.lp .chip{flex:none;background:#fff;border:1px solid var(--border);border-radius:999px;padding:13px 24px;font-weight:700;color:var(--pinkDeep);box-shadow:0 4px 18px rgba(236,111,156,.1);transition:transform .2s var(--ease-spring),background .2s,color .2s}
.lp .chip:hover{background:linear-gradient(135deg,var(--pinkBright),var(--pink));color:#fff;transform:translateY(-4px) scale(1.04)}

/* ticker de productos */
.lp .ticker-sec{padding:clamp(56px,8vw,84px) 0;background:linear-gradient(180deg,#FFF8FB,#FDF0F6)}
.lp .ticker{overflow:hidden;margin-top:38px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.lp .ticker-track{display:flex;gap:18px;width:max-content;padding:0 9px;animation:scrollX 38s linear infinite}
.lp .ticker:hover .ticker-track{animation-play-state:paused}
.lp .prod{flex:none;width:190px;background:#fff;border:1px solid var(--border);border-radius:20px;overflow:hidden;box-shadow:0 6px 22px rgba(236,111,156,.1);transition:transform .25s var(--ease-spring),box-shadow .25s}
.lp .prod:hover{transform:translateY(-6px);box-shadow:0 18px 40px rgba(236,111,156,.22)}
.lp .prod-img{position:relative;aspect-ratio:1;overflow:hidden;background:linear-gradient(135deg,var(--card1),var(--card2));display:flex;align-items:center;justify-content:center}
.lp .prod-img img{width:100%;height:100%;object-fit:cover;transition:transform .4s var(--ease)}
.lp .prod:hover .prod-img img{transform:scale(1.07)}
.lp .prod-ph{font-size:46px}
.lp .prod-info{padding:13px 15px 16px}
.lp .prod-name{display:block;font-family:var(--display);font-weight:600;color:var(--text);font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lp .prod-price{display:block;margin-top:4px;font-family:var(--display);font-weight:700;color:var(--pinkDeep);font-size:17px}

/* ubicación + contacto */
.lp .loc-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:34px;align-items:stretch;margin-top:14px}
.lp .loc-info{display:flex;flex-direction:column;gap:14px}
.lp .loc-row{display:flex;gap:14px;align-items:center;background:#fff;border:1px solid var(--border);border-radius:18px;padding:16px 18px;box-shadow:0 4px 18px rgba(236,111,156,.08);transition:transform .2s var(--ease),box-shadow .2s}
.lp .loc-row.link:hover{transform:translateX(4px);box-shadow:0 10px 26px rgba(236,111,156,.18)}
.lp .loc-ico{font-size:24px;width:46px;height:46px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:14px;background:linear-gradient(135deg,var(--card1),var(--card2))}
.lp .loc-row b{font-family:var(--display);color:var(--pinkDeep);display:block;font-size:15px}
.lp .loc-row span{color:var(--muted);font-size:14px}
.lp .loc-map{border-radius:24px;overflow:hidden;border:1px solid var(--border);box-shadow:0 14px 40px rgba(236,111,156,.16);min-height:340px}
.lp .loc-map iframe{width:100%;height:100%;min-height:340px;border:0;display:block}
.lp .map-ph{height:100%;min-height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:24px;background:linear-gradient(135deg,#FDE7F0,#EAF3FD)}
.lp .map-ph span{font-size:44px}
.lp .map-ph b{font-family:var(--display);color:var(--pinkDeep);font-size:18px}
.lp .map-ph p{color:var(--muted);font-size:14px;max-width:260px}
@media(max-width:760px){.lp .loc-grid{grid-template-columns:1fr}}

/* pasos */
.lp .steps-sec{background:#fff}
.lp .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;counter-reset:s}
.lp .step{position:relative;background:linear-gradient(160deg,#fff,#FDF0F6);border:1px solid var(--border);border-radius:24px;padding:34px 28px;box-shadow:0 6px 22px rgba(236,111,156,.1)}
.lp .step-n{font-family:var(--display);font-weight:700;font-size:34px;width:62px;height:62px;display:flex;align-items:center;justify-content:center;border-radius:18px;color:#fff;background:linear-gradient(135deg,var(--pinkBright),var(--pinkDeep));box-shadow:0 10px 24px rgba(236,111,156,.34);margin-bottom:18px}
.lp .step h3{font-size:21px;margin-bottom:8px}
.lp .step p{color:var(--muted);font-size:15px}
@media(max-width:760px){.lp .steps{grid-template-columns:1fr}}

/* CTA */
.lp .cta-wrap{padding:30px 0 80px}
.lp .cta-final{position:relative;overflow:hidden;margin:0 22px;border-radius:34px;padding:clamp(48px,7vw,72px) 30px;text-align:center;background:linear-gradient(135deg,var(--pinkBright),var(--pinkDeep));color:#fff;max-width:1076px;margin-left:auto;margin-right:auto;box-shadow:0 26px 70px rgba(192,79,126,.35)}
.lp .cta-final .shine{position:absolute;top:-60%;left:-30%;width:60%;height:220%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent);transform:rotate(20deg);animation:shine 5s ease-in-out infinite}
@keyframes shine{0%{left:-40%}55%,100%{left:130%}}
.lp .cta-final h2{color:#fff;font-size:var(--fs-h2);margin-bottom:12px;position:relative}
.lp .cta-final p{opacity:.94;max-width:520px;margin:0 auto 28px;font-size:var(--fs-lead);position:relative}
.lp .cta-row{position:relative;display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.lp .cta-final .btn:not(.ghost-light){background:#fff;color:var(--pinkDeep)}

/* footer */
.lp footer{padding:52px 0 40px;text-align:center;color:var(--muted)}
.lp .foot-brand{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:14px}
.lp .foot-links{display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin:14px 0}
.lp .foot-links a{font-weight:700;color:var(--pinkDeep)}
.lp .foot-mail{font-size:14px}
.lp .foot-copy{font-size:13px;margin-top:10px;opacity:.8}

@media (prefers-reduced-motion: reduce){
  .lp *,.lp *::before,.lp *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
  .lp .reveal{opacity:1!important}
  .lp .hero-title .word{opacity:1!important}
  .cap-progress{display:none}
}
`
