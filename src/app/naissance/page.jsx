// Page dédiée « Naissance » — reproduit FIDÈLEMENT la maquette validée
// (docs/maquettes/plaque-naissance.html) : titre « Plaque de naissance », carte
// moitié-moitié avec badges rose « Fille » / bleu « Garçon », trait doré, sous-titre
// et bouton « Personnaliser ». Page propre (sans barre de recherche ni filtres).
import Link from "next/link";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Plaque de naissance personnalisée en bois — gravée en France | Niv Création",
  description:
    "Plaque de naissance en bois gravé, personnalisée aux informations de bébé (prénom, date, poids, heure, taille). Modèle fille ou garçon, faite main en France.",
};

const euro = (n) =>
  (Number(n) % 1 === 0 ? String(Number(n)) : Number(n).toFixed(2).replace(".", ",")) + " €";

// Photos fille/garçon par produit (pour la carte moitié-moitié avec badges).
const HALVES = {
  "plaque-de-naissance": {
    garcon: "/produits/plaque-naissance-garcon-1.jpg",
    fille: "/produits/plaque-naissance-fille-1.jpg",
  },
};

export default async function NaissancePage() {
  const catalog = await getCatalog().catch(() => []);
  const items = catalog.filter((p) => p.category === "naissance");

  return (
    <>
      <section
        style={{
          textAlign: "center",
          padding: "clamp(34px,6vw,60px) 18px 8px",
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
            Nos souvenirs de naissance en bois gravé, personnalisés aux informations de bébé.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 22 }}>
        <div className="container">
          {items.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--ink-soft)" }}>La collection arrive très bientôt.</p>
          ) : (
            <div className="naissance-grid">
              {items.map((p) => {
                const h = HALVES[p.slug];
                const price = (p.variants || []).map((v) => Number(v.price)).filter((n) => n > 0);
                const from = price.length ? Math.min(...price) : null;
                return (
                  <Link key={p.slug} href={`/produit/${p.slug}`} className="naissance-card">
                    <div className="nc-ph">
                      {h ? (
                        <>
                          <span className="nc-tag f">Fille</span>
                          <span className="nc-tag g">Garçon</span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="nc-half" src={h.fille} alt="Modèle fille" />
                          <span className="nc-div" />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="nc-half" src={h.garcon} alt="Modèle garçon" />
                        </>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="nc-single" src={p.cardImage || p.images?.[0]} alt={p.name} />
                      )}
                    </div>
                    <div className="nc-body">
                      <h3>{p.name}</h3>
                      <div className="nc-sub">{h ? "Fille & Garçon · personnalisable" : (p.tagline || "Personnalisable")}</div>
                      <div className="nc-row">
                        <span className="nc-price">{from ? euro(from) : ""}</span>
                        <span className="nc-btn">Personnaliser</span>
                      </div>
                    </div>
                  </Link>
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
