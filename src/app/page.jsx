import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug } from "@/lib/products";
import { getSettings } from "@/lib/stock";

export const dynamic = "force-dynamic";

const HERO_DEFAULTS = {
  eyebrow: "Atelier français · gravure laser",
  title: "Des créations uniques, gravées avec émotion.",
  text: "Bijoux, décorations de mariage et cadeaux personnalisés, façonnés à la main dans notre atelier. Chaque pièce raconte votre histoire.",
  cta1: "Découvrir la boutique",
  cta2: "Collection mariage",
  image: getProductBySlug("numero-table-arches-bohemes").images[0],
};

const CATEGORY_DEFAULTS = [
  { slug: "bijoux", label: "Bijoux personnalisés", sub: "Colliers & bracelets gravés", image: getProductBySlug("collier-medaillon-coeur-ouvrable").images[0] },
  { slug: "mariage", label: "Mariage & Réception", sub: "Numéros de table, menus, ronds de serviette", image: getProductBySlug("menu-de-mariage-bois-grave").images[0] },
  { slug: "cadeaux", label: "Cadeaux & Décoration", sub: "Plaques, objets souvenirs gravés", image: getProductBySlug("plaque-de-porte-enfant").images[0] },
];

const ATELIER_DEFAULTS = {
  eyebrow: "L'atelier",
  title: "Le savoir-faire de la gravure laser",
  text1: "Chez Niv Création, chaque pièce est dessinée puis gravée ou découpée au laser dans notre atelier. Bois noble, acier inoxydable, acrylique : nous sélectionnons des matériaux durables pour des créations qui traversent le temps.",
  text2: "La personnalisation est au cœur de notre métier. Prénoms, dates, messages, photos gravées… nous transformons vos idées en objets chargés de sens.",
  image: getProductBySlug("ronds-de-serviette-bois").images[0],
};

const featured = [
  "collier-medaillon-coeur-ouvrable",
  "numero-table-arches-bohemes",
  "bracelet-homme-cuir-acier",
  "ronds-de-serviette-bois",
  "plaque-de-porte-enfant",
  "menu-de-mariage-bois-grave",
].map(getProductBySlug);

function pick(v, def) {
  return v && String(v).trim() ? v : def;
}

export default async function HomePage() {
  let s = null;
  try { s = await getSettings(); } catch { /* défauts */ }

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
              <Link href="/boutique?cat=mariage" className="btn btn-outline">{hero.cta2}</Link>
            </div>
            <div className="hero-badges">
              <div className="hero-badge"><span>🪵</span> Fait main en France</div>
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
            <div className="trust-item"><span>🪵</span><strong>Fabrication artisanale</strong><small>Atelier français, fait main</small></div>
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
              {featured.map((p) => (<ProductCard key={p.slug} product={p} />))}
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
    </>
  );
}
