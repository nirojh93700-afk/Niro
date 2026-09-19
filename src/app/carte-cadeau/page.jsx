import CarteCadeauForm from "@/components/CarteCadeauForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Carte cadeau Niv Création — offrez le choix",
  description:
    "Offrez une carte cadeau Niv Création : bijoux gravés, verres personnalisés, cristal photo 3D. Envoyée par e-mail avec votre petit mot, valable un an sur toute la boutique.",
  alternates: { canonical: "/carte-cadeau" },
};

// =============================================================================
// PAGE CARTE CADEAU (audit du 19/09/2026, validé « applique »). La page est un
// écrin serveur (titre + référencement) ; le formulaire est un composant client.
// =============================================================================
export default function CarteCadeauPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="section-head">
          <span className="eyebrow">Offrir</span>
          <h2>La Carte Cadeau Niv Création</h2>
          <p>
            Quand on veut offrir une pièce gravée mais laisser le choix : la carte arrive par e-mail,
            avec votre petit mot et son code personnel. Valable un an, en une ou plusieurs fois, sur
            toute la boutique.
          </p>
        </div>
        <CarteCadeauForm />
      </div>
    </section>
  );
}
