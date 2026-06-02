import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import MockupSwitcher from "@/components/MockupSwitcher";
import { brand, categoryCards, featured, heroImages } from "@/lib/homeContent";

export const metadata = { title: "Maquette 3 — Manifeste artisanal" };

export default function Style3() {
  return (
    <>
      <MockupSwitcher current={3} />

      {/* HERO manifeste */}
      <section className="section" style={{ background: "var(--paper)" }}>
        <div className="container manifesto">
          <div>
            <span className="hero-eyebrow">{brand.eyebrow}</span>
            <p className="quote">« {brand.quote} »</p>
            <p style={{ color: "var(--ink-soft)", maxWidth: 460 }}>{brand.intro}</p>
            <div style={{ marginTop: 26, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              <Link href="/boutique" className="btn btn-gold">Découvrir la boutique</Link>
              <Link href="/a-propos" className="link-underline">Lire notre histoire</Link>
            </div>
          </div>
          <div className="frame">
            <Image src={heroImages.manifesto} alt="Création Niv Création" width={600} height={750} priority />
          </div>
        </div>
      </section>

      {/* Notre histoire / atelier (présentation avant produits) */}
      <section className="section">
        <div className="container">
          <div className="statement">
            <span className="eyebrow">{brand.statementEyebrow}</span>
            <p>{brand.statement}</p>
          </div>
        </div>
      </section>

      {/* Réassurance */}
      <div className="plainstrip">
        <div className="container row">
          {brand.trust.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      {/* Collections */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Nos univers</span>
            <h2>Nos collections</h2>
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

      {/* Créations */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Créations</span>
            <h2>Faites pour être offertes</h2>
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
