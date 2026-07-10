// Page dédiée « Naissance » — reproduit la maquette validée (docs/maquettes/
// plaque-naissance.html) : titre « Plaque de naissance », page propre (sans barre
// de recherche ni filtres), les produits en cartes (image moitié-moitié via cardImage).
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getCatalog } from "@/lib/catalog";
import { getSettings, getRatingSummaries } from "@/lib/stock";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Plaque de naissance personnalisée en bois — gravée en France | Niv Création",
  description:
    "Plaque de naissance en bois gravé, personnalisée aux informations de bébé (prénom, date, poids, heure, taille). Modèle fille ou garçon, faite main en France.",
};

export default async function NaissancePage() {
  const catalog = await getCatalog().catch(() => []);
  const ratings = await getRatingSummaries().catch(() => ({}));
  let s = null;
  try { s = await getSettings(); } catch { /* défauts */ }
  const mk = Number(s?.refMarkup) > 0;

  const items = catalog.filter((p) => p.category === "naissance");

  return (
    <>
      {/* EN-TÊTE (fidèle à la maquette) */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
          padding: "clamp(34px,6vw,60px) 18px 10px",
          background:
            "radial-gradient(90% 120% at 85% 8%, rgba(201,162,75,.16), transparent 55%), linear-gradient(160deg,#fffdf9,#faf6ef 70%,#f3ece0)",
        }}
      >
        <div className="container" style={{ maxWidth: 720 }}>
          <div style={{ fontSize: ".7rem", letterSpacing: 3, textTransform: "uppercase", color: "#a98935", fontWeight: 700 }}>
            Niv Création · Catégorie Naissance
          </div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2rem,6vw,3rem)", margin: "8px 0 8px", color: "#2b2620", lineHeight: 1.08 }}>
            Plaque de naissance
          </h1>
          <p style={{ fontSize: "clamp(1rem,3vw,1.15rem)", color: "#6f6453", margin: 0 }}>
            Nos souvenirs de naissance en bois gravé, personnalisés aux informations de bébé — prénom, date, poids, heure et taille.
          </p>
        </div>
      </section>

      {/* PRODUITS */}
      <section className="section" style={{ paddingTop: 22 }}>
        <div className="container">
          {items.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--ink-soft)" }}>La collection arrive très bientôt.</p>
          ) : (
            <div className="product-grid">
              {items.map((p) => {
                const r = ratings[p.slug];
                return (
                  <ProductCard
                    key={p.slug}
                    product={{ ...p, ...(mk ? { refMarkup: Number(s.refMarkup) } : {}), ...(r ? { rating: r } : {}) }}
                  />
                );
              })}
            </div>
          )}
          <p style={{ textAlign: "center", marginTop: 30 }}>
            <Link href="/boutique" className="link-underline">← Retour à toute la boutique</Link>
          </p>
        </div>
      </section>
    </>
  );
}
