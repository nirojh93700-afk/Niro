"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/components/CartContext";
import { formatEuro } from "@/lib/format";
import { startCheckout } from "@/lib/checkout";
import FreeShippingBar from "@/components/FreeShippingBar";
import CadeauChoix from "@/components/CadeauChoix";
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
  // E-mail demandé pour appliquer un code à usage unique : le blocage se fait
  // alors par PERSONNE (e-mail) et non plus par connexion internet, qui bloquait
  // à tort deux personnes d'un même foyer et laissait passer un changement de réseau.
  const [promoEmail, setPromoEmail] = useState("");

  // Cagnotte fidélité de la cliente connectée (chargée si elle a un espace + un solde).
  const [cagnotte, setCagnotte] = useState(null); // { email, balance }
  const [useCagnotte, setUseCagnotte] = useState(false);

  // Livraison : la cliente choisit entre "domicile" et "relais" (point relais).
  const [relaisEnabled, setRelaisEnabled] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("domicile");
  const [relais, setRelais] = useState(null);
  const [country, setCountry] = useState("FR");
  // Préférence de cadeau d'attente (mode délai allongé) — « Surprise » par défaut.
  const [cadeau, setCadeau] = useState("surprise");
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

  // Cagnotte : si la cliente est connectée à son espace et a un solde, on le propose.
  useEffect(() => {
    let ok = true;
    fetch("/api/espace/me")
      .then((r) => r.json())
      .then((d) => { if (ok && d?.loggedIn && d.balance > 0) setCagnotte({ email: d.email, balance: d.balance }); })
      .catch(() => {});
    return () => { ok = false; };
  }, []);

  // Montant réellement utilisable : min(solde, 50 % du sous-total). Exclusif avec le code promo.
  const cagnotteUsable = cagnotte
    ? Math.min(cagnotte.balance, Math.floor(total * 50) / 100)
    : 0;

  // Mémorise les choix de livraison (pays, domicile/relais, point relais) pour
  // que le client n'ait PAS à les refaire s'il quitte puis revient au panier.
  const choicesLoaded = useRef(false);
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("niv-cart-choices") || "{}");
      if (s.country && COUNTRIES.some((c) => c.code === s.country)) setCountry(s.country);
      if (s.deliveryMethod === "domicile" || s.deliveryMethod === "relais") setDeliveryMethod(s.deliveryMethod);
      if (s.relais && typeof s.relais === "object") setRelais(s.relais);
    } catch { /* ignore */ }
    choicesLoaded.current = true;
  }, []);
  useEffect(() => {
    if (!choicesLoaded.current) return;
    try { localStorage.setItem("niv-cart-choices", JSON.stringify({ country, deliveryMethod, relais })); } catch { /* ignore */ }
  }, [country, deliveryMethod, relais]);

  // Retrait en main propre proposé UNIQUEMENT si TOUS les articles du panier sont
  // marqués « retrait possible » (mariage). Dès qu'il y a un produit à expédier
  // (cristal, déco…), le retrait n'est pas proposé. Jamais déclenché par le poids.
  const totalGrams = items.reduce((s, i) => s + (Number(i.weight) || 200) * (i.quantity || 1), 0);
  const hasPickup = items.length > 0 && items.every((i) => i.pickup);
  // Point relais dispo : France, ou pays d'Europe desservis par Mondial Relay.
  const relaisPossible = relaisEnabled && (isFrance || EU_RELAIS_COUNTRIES.includes(country));
  const retraitPossible = isFrance && hasPickup;

  // Lien d'affiliation : si le client est arrivé via le lien d'un ambassadeur
  // (?ref=CODE mémorisé), on applique son code automatiquement (30 jours).
  useEffect(() => {
    if (promoCode) return;
    let raw;
    try { raw = localStorage.getItem("niv-ref"); } catch { return; }
    if (!raw) return;
    let ref;
    try { ref = JSON.parse(raw); } catch { return; }
    if (!ref?.code || Date.now() - (ref.ts || 0) > 30 * 24 * 3600 * 1000) return;
    fetch("/api/promo-validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: ref.code }) })
      .then((r) => r.json())
      .then((d) => { if (d.valid) { setPromoCode(ref.code); setPromoOk(true); setPromoMsg(`✓ Recommandé par un ambassadeur — code ${ref.code} appliqué (${d.label}).`); } })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyPromo() {
    setPromoMsg(""); setPromoOk(false);
    const code = promoCode.trim();
    if (!code) return;
    const email = promoEmail.trim().toLowerCase();
    try {
      const res = await fetch("/api/promo-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email }),
      });
      const d = await res.json();
      if (d.valid) { setPromoOk(true); setPromoMsg(`✓ Code valide (${d.label}) — appliqué au paiement.`); }
      else if (d.needEmail) setPromoMsg("Entrez votre e-mail pour utiliser ce code.");
      else if (d.used) setPromoMsg("Ce code a déjà été utilisé avec cette adresse e-mail.");
      else if (d.expired) setPromoMsg("Ce code a expiré.");
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
      // Cagnotte et code promo sont exclusifs (un seul coupon Stripe). Si la cagnotte
      // est cochée, elle a la priorité et le code promo n'est pas envoyé.
      const wantCagnotte = Boolean(useCagnotte && cagnotteUsable > 0);
      await startCheckout(items, postalCode, wantCagnotte ? "" : (promoOk ? promoCode.trim() : ""), delivery, country, wantCagnotte, promoEmail.trim().toLowerCase(), cadeau);
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
          {/* Mode délai allongé : encadré cadeau (délai + choix de préférence).
              N'affiche RIEN quand le mode est éteint → panier comme avant. */}
          <CadeauChoix value={cadeau} onChange={setCadeau} />
          <div className="summary-row">
            <span>Sous-total</span>
            <span>{formatEuro(total)}</span>
          </div>
          {useCagnotte && cagnotteUsable > 0 && (
            <div className="summary-row" style={{ color: "#256b34" }}>
              <span>Cagnotte fidélité</span>
              <span>−{formatEuro(cagnotteUsable)}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Livraison</span>
            <span>Calculée au paiement</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>{formatEuro(useCagnotte && cagnotteUsable > 0 ? Math.max(0, total - cagnotteUsable) : total)}<span style={{ fontSize: "0.7rem", fontWeight: 400, color: "var(--ink-soft)" }}> + livraison</span></span>
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
                  <div className="info-callout">
                    <span className="ci">📍</span>
                    <span>
                      <strong>Retrait sur rendez-vous</strong> à l'atelier : à récupérer sous <strong>14 jours</strong> après notre message « commande prête » (passé ce délai, la commande ne pourra plus être ni retirée, ni expédiée).
                      <br />Vous habitez plus loin et souhaitez tout de même venir récupérer ? Écrivez-nous <strong>avant de commander</strong> : <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a>.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {cagnotte && cagnotteUsable > 0 && (
            <div style={{ marginTop: 16, background: "linear-gradient(150deg,#241a0c,#3a2c12)", borderRadius: 12, padding: "14px 16px", color: "#f3e8d3" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={useCagnotte}
                  onChange={(e) => { setUseCagnotte(e.target.checked); if (e.target.checked) { setPromoOk(false); setPromoMsg(""); } }}
                  style={{ marginTop: 3, width: 18, height: 18, accentColor: "#c9a24b", flexShrink: 0 }}
                />
                <span>
                  <span style={{ fontWeight: 700, color: "#e2c67e" }}>Utiliser ma cagnotte fidélité</span>
                  <span style={{ display: "block", fontSize: "0.85rem", color: "#c9b78d", marginTop: 2 }}>
                    Solde : {formatEuro(cagnotte.balance)} · j&apos;utilise <strong style={{ color: "#fff" }}>{formatEuro(cagnotteUsable)}</strong> sur cette commande (jusqu&apos;à 50 % du panier).
                  </span>
                </span>
              </label>
            </div>
          )}

          <div style={{ marginTop: 16, opacity: useCagnotte ? 0.5 : 1, pointerEvents: useCagnotte ? "none" : "auto" }}>
            <label style={{ display: "block", fontSize: "0.88rem", marginBottom: 6 }}>Code promo</label>
            <input
              type="email"
              value={promoEmail}
              onChange={(e) => { setPromoEmail(e.target.value); setPromoOk(false); setPromoMsg(""); }}
              placeholder="Votre e-mail"
              autoComplete="email"
              disabled={useCagnotte}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit", marginBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value); setPromoOk(false); setPromoMsg(""); }}
                placeholder="Ex. BIENVENUE10"
                disabled={useCagnotte}
                style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit", textTransform: "uppercase" }}
              />
              <button type="button" className="btn btn-outline" onClick={applyPromo} disabled={useCagnotte}>Appliquer</button>
            </div>
            {useCagnotte
              ? <p style={{ fontSize: "0.82rem", margin: "6px 0 0", color: "var(--ink-soft)" }}>Cagnotte et code promo ne se cumulent pas.</p>
              : (promoMsg
                ? <p style={{ fontSize: "0.82rem", margin: "6px 0 0", color: promoOk ? "#256b34" : "#b4452f" }}>{promoMsg}</p>
                : <p style={{ fontSize: "0.78rem", margin: "6px 0 0", color: "var(--ink-soft)" }}>Votre e-mail sert uniquement à vérifier que le code n&apos;a pas déjà été utilisé.</p>)}
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
