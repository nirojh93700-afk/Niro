// Page collection « Cristal Photo 3D » — regroupe les produits cristal (crystal3d).
// Le bandeau d'accueil « Créer mon cristal » mène ici : le client choisit sa version
// (vertical / horizontal…), puis la taille et le prix sur la fiche.
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
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
  // Les blocs photo (vertical / horizontal) d'abord, puis le reste de la gamme cristal.
  const items = catalog
    .filter((p) => p.crystal3d)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return (
    <>
      {/* BANNIÈRE */}
      <section style={{ position: "relative", overflow: "hidden", textAlign: "center", padding: "clamp(40px,7vw,72px) 18px",
        background: "radial-gradient(90% 120% at 85% 8%, rgba(201,162,75,.20), transparent 55%), radial-gradient(80% 100% at 5% 100%, rgba(201,162,75,.14), transparent 55%), linear-gradient(160deg,#faf5ea,#f1e6d2 78%)" }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <span style={{ display: "inline-block", border: "1px solid rgba(201,162,75,.55)", color: "#a5822f", fontWeight: 700, letterSpacing: 2, fontSize: "0.74rem", padding: "7px 14px", borderRadius: 999, textTransform: "uppercase" }}>
            Fait main en France
          </span>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2.1rem,6vw,3.2rem)", margin: "16px 0 10px", color: "#241a0c", lineHeight: 1.08 }}>
            Cristal Photo 3D
          </h1>
          <p style={{ fontSize: "clamp(1rem,3vw,1.2rem)", color: "#6f6453", margin: 0 }}>
            Votre photo sculptée en 3D au cœur d'un cristal K9. Choisissez votre version, votre taille — et nous gravons le reste.
          </p>
        </div>
      </section>

      {/* COLLECTION */}
      <section className="section">
        <div className="container">
          {items.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--ink-soft)" }}>La collection arrive très bientôt. 💎</p>
          ) : (
            <>
              <div className="section-head">
                <span className="eyebrow" style={{ color: "var(--gold-dark)" }}>✦ Choisissez votre cristal</span>
                <h2>Nos cristaux photo 3D</h2>
                <p>Bloc vertical (portrait), bloc horizontal (paysage)… chacun en plusieurs tailles selon le nombre de personnes.</p>
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
