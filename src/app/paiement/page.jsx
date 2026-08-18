import { PayInfoContent } from "@/components/PayInfo";

export const metadata = {
  title: "Paiement sécurisé & en plusieurs fois",
  description: "Payez par carte, PayPal, Apple Pay, Google Pay, Klarna… et réglez en plusieurs fois sans frais : 4× avec PayPal (dès 30 €) ou 3× avec Klarna (dès 50 €). Toutes les règles.",
};

export default function PaiementPage() {
  return (
    <main className="container" style={{ maxWidth: 720, margin: "24px auto 60px", padding: "0 16px" }}>
      <p className="pi-eyebrow">✦ Paiement</p>
      <h1 className="pi-title" style={{ fontSize: "1.9rem" }}>Paiement sécurisé &amp; en plusieurs fois</h1>
      <PayInfoContent />
    </main>
  );
}
