"use client";

// =============================================================================
// DEUX ACTIONS DU MENU « PLUS D'ACTIONS » DE LA FICHE COMMANDE (08/11/2026) :
//   · RefaireDevis     — « Refaire la même commande → devis » : un devis prérempli
//     (mêmes articles, même gravure, prix payés, cliente) créé par
//     POST /api/admin/quotes. RIEN n'est envoyé à la cliente : le gérant l'envoie
//     lui-même depuis Devis & factures.
//   · CrediterCagnotte — « Créditer la cagnotte (avoir) » : crédit manuel par
//     POST /api/admin/cagnottes (0,01 à 100 €). Aucun e-mail ne part.
// Confirmations EN LIGNE (classe `fc-confirm`), jamais de fenêtre système.
// =============================================================================
import { useMemo, useState } from "react";
import Ic from "@/components/admin/IconesGestion";
import { getProductBySlug } from "@/lib/products";
import { formatEuro } from "@/lib/format";
import { refDe, adresseLigne } from "@/lib/fileCommandes";

// Clés des réglages qui ne sont pas un texte à relire (images, mises en page, fichiers).
const CLES_TECHNIQUES = /^(photo|image|logo|src|url|layout|apercu|preview|artwork|capture|fichier|data|cn|mp|motifCount|texteSource|tradOk|direct|langueCles)$|Image$|Src$|Layout$|Source$/i;

// Résumé de la gravure d'une ligne : le récap écrit à la commande, sinon les champs tapés.
function resumeGravure(s, it) {
  if (!s) return String(it?.personalization || "").trim();
  if (s.personalization && String(s.personalization).trim()) return String(s.personalization).trim();
  const champs = s.fields && typeof s.fields === "object" ? s.fields : {};
  const parts = [];
  for (const [k, v] of Object.entries(champs)) {
    if (typeof v !== "string" || !v.trim() || CLES_TECHNIQUES.test(k)) continue;
    if (/^(data:|https?:\/\/|\/api\/img\/)/.test(v.trim())) continue;
    parts.push(`${k} : ${v.trim()}`);
  }
  if (s.modele?.n || s.modele?.numero) parts.unshift(`Modèle n° ${s.modele.n || s.modele.numero}`);
  if (s.photoSrc) parts.push("photo de la cliente");
  if (s.emplacement && s.emplacement !== "face") parts.push(`emplacement : ${s.emplacement}`);
  return parts.join(" · ");
}

// Les lignes du devis, prêtes pour POST /api/admin/quotes (desc ≤ 200 car., qty, price, variantId, weight).
export function lignesDevisDepuisCommande(o, lignes) {
  return (lignes || []).map(({ it, s }) => {
    const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
    const prix = Number(it.unitPrice) > 0 ? Number(it.unitPrice) : (Number(it.total) || Number(it.subtotal) || 0) / qty;
    const variantId = it.variantId || s?.variantId || "";
    const slug = s?.slug || it.slug || "";
    const produit = slug ? getProductBySlug(slug) : null;
    const variante = produit && variantId ? (produit.variants || []).find((v) => v.id === variantId) : null;
    const poids = Number(variante?.weight) || Number(produit?.weight) || 0;
    const detail = s?.variantDetail || it.variantDetail || s?.variantTitle || "";
    const grav = resumeGravure(s, it);
    const desc = [it.name, detail, grav ? `gravure : ${grav}` : ""].filter(Boolean).join(" — ").slice(0, 200);
    return {
      desc,
      qty,
      price: Math.round(prix * 100) / 100,
      ...(variantId ? { variantId } : {}),
      // Sans produit rattaché, une ligne doit porter un poids pour que la cliente puisse choisir sa livraison (règle du 04/11).
      ...(!variantId ? { weight: poids > 0 ? poids : 1 } : {}),
    };
  }).filter((l) => l.desc);
}

