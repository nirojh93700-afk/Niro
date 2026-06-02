import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { products, getProductBySlug } from "@/lib/products";

const heroImage = getProductBySlug("numero-table-arches-bohemes").images[0];

const categoryCards = [
  {
    slug: "bijoux",
    label: "Bijoux personnalisés",
    sub: "Colliers & bracelets gravés",
    image: getProductBySlug("collier-medaillon-coeur-ouvrable").images[0],
  },
  {
    slug: "mariage",
    label: "Mariage & Réception",
    sub: "Numéros de table, menus, ronds de serviette",
    image: getProductBySlug("menu-de-mariage-bois-grave").images[0],
  },
  {
    slug: "cadeaux",
    label: "Cadeaux & Décoration",
    sub: "Plaques, objets souvenirs gravés",
    image: getProductBySlug("plaque-de-porte-enfant").images[0],
  },
];

const featured = [
  "collier-medaillon-coeur-ouvrable",
  "numero-table-arches-bohemes",
  "bracelet-homme-cuir-acier",
  "ronds-de-serviette-bois",
  "plaque-de-porte-enfant",
  "menu-de-mariage-bois-grave",
].map(getProductBySlug);

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="hero-eyebrow">Atelier français · gravure laser</span>
            <h1>Des créations uniques, gravées avec émotion.</h1>
            <p>
              Bijoux, décorations de mariage et cadeaux personnalisés, façonnés à
              la main dans notre atelier. Chaque pièce raconte votre histoire.
            </p>
            <div className="hero-cta">
              <Link href="/boutique" className="btn btn-gold">Découvrir la boutique</Link>
              <Link href="/boutique?cat=mariage" className="btn btn-outline">
                Collection mariage
              </Link>
            </div>
            <div className="hero-badges">
              <div className="hero-badge"><span>🪵</span> Fait main en France</div>
              <div className="hero-badge"><span>✦</span> 100% personnalisable</div>
              <div className="hero-badge"><span>🔒</span> Paiement sécurisé</div>
            </div>
          </div>
          <div className="hero-visual">
            <Image src={heroImage} alt="Création Niv Création" width={700} height={700} priority />
          </div>
        </div>
      </section>

      {/* CATÉGORIES */}
      <section className="section" id="collections">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Nos univers</span>
            <h2>Explorez nos collections</h2>
            <p>Trois familles de créations, une même exigence : la personnalisation soignée.</p>
          </div>
          <div className="cat-grid">
            {categoryCards.map((cat) => (
              <Link href={`/boutique?cat=${cat.slug}`} key={cat.slug} className="cat-card">
                <Image src={cat.image} alt={cat.label} width={500} height={650} />
                <div className="cat-overlay">
                  <h3>{cat.label}</h3>
                  <span>{cat.sub}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BANDEAU CONFIANCE */}
      <section className="trust">
        <div className="container trust-grid">
          <div className="trust-item">
            <span>🪵</span>
            <strong>Fabrication artisanale</strong>
            <small>Atelier français, fait main</small>
          </div>
          <div className="trust-item">
            <span>✦</span>
            <strong>Sur mesure</strong>
            <small>Gravure & découpe laser de précision</small>
          </div>
          <div className="trust-item">
            <span>🔒</span>
            <strong>Paiement sécurisé</strong>
            <small>Carte bancaire via Stripe</small>
          </div>
          <div className="trust-item">
            <span>💌</span>
            <strong>Cadeau idéal</strong>
            <small>Une attention qui marque les esprits</small>
          </div>
        </div>
      </section>

      {/* PRODUITS PHARES */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Coups de cœur</span>
            <h2>Nos créations phares</h2>
            <p>Une sélection de pièces appréciées, prêtes à être personnalisées pour vous.</p>
          </div>
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/boutique" className="btn btn-primary">Voir toute la boutique</Link>
          </div>
        </div>
      </section>

      {/* ATELIER */}
      <section className="section" id="atelier" style={{ background: "var(--paper)" }}>
        <div className="container hero-grid">
          <div className="hero-visual">
            <Image
              src={getProductBySlug("ronds-de-serviette-bois").images[0]}
              alt="L'atelier Niv Création"
              width={700}
              height={700}
            />
          </div>
          <div>
            <span className="hero-eyebrow">L'atelier</span>
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.5rem)", marginTop: 0 }}>
              Le savoir-faire de la gravure laser
            </h2>
            <p style={{ color: "var(--ink-soft)" }}>
              Chez Niv Création, chaque pièce est dessinée puis gravée ou découpée
              au laser dans notre atelier. Bois noble, acier inoxydable, acrylique :
              nous sélectionnons des matériaux durables pour des créations qui
              traversent le temps.
            </p>
            <p style={{ color: "var(--ink-soft)" }} id="personnalisation">
              La personnalisation est au cœur de notre métier. Prénoms, dates,
              messages, photos gravées… nous transformons vos idées en objets
              chargés de sens.
            </p>
            <Link href="/boutique" className="btn btn-outline">Commander une création</Link>
          </div>
        </div>
      </section>
    </>
  );
}
