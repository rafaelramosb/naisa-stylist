import Link from "next/link";
import { Brand } from "@/components/Brand";
import { HeroArt } from "@/components/HeroArt";
import { Icon } from "@/components/Icon";
import { OCCASIONS } from "@/lib/occasions";
import { VideoShowcase } from "@/components/VideoShowcase";
import { VIDEO_HISTORIA } from "@/lib/videos";
import { PLAN_FEATURES, PRICES, formatCOP } from "@/lib/plans";

export default function Landing() {
  const yearlyMonthly = Math.round(PRICES.yearly / 12);
  const savings = Math.round((1 - PRICES.yearly / (PRICES.monthly * 12)) * 100);
  return (
    <>
      <header className="site-header">
        <div className="container">
          <Brand />
          <nav className="nav-links" aria-label="Principal">
            <a href="#video" className="hide-m">Ver video</a>
            <Link href="/como-funciona" className="hide-m">Cómo funciona</Link>
            <a href="#precios" className="hide-m">Precios</a>
            <Link href="/descargar" className="hide-m">App Android</Link>
            <Link href="/ingresar" className="btn btn-sm">Entrar</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="stack" style={{ "--gap": "22px" } as React.CSSProperties}>
              <span className="eyebrow">Por NAISA BALLESTEROS · Alta costura colombiana</span>
              <h1>Tu estilista de protocolo, <em>con lo que ya tienes</em> en el clóset.</h1>
              <p className="muted" style={{ fontSize: "1.1rem", maxWidth: 540 }}>
                Fotografía tus prendas, sube una foto de cuerpo completo y dinos a dónde vas. En menos de 5 segundos
                recibes 3 outfits con su porcentaje de compatibilidad y consejos de estilismo para tu silueta.
              </p>
              <div className="row">
                <Link href="/ingresar?modo=registro" className="btn btn-gold">Empieza gratis <Icon name="arrow" size={18} /></Link>
                <a href="#video" className="btn btn-ghost"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg> Ver cómo funciona</a>
              </div>
              <div className="row small muted" style={{ "--gap": "18px" } as React.CSSProperties}>
                <span className="row" style={{ "--gap": "6px" } as React.CSSProperties}><Icon name="shield" size={16} /> Fotos privadas y cifradas</span>
                <span className="row" style={{ "--gap": "6px" } as React.CSSProperties}><Icon name="bolt" size={16} /> Respuesta &lt; 5 s</span>
                <span className="row" style={{ "--gap": "6px" } as React.CSSProperties}><Icon name="check" size={16} /> Sin anuncios</span>
              </div>
            </div>
            <div className="hero-visual"><HeroArt /></div>
          </div>
        </section>

        <section className="section" id="video">
          <div className="container stack" style={{ "--gap": "32px" } as React.CSSProperties}>
            <div className="stack" style={{ maxWidth: 680 }}>
              <span className="eyebrow">Mírala en acción · 31 segundos</span>
              <h2>De &ldquo;no tengo qué ponerme&rdquo; a llegar perfecta</h2>
              <p className="muted">Acompaña a Valentina la noche antes de la boda de su mejor amiga: una foto, su clóset y la ocasión. Toca cualquier paso para verlo.</p>
            </div>
            <VideoShowcase video={VIDEO_HISTORIA} autoPreview />
            <div className="row">
              <Link href="/ingresar?modo=registro" className="btn btn-gold">Probarlo gratis <Icon name="arrow" size={18} /></Link>
              <Link href="/como-funciona" className="link small">Más videos y la guía paso a paso</Link>
            </div>
          </div>
        </section>

        <section className="section section-alt" id="como-funciona">
          <div className="container stack" style={{ "--gap": "32px" } as React.CSSProperties}>
            <div className="stack" style={{ maxWidth: 640 }}>
              <span className="eyebrow">Cómo funciona</span>
              <h2>De la foto al look perfecto en tres pasos</h2>
            </div>
            <div className="grid grid-3">
              {[
                { icon: "camera", t: "1. Escanea tu clóset", d: "Toma una foto (incluso varias prendas a la vez). La IA reconoce tipo, color, tejido, corte y nivel de formalidad." },
                { icon: "body", t: "2. Conoce tu silueta", d: "Con una foto de cuerpo completo analizamos proporciones y te decimos qué cortes te favorecen. Puedes no guardar la foto." },
                { icon: "sparkle", t: "3. Elige la ocasión", d: "Entrevista, matrimonio, gala o reunión. Recibes 3 outfits con % de compatibilidad, protocolo y la pieza que te falta." },
              ].map((f) => (
                <div key={f.t} className="card feature">
                  <div className="feature-icon"><Icon name={f.icon} /></div>
                  <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
                    <h3>{f.t}</h3>
                    <p className="muted small">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container stack" style={{ "--gap": "28px" } as React.CSSProperties}>
            <div className="stack" style={{ maxWidth: 680 }}>
              <span className="eyebrow">Protocolo real, no tendencias genéricas</span>
              <h2>Cada ocasión tiene reglas. Nosotros las conocemos.</h2>
              <p className="muted">Ninguna otra app de clóset resuelve el código de vestimenta. NAISA Stylist IA verifica cada outfit contra el protocolo del evento, tu silueta, la armonía de color y tu estilo personal.</p>
            </div>
            <div className="grid grid-3">
              {OCCASIONS.filter((o) => o.id !== "dia_casual").map((o) => (
                <div key={o.id} className="card stack" style={{ "--gap": "10px" } as React.CSSProperties}>
                  <div className="row between">
                    <span className="pill">{o.group}</span>
                    <Icon name={o.icon} />
                  </div>
                  <h3>{o.label}</h3>
                  <p className="small muted">{o.protocol[0]}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-alt">
          <div className="container grid grid-2" style={{ alignItems: "center", "--gap": "40px" } as React.CSSProperties}>
            <div className="stack">
              <span className="eyebrow">Compatibilidad explicada</span>
              <h2>Sabes por qué funciona cada look</h2>
              <p className="muted">El porcentaje no es una caja negra. Se compone de cuatro dimensiones que puedes ver en cada outfit. Solo marcamos como &ldquo;recomendado&rdquo; lo que supera el 85%.</p>
            </div>
            <div className="card stack">
              {[
                ["Protocolo del evento", 96, "40%"],
                ["Armonía de color", 92, "25%"],
                ["Silueta y proporciones", 88, "20%"],
                ["Estilo personal", 90, "15%"],
              ].map(([l, v, w]) => (
                <div key={l as string} className="bar" style={{ gridTemplateColumns: "1fr 120px 44px" }}>
                  <span>{l} <span className="tiny">({w})</span></span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${v}%` }} /></div>
                  <strong style={{ color: "var(--mocha)" }}>{v}%</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="precios">
          <div className="container stack" style={{ "--gap": "28px" } as React.CSSProperties}>
            <div className="stack" style={{ textAlign: "center", alignItems: "center" }}>
              <span className="eyebrow">Precios</span>
              <h2>Empieza gratis. Sube a Premium cuando lo necesites.</h2>
              <p className="muted">Pago seguro con Mercado Pago: tarjetas débito y crédito. Cancela cuando quieras.</p>
            </div>
            <div className="grid grid-3">
              <div className="card price-card stack">
                <h3>Esencial</h3>
                <div className="price">Gratis</div>
                <p className="muted small">Para conocer tu estilo</p>
                <ul className="check">{PLAN_FEATURES.free.map((f) => <li key={f}>{f}</li>)}</ul>
                <Link href="/ingresar?modo=registro" className="btn btn-ghost btn-block">Crear cuenta</Link>
              </div>
              <div className="card price-card featured stack">
                <span className="pill pill-gold" style={{ alignSelf: "flex-start" }}>Más elegido</span>
                <h3>Premium anual</h3>
                <div className="price">{formatCOP(PRICES.yearly)}<span className="small muted"> /año</span></div>
                <p className="muted small">Equivale a {formatCOP(yearlyMonthly)} al mes · ahorras {savings}%</p>
                <ul className="check">{PLAN_FEATURES.premium.map((f) => <li key={f}>{f}</li>)}</ul>
                <Link href="/ingresar?modo=registro&plan=yearly" className="btn btn-gold btn-block">Elegir anual</Link>
              </div>
              <div className="card price-card stack">
                <h3>Premium mensual</h3>
                <div className="price">{formatCOP(PRICES.monthly)}<span className="small muted"> /mes</span></div>
                <p className="muted small">Flexibilidad total</p>
                <ul className="check">{PLAN_FEATURES.premium.map((f) => <li key={f}>{f}</li>)}</ul>
                <Link href="/ingresar?modo=registro&plan=monthly" className="btn btn-block">Elegir mensual</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-alt">
          <div className="container grid grid-2" style={{ alignItems: "center" }}>
            <div className="stack">
              <span className="eyebrow">Privacidad primero</span>
              <h2>Tu clóset es tuyo</h2>
              <ul className="check">
                <li>Fotos en almacenamiento privado; solo tú puedes verlas, con enlaces temporales.</li>
                <li>La foto de cuerpo completo se procesa y se descarta si no eliges guardarla.</li>
                <li>Las imágenes se reducen en tu teléfono antes de enviarse.</li>
                <li>Exporta o elimina todos tus datos en un clic (Ley 1581 de 2012).</li>
              </ul>
            </div>
            <div className="card stack" style={{ textAlign: "center", alignItems: "center" }}>
              <Icon name="phone" size={40} />
              <h3>Llévala en tu Android</h3>
              <p className="muted small">Instala la app desde el APK oficial o agrégala a tu pantalla de inicio.</p>
              <Link href="/descargar" className="btn"><Icon name="download" size={18} /> Descargar app</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container row between">
          <span>© {new Date().getFullYear()} NAISA BALLESTEROS · Desarrollado por Virtual Business Society</span>
          <span className="row"><Link href="/privacidad">Privacidad</Link><Link href="/terminos">Términos</Link></span>
        </div>
      </footer>
    </>
  );
}
