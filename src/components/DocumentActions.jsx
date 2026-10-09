"use client";

import { useEffect, useState } from "react";
import RelaisPicker from "@/components/RelaisPicker";

const euro = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);
const prixPort = (n) => (n === 0 ? "Offerte" : euro(n));

export default function DocumentActions({ id, type, status, clientEmail = "", totalArticles = 0, livraison = false }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  // Code promo (devis seulement) : le client s'inscrit, reçoit son code, le saisit ici.
  const [ouvert, setOuvert] = useState(false);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [verif, setVerif] = useState(false);
  const [promo, setPromo] = useState(null); // { code, remise, label, total, email }
  const [promoMsg, setPromoMsg] = useState("");
  const peutCode = type !== "facture" && status !== "paye";
  // Livraison choisie par le client (devis dont chaque ligne a un poids) — maquette validée 03/10/2026.
  const peutLivrer = livraison && type !== "facture" && status !== "paye";
  const [method, setMethod] = useState("domicile");
  const [relais, setRelais] = useState(null);
  const [tarifs, setTarifs] = useState(null); // { poids, domicile, relaisOk, relaisDes }
  const [portRelais, setPortRelais] = useState(null);

  useEffect(() => {
    if (!peutLivrer) return;
    let vivant = true;
    fetch("/api/quote-shipping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
      .then((r) => r.json()).then((d) => { if (vivant && d.actif) setTarifs(d); }).catch(() => {});
    return () => { vivant = false; };
  }, [id, peutLivrer]);

  async function choisirRelais(p) {
    setRelais(p); setPortRelais(null); setErr("");
    try {
      const res = await fetch("/api/quote-shipping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, method: "relais", relaisPoint: p }) });
      const d = await res.json();
      if (typeof d.price === "number") setPortRelais(d.price);
    } catch { /* le prix exact est de toute façon recalculé au paiement */ }
  }

  const port = !peutLivrer ? null : method === "relais" ? (relais ? portRelais : null) : (tarifs ? tarifs.domicile : null);
  const remise = promo ? promo.remise : 0;
  const total = peutLivrer && port != null ? Math.round((totalArticles - remise + port) * 100) / 100 : null;
  const bloque = peutLivrer && (!tarifs || (method === "relais" && !relais) || port == null);

  async function appliquer() {
    setPromoMsg(""); setPromo(null);
    if (!code.trim()) { setPromoMsg("Saisissez votre code promo."); return; }
    setVerif(true);
    try {
      const res = await fetch("/api/quote-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, code, email: clientEmail || email }),
      });
      const d = await res.json();
      if (d.valid) setPromo({ code: d.code, remise: d.remise, label: d.label, total: d.total, email: d.email || (clientEmail || email) });
      else if (d.needEmail) setPromoMsg("Indiquez l'adresse e-mail avec laquelle vous vous êtes inscrit(e).");
      else if (d.wrongEmail) setPromoMsg("Ce code est réservé à l'adresse e-mail à laquelle il a été envoyé.");
      else if (d.used) setPromoMsg("Ce code a déjà été utilisé.");
      else if (d.expired) setPromoMsg("Ce code a expiré.");
      else if (d.boutiqueSeulement) setPromoMsg("Ce code s'utilise sur la boutique, pas sur un devis.");
      else setPromoMsg("Ce code n'est pas valable pour ce devis.");
    } catch {
      setPromoMsg("Erreur réseau. Réessayez.");
    } finally {
      setVerif(false);
    }
  }

  async function pay() {
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/quote-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...(promo ? { promoCode: promo.code, promoEmail: promo.email } : {}),
          ...(peutLivrer ? { deliveryMethod: method, ...(method === "relais" ? { relaisPoint: relais } : {}) } : {}),
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setErr(data.error || "Erreur.");
    } catch {
      setErr("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="doc-actions" style={{ marginTop: 24 }}>
      {peutLivrer && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: "0.92rem", fontWeight: 600, marginBottom: 8 }}>Mode de livraison</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { key: "domicile", label: "🏠 À domicile", sub: tarifs ? prixPort(tarifs.domicile) : "", show: true },
              { key: "relais", label: "📍 Point relais", sub: tarifs && tarifs.relaisOk ? (tarifs.relaisDes === 0 ? "Offerte" : `à partir de ${euro(tarifs.relaisDes)}`) : "", show: !tarifs || tarifs.relaisOk },
            ].filter((o) => o.show).map((o) => (
              <button key={o.key} type="button" onClick={() => { setMethod(o.key); setErr(""); }}
                style={{ flex: "1 1 45%", padding: "12px 10px", border: `1.5px solid ${method === o.key ? "var(--gold-dark, #b8860b)" : "var(--line)"}`, background: method === o.key ? "rgba(184,134,11,.08)" : "#fff", borderRadius: 10, cursor: "pointer", font: "inherit", fontWeight: method === o.key ? 600 : 400 }}>
                {o.label}
                {o.sub ? <small style={{ display: "block", fontWeight: 400, color: "var(--ink-soft)", fontSize: "0.78rem", marginTop: 2 }}>{o.sub}</small> : null}
              </button>
            ))}
          </div>
          {method === "domicile" ? (
            <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "10px 0 0", lineHeight: 1.5 }}>
              Votre adresse de livraison et votre téléphone vous seront demandés à l&apos;étape suivante (paiement sécurisé).
              {tarifs && typeof tarifs.express === "number" ? (
                <> À cette étape, vous pourrez aussi choisir l&apos;<strong>Express Chronopost</strong> ({euro(tarifs.express)}, 24/48 h après confection).</>
              ) : null}
            </p>
          ) : (
            <>
              <RelaisPicker selected={relais} onSelect={choisirRelais} weightGrams={tarifs ? tarifs.poids : 0} country="FR" />
              <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "10px 0 0", lineHeight: 1.5 }}>
                Votre colis sera livré au point relais choisi ; à l&apos;étape suivante, vous indiquerez seulement vos coordonnées (nom, téléphone).
              </p>
            </>
          )}
        </div>
      )}
      {peutCode && (
        <div className="doc-promo no-print" style={{ marginBottom: 16 }}>
          {!ouvert && !promo ? (
            <button type="button" onClick={() => setOuvert(true)}
              style={{ background: "none", border: 0, padding: 0, color: "var(--gold-dark)", textDecoration: "underline", cursor: "pointer", font: "inherit", fontWeight: 600 }}>
              J&apos;ai un code promo
            </button>
          ) : promo ? (
            <div style={{ background: "#eef7ee", border: "1px solid #bcd9bc", borderRadius: 10, padding: "12px 14px", fontSize: "0.92rem" }}>
              <strong>Code {promo.code} appliqué ({promo.label})</strong> : −{euro(promo.remise)} sur vos articles.
              <div style={{ marginTop: 4 }}>Total à payer : <strong>{euro(promo.total)}</strong></div>
              <button type="button" onClick={() => { setPromo(null); setCode(""); setOuvert(true); }}
                style={{ background: "none", border: 0, padding: 0, marginTop: 6, color: "var(--ink-soft)", textDecoration: "underline", cursor: "pointer", font: "inherit", fontSize: "0.82rem" }}>
                Retirer le code
              </button>
            </div>
          ) : (
            <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "14px", background: "var(--paper)" }}>
              <label htmlFor="doc-code" style={{ display: "block", fontWeight: 600, fontSize: "0.88rem", marginBottom: 6 }}>Code promo</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input id="doc-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === "Enter") appliquer(); }}
                  placeholder="Ex : BIENVENUE10" autoCapitalize="characters" autoComplete="off"
                  style={{ flex: "1 1 180px", minWidth: 0, padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", font: "inherit" }} />
                <button type="button" className="btn btn-outline" onClick={appliquer} disabled={verif}>{verif ? "Vérification…" : "Appliquer"}</button>
              </div>
              {!clientEmail && (
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Votre adresse e-mail (celle de l'inscription)" autoComplete="email"
                  style={{ width: "100%", boxSizing: "border-box", marginTop: 8, padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", font: "inherit" }} />
              )}
              {promoMsg && <div role="alert" style={{ marginTop: 8, fontSize: "0.85rem", color: "#b4552f" }}>{promoMsg}</div>}
            </div>
          )}
        </div>
      )}
      {peutLivrer && (
        <div style={{ margin: "0 0 18px", border: "1px solid #e7d3a1", borderRadius: 12, background: "linear-gradient(135deg,#fbf4e6,#fffdf9)", padding: "6px 14px" }}>
          {[
            ["Articles", euro(totalArticles)],
            ...(remise ? [[`Remise ${promo.code} (${promo.label})`, `−${euro(remise)}`]] : []),
            [method === "relais" ? "Livraison en point relais" : "Livraison à domicile", port == null ? "à choisir" : prixPort(port)],
          ].map(([l, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px dashed #e7d3a1", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--ink-soft)" }}>{l}</span><b style={{ whiteSpace: "nowrap" }}>{v}</b>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--ink-soft)" }}>Total à payer</span><b style={{ fontSize: "1.15rem", color: "var(--gold-dark)" }}>{total == null ? "—" : euro(total)}</b>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {status !== "paye" && (
          <button className="btn btn-gold" onClick={pay} disabled={loading || bloque}>
            {loading ? "Redirection…" : (type === "facture" ? "Payer en ligne" : "Accepter et payer en ligne")}
          </button>
        )}
        {status === "paye" && (
          <span className="btn btn-outline" style={{ color: "#256b34", cursor: "default" }}>✓ Payé</span>
        )}
        <button className="btn btn-outline" onClick={() => window.print()}>Imprimer / Enregistrer en PDF</button>
        {err && <div className="notice" style={{ width: "100%" }}>{err}</div>}
      </div>
      {peutLivrer && method === "relais" && !relais && (
        <p style={{ fontSize: "0.78rem", color: "#b4552f", background: "#fff5ee", border: "1px solid #f2cdb6", borderRadius: 10, padding: "8px 12px", margin: "10px 0 0" }}>
          Choisissez votre point relais pour continuer.
        </p>
      )}
    </div>
  );
}
