"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { formatEuro } from "@/lib/format";
import { startCheckout } from "@/lib/checkout";
import FreeShippingBar from "./FreeShippingBar";

export default function CartDrawer() {
  const {
    items,
    total,
    drawerOpen,
    setDrawerOpen,
    removeItem,
    updateQuantity,
  } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setError("");
    setLoading(true);
    try {
      await startCheckout(items);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  function goToCart() {
    setDrawerOpen(false);
    router.push("/panier");
  }

  return (
    <>
      <div
        className={`drawer-overlay ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen}>
        <div className="drawer-head">
          <h3>Votre panier</h3>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Fermer">
            ×
          </button>
        </div>

        <div className="drawer-body">
          {items.length === 0 ? (
            <p className="drawer-empty">
              Votre panier est vide.
              <br />
              Découvrez nos créations ✨
            </p>
          ) : (
            items.map((item) => (
              <div className="cart-line" key={item.key}>
                <div className="cart-line-thumb">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} />
                  ) : null}
                </div>
                <div className="cart-line-info">
                  <h4>{item.name}</h4>
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
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-foot">
            <FreeShippingBar compact />
            <div className="drawer-total">
              <span>Sous-total</span>
              <span>{formatEuro(total)}</span>
            </div>
            <p className="drawer-note">Frais de livraison calculés au paiement.</p>
            {error && <div className="notice">{error}</div>}
            <button className="btn btn-gold btn-block" onClick={handleCheckout} disabled={loading}>
              {loading ? "Redirection…" : "Payer maintenant"}
            </button>
            <button
              className="btn btn-outline btn-block"
              style={{ marginTop: 10 }}
              onClick={goToCart}
            >
              Voir le panier
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
