"use client";

// Rappel automatique : vérifier Google Merchant Center après la mise en place du
// flux (18/08/2026). Google met 3 à 5 jours à examiner les produits ; c'est le
// moment de regarder l'onglet « Attention requise » et de corriger d'éventuels
// refus. Le rappel s'affiche du 21/08 au 05/09/2026, puis disparaît tout seul.
const MERCHANT_URL = "https://merchants.google.com/";
const START = new Date(2026, 7, 21); // 21 août 2026 (début d'affichage)
const END = new Date(2026, 8, 5);    // 5 septembre 2026 (fin d'affichage)

export default function MerchantReminder() {
  // Date-only (évite Date.now() côté build) : on compare des jours calendaires.
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (today < START || today > END) return null; // hors fenêtre → rien

  return (
    <div
      className="admin-block"
      style={{ background: "#eaf1fb", border: "1px solid #b9cdec", marginBottom: 20 }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>🛍️</span>
        <div style={{ flex: 1 }}>
          <strong style={{ color: "#2c5cbd" }}>
            Google Shopping — à vérifier cette semaine
          </strong>
          <p style={{ margin: "6px 0 0", fontSize: "0.92rem", lineHeight: 1.55 }}>
            Tu as branché ton flux produits sur Google Merchant Center. Google a fini
            de l&apos;examiner : ouvre l&apos;onglet <strong>« Attention requise »</strong> et
            regarde s&apos;il y a des <strong>produits refusés</strong> à corriger (c&apos;est courant
            au début, souvent un petit détail).
          </p>
          <p style={{ margin: "6px 0 10px", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
            💡 En cas de refus, envoie-moi la capture d&apos;écran et je corrige le flux
            pour toi. Une fois les produits approuvés, ils apparaissent gratuitement
            dans l&apos;onglet Shopping de Google.
          </p>
          <a
            className="btn btn-gold"
            style={{ padding: "6px 16px", fontSize: "0.88rem" }}
            href={MERCHANT_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ouvrir Merchant Center →
          </a>
        </div>
      </div>
    </div>
  );
}
