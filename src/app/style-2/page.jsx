import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import MockupSwitcher from "@/components/MockupSwitcher";
import { brand, categoryCards, featured } from "@/lib/homeContent";

export const metadata = { title: "Maquette 2 — Immersif plein écran" };

export default function Style2() {
  return (
    <>
      <MockupSwitcher current={2} />

      {/* HERO plein écran — fond de marque général (sans produit) */}
      <section className="fs-hero brandbg">
        <div className="fs-content">
          <p className="fs-tag">{brand.eyebrow}</p>
          <h1 className="fs-name">Niv Création</h1>
          <div className="fs-divider" />
          <p className="fs-tag">Gravé et personnalisé sur mesure</p>
          <div className="fs-cta">
            <Link href="/boutique" className="btn btn-gold">Découvrir la boutique</Link>
          </div>
        </div>
        <div className="scrollcue">
          <span>Découvrir</span>
          <span className="chev" />
        </div>
      </section>

      {/* Savoir-faire */}
      <section className="section">
        <div className="container">
          <div className="statement">
            <span className="eyebrow">{brand.statementEyebrow}</span>
            <p>{brand.statement}</p>
            <div style={{ marginTop: 26 }}>
              <Link href="/a-propos" className="link-underline">Découvrir l'atelier</Link>
            </div>
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
            <h2>Nos créations phares</h2>
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
