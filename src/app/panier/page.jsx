"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "@/components/CartContext";
import { formatEuro } from "@/lib/format";
import { startCheckout } from "@/lib/checkout";
import { PICKUP_MIN_GRAMS } from "@/lib/shipping";
import FreeShippingBar from "@/components/FreeShippingBar";
import RelaisPicker from "@/components/RelaisPicker";

// Pays d'Europe où le point relais (Mondial Relay) est disponible.
const EU_RELAIS_COUNTRIES = ["BE", "LU", "NL", "ES", "PT", "IT"];

// Pays de livraison proposés (doivent correspondre à SHIPPING_COUNTRIES côté serveur).
const COUNTRIES = [
  { code: "FR", label: "France" },
  { code: "MC", label: "Monaco" },
  { code: "BE", label: "Belgique" },
  { code: "LU", label: "Luxembourg" },
  { code: "NL", label: "Pays-Bas" },
  { code: "DE", label: "Allemagne" },
  { code: "ES", label: "Espagne" },
  { code: "IT", label: "Italie" },
  { code: "PT", label: "Portugal" },
  { code: "CH", label: "Suisse" },
];

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
  const [country, setCountry] = useState("FR");
  const isFrance = country === "FR" || country === "MC";

  // L'option point relais s'affiche uniquement si elle est activée dans l'admin.
  useEffect(() => {
    let ok = true;
    fetch("/api/shipping-config")
      .then((r) => r.json())
      .then((d) => { if (ok) setRelaisEnabled(Boolean(d?.pointRelais)); })
      .catch(() => {});
    return () => { ok = false; };
  }, []);

  // Retrait en main propre proposé : article « mariage » marqué, OU panier lourd
  // (≥ 2 kg) car l'expédition d'un colis lourd coûte cher.
  const totalGrams = items.reduce((s, i) => s + (Number(i.weight) || 200) * (i.quantity || 1), 0);
  const hasPickup = items.some((i) => i.pickup) || totalGrams >= PICKUP_MIN_GRAMS;
  // Point relais dispo : France, ou pays d'Europe desservis par Mondial Relay.
  const relaisPossible = relaisEnabled && (isFrance || EU_RELAIS_COUNTRIES.includes(country));
  const retraitPossible = isFrance && hasPickup;

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
    // Point relais : il faut d'abord choisir son relais sur la carte.
    if (relaisPossible && deliveryMethod === "relais" && !relais) {
      setError("Choisissez d'abord votre point relais sur la carte.");
      return;
    }
    // Retrait en main propre : il faut un code postal (vérifié en zone côté serveur).
    if (retraitPossible && deliveryMethod === "retrait" && postalCode.replace(/\D/g, "").length < 4) {
      setError("Entrez votre code postal pour le retrait en main propre.");
      return;
    }
    setLoading(true);
    try {
      // On ne garde que les modes réellement disponibles pour ce pays.
      let method = deliveryMethod;
      if (method === "relais" && !relaisPossible) method = "domicile";
      if (method === "retrait" && !retraitPossible) method = "domicile";
      const delivery = { method, relais: method === "relais" ? relais : null };
      await startCheckout(items, postalCode, promoOk ? promoCode.trim() : "", delivery, country);
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

          <div style={{ marginTop: 18 }}>
            <label htmlFor="cart-country" style={{ display: "block", fontSize: "0.92rem", fontWeight: 600, marginBottom: 8 }}>
              Pays de livraison
            </label>
            <select
              id="cart-country"
              value={country}
              onChange={(e) => { setCountry(e.target.value); setDeliveryMethod("domicile"); setRelais(null); setError(""); }}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit", background: "#fff" }}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            {!isFrance && !relaisPossible && (
              <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "10px 0 0" }}>
                Livraison à domicile en Europe — le tarif exact (selon le poids et le pays) s'affiche à l'étape du paiement.
              </p>
            )}
          </div>

          {(relaisPossible || retraitPossible) && (
            <div style={{ marginTop: 18 }}>
              <label style={{ display: "block", fontSize: "0.92rem", fontWeight: 600, marginBottom: 8 }}>
                Mode de livraison
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { key: "domicile", label: "🏠 À domicile", show: true },
                  { key: "relais", label: "📍 Point relais", show: relaisPossible },
                  { key: "retrait", label: "🤝 Retrait en main propre", show: retraitPossible },
                ].filter((o) => o.show).map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => { setDeliveryMethod(o.key); setError(""); }}
                    style={{
                      flex: "1 1 45%",
                      padding: "12px 10px",
                      border: `1.5px solid ${deliveryMethod === o.key ? "var(--gold-dark, #b8860b)" : "var(--line)"}`,
                      background: deliveryMethod === o.key ? "rgba(184,134,11,.08)" : "#fff",
                      borderRadius: 10, cursor: "pointer", font: "inherit",
                      fontWeight: deliveryMethod === o.key ? 600 : 400,
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              {deliveryMethod === "relais" && relaisPossible && (
                <>
                  <RelaisPicker selected={relais} onSelect={(p) => { setRelais(p); setError(""); }} weightGrams={totalGrams} country={country} />
                  {relais && (
                    <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", margin: "10px 0 0" }}>
                      À l'étape suivante, vous indiquerez seulement vos coordonnées (nom, téléphone) :
                      votre colis sera livré au point relais choisi ci-dessus.
                    </p>
                  )}
                </>
              )}

              {deliveryMethod === "retrait" && retraitPossible && (
                <div style={{ marginTop: 12 }}>
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
