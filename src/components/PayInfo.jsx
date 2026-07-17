"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PaymentLogos } from "@/components/PaymentBand";

// Contenu détaillé (vraies règles) — réutilisé dans la fenêtre ET la page /paiement.
export function PayInfoContent() {
  return (
    <div className="payinfo">
      <p className="pi-intro">
        Tous les paiements sont <strong>100 % sécurisés</strong> et cryptés (via Stripe). Au moment de payer, vous
        choisissez votre moyen de paiement : <strong>carte bancaire</strong> (Visa, Mastercard, CB),
        <strong> PayPal</strong>, <strong>Apple&nbsp;Pay</strong>, <strong>Google&nbsp;Pay</strong>,
        <strong> Klarna</strong>… Et avec PayPal ou Klarna, vous pouvez régler <strong>en plusieurs fois</strong>.
      </p>

      <div className="pi-cards">
        <div className="pi-card" style={{ borderTopColor: "#003087" }}>
          <div className="pi-h"><span style={{ color: "#003087" }}>Pay</span><span style={{ color: "#009CDE" }}>Pal</span> — Paiement en 4 fois</div>
          <ul>
            <li><strong>4 fois sans frais</strong>, pour un achat <strong>de 30 € à 2 000 €</strong>.</li>
            <li>Aucun frais d'ouverture, aucun intérêt, et <strong>plus aucune pénalité de retard</strong> (PayPal les a supprimées).</li>
            <li>Échéancier : 1<sup>er</sup> versement (acompte) le jour de la commande, puis <strong>3 mensualités automatiques</strong> (1 par mois).</li>
            <li>Éligibilité : résider en France, avoir <strong>18 ans ou plus</strong>, compte PayPal en règle ou carte valide. Soumis à l'acceptation de PayPal.</li>
            <li>Vous disposez d'un délai de <strong>rétractation de 14 jours</strong> pour renoncer au crédit.</li>
            <li>Prêteur : PayPal (Europe) S.à r.l. et Cie, SCA, Luxembourg.</li>
            <li>En cas de non-paiement, des mesures de recouvrement peuvent être engagées.</li>
          </ul>
        </div>

        <div className="pi-card" style={{ borderTopColor: "#FFB3C7" }}>
          <div className="pi-h"><span style={{ background: "#FFB3C7", color: "#0b0b0b", borderRadius: 7, padding: "2px 9px" }}>Klarna</span> — Paiement en 3 fois</div>
          <ul>
            <li><strong>3 fois sans frais</strong>, pour un achat <strong>de 50 € à 1 000 €</strong>. Ou <strong>payez en 30 jours</strong>.</li>
            <li>Aucun frais ni intérêt tant que l'échéancier est respecté.</li>
            <li>Échéancier : 1<sup>er</sup> tiers à la confirmation de la commande, puis à <strong>+30 jours</strong> et <strong>+60 jours</strong>.</li>
            <li>Éligibilité : <strong>18 ans ou plus</strong>, résider en France, carte valide. Klarna évalue le montant, l'historique de commande, etc. Soumis à l'acceptation de Klarna.</li>
            <li>En cas de retard, Klarna peut facturer des <strong>frais de retard</strong> et, en cas de défaut, faire appel à une agence de recouvrement et signaler l'incident aux organismes d'évaluation du crédit.</li>
          </ul>
        </div>
      </div>

      <div className="pi-steps">
        {[
          { n: 1, ic: "🛒", t: "Au paiement", d: "Choisissez PayPal ou Klarna" },
          { n: 2, ic: "✅", t: "1er versement", d: "Prélevé à la commande" },
          { n: 3, ic: "📅", t: "Les suivants", d: "Prélevés automatiquement" },
        ].map((s) => (
          <div key={s.n} className="pi-step">
            <span className="pi-n">{s.n}</span>
            <div className="pi-ic">{s.ic}</div>
            <strong>{s.t}</strong>
            <small>{s.d}</small>
          </div>
        ))}
      </div>

      <p className="pi-legal">
        Un crédit vous engage et doit être remboursé. Vérifiez vos capacités de remboursement avant de vous engager.
        Le paiement en plusieurs fois est proposé et géré par PayPal ou Klarna, qui décident seuls de l'éligibilité selon le montant.
        La boutique, elle, est réglée en une seule fois.
      </p>

      <div style={{ margin: "14px 0 2px" }}><PaymentLogos /></div>
    </div>
  );
}

// Lien « En savoir plus » qui ouvre une fenêtre (pop-up) avec le contenu ci-dessus.
export default function PayInfoModal({ label = "En savoir plus", className = "pb-link" }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const overlay = (
    <div className="payinfo-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="En savoir plus sur le paiement">
      <div className="payinfo-modal" onClick={(e) => e.stopPropagation()}>
        <button className="payinfo-close" onClick={() => setOpen(false)} aria-label="Fermer">×</button>
        <p className="pi-eyebrow">✦ Paiement</p>
        <h2 className="pi-title">Paiement sécurisé &amp; en plusieurs fois</h2>
        <PayInfoContent />
      </div>
    </div>
  );

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}>
        {label}
      </button>
      {/* Rendue dans document.body (portail) pour ne pas hériter des couleurs du bandeau foncé. */}
      {open && mounted && createPortal(overlay, document.body)}
    </>
  );
}
