// Page collection « Cristal Photo 3D » — regroupe les produits cristal (crystal3d).
// Le bandeau d'accueil « Créer mon cristal » mène ici : le client choisit sa version
// (vertical / horizontal…), puis la taille et le prix sur la fiche.
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import CristalVivant from "@/components/CristalVivant";
import { getCatalog } from "@/lib/catalog";
import { getSettings, getRatingSummaries } from "@/lib/stock";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cristal Photo 3D personnalisé — Gravure photo dans le cristal | Niv Création",
  description: "Votre photo gravée en 3D au cœur d'un cristal K9, dans notre atelier en France. Bloc vertical ou horizontal, plusieurs tailles. Un cadeau qui capte la lumière.",
};

export default async function CristauxPage() {
  const catalog = await getCatalog().catch(() => []);
  const ratings = await getRatingSummaries().catch(() => ({}));
  let s = null; try { s = await getSettings(); } catch { /* défauts */ }
  const mk = Number(s?.refMarkup) > 0;
  // Ordre voulu : blocs d'abord, puis les porte-clés, puis clé USB, puis
  // trophée et pyramide en bas.
  const crystalRank = (p) => {
    const s = p.slug || "";
    if (s.startsWith("cristal-photo-3d")) return 0; // blocs vertical / horizontal
    if (s.includes("porte-cles-cristal")) return 1; // porte-clés cristal
    if (s.includes("cle-usb-cristal")) return 2;     // clé USB
    if (s.includes("trophee")) return 4;             // trophée
    if (s.includes("pyramide")) return 5;            // pyramide
    return 3;                                         // autres cristaux
  };
  const items = catalog
    .filter((p) => p.crystal3d)
    .sort((a, b) => crystalRank(a) - crystalRank(b));

  return (
    <>
      {/* EXPÉRIENCE ANIMÉE (maquette cristal-vivant validée) */}
      <CristalVivant />

      {/* COLLECTION */}
      <section className="section" id="cristaux-collection">
        <div className="container">
          {items.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--ink-soft)" }}>La collection arrive très bientôt. 💎</p>
          ) : (
            <>
              <div className="section-head">
                <span className="eyebrow" style={{ color: "var(--gold-dark)" }}>✦ Choisissez votre cristal</span>
                <h2>Nos cristaux photo 3D</h2>
                <p>Vos souvenirs gravés en 3D au cœur du cristal : blocs photo, porte-clés, trophées… en plusieurs tailles, pour toutes vos occasions.</p>
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
