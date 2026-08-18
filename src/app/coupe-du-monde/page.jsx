// Page collection « Coupe du Monde 2026 » — regroupe les produits marqués worldcup.
// Renommable en « Aux couleurs de votre nation » après le Mondial (juste le texte ci-dessous).
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getCatalog } from "@/lib/catalog";
import { getSettings, getRatingSummaries } from "@/lib/stock";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Coupe du Monde 2026 — Déco en bois aux couleurs de votre nation",
  description: "Découvrez notre collection spéciale Coupe du Monde 2026 : déco et cadeaux en bois découpés au laser, aux couleurs de votre équipe nationale. Fait main en France.",
};

export default async function CoupeDuMondePage() {
  const catalog = await getCatalog().catch(() => []);
  const ratings = await getRatingSummaries().catch(() => ({}));
  let s = null; try { s = await getSettings(); } catch { /* défauts */ }
  const mk = Number(s?.refMarkup) > 0;
  const items = catalog.filter((p) => p.worldcup);

  return (
    <>
      {/* BANNIÈRE */}
      <section style={{ background: "linear-gradient(135deg,#0a1a3f 0%,#12275c 55%,#1c1206 100%)", color: "#fff", padding: "64px 16px 58px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: "2.4rem", letterSpacing: 6, marginBottom: 10 }}>⚽ 🏆 ⭐</div>
        <div className="container" style={{ maxWidth: 760 }}>
          <span style={{ display: "inline-block", background: "#c9a24b", color: "#1a130a", fontWeight: 800, letterSpacing: 1, fontSize: "0.8rem", padding: "6px 14px", borderRadius: 999, textTransform: "uppercase" }}>Édition spéciale</span>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2.1rem,6vw,3.2rem)", margin: "16px 0 8px", color: "#f4e6c2" }}>Coupe du Monde 2026</h1>
          <p style={{ fontSize: "clamp(1rem,3vw,1.25rem)", color: "#e7ddc7", margin: 0 }}>Aux couleurs de votre nation.<br />Déco et cadeaux en bois, découpés à la main dans notre atelier.</p>
          <div style={{ marginTop: 26 }}>
            <a href="#collection" className="btn btn-gold">Voir la collection</a>
          </div>
        </div>
      </section>

      {/* COLLECTION */}
      <section className="section" id="collection">
        <div className="container">
          {items.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--ink-soft)" }}>La collection arrive très bientôt. 🏆</p>
          ) : (
            <>
              <div className="section-head">
                <span className="eyebrow" style={{ color: "var(--gold-dark)" }}>✦ Supportez votre équipe</span>
                <h2>Notre collection Coupe du Monde</h2>
                <p>Choisissez votre équipe — le cadeau parfait pour tous les supporters.</p>
              </div>
              <div className="product-grid">
                {items.map((p) => {
                  const r = ratings[p.slug];
                  return <ProductCard key={p.slug} product={{ ...p, ...(mk ? { refMarkup: Number(s.refMarkup) } : {}), ...(r ? { rating: r } : {}) }} />;
                })}
              </div>
            </>
          )}
          <p style={{ textAlign: "center", marginTop: 34 }}>
            <Link href="/boutique" className="link-underline">← Retour à toute la boutique</Link>
          </p>
        </div>
      </section>
    </>
  );
}
