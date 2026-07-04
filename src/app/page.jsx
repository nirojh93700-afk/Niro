import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import NewArrivalsToast from "@/components/NewArrivalsToast";
import { getProductBySlug } from "@/lib/products";
import { getSettings, getRatingSummaries } from "@/lib/stock";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const CATEGORY_DEFAULTS = [
  { slug: "bijoux", label: "Bijoux", sub: "Colliers & bracelets gravés", image: getProductBySlug("collier-medaillon-coeur-ouvrable").images[0] },
  { slug: "mariage", label: "Mariage & Réception", sub: "Numéros de table, menus, ronds de serviette", image: getProductBySlug("menu-de-mariage-bois-grave").images[0] },
  { slug: "cadeaux", label: "Cadeaux & Accessoires", sub: "Clés USB, porte-clés, médaillons", image: getProductBySlug("cle-usb-personnalisee").images[0] },
  { slug: "verres", label: "Verres gravés", sub: "Whisky personnalisé, gravure photo & logo", image: "/produits/verre_a_whisky_card.jpg" },
  { slug: "deco", label: "Déco & Maison", sub: "Lampes, cristal 3D, couverts", image: getProductBySlug("lampe-led-paris-saint-germain").images[0] },
];

const ATELIER_DEFAULTS = {
  eyebrow: "L'atelier",
  title: "Le savoir-faire de la gravure laser",
  text1: "Chez Niv Création, chaque pièce est dessinée puis gravée ou découpée au laser dans notre atelier. Bois noble, acier inoxydable, acrylique : nous sélectionnons des matériaux durables pour des créations qui traversent le temps.",
  text2: "La personnalisation est au cœur de notre métier. Prénoms, dates, messages, photos gravées… nous transformons vos idées en objets chargés de sens.",
  image: getProductBySlug("ronds-de-serviette-bois").images[0],
};

// Repli si aucun produit n'est coché « mis en avant » dans l'admin.
const FEATURED_FALLBACK = [
  "arbre-de-vie-lumineux",
  "veilleuse-arbre-de-vie-ronde",
  "couverts-enfants-personnalises",
  "lampe-led-paris-saint-germain",
  "verre-a-whisky-fete-des-peres",
  "collier-medaillon-coeur-ouvrable",
  "numero-table-arches-bohemes",
  "ronds-de-serviette-bois",
];

function pick(v, def) {
  return v && String(v).trim() ? v : def;
}

