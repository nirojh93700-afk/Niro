import Link from "next/link";

export const metadata = { title: "Paiement annulé" };

export default function AnnulePage() {
  return (
    <div className="center-card">
      <div className="big-emoji">🛒</div>
      <h1>Paiement annulé</h1>
      <p style={{ color: "var(--ink-soft)" }}>
        Aucun montant n'a été débité. Votre panier est toujours disponible si
        vous souhaitez finaliser votre commande.
      </p>
      <Link href="/panier" className="btn btn-gold" style={{ marginTop: 8 }}>
        Retourner au panier
      </Link>
    </div>
  );
}
