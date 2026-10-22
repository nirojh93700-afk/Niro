import { PaymentLogos } from "@/components/PaymentBand";
import DelaiFabrication from "@/components/DelaiFabrication";

// Section « Commandez en toute confiance » — réassurance client basée UNIQUEMENT
// sur des éléments réels (atelier France, paiement sécurisé, matériaux, Instagram).
// Aucun avis. Pour la retirer : supprimer ce composant et son usage dans ProductDetail.
const BADGES = [
  { ic: "🇫🇷", t: "Gravé en France", d: "Dans notre atelier du Val-d'Oise (95)" },
  { ic: "🔒", t: "Paiement 100 % sécurisé", d: "CB, PayPal, Klarna — via Stripe" },
  { ic: "✋", t: "Fait à la commande", d: "Chaque pièce personnalisée rien que pour vous" },
  { ic: "💎", t: "Matériaux nobles", d: "Acier inoxydable 316L hypoallergénique, bois, cristal" },
  { ic: "🎁", t: "Emballage soigné", d: "Livré protégé, prêt à offrir" },
  { ic: "💬", t: "On vous accompagne", d: "Une question ? Réponse rapide par message" },
];

// « Nos coups de cœur » (22/10/2026, gérant : « je peux même pas cliquer sur les photos pour aller dans les
// articles, et il y a un article qui n'est même pas sur le site ») : chaque photo mène à la fiche de son
// produit, et la page produit ne garde que les produits EN VENTE (masqués écartés) — d'où la liste de
// candidats plus longue que les 4 cases. Le tri se fait côté serveur (realisationsVisibles).
export const REALISATIONS = [
  { slug: "collier-medaillon-coeur-ouvrable", src: "/produits/catalogue/il_fullxfull.8007460522_d3ji.jpg" },
  { slug: "cristal-photo-3d-vertical", src: "/produits/cristal-v-femme.jpg" },
  { slug: "arbre-de-vie-lumineux", src: "/produits/arbre-vie-lumineux-2.jpg" },
  { slug: "bracelet-homme-identite-gourmette", src: "/produits/catalogue/il_fullxfull.8086801196_rxih.jpg" },
  { slug: "verre-a-whisky-grave", src: "/produits/verre_a_whisky_exemple_face.jpg" },
  { slug: "carafe-a-whisky-gravee", src: "/produits/carafe_gravee.jpg" },
  { slug: "collier-coeur-grave", src: "/produits/collier-coeur-grave-1.jpg" },
];

/** Les 4 réalisations à montrer : produits visibles du catalogue seulement, jamais la fiche ouverte. */
export function realisationsVisibles(catalogue, slugCourant) {
  const visibles = new Map((catalogue || []).map((p) => [p.slug, p]));
  return REALISATIONS
    .filter((r) => r.slug !== slugCourant && visibles.has(r.slug))
    .slice(0, 4)
    .map((r) => ({ ...r, name: visibles.get(r.slug).name || "" }));
}

export default function TrustSection({ realisations = [] }) {
  return (
    <section className="confiance">
      <p className="cf-eyebrow">✦ Niv Création</p>
      <h2 className="cf-title">Commandez en toute confiance</h2>
      <p className="cf-sub">Un atelier français, chaque pièce personnalisée avec soin.</p>

      <div className="cf-grid">
        {BADGES.map((b) => (
          <div key={b.t} className="cf-card">
            <div className="cf-ic">{b.ic}</div>
            <div className="cf-t">{b.t}</div>
            <div className="cf-d">{b.d}</div>
          </div>
        ))}
      </div>

      {realisations.length > 0 && (
        <div className="cf-real">
          <div className="cf-real-h">Nos coups de cœur</div>
          <div className="cf-shots">
            {realisations.map((r) => (
              <a key={r.slug} className="cf-shot" href={`/produit/${r.slug}`} aria-label={r.name || "Voir la création"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.src} alt={r.name || "Réalisation Niv Création"} loading="lazy" />
              </a>
            ))}
          </div>
        </div>
      )}

      <a className="cf-insta" href="https://www.instagram.com/nivcreation.fr" target="_blank" rel="noopener noreferrer">
        <span className="cf-ig">📸</span>
        <span className="cf-ig-tx"><b>Suivez l'atelier au quotidien</b><span>@nivcreation.fr — nos créations, coulisses et nouveautés</span></span>
        <span className="cf-ig-btn">Voir l'Instagram</span>
      </a>

      <div className="cf-pay">
        <div className="cf-pay-lab">Paiement sécurisé</div>
        <PaymentLogos />
      </div>

      <div className="cf-footline">
        <DelaiFabrication><span>🕒 Fabrication 3 à 5 j ouvrés</span></DelaiFabrication>
        <span>🚚 Expédition suivie</span>
        <span>✦ Personnalisé en France</span>
      </div>
    </section>
  );
}