export default async function HomePage() {
  let s = null;
  try { s = await getSettings(); } catch { /* défauts */ }
  const ratings = await getRatingSummaries().catch(() => ({}));

  // Produits mis en avant : ceux cochés « ⭐ mis en avant » dans l'admin,
  // sinon une sélection par défaut. (Repli sûr sur le code.)
  const catalog = await getCatalog().catch(() => []);
  const flagged = catalog.filter((p) => p.featured);
  const featured = (flagged.length
    ? flagged
    : FEATURED_FALLBACK.map((sl) => catalog.find((p) => p.slug === sl) || getProductBySlug(sl)).filter(Boolean)
  ).slice(0, 8);

  const cats = CATEGORY_DEFAULTS.map((c, i) => ({
    ...c,
    label: pick(s?.categories?.[i]?.label, c.label),
    sub: pick(s?.categories?.[i]?.sub, c.sub),
    image: pick(s?.categories?.[i]?.image, c.image),
  }));
  const atelier = {
    eyebrow: pick(s?.atelier?.eyebrow, ATELIER_DEFAULTS.eyebrow),
    title: pick(s?.atelier?.title, ATELIER_DEFAULTS.title),
    text1: pick(s?.atelier?.text1, ATELIER_DEFAULTS.text1),
    text2: pick(s?.atelier?.text2, ATELIER_DEFAULTS.text2),
    image: pick(s?.atelier?.image, ATELIER_DEFAULTS.image),
  };
  const show = { categories: true, trust: true, featured: true, atelier: true, newArrivals: true, ...(s?.sections || {}) };
  // Nouveautés : TOUS les produits taggés « Nouveau » (les plus récents d'abord).
  const newProducts = catalog.filter((p) => p.badge === "Nouveau").reverse().slice(0, 8);
  // Pour la petite fenêtre flottante.
  const newItems = newProducts.map((p) => ({ slug: p.slug, name: p.name, image: p.cardImage || p.images?.[0] || "" }));

  return (
    <>
      {/* HERO — Cristal Photo 3D (produit phare) */}
      <section className="cr-hero">
        <style>{`
          .cr-hero{position:relative;overflow:hidden;background:
            radial-gradient(90% 120% at 88% 12%, rgba(61,120,152,.30), transparent 55%),
            radial-gradient(80% 100% at 6% 100%, rgba(201,162,75,.20), transparent 55%),
            linear-gradient(160deg,#0e151d,#05070a 70%);color:#f3efe6}
          .cr-wrap{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:24px;padding:clamp(30px,5vw,60px) clamp(20px,5vw,48px)}
          @media(max-width:840px){.cr-wrap{grid-template-columns:1fr;text-align:center}}
          .cr-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.74rem;letter-spacing:.22em;text-transform:uppercase;color:#e2c67e;border:1px solid rgba(201,162,75,.35);border-radius:999px;padding:7px 14px;margin-bottom:20px}
          .cr-dot{width:6px;height:6px;border-radius:50%;background:#c9a24b;animation:crpulse 2.4s infinite}
          @keyframes crpulse{0%{box-shadow:0 0 0 0 rgba(201,162,75,.55)}70%{box-shadow:0 0 0 10px rgba(201,162,75,0)}100%{box-shadow:0 0 0 0 rgba(201,162,75,0)}}
          .cr-hero h1{font-family:Georgia,serif;font-weight:600;font-size:clamp(2.1rem,5.5vw,3.6rem);line-height:1.05;letter-spacing:-.015em;margin:0 0 16px;color:#fff}
          .cr-shine{background:linear-gradient(92deg,#fff 20%,#e2c67e 45%,#fff 70%);-webkit-background-clip:text;background-clip:text;color:transparent}
          .cr-lede{color:#b9c2cc;font-size:clamp(1rem,2.2vw,1.14rem);max-width:46ch;margin:0 0 26px;line-height:1.6}
          @media(max-width:840px){.cr-lede{margin-left:auto;margin-right:auto}}
          .cr-cta{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
          @media(max-width:840px){.cr-cta{justify-content:center}}
          .cr-btn{border-radius:14px;padding:15px 28px;font-weight:700;font-size:1rem;text-decoration:none;background:linear-gradient(135deg,#c9a24b,#e2c67e);color:#1a1206;box-shadow:0 10px 30px rgba(201,162,75,.28);transition:transform .15s}
          .cr-btn:hover{transform:translateY(-2px)}
          .cr-link2{color:#e7edf2;text-decoration:none;font-size:.96rem;border-bottom:1px solid rgba(255,255,255,.3);padding-bottom:2px}
          .cr-badges{display:flex;gap:18px;flex-wrap:wrap;margin-top:26px;color:#8f9aa5;font-size:.8rem}
          @media(max-width:840px){.cr-badges{justify-content:center}}
          .cr-badges b{color:#cfd6dd;font-weight:600}
          .cr-viz{position:relative;display:grid;place-items:center;min-height:300px}
          .cr-halo{position:absolute;width:74%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(120,180,220,.35),rgba(201,162,75,.12) 45%,transparent 66%);filter:blur(18px);animation:crbreathe 5s ease-in-out infinite}
          @keyframes crbreathe{0%,100%{transform:scale(.96);opacity:.75}50%{transform:scale(1.05);opacity:1}}
          .cr-shot{position:relative;width:min(400px,82%);border-radius:18px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.6);animation:crfloat 6s ease-in-out infinite;-webkit-mask-image:radial-gradient(120% 120% at 50% 40%,#000 72%,transparent 100%);mask-image:radial-gradient(120% 120% at 50% 40%,#000 72%,transparent 100%)}
          .cr-shot img{display:block;width:100%;height:auto}
          @keyframes crfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
          @media(prefers-reduced-motion:reduce){.cr-shot,.cr-halo,.cr-dot{animation:none}}
        `}</style>
        <div className="cr-wrap">
          <div>
            <span className="cr-eyebrow"><span className="cr-dot"></span> Nouveau · Fait main en France</span>
            <h1>Votre photo,<br/><span className="cr-shine">sculptée dans le cristal.</span></h1>
            <p className="cr-lede">Gravure photo 3D au cœur d&apos;un cristal K9, réalisée dans notre atelier. Un cadeau qui capte la lumière — et l&apos;émotion.</p>
            <div className="cr-cta">
              <Link href="/produit/cristal-photo-3d-vertical" className="cr-btn">Créer mon cristal →</Link>
              <Link href="/boutique?cat=deco" className="cr-link2">Voir les tailles &amp; prix</Link>
            </div>
            <div className="cr-badges">
              <span>🇫🇷 <b>Gravé en France</b></span>
              <span>💎 <b>Cristal K9</b> premium</span>
              <span>🚚 <b>Livraison suivie</b></span>
            </div>
          </div>
          <div className="cr-viz">
            <div className="cr-halo"></div>
            <div className="cr-shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/produits/cristal-v-bebe.jpg" alt="Cristal photo 3D personnalisé" />
            </div>
          </div>
        </div>
      </section>

      {/* BANNIÈRE COUPE DU MONDE 2026 */}
      <Link href="/coupe-du-monde" style={{ display: "block", textDecoration: "none" }}>
        <div style={{ background: "linear-gradient(135deg,#0a1a3f 0%,#12275c 55%,#1c1206 100%)", color: "#f4e6c2", padding: "26px 18px", textAlign: "center" }}>
          <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>⚽ 🏆 ⭐</div>
          <strong style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.3rem,4.5vw,1.9rem)", display: "block" }}>Spécial Coupe du Monde 2026</strong>
          <span style={{ color: "#e7ddc7", fontSize: "0.98rem" }}>Déco en bois aux couleurs de votre nation →</span>
        </div>
      </Link>

      {/* NOUVEAUTÉS — alimenté automatiquement par le badge « Nouveau » */}
      {show.newArrivals && newProducts.length > 0 && (
        <section className="section new-arrivals" style={{ background: "linear-gradient(180deg,#fbf4e6 0%,#fffdf9 65%)", borderTop: "1px solid #efe2c2" }}>
          <div className="container">
            <div className="section-head">
              <span className="eyebrow" style={{ color: "var(--gold-dark)" }}>✦ Vient d'arriver</span>
              <h2>Nos nouveautés</h2>
              <p>Les dernières créations sorties de notre atelier — à découvrir en avant-première.</p>
            </div>
            <div className="product-grid">
              {newProducts.map((p) => { const r = ratings[p.slug]; const mk = Number(s?.refMarkup) > 0; return (<ProductCard key={p.slug} product={{ ...p, ...(mk ? { refMarkup: Number(s.refMarkup) } : {}), ...(r ? { rating: r } : {}) }} />); })}
            </div>
            <div style={{ textAlign: "center", marginTop: 34 }}>
              <Link href="/boutique" className="btn btn-gold">Découvrir toutes les nouveautés</Link>
            </div>
          </div>
        </section>
      )}

      {/* CATÉGORIES */}
      {show.categories && (
        <section className="section" id="collections">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Nos univers</span>
              <h2>Explorez nos collections</h2>
              <p>Nos familles de créations, une même exigence : la personnalisation soignée.</p>
            </div>
            <div className="cat-grid">
              {cats.map((cat) => (
                <Link href={`/boutique?cat=${cat.slug}`} key={cat.slug} className="cat-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cat.image} alt={cat.label} width={500} height={650} />
                  <div className="cat-overlay">
                    <h3>{cat.label}</h3>
                    <span>{cat.sub}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BANDEAU CONFIANCE */}
      {show.trust && (
        <section className="trust">
          <div className="container trust-grid">
            <div className="trust-item"><span>🇫🇷</span><strong>Personnalisé en France</strong><small>Atelier français · gravure laser</small></div>
            <div className="trust-item"><span>✦</span><strong>Sur mesure</strong><small>Gravure & découpe laser de précision</small></div>
            <div className="trust-item"><span>🔒</span><strong>Paiement sécurisé</strong><small>Carte bancaire via Stripe</small></div>
            <div className="trust-item"><span>💌</span><strong>Cadeau idéal</strong><small>Une attention qui marque les esprits</small></div>
          </div>
        </section>
      )}

      {/* PRODUITS PHARES */}
      {show.featured && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Coups de cœur</span>
              <h2>Nos créations phares</h2>
              <p>Une sélection de pièces appréciées, prêtes à être personnalisées pour vous.</p>
            </div>
            <div className="product-grid">
              {featured.map((p) => { const r = ratings[p.slug]; const mk = Number(s?.refMarkup) > 0; return (<ProductCard key={p.slug} product={{ ...p, ...(mk ? { refMarkup: Number(s.refMarkup) } : {}), ...(r ? { rating: r } : {}) }} />); })}
            </div>
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Link href="/boutique" className="btn btn-primary">Voir toute la boutique</Link>
            </div>
          </div>
        </section>
      )}

      {/* ATELIER */}
      {show.atelier && (
        <section className="section" id="atelier" style={{ background: "var(--paper)" }}>
          <div className="container hero-grid">
            <div className="hero-visual">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={atelier.image} alt="L'atelier Niv Création" width={700} height={700} />
            </div>
            <div>
              <span className="hero-eyebrow">{atelier.eyebrow}</span>
              <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.5rem)", marginTop: 0 }}>{atelier.title}</h2>
              <p style={{ color: "var(--ink-soft)" }}>{atelier.text1}</p>
              <p style={{ color: "var(--ink-soft)" }} id="personnalisation">{atelier.text2}</p>
              <Link href="/boutique" className="btn btn-outline">Commander une création</Link>
            </div>
          </div>
        </section>
      )}

      {/* SUR MESURE — commande personnalisée bois & déco */}
      <section className="section">
        <div className="container">
          <div
            style={{
              background: "linear-gradient(135deg, #f7efe0, #fbf7ee)",
              border: "1px solid #e7d3a1",
              borderRadius: 18,
              padding: "40px 28px",
              textAlign: "center",
            }}
          >
            <span className="eyebrow">Sur mesure</span>
            <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", margin: "8px 0 10px" }}>
              Une idée précise&nbsp;? Créons-la ensemble
            </h2>
            <p style={{ color: "var(--ink-soft)", maxWidth: 560, margin: "0 auto 22px" }}>
              Objet personnalisé en bois, décoration sur mesure, pièce unique
              pour un mariage ou un cadeau… Contactez-nous directement, par
              e-mail ou par téléphone, et donnons vie à votre projet.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/contact" className="btn btn-gold">Demander un projet sur mesure</Link>
              <a href="tel:+33766153102" className="btn btn-outline">📞 07 66 15 31 02</a>
            </div>
          </div>
        </div>
      </section>
      <NewArrivalsToast items={newItems} />
    </>
  );
}
