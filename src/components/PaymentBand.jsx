import Link from "next/link";

// Rangée de logos des moyens de paiement acceptés (réutilisable).
export function PaymentLogos({ dark = false }) {
  const bg = dark ? "#fff" : "#fff";
  return (
    <div className="pay-logos">
      <span className="plg" style={{ background: bg }} aria-label="Visa">
        <svg width="40" height="14" viewBox="0 0 48 16"><text x="0" y="13" fontFamily="Arial,Helvetica,sans-serif" fontSize="15" fontWeight="800" fontStyle="italic" fill="#1A1F71">VISA</text></svg>
      </span>
      <span className="plg" style={{ background: bg }} aria-label="Mastercard">
        <svg width="34" height="22" viewBox="0 0 34 22"><circle cx="13" cy="11" r="8" fill="#EB001B" /><circle cx="21" cy="11" r="8" fill="#F79E1B" /><path d="M17 4.8a8 8 0 0 0 0 12.4 8 8 0 0 0 0-12.4z" fill="#FF5F00" /></svg>
      </span>
      <span className="plg" style={{ background: bg }} aria-label="Cartes Bancaires">
        <svg width="30" height="16" viewBox="0 0 34 18"><text x="2" y="14" fontFamily="Arial" fontSize="13" fontWeight="800" fill="#2e7d32">C</text><text x="14" y="14" fontFamily="Arial" fontSize="13" fontWeight="800" fill="#1565c0">B</text></svg>
      </span>
      <span className="plg" style={{ background: bg }} aria-label="PayPal">
        <svg width="54" height="15" viewBox="0 0 62 16"><text x="0" y="13" fontFamily="Arial" fontSize="14" fontWeight="800" fontStyle="italic" fill="#003087">Pay</text><text x="27" y="13" fontFamily="Arial" fontSize="14" fontWeight="800" fontStyle="italic" fill="#009CDE">Pal</text></svg>
      </span>
      <span className="plg plg-klarna" aria-label="Klarna">Klarna</span>
      <span className="plg" style={{ background: bg }} aria-label="Apple Pay">
        <svg width="52" height="17" viewBox="0 0 56 18"><path fill="#000" d="M9.9 5.2c-.4.5-1 .9-1.7.8-.1-.7.2-1.4.6-1.9.4-.5 1.1-.9 1.7-.9.1.7-.2 1.4-.6 2zm.6 1c-.9 0-1.7.5-2.2.5-.5 0-1.2-.5-1.9-.5-1 0-1.9.6-2.4 1.4-1 1.8-.3 4.4.7 5.9.5.7 1.1 1.5 1.8 1.5.7 0 1-.5 1.9-.5.9 0 1.1.5 1.9.5.8 0 1.3-.7 1.7-1.4.6-.8.8-1.6.8-1.6 0 0-1.6-.6-1.6-2.4 0-1.5 1.2-2.2 1.3-2.3-.7-1-1.8-1.1-2.2-1.1z" /><text x="18" y="14" fontFamily="Arial,Helvetica,sans-serif" fontSize="13" fontWeight="600" fill="#000">Pay</text></svg>
      </span>
      <span className="plg" style={{ background: bg }} aria-label="Google Pay">
        <svg width="46" height="16" viewBox="0 0 48 18"><text x="0" y="14" fontFamily="Arial,Helvetica,sans-serif" fontSize="15" fontWeight="800" fill="#4285F4">G</text><text x="14" y="14" fontFamily="Arial,Helvetica,sans-serif" fontSize="13" fontWeight="600" fill="#5f6368">Pay</text></svg>
      </span>
    </div>
  );
}

// Bandeau paiement (version sombre & chic) pour la page d'accueil.
export default function PaymentBand() {
  return (
    <section className="pay-band">
      <div className="container">
        <div className="pay-band-inner">
          <div className="pb-ey">✦ Paiement</div>
          <h2>Paiement 100 % sécurisé &amp; en plusieurs fois</h2>
          <p className="pb-sub">Réglez comme vous voulez, en toute sérénité.</p>
          <PaymentLogos dark />
          <p className="pb-nfois">
            💳 <strong>Payez en plusieurs fois sans frais</strong> — en 4× avec PayPal (dès 30 €) ou 3× avec Klarna (dès 50 €).{" "}
            <Link href="/paiement" className="pb-link">En savoir plus</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
