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

const SHOTS = [
  "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8007460522_d3ji.jpg",
  "/produits/cristal-v-femme.jpg",
  "/produits/arbre-vie-lumineux-2.jpg",
  "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8086801196_rxih.jpg",
];

export default function TrustSection() {
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

      <div className="cf-real">
        <div className="cf-real-h">Nos réalisations</div>
        <div className="cf-shots">
          {SHOTS.map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <div key={i} className="cf-shot"><img src={s} alt="Réalisation Niv Création" loading="lazy" /></div>
          ))}
        </div>
      </div>

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