export function RefaireDevis({ o, lignes, adminKey, onToast, onClose }) {
  const items = useMemo(() => lignesDevisDepuisCommande(o, lignes), [o, lignes]);
  const [note, setNote] = useState(`Refait d'après la commande #${refDe(o)} (même gravure)`);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");
  const [cree, setCree] = useState(null); // { id, number }
  const total = items.reduce((s, l) => s + l.qty * l.price, 0);
  const client = { name: o.customerName || o.shippingName || "", email: o.customerEmail || "", address: o.shippingAddress ? adresseLigne(o) : "" };

  async function creer() {
    setBusy(true); setErreur("");
    try {
      const r = await fetch("/api/admin/quotes", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ type: "devis", client, items, note }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "Le devis n'a pas pu être créé.");
      setCree({ id: d.id, number: d.number });
      onToast(`Devis ${d.number || ""} créé`.replace(/\s+/g, " ").trim());
    } catch (e) { setErreur(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="fc-confirm" style={{ alignItems: "stretch" }}>
      <div style={{ width: "100%", display: "grid", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><Ic n="copy" /><b>Refaire la même commande → devis</b><span style={{ color: "var(--ash-muted)" }}>Rien n&apos;est envoyé à la cliente : vous l&apos;enverrez depuis Devis &amp; factures.</span></div>
        {cree ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className="fc-pill ok"><Ic n="check" /> Devis {cree.number || ""} créé</span>
            <a className="fc-btn sm pri" href="/gestion/devis">Ouvrir Devis &amp; factures</a>
            <button type="button" className="fc-btn sm" onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
              {items.map((l, i) => (
                <li key={i} style={{ display: "flex", gap: 8, alignItems: "baseline", justifyContent: "space-between", padding: "6px 8px", background: "#fffdf8", border: "1px solid var(--ash-line)", borderRadius: 8 }}>
                  <span style={{ minWidth: 0, overflowWrap: "anywhere" }}><b>{l.qty}×</b> {l.desc}</span>
                  <b style={{ whiteSpace: "nowrap" }}>{formatEuro(l.price)}</b>
                </li>
              ))}
              {!items.length ? <li style={{ color: "var(--ash-bad)" }}>Aucun article à reprendre sur cette commande.</li> : null}
            </ul>
            <div style={{ color: "var(--ash-muted)" }}>
              Total du devis : <b style={{ color: "var(--ash-ink)" }}>{formatEuro(total)}</b> (prix payés, livraison choisie par la cliente au paiement) · Cliente : <b style={{ color: "var(--ash-ink)" }}>{client.name || "—"}</b>{client.email ? ` · ${client.email}` : " · pas d'e-mail"}{client.address ? ` · ${client.address}` : ""}
            </div>
            <textarea className="fc-note" style={{ minHeight: 48 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note du devis (visible par la cliente)" />
            {erreur ? <div style={{ color: "var(--ash-bad)", fontWeight: 600 }}>{erreur}</div> : null}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="fc-btn sm pri" disabled={busy || !items.length} onClick={creer}><Ic n="copy" /> {busy ? "Création…" : "Créer le devis"}</button>
              <button type="button" className="fc-btn sm" onClick={onClose}>Annuler</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CrediterCagnotte({ o, adminKey, onToast, onClose }) {
  const [montant, setMontant] = useState("5.00");
  const [motif, setMotif] = useState(`Geste commercial · commande #${refDe(o)}`);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");
  const [solde, setSolde] = useState(null);
  const valeur = Math.round((parseFloat(String(montant).replace(",", ".")) || 0) * 100) / 100;
  const valide = valeur >= 0.01 && valeur <= 100;

  async function crediter() {
    if (!valide) { setErreur("Montant entre 0,01 et 100 €."); return; }
    setBusy(true); setErreur("");
    try {
      const r = await fetch("/api/admin/cagnottes", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ email: o.customerEmail, amount: valeur, reason: motif.trim() || "Geste commercial" }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "Le crédit n'a pas pu être enregistré.");
      setSolde(d.balance);
      onToast(`Cagnotte créditée : nouveau solde ${d.balance != null ? formatEuro(d.balance) : "mis à jour"}`);
    } catch (e) { setErreur(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="fc-confirm" style={{ alignItems: "stretch" }}>
      <div style={{ width: "100%", display: "grid", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><Ic n="gift" /><b>Créditer la cagnotte de {o.customerEmail}</b><span style={{ color: "var(--ash-muted)" }}>Aucun e-mail ne part : la cliente voit son solde dans son espace.</span></div>
        {solde != null ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className="fc-pill ok"><Ic n="check" /> {formatEuro(valeur)} crédités · nouveau solde {formatEuro(solde)}</span>
            <button type="button" className="fc-btn sm" onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ display: "flex", gap: 6, alignItems: "center", flex: "0 1 180px" }}>Montant (€)
                <input type="number" inputMode="decimal" min="0.01" max="100" step="0.01" value={montant} onChange={(e) => { setMontant(e.target.value); setErreur(""); }} style={{ minWidth: 90, flex: 1 }} />
              </label>
              <label style={{ display: "flex", gap: 6, alignItems: "center", flex: "1 1 240px" }}>Motif
                <input type="text" maxLength={120} value={motif} onChange={(e) => setMotif(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
              </label>
            </div>
            {erreur ? <div style={{ color: "var(--ash-bad)", fontWeight: 600 }}>{erreur}</div> : null}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="fc-btn sm pri" disabled={busy || !valide} onClick={crediter}><Ic n="gift" /> {busy ? "Enregistrement…" : `Créditer ${formatEuro(valide ? valeur : 0)}`}</button>
              <button type="button" className="fc-btn sm" onClick={onClose}>Annuler</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
