import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import MockupSwitcher from "@/components/MockupSwitcher";
import { brand, categoryCards, featured, heroImages } from "@/lib/homeContent";

export const metadata = { title: "Maquette 1 — Éditorial épuré" };

export default function Style1() {
  return (
    <>
      <MockupSwitcher current={1} />

      {/* HERO éditorial */}
      <section className="hero" style={{ padding: "96px 0 84px" }}>
        <div className="container hero-grid">
          <div>
            <span className="hero-eyebrow">{brand.eyebrow}</span>
            <h1>{brand.headline}</h1>
            <p>{brand.intro}</p>
            <div className="hero-cta">
              <Link href="/boutique" className="btn btn-primary">Découvrir la boutique</Link>
              <Link href="/a-propos" className="link-underline" style={{ alignSelf: "center" }}>
                Notre atelier
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <Image src={heroImages.editorial} alt="Création Niv Création" width={700} height={700} priority />
          </div>
        </div>
      </section>

      {/* Réassurance épurée */}
      <div className="plainstrip">
        <div className="container row">
          {brand.trust.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      {/* Savoir-faire (présentation avant produits) */}
      <section className="section">
        <div className="container">
          <div className="statement">
            <span className="eyebrow">{brand.statementEyebrow}</span>
            <p>{brand.statement}</p>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Nos univers</span>
            <h2>Explorez nos collections</h2>
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

      {/* Sélection */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Sélection</span>
            <h2>Quelques-unes de nos créations</h2>
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
    </>
  );
}
