import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { STORE } from '../config'

// Landing pública de Caprichitos (página principal del sitio).
// Estilos en un <style> embebido para conservar animaciones, hover y media queries
// (mismo patrón visual que el resto de la app, con la paleta rosa de theme.ts).
export default function Landing() {
  // Animación "reveal" al hacer scroll
  useEffect(() => {
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
    return () => obs.disconnect()
  }, [])

  return (
    <div className="lp">
      <style>{CSS}</style>

      {/* NAV */}
      <nav>
        <div className="wrap nav-in">
          <div className="logo">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-7-4.35-9.2-8.5C1.3 9.6 2.6 6 6 6c2 0 3.2 1.3 4 2.4C10.8 7.3 12 6 14 6c3.4 0 4.7 3.6 3.2 6.5C19 16.65 12 21 12 21z" fill="#fff" />
            </svg>
          </div>
          <div className="brand">
            Caprichitos<small>REGALOS Y NOVEDADES</small>
          </div>
          <div className="nav-links">
            <a href="#nosotros">Nosotros</a>
            <a href="#productos">Productos</a>
            <a href="#jovenes">Jóvenes</a>
            <Link to="/tienda" className="btn">Ver catálogo</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="wrap">
          <div className="reveal">
            <span className="pill">✨ Detalles bonitos para cada ocasión</span>
            <h1>
              Regalos y novedades que <span>hacen sonreír</span>
            </h1>
            <p className="lead">
              En <b>Caprichitos</b> encuentras el detalle perfecto: peluches, accesorios, artículos de fiesta y
              novedades para sorprender a quien quieres. Un negocio moderno, ordenado y con tecnología de punto de venta.
            </p>
            <div className="hero-cta">
              <Link to="/tienda" className="btn">🛍️ Explorar catálogo</Link>
              <a href="#contacto" className="btn ghost">Contáctanos</a>
            </div>
          </div>
          <div className="hero-art reveal">
            <div className="blob b1" />
            <div className="blob b2" />
            <div className="gift">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="9" width="18" height="12" rx="2" fill="#fff" />
                <rect x="3" y="9" width="18" height="4" rx="1" fill="#FCD7E6" />
                <rect x="10.5" y="9" width="3" height="12" fill="#EC6F9C" />
                <path d="M12 9C12 9 8 9 7 6.5C6.3 4.8 8.2 3.2 9.6 4.4C11 5.6 12 9 12 9Z" fill="#F58FB4" />
                <path d="M12 9C12 9 16 9 17 6.5C17.7 4.8 15.8 3.2 14.4 4.4C13 5.6 12 9 12 9Z" fill="#F58FB4" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* NOSOTROS */}
      <section className="block" id="nosotros">
        <div className="wrap">
          <p className="eyebrow reveal">Quiénes somos</p>
          <h2 className="title reveal">Una tienda hecha con cariño</h2>
          <p className="sub reveal">
            Caprichitos es una tienda de regalos y novedades donde cada producto está pensado para alegrar el día.
            Cuidamos la atención al cliente y operamos con un sistema digital que mantiene todo en orden.
          </p>
          <div className="grid g3">
            <div className="card reveal">
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s-7-4.35-9.2-8.5C1.3 9.6 2.6 6 6 6c2 0 3.2 1.3 4 2.4C10.8 7.3 12 6 14 6c3.4 0 4.7 3.6 3.2 6.5C19 16.65 12 21 12 21z" fill="#EC6F9C" />
                </svg>
              </div>
              <h3>Detalles para cada ocasión</h3>
              <p>Cumpleaños, San Valentín, graduaciones o un "solo porque sí". Tenemos el regalo ideal.</p>
            </div>
            <div className="card reveal">
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 8h14l-1 11a2 2 0 01-2 2H8a2 2 0 01-2-2L5 8z" fill="#EC6F9C" />
                  <path d="M9 8a3 3 0 116 0" stroke="#C04F7E" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <h3>Atención cercana</h3>
              <p>Te ayudamos a elegir el detalle perfecto con una sonrisa y trato amable.</p>
            </div>
            <div className="card reveal">
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="3" width="16" height="18" rx="2" fill="#EC6F9C" />
                  <rect x="7" y="6" width="10" height="2" rx="1" fill="#fff" />
                  <rect x="7" y="10" width="10" height="2" rx="1" fill="#fff" />
                  <rect x="7" y="14" width="6" height="2" rx="1" fill="#fff" />
                </svg>
              </div>
              <h3>Negocio ordenado</h3>
              <p>Inventario y ventas con sistema digital de punto de venta y códigos QR.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section className="block alt" id="productos">
        <div className="wrap">
          <p className="eyebrow reveal">Lo que encontrarás</p>
          <h2 className="title reveal">Para todos los gustos</h2>
          <p className="sub reveal">Una gran variedad de productos que se renueva constantemente.</p>
          <div className="cats reveal">
            <span className="chip">🧸 Peluches</span>
            <span className="chip">🎁 Regalos</span>
            <span className="chip">🎈 Fiesta</span>
            <span className="chip">💄 Accesorios</span>
            <span className="chip">🏠 Hogar</span>
            <span className="chip">✏️ Papelería</span>
            <span className="chip">📿 Bisutería</span>
            <span className="chip">🍭 Dulces</span>
            <span className="chip">💝 San Valentín</span>
            <span className="chip">✨ Novedades</span>
          </div>
          <div className="center reveal">
            <Link to="/tienda" className="btn">Ver catálogo completo →</Link>
          </div>
        </div>
      </section>

      {/* JÓVENES CONSTRUYENDO EL FUTURO */}
      <section className="block jcf" id="jovenes">
        <div className="wrap jcf-grid">
          <div>
            <p className="eyebrow left">Comprometidos con la comunidad</p>
            <h2 className="jcf-h">
              Formamos a jóvenes con el programa <span>Jóvenes Construyendo el Futuro</span>
            </h2>
            <p className="jcf-p">
              En Caprichitos capacitamos a jóvenes aprendices en un oficio real: atención al cliente, ventas y manejo
              de tecnología. Les damos herramientas para su primer empleo.
            </p>
            {[
              ['Atención al cliente', 'Aprenden a recibir, asesorar y atender con amabilidad.'],
              ['Tecnología y ventas', 'Manejan un sistema de punto de venta y escáner de códigos QR.'],
              ['Control de inventario', 'Aprenden a cuidar la mercancía y manejar dinero con responsabilidad.'],
              ['Habilidades para la vida', 'Disciplina, organización, puntualidad y trabajo en equipo.'],
            ].map(([t, d]) => (
              <div className="check" key={t}>
                <div className="dot">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <b>{t}</b>
                  <span>{d}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="panel reveal">
            <div className="stats">
              <div className="stat"><div className="num">12</div><span>meses de capacitación</span></div>
              <div className="stat"><div className="num">100%</div><span>práctica real</span></div>
              <div className="stat"><div className="num">+10</div><span>habilidades</span></div>
            </div>
            <p className="panel-note">
              Un espacio seguro y ordenado donde cada joven aprende un oficio digno y desarrolla confianza para su
              futuro laboral. 💗
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-wrap">
        <div className="cta-final reveal" id="contacto">
          <h2>¿Buscas el regalo perfecto?</h2>
          <p>Visítanos o explora nuestro catálogo en línea. Tenemos novedades cada semana.</p>
          <Link to="/tienda" className="btn">🛍️ Ver catálogo</Link>
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
            <a href="#jovenes">Jóvenes</a>
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
.lp{--bg:#FFF8FB;--text:#4A3F4A;--muted:#9B8A95;--pink:#EC6F9C;--pinkBright:#F072A0;--pinkDeep:#C04F7E;--blue:#8FBEEC;--card1:#FDE7F0;--card2:#FCD7E6;--border:#F4DEEA;--green:#5FB98E;--display:'Quicksand',sans-serif;--body:'Nunito',sans-serif;font-family:var(--body);color:var(--text);background:var(--bg);line-height:1.6}
.lp *{box-sizing:border-box}
.lp a{text-decoration:none;color:inherit}
.lp h1,.lp h2,.lp h3{font-family:var(--display);font-weight:700;color:var(--pinkDeep);line-height:1.15;margin:0}
.lp .wrap{max-width:1080px;margin:0 auto;padding:0 22px}
@keyframes lpFadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
.lp .reveal{opacity:0}
.lp .reveal.in{animation:lpFadeUp .7s ease forwards}
.lp nav{position:sticky;top:0;z-index:20;background:rgba(255,248,251,.82);backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}
.lp .nav-in{display:flex;align-items:center;gap:14px;padding:14px 0}
.lp .logo{width:46px;height:46px;flex:none;border-radius:15px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#F58FB4,var(--blue));box-shadow:0 6px 16px rgba(236,111,156,.34)}
.lp .logo.small{width:40px;height:40px;border-radius:13px}
.lp .brand{font-family:var(--display);font-weight:700;font-size:22px;color:var(--pinkDeep);line-height:1}
.lp .brand small{display:block;font-family:var(--body);font-weight:600;font-size:12px;color:var(--muted);letter-spacing:.5px}
.lp .nav-links{margin-left:auto;display:flex;gap:26px;align-items:center}
.lp .nav-links a{font-weight:600;font-size:15px;color:var(--text);opacity:.8;transition:.2s}
.lp .nav-links a:hover{opacity:1;color:var(--pinkDeep)}
.lp .btn{display:inline-flex;align-items:center;gap:8px;font-family:var(--display);font-weight:600;font-size:15px;padding:11px 20px;border-radius:14px;background:linear-gradient(135deg,var(--pinkBright),var(--pink));color:#fff;box-shadow:0 6px 16px rgba(236,111,156,.34);transition:.2s;cursor:pointer;border:none}
.lp .btn:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(236,111,156,.4);color:#fff}
.lp .btn.ghost{background:#fff;color:var(--pinkDeep);box-shadow:0 4px 18px rgba(236,111,156,.12);border:1px solid var(--border)}
@media(max-width:720px){.lp .nav-links a:not(.btn){display:none}}
.lp .hero{position:relative;overflow:hidden;padding:64px 0 70px;background:linear-gradient(180deg,#FDE7F0 0%,#EAF3FD 100%)}
.lp .hero .wrap{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center}
.lp .pill{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--border);color:var(--pinkDeep);font-weight:700;font-size:13px;padding:7px 14px;border-radius:999px;box-shadow:0 4px 18px rgba(236,111,156,.12)}
.lp .hero h1{font-size:46px;margin:18px 0 16px}
.lp .hero h1 span{background:linear-gradient(135deg,var(--pinkBright),var(--pinkDeep));-webkit-background-clip:text;background-clip:text;color:transparent}
.lp .hero p.lead{font-size:18px;color:var(--text);opacity:.85;max-width:520px}
.lp .hero-cta{display:flex;gap:14px;margin-top:28px;flex-wrap:wrap}
.lp .hero-art{position:relative;height:360px}
.lp .blob{position:absolute;border-radius:42% 58% 60% 40%/45% 45% 55% 55%;filter:blur(2px)}
.lp .blob.b1{width:280px;height:280px;background:linear-gradient(135deg,#F58FB4,var(--pink));right:10%;top:8%;animation:lpFloat 7s ease-in-out infinite}
.lp .blob.b2{width:170px;height:170px;background:linear-gradient(135deg,var(--blue),#BFE0FF);left:6%;bottom:0;animation:lpFloat 9s ease-in-out infinite reverse}
@keyframes lpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
.lp .gift{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2}
.lp .gift svg{width:170px;height:170px;filter:drop-shadow(0 18px 30px rgba(192,79,126,.28))}
@media(max-width:860px){.lp .hero .wrap{grid-template-columns:1fr}.lp .hero-art{display:none}.lp .hero h1{font-size:36px}}
.lp section.block{padding:72px 0}
.lp section.block.alt{background:linear-gradient(180deg,#FDF0F6,#FFF8FB)}
.lp .eyebrow{text-align:center;color:var(--pink);font-weight:700;letter-spacing:1.5px;text-transform:uppercase;font-size:13px;margin:0}
.lp .eyebrow.left{text-align:left}
.lp .title{text-align:center;font-size:34px;margin:8px 0 12px}
.lp .sub{text-align:center;color:var(--muted);max-width:620px;margin:0 auto 44px;font-size:17px}
.lp .center{text-align:center;margin-top:40px}
.lp .grid{display:grid;gap:22px}
.lp .g3{grid-template-columns:repeat(3,1fr)}
@media(max-width:860px){.lp .g3{grid-template-columns:repeat(2,1fr)}}
@media(max-width:520px){.lp .g3{grid-template-columns:1fr}}
.lp .card{background:#fff;border:1px solid var(--border);border-radius:22px;padding:26px;box-shadow:0 4px 18px rgba(236,111,156,.12);transition:.25s}
.lp .card:hover{transform:translateY(-5px);box-shadow:0 14px 36px rgba(236,111,156,.2)}
.lp .ico{width:54px;height:54px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;background:linear-gradient(135deg,var(--card1),var(--card2))}
.lp .ico svg{width:28px;height:28px}
.lp .card h3{font-size:19px;margin-bottom:7px}
.lp .card p{color:var(--muted);font-size:15px}
.lp .cats{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;max-width:760px;margin:0 auto}
.lp .chip{background:#fff;border:1px solid var(--border);border-radius:999px;padding:11px 20px;font-weight:600;color:var(--pinkDeep);box-shadow:0 4px 18px rgba(236,111,156,.1);transition:.2s}
.lp .chip:hover{background:linear-gradient(135deg,var(--pinkBright),var(--pink));color:#fff;transform:translateY(-3px)}
.lp .jcf{background:linear-gradient(180deg,#FFF 0%,#FDF0F6 100%)}
.lp .jcf-grid{display:grid;grid-template-columns:1fr 1fr;gap:46px;align-items:center}
@media(max-width:860px){.lp .jcf-grid{grid-template-columns:1fr}}
.lp .jcf-h{font-size:32px;margin:8px 0 18px}
.lp .jcf-h span{color:var(--pink)}
.lp .jcf-p{color:var(--muted);margin-bottom:26px;font-size:16px}
.lp .check{display:flex;gap:14px;margin-bottom:18px}
.lp .check .dot{width:30px;height:30px;flex:none;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center}
.lp .check .dot svg{width:16px;height:16px}
.lp .check b{font-family:var(--display);color:var(--pinkDeep)}
.lp .check span{display:block;color:var(--muted);font-size:15px}
.lp .panel{background:#fff;border:1px solid var(--border);border-radius:24px;padding:34px;box-shadow:0 12px 40px rgba(236,111,156,.18)}
.lp .panel-note{margin-top:26px;color:var(--muted);font-size:15px;text-align:center;border-top:1px dashed var(--border);padding-top:22px}
.lp .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;text-align:center}
@media(max-width:520px){.lp .stats{grid-template-columns:1fr}}
.lp .stat .num{font-family:var(--display);font-weight:700;font-size:40px;background:linear-gradient(135deg,var(--pinkBright),var(--pinkDeep));-webkit-background-clip:text;background-clip:text;color:transparent}
.lp .stat span{color:var(--muted);font-weight:600}
.lp .cta-wrap{padding:30px 0 72px}
.lp .cta-final{margin:0 22px;border-radius:30px;padding:60px 30px;text-align:center;background:linear-gradient(135deg,var(--pinkBright),var(--pinkDeep));color:#fff;max-width:1036px;margin-left:auto;margin-right:auto}
.lp .cta-final h2{color:#fff;font-size:34px;margin-bottom:12px}
.lp .cta-final p{opacity:.92;max-width:520px;margin:0 auto 26px;font-size:17px}
.lp .cta-final .btn{background:#fff;color:var(--pinkDeep)}
.lp footer{padding:48px 0 36px;text-align:center;color:var(--muted)}
.lp .foot-brand{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:14px}
.lp .foot-links{display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin:14px 0}
.lp .foot-links a{font-weight:600;color:var(--pinkDeep)}
.lp .foot-mail{font-size:14px}
.lp .foot-copy{font-size:13px;margin-top:10px;opacity:.8}
`
