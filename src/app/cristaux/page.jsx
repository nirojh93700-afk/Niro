// Page collection « Cristal Photo 3D » — regroupe les produits cristal (crystal3d).
// Le bandeau d'accueil « Créer mon cristal » mène ici : le client choisit sa version
// (vertical / horizontal…), puis la taille et le prix sur la fiche.
import Link from "next/link";
import CristalVivant from "@/components/CristalVivant";
import { getCatalog } from "@/lib/catalog";
import { getRatingSummaries } from "@/lib/stock";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cristal Photo 3D personnalisé — Gravure photo dans le cristal | Niv Création",
  description: "Votre photo gravée en 3D au cœur d'un cristal K9, dans notre atelier en France. Bloc vertical ou horizontal, plusieurs tailles. Un cadeau qui capte la lumière.",
};

export default async function CristauxPage() {
  const catalog = await getCatalog().catch(() => []);
  const ratings = await getRatingSummaries().catch(() => ({}));
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
  // Fenêtres produits pour la grille multi-fenêtres (photo, prix « dès », note).
  // Trophée + pyramide retirés des fenêtres (demande gérante 10/07/2026) — la clé
  // USB reste rangée avec les porte-clés cristal.
  const HIDDEN_TILES = ["trophee-cristal-vierge-3d", "pyramide-cristal-gravure-3d"];
  const tiles = items.filter((p) => !HIDDEN_TILES.includes(p.slug)).map((p) => {
    const prices = (p.variants || []).map((v) => Number(v.price)).filter((n) => n > 0);
    const r = ratings[p.slug];
    return {
      slug: p.slug,
      name: p.name,
      type: p.type || "",
      image: (p.images || [])[0] || "",
      price: prices.length ? Math.min(...prices) : null,
      rating: r && r.count ? { avg: r.avg, count: r.count } : null,
    };
  });

  return (
    <>
      {/* MULTI-FENÊTRES : animation + les produits en fenêtres */}
      <CristalVivant products={tiles} />

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          {items.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--ink-soft)" }}>La collection arrive très bientôt. 💎</p>
          ) : null}
          <p style={{ textAlign: "center", marginTop: 10 }}>
            <Link href="/boutique" className="link-underline">← Retour à toute la boutique</Link>
          </p>
        </div>
      </section>
    </>
  );
}
