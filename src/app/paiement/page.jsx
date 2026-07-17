import Link from "next/link";
import { PaymentLogos } from "@/components/PaymentBand";

export const metadata = {
  title: "Paiement sécurisé & en plusieurs fois | Niv Création",
  description: "Payez en toute sécurité par carte, PayPal, Apple Pay, Google Pay… et réglez en plusieurs fois sans frais : 4× avec PayPal (dès 30 €) ou 3× avec Klarna (dès 50 €).",
};

export default function PaiementPage() {
  return (
    <main className="container" style={{ maxWidth: 760, margin: "24px auto 60px", padding: "0 16px" }}>
      <p style={{ fontSize: "0.72rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold-dark)", fontWeight: 700, margin: 0 }}>✦ Paiement</p>
      <h1 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.9rem", margin: "4px 0 8px" }}>Paiement sécurisé &amp; en plusieurs fois</h1>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Réglez comme vous voulez, en toute sérénité. Tous les paiements sont 100 % sécurisés (cryptés via Stripe). Vous pouvez aussi <strong>étaler votre paiement, sans frais</strong>.
      </p>

      <div style={{ margin: "18px 0 26px" }}><PaymentLogos /></div>

      {/* Deux solutions de paiement en plusieurs fois */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 18px", borderTop: "3px solid #003087" }}>
          <div style={{ fontStyle: "italic", fontWeight: 800, fontSize: "1.1rem", marginBottom: 6 }}>
            <span style={{ color: "#003087" }}>Pay</span><span style={{ color: "#009CDE" }}>Pal</span> — 4 fois
          </div>
          <p style={{ margin: "0 0 8px", color: "var(--ink-soft)", fontSize: "0.92rem" }}>
            Payez en <strong>4 fois sans frais</strong> avec PayPal, pour tout achat <strong>de 30 € à 2 000 €</strong>.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink-soft)", fontSize: "0.9rem" }}>
            <li>1<sup>er</sup> paiement le jour de la commande</li>
            <li>puis 3 mensualités automatiques</li>
            <li>Au moment de payer, choisissez « en 1 fois » ou « en 4 fois »</li>
          </ul>
        </div>

        <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 18px", borderTop: "3px solid #FFB3C7" }}>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 6 }}>
            <span style={{ background: "#FFB3C7", color: "#0b0b0b", borderRadius: 7, padding: "2px 9px", fontSize: "0.9rem" }}>Klarna</span> — 3 fois
          </div>
          <p style={{ margin: "0 0 8px", color: "var(--ink-soft)", fontSize: "0.92rem" }}>
            Payez en <strong>3 fois sans frais</strong> avec Klarna, pour tout achat <strong>de 50 € à 1 000 €</strong>. Ou <strong>payez en 30 jours</strong>.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink-soft)", fontSize: "0.9rem" }}>
            <li>1<sup>er</sup> tiers le jour de la commande</li>
            <li>puis à +30 jours et +60 jours</li>
            <li>Aucun frais ni intérêt (si paiement à temps)</li>
          </ul>
        </div>
      </div>

      {/* Comment ça marche */}
      <h2 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.2rem", margin: "28px 0 12px" }}>Comment ça marche ?</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
        {[
          { n: 1, ic: "🛒", t: "Au panier", d: "Choisissez PayPal ou Klarna au moment de payer" },
          { n: 2, ic: "✅", t: "1er paiement", d: "Le premier versement est prélevé à la commande" },
          { n: 3, ic: "📅", t: "Les suivants", d: "Les autres versements sont prélevés automatiquement" },
        ].map((s) => (
          <div key={s.n} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 12px", textAlign: "center", position: "relative" }}>
            <span style={{ position: "absolute", top: 8, right: 12, color: "var(--gold-l)", fontWeight: 800 }}>{s.n}</span>
            <div style={{ fontSize: "1.5rem" }}>{s.ic}</div>
            <strong style={{ display: "block", margin: "6px 0 3px", fontSize: "0.92rem" }}>{s.t}</strong>
            <small style={{ color: "var(--ink-soft)" }}>{s.d}</small>
          </div>
        ))}
      </div>

      <p style={{ color: "var(--ink-soft)", fontSize: "0.82rem", marginTop: 20 }}>
        Conditions : résider en France, avoir plus de 18 ans et disposer d'une carte valide. Le paiement en plusieurs fois est proposé et géré par PayPal ou Klarna, qui décident de l'éligibilité selon le montant. Nous, nous sommes réglés en une seule fois.
      </p>

      <div style={{ textAlign: "center", marginTop: 26 }}>
        <Link href="/boutique" className="btn btn-gold" style={{ display: "inline-block" }}>Découvrir la boutique</Link>
      </div>
    </main>
  );
}
