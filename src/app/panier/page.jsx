"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "@/components/CartContext";
import { formatEuro } from "@/lib/format";
import { startCheckout } from "@/lib/checkout";
import FreeShippingBar from "@/components/FreeShippingBar";
import RelaisPicker from "@/components/RelaisPicker";

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, hydrated } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [promoOk, setPromoOk] = useState(false);

  // Livraison : la cliente choisit entre "domicile" et "relais" (point relais).
  const [relaisEnabled, setRelaisEnabled] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("domicile");
  const [relais, setRelais] = useState(null);

  // L'option point relais s'affiche uniquement si elle est activée dans l'admin.
  useEffect(() => {
    let ok = true;
    fetch("/api/shipping-config")
      .then((r) => r.json())
      .then((d) => { if (ok) setRelaisEnabled(Boolean(d?.pointRelais)); })
      .catch(() => {});
    return () => { ok = false; };
  }, []);

  const hasPickup = items.some((i) => i.pickup);

  async function applyPromo() {
    setPromoMsg(""); setPromoOk(false);
    const code = promoCode.trim();
    if (!code) return;
    try {
      const res = await fetch("/api/promo-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await res.json();
      if (d.valid) { setPromoOk(true); setPromoMsg(`✓ Code valide (${d.label}) — appliqué au paiement.`); }
      else if (d.used) setPromoMsg("Ce code a déjà été utilisé.");
      else setPromoMsg("Code invalide.");
    } catch { setPromoMsg("Vérification impossible."); }
  }

  async function handleCheckout() {
    setError("");
    // Si la cliente a choisi « point relais », elle doit d'abord sélectionner
    // son point relais sur la carte avant de payer.
    if (relaisEnabled && deliveryMethod === "relais" && !relais) {
      setError("Choisissez d'abord votre point relais sur la carte.");
      return;
    }
    setLoading(true);
    try {
      const delivery = relaisEnabled
        ? { method: deliveryMethod, relais: deliveryMethod === "relais" ? relais : null }
        : null;
      await startCheckout(items, postalCode, promoOk ? promoCode.trim() : "", delivery);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="container cart-page">
        <p>Chargement du panier…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="center-card">
        <div className="big-emoji">🛍️</div>
        <h2>Votre panier est vide</h2>
        <p style={{ color: "var(--ink-soft)" }}>
          Parcourez nos créations personnalisées et trouvez la pièce parfaite.
        </p>
        <Link href="/boutique" className="btn btn-gold">Découvrir la boutique</Link>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <h1 style={{ marginBottom: 28 }}>Votre panier</h1>
      <div className="cart-page-grid">
        <div>
          {items.map((item) => (
            <div className="cart-line" key={item.key}>
              <div className="cart-line-thumb">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} />
                ) : null}
              </div>
              <div className="cart-line-info">
                <h4 style={{ fontSize: "1rem" }}>{item.name}</h4>
                <div className="variant">{item.variantTitle}</div>
                {item.personalization ? (
                  <div className="perso">✎ {item.personalization}</div>
                ) : null}
                <div className="cart-line-bottom">
                  <div className="mini-stepper">
                    <button onClick={() => updateQuantity(item.key, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.key, item.quantity + 1)}>+</button>
                  </div>
                  <strong>{formatEuro(item.price * item.quantity)}</strong>
                </div>
                <button className="cart-line-remove" onClick={() => removeItem(item.key)}>
                  Retirer
                </button>
              </div>
            </div>
          ))}
          <Link href="/boutique" style={{ display: "inline-block", marginTop: 18, color: "var(--gold-dark)" }}>
            ← Continuer mes achats
          </Link>
        </div>

        <aside className="cart-summary">
          <h3>Récapitulatif</h3>
          <FreeShippingBar />
          <div className="summary-row">
            <span>Sous-total</span>
            <span>{formatEuro(total)}</span>
          </div>
          <div className="summary-row">
            <span>Livraison</span>
            <span>Calculée au paiement</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>{formatEuro(total)}</span>
          </div>

          {relaisEnabled && (
            <div style={{ marginTop: 18 }}>
              <label style={{ display: "block", fontSize: "0.92rem", fontWeight: 600, marginBottom: 8 }}>
                Mode de livraison
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => { setDeliveryMethod("domicile"); setError(""); }}
                  style={{
                    padding: "12px 10px",
                    border: `1.5px solid ${deliveryMethod === "domicile" ? "var(--gold-dark, #b8860b)" : "var(--line)"}`,
                    background: deliveryMethod === "domicile" ? "rgba(184,134,11,.08)" : "#fff",
                    borderRadius: 10, cursor: "pointer", font: "inherit", fontWeight: deliveryMethod === "domicile" ? 600 : 400,
                  }}
                >
                  🏠 À domicile
                </button>
                <button
                  type="button"
                  onClick={() => { setDeliveryMethod("relais"); setError(""); }}
                  style={{
                    padding: "12px 10px",
                    border: `1.5px solid ${deliveryMethod === "relais" ? "var(--gold-dark, #b8860b)" : "var(--line)"}`,
                    background: deliveryMethod === "relais" ? "rgba(184,134,11,.08)" : "#fff",
                    borderRadius: 10, cursor: "pointer", font: "inherit", fontWeight: deliveryMethod === "relais" ? 600 : 400,
                  }}
                >
                  📍 Point relais
                </button>
              </div>
              {deliveryMethod === "relais" && (
                <>
                  <RelaisPicker selected={relais} onSelect={(p) => { setRelais(p); setError(""); }} />
                  {relais && (
                    <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", margin: "10px 0 0" }}>
                      À l'étape suivante, vous indiquerez seulement vos coordonnées (nom, téléphone) :
                      votre colis sera livré au point relais choisi ci-dessus.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", fontSize: "0.88rem", marginBottom: 6 }}>Code promo</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value); setPromoOk(false); setPromoMsg(""); }}
                placeholder="Ex. BIENVENUE10"
                style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit", textTransform: "uppercase" }}
              />
              <button type="button" className="btn btn-outline" onClick={applyPromo}>Appliquer</button>
            </div>
            {promoMsg && <p style={{ fontSize: "0.82rem", margin: "6px 0 0", color: promoOk ? "#256b34" : "#b4452f" }}>{promoMsg}</p>}
          </div>

          {hasPickup && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: "0.88rem", marginBottom: 6 }}>
                Votre code postal <span style={{ color: "var(--ink-soft)" }}>— notre atelier est dans le Val-d'Oise (95). Le retrait en main propre est proposé si vous êtes dans le secteur.</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ex. 95800"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }}
              />
              <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", margin: "8px 0 0" }}>
                Retrait sur rendez-vous : c'est vous qui venez récupérer à l'atelier, sous <strong>14 jours</strong> après notre message « commande prête » (passé ce délai, la commande ne pourra plus être ni retirée, ni expédiée).
                <br />Vous habitez plus loin et souhaitez tout de même venir récupérer ? Écrivez-nous <strong>avant de commander</strong> : <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a>.
              </p>
            </div>
          )}
          {error && <div className="notice" style={{ marginTop: 16 }}>{error}</div>}
          <button
            className="btn btn-gold btn-block"
            style={{ marginTop: 18 }}
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? "Redirection vers le paiement…" : "Procéder au paiement"}
          </button>
          <p className="drawer-note" style={{ marginTop: 12, textAlign: "center" }}>
            🔒 Paiement 100% sécurisé via Stripe
          </p>
        </aside>
      </div>
    </div>
  );
}
