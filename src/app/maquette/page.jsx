import Link from "next/link";
import MqHero from "@/components/maquette/MqHero";
import Marquee from "@/components/maquette/Marquee";
import Demo3D from "@/components/maquette/Demo3D";
import Reveal from "@/components/Reveal";
import { getProductBySlug } from "@/lib/products";
import { formatEuro } from "@/lib/format";

export const metadata = { title: "Maquette moderne — Niv Création" };

const heroProduct = getProductBySlug("collier-medaillon-coeur-ouvrable");

const featured = [
  "collier-medaillon-coeur-ouvrable",
  "bracelet-homme-cuir-acier",
  "numero-table-arches-bohemes",
  "ronds-de-serviette-bois",
  "plaque-de-porte-enfant",
  "menu-de-mariage-bois-grave",
].map(getProductBySlug).filter(Boolean);

const cats = [
  { slug: "bijoux", label: "Bijoux", sub: "Colliers & bracelets gravés", image: getProductBySlug("collier-medaillon-coeur-ouvrable").images[0] },
  { slug: "mariage", label: "Mariage", sub: "Menus, numéros, ronds de serviette", image: getProductBySlug("numero-table-arches-bohemes").images[0] },
  { slug: "cadeaux", label: "Cadeaux & Déco", sub: "Plaques & objets souvenirs", image: getProductBySlug("plaque-de-porte-enfant").images[0] },
];

function price(p) {
  return formatEuro(p.variants[0].price);
}

export default function MaquettePage() {
  return (
    <main className="mq-page">
      {/* HERO */}
      <section className="mq-hero">
        <div className="mq-container">
          <MqHero
            image={heroProduct.images[0]}
            productName={heroProduct.name}
            price={price(heroProduct)}
          />
        </div>
      </section>

      {/* BANDEAU DÉFILANT */}
      <Marquee
        items={[
          "Gravure laser de précision",
          "Personnalisé en France",
          "Or, acier & bois noble",
          "Aperçu 3D en direct",
          "Expédition soignée",
          "Pièces uniques",
        ]}
      />

      {/* PRODUITS */}
      <section className="mq-section">
        <div className="mq-container">
          <Reveal className="mq-head">
            <span className="mq-eyebrow">Coups de cœur</span>
            <h2 className="mq-h2">Nos créations phares</h2>
            <p className="mq-sub">Une sélection de pièces appréciées, prêtes à être personnalisées pour vous.</p>
          </Reveal>
          <div className="mq-products">
            {featured.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 3) * 0.08} y={28}>
                <Link href={`/produit/${p.slug}`} className="mq-card">
                  <div className="mq-card-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.cardImage || p.images[0]} alt={p.name} loading="eager" />
                    <span className="mq-card-chip">{p.type}</span>
                  </div>
                  <div className="mq-card-body">
                    <h3>{p.name}</h3>
                    <p>{p.tagline}</p>
                    <div className="mq-card-foot">
                      <span className="mq-card-price">{price(p)}</span>
                      <span className="mq-card-link">Personnaliser →</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SHOWCASE 3D */}
      <section className="mq-section mq-3d-band">
        <div className="mq-container mq-3d-grid">
          <Reveal className="mq-3d-copy">
            <span className="mq-eyebrow mq-eyebrow-light">Nouveau · aperçu 3D</span>
            <h2 className="mq-h2 mq-h2-light">Voyez votre bijou<br />sous toutes ses faces</h2>
            <p className="mq-sub mq-sub-light">
              Avant même de commander, tournez la pièce en 3D temps réel : la
              lumière, l'or, le relief de la gravure — exactement comme dans la
              main. Une expérience d'achat haut de gamme, directement sur le site.
            </p>
            <Link href="/boutique?cat=bijoux" className="mq-btn mq-btn-gold">Explorer les bijoux</Link>
          </Reveal>
          <Reveal className="mq-3d-stage" delay={0.1}>
            <Demo3D height={460} />
          </Reveal>
        </div>
      </section>

      {/* CATÉGORIES */}
      <section className="mq-section">
        <div className="mq-container">
          <Reveal className="mq-head">
            <span className="mq-eyebrow">Nos univers</span>
            <h2 className="mq-h2">Explorez nos collections</h2>
          </Reveal>
          <div className="mq-cats">
            {cats.map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.08} y={28}>
                <Link href={`/boutique?cat=${c.slug}`} className="mq-cat">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt={c.label} loading="eager" />
                  <div className="mq-cat-overlay">
                    <h3>{c.label}</h3>
                    <span>{c.sub}</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ATELIER */}
      <section className="mq-section mq-atelier">
        <div className="mq-container">
          <Reveal className="mq-statement">
            <span className="mq-eyebrow">L'atelier Niv Création</span>
            <p>
              « Chaque pièce est dessinée puis gravée au laser dans notre atelier
              français. Un prénom, une date, un message : nous transformons vos
              émotions en objets qui traversent le temps. »
            </p>
            <Link href="/a-propos" className="mq-link">Découvrir notre histoire</Link>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mq-section">
        <div className="mq-container">
          <Reveal className="mq-cta">
            <span className="mq-eyebrow mq-eyebrow-light">Sur mesure</span>
            <h2 className="mq-h2 mq-h2-light">Une idée précise ? Créons-la ensemble.</h2>
            <p className="mq-sub mq-sub-light">
              Objet personnalisé, décoration de mariage, pièce unique pour un
              cadeau… Donnons vie à votre projet.
            </p>
            <div className="mq-cta-btns">
              <Link href="/contact" className="mq-btn mq-btn-gold">Demander un projet</Link>
              <Link href="/boutique" className="mq-btn mq-btn-ghost mq-btn-ghost-light">Voir la boutique</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
