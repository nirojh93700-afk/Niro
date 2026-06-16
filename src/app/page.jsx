import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug } from "@/lib/products";
import { getSettings, getRatingSummaries } from "@/lib/stock";

export const dynamic = "force-dynamic";

const HERO_DEFAULTS = {
  eyebrow: "Atelier français · gravure laser",
  title: "Des créations uniques, gravées avec émotion.",
  text: "Bijoux, décorations de mariage et cadeaux personnalisés, gravés dans notre atelier. Chaque pièce raconte votre histoire.",
  cta1: "Découvrir la boutique",
  cta2: "Idées cadeaux",
  image: "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/jewelry-natural-1.jpg?v=1774981669",
};

const CATEGORY_DEFAULTS = [
  { slug: "bijoux", label: "Bijoux personnalisés", sub: "Colliers & bracelets gravés", image: getProductBySlug("collier-medaillon-coeur-ouvrable").images[0] },
  { slug: "mariage", label: "Mariage & Réception", sub: "Numéros de table, menus, ronds de serviette", image: getProductBySlug("menu-de-mariage-bois-grave").images[0] },
  { slug: "cadeaux", label: "Cadeaux & Décoration", sub: "Plaques, objets souvenirs gravés", image: getProductBySlug("plaque-de-porte-enfant").images[0] },
  { slug: "verres", label: "Verres gravés", sub: "Whisky personnalisé, gravure photo & logo", image: "/produits/verre_a_whisky_card.jpg" },
];

const ATELIER_DEFAULTS = {
  eyebrow: "L'atelier",
  title: "Le savoir-faire de la gravure laser",
  text1: "Chez Niv Création, chaque pièce est dessinée puis gravée ou découpée au laser dans notre atelier. Bois noble, acier inoxydable, acrylique : nous sélectionnons des matériaux durables pour des créations qui traversent le temps.",
  text2: "La personnalisation est au cœur de notre métier. Prénoms, dates, messages, photos gravées… nous transformons vos idées en objets chargés de sens.",
  image: getProductBySlug("ronds-de-serviette-bois").images[0],
};

const featured = [
  "verre-a-whisky-fete-des-peres",
  "collier-medaillon-coeur-ouvrable",
  "numero-table-arches-bohemes",
  "bracelet-homme-cuir-acier",
  "ronds-de-serviette-bois",
  "plaque-de-porte-enfant",
].map(getProductBySlug).filter(Boolean);

function pick(v, def) {
  return v && String(v).trim() ? v : def;
}

export default async function HomePage() {
  let s = null;
  try { s = await getSettings(); } catch { /* défauts */ }
  const ratings = await getRatingSummaries().catch(() => ({}));

  const hero = {
    eyebrow: pick(s?.hero?.eyebrow, HERO_DEFAULTS.eyebrow),
    title: pick(s?.hero?.title, HERO_DEFAULTS.title),
    text: pick(s?.hero?.text, HERO_DEFAULTS.text),
    cta1: pick(s?.hero?.cta1, HERO_DEFAULTS.cta1),
    cta2: pick(s?.hero?.cta2, HERO_DEFAULTS.cta2),
    image: pick(s?.hero?.image, HERO_DEFAULTS.image),
  };
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
  const show = { categories: true, trust: true, featured: true, atelier: true, ...(s?.sections || {}) };

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="hero-eyebrow">{hero.eyebrow}</span>
            <h1>{hero.title}</h1>
            <p>{hero.text}</p>
            <div className="hero-cta">
              <Link href="/boutique" className="btn btn-gold">{hero.cta1}</Link>
              <Link href="/boutique?cat=bijoux" className="btn btn-outline">{hero.cta2}</Link>
            </div>
            <div className="hero-badges">
              <div className="hero-badge"><span>🇫🇷</span> Personnalisé en France</div>
              <div className="hero-badge"><span>✦</span> 100% personnalisable</div>
              <div className="hero-badge"><span>🔒</span> Paiement sécurisé</div>
            </div>
          </div>
          <div className="hero-visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero.image} alt="Création Niv Création" width={700} height={700} />
          </div>
        </div>
      </section>

      {/* CATÉGORIES */}
      {show.categories && (
        <section className="section" id="collections">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Nos univers</span>
              <h2>Explorez nos collections</h2>
              <p>Trois familles de créations, une même exigence : la personnalisation soignée.</p>
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
    </>
  );
}
