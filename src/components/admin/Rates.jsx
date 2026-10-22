"use client";

// =============================================================================
// PIÈCE RATÉE / À REFAIRE (12/10/2026) — gérant : « si je grave mal et je recommence, je dis combien,
// il faut que ça diminue le stock automatiquement ». Un bouton par article commandé (page Atelier et
// file de production) : quantité ratée → la ligne de stock du produit baisse, le coût perdu est gardé
// (déduit du gain de la commande et dans Bénéfices). « Annuler » rend la quantité au stock.
// =============================================================================

import { useMemo, useState } from "react";
import { getProductBySlug, products as CATALOGUE } from "@/lib/products";
import { VARIANT_COSTS } from "@/lib/productCosts";
import VarBadge from "@/components/admin/VarBadge";
import { apparierSpec } from "@/lib/orderSpec";

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";
const jour = (t) => { try { return new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" }); } catch { return ""; } };

// Lignes de stock du produit (une par stockId), avec le libellé des choix qui la partagent.
function lignesStock(product) {
  const map = new Map();
  for (const v of product?.variants || []) {
    const sid = v.stockId || v.id;
    if (!sid) continue;
    // Deux tailles (verre à vin 36 / 47 cl) ont les mêmes titres « À l'unité »… : on précise la taille.
    const taille = v.taille ? (product.tailles?.options?.find((o) => o.id === v.taille)?.title || `${v.taille} cl`) : "";
    const titre = [taille, v.title].filter(Boolean).join(" · ");
    const l = map.get(sid) || { sid, titres: [], titresBruts: [] };
    if (titre && !l.titres.includes(titre)) l.titres.push(titre);
    if (v.title) l.titresBruts.push(v.title);
    map.set(sid, l);
  }
  return [...map.values()];
}

// Lignes de stock réellement décomptées au paiement (métadonnée Stripe « stock » de la commande).
function stocksCommande(o) {
  try { return (JSON.parse(o.stock || "[]") || []).map((x) => String(x[0])); } catch { return []; }
}

// Ratés déjà saisis pour un article d'une commande (somme des coûts pour le gain).
export function ratesDe(mat, orderId, slug, verre, variantTitle, nom) {
  return (mat?.rates || []).filter((r) => r.orderId === orderId && (!slug || r.slug === slug)
    && (slug || !nom || r.name === nom)
    && (!verre || !r.verre || r.verre === verre)
    && (!variantTitle || !r.variantTitle || r.variantTitle === variantTitle));
}
export const coutRates = (liste) => (liste || []).reduce((s, r) => s + (Number(r.cout) || 0), 0);

// Produit du catalogue qui porte une ligne de stock (lignes de devis : pas d'identifiant produit).
function produitDuStock(sid) {
  if (!sid) return "";
  return CATALOGUE.find((p) => (p.variants || []).some((v) => (v.stockId || v.id) === sid))?.slug || "";
}
const CHOIX_PRODUITS = CATALOGUE.filter((p) => (p.variants || []).length)
  .map((p) => ({ slug: p.slug, name: p.name || p.slug })).sort((a, b) => a.name.localeCompare(b.name, "fr"));

export default function BoutonRate({ o, item, mat, adminKey, onSaved }) {
  // Ligne de devis (sur mesure) : pas de produit enregistré → on le retrouve par la ligne de stock
  // retirée au paiement s'il n'y en a qu'une, sinon le gérant le choisit dans la liste.
  const sansProduit = !item.slug;
  const slugDevis = useMemo(() => {
    if (!sansProduit) return "";
    const payes = stocksCommande(o);
    return produitDuStock(item.stockId) || (payes.length === 1 ? produitDuStock(payes[0]) : "");
  }, [sansProduit, o, item.stockId]);
  const [slugChoisi, setSlugChoisi] = useState(item.slug || slugDevis);
  const slug = item.slug || slugChoisi;
  const product = getProductBySlug(slug);
  const lignes = useMemo(() => lignesStock(product), [product]);
  const stock = mat?.stock || {};
  // Ligne proposée : celle que la commande a vraiment décomptée au paiement (bonne taille),
  // sinon celle du choix commandé, sinon la première.
  const defSid = useMemo(() => {
    // Variante exacte connue (commandes récentes, ou retrouvée par Gestion) : c'est sa ligne de stock.
    const vExacte = item.variantId ? (product?.variants || []).find((x) => x.id === item.variantId) : null;
    if (vExacte) return vExacte.stockId || vExacte.id;
    const payes = stocksCommande(o);
    const duTitre = lignes.filter((l) => item.variantTitle && l.titresBruts.includes(item.variantTitle));
    const parPaiement = (duTitre.length ? duTitre : lignes).find((l) => payes.includes(l.sid));
    return parPaiement?.sid || duTitre[0]?.sid || lignes[0]?.sid || "";
  }, [o, item.variantTitle, item.variantId, product, lignes]);
  const coutDe = (sid) => { const c = VARIANT_COSTS[sid] ?? (Number(product?.cost) > 0 ? Number(product.cost) : null); return c == null ? "" : String(c).replace(".", ","); };

  const [ouvert, setOuvert] = useState(false);
  const [qty, setQty] = useState(1);
  const [sid, setSid] = useState(defSid);
  const [cout, setCout] = useState(coutDe(defSid));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const liste = ratesDe(mat, o.id, item.slug, item.verre, item.variantTitle, item.name);
  const unit = Number(String(cout).replace(",", ".")) || 0;
  const valeur = typeof stock[sid] === "number" ? stock[sid] : null;

  function choisirProduit(s2) {
    setSlugChoisi(s2);
    const p2 = getProductBySlug(s2);
    const ls = lignesStock(p2);
    const l = ls.find((x) => stocksCommande(o).includes(x.sid)) || ls[0];
    const c = l ? (VARIANT_COSTS[l.sid] ?? (Number(p2?.cost) > 0 ? Number(p2.cost) : null)) : null;
    setSid(l?.sid || ""); setCout(c == null ? "" : String(c).replace(".", ","));
  }
  function ouvrir() { setQty(1); setSid(defSid); setCout(coutDe(defSid)); setNote(""); setErr(""); setOuvert(true); }
  async function appeler(body) {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/admin/materiel", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Échec de l'enregistrement.");
      return d;
    } catch (e) { setErr(e.message); return null; } finally { setBusy(false); }
  }
  async function enregistrer() {
    if (sansProduit && !product) { setErr("Choisissez d'abord le produit raté."); return; }
    const d = await appeler({
      action: "rate", orderId: o.id, ref: o.ref || "", slug, name: item.name || product?.name || "",
      variantTitle: item.variantTitle || "", verre: item.verre || null, stockId: sid, qty, cout: Math.round(unit * qty * 100) / 100, note,
    });
    if (d) { setOuvert(false); onSaved?.(); }
  }
  async function annuler(r) {
    if (!window.confirm(`Annuler ce raté ? ${r.retire ? `${r.retire} pièce${r.retire > 1 ? "s" : ""} revien${r.retire > 1 ? "nent" : "t"} dans le stock.` : ""}`)) return;
    const d = await appeler({ action: "annulerRate", id: r.id });
    if (d) onSaved?.();
  }
  const libLigne = (l) => l.titres.join(" / ") || l.sid;

  return (
    <div className="rt">
      {liste.length ? (
        <ul className="rt-liste">
          {liste.map((r) => (
            <li key={r.id}>
              <span>✗ <b>{r.qty} raté{r.qty > 1 ? "s" : ""}</b> · {jour(r.at)}
                {r.suivi ? <> · stock {r.avant} → {r.apres}</> : <> · stock non suivi, rien retiré</>}
                {r.cout ? <> · <b className="rt-perte">−{euro(r.cout)}</b></> : null}
                {r.note ? <> · {r.note}</> : null}
              </span>
              <button type="button" className="rt-annul" disabled={busy} onClick={() => annuler(r)}>Annuler</button>
            </li>
          ))}
        </ul>
      ) : null}
      {!ouvert ? (
        <button type="button" className="btn btn-outline rt-btn" onClick={ouvrir}>✗ Raté — à refaire</button>
      ) : (
        <div className="rt-form">
          <div className="rt-titre">Pièce ratée : {item.name || product?.name}<VarBadge texte={item.variantDetail || item.variantTitle} />{item.verre ? ` (verre ${item.verre})` : ""}</div>
          {sansProduit ? (
            <label className="rt-ligne">
              <span>Quel produit ? (commande sur devis)</span>
              <select value={slugChoisi} onChange={(e) => choisirProduit(e.target.value)}>
                <option value="">— Choisir le produit raté —</option>
                {CHOIX_PRODUITS.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              </select>
            </label>
          ) : null}
          <div className="rt-ligne">
            <span>Combien de pièces ratées ?</span>
            <span className="rt-qty">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Moins">−</button>
              <b>{qty}</b>
              <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Plus">+</button>
            </span>
          </div>
          {lignes.length > 1 ? (
            <label className="rt-ligne">
              <span>Retirer du stock</span>
              <select value={sid} onChange={(e) => { setSid(e.target.value); setCout(coutDe(e.target.value)); }}>
                {lignes.map((l) => <option key={l.sid} value={l.sid}>{libLigne(l)}{typeof stock[l.sid] === "number" ? ` (stock ${stock[l.sid]})` : " (non suivi)"}</option>)}
              </select>
            </label>
          ) : null}
          <p className="rt-info">
            {sansProduit && !product ? "Choisissez le produit pour savoir quel stock baisser." : valeur === null ? "Ce stock n'est pas suivi (illimité) : rien ne sera retiré, mais le coût perdu est gardé."
              : <>Stock {valeur} → <b>{Math.max(0, valeur - qty)}</b> après l&apos;enregistrement.</>}
          </p>
          <label className="rt-ligne">
            <span>Coût d&apos;achat d&apos;une unité de ce stock (€)</span>
            <input inputMode="decimal" value={cout} onChange={(e) => setCout(e.target.value)} placeholder="ex. 3,24" />
          </label>
          <label className="rt-ligne rt-note">
            <span>Que s&apos;est-il passé ? (facultatif)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="ex. gravure décalée, verre fendu" />
          </label>
          <p className="rt-info">Perte : <b className="rt-perte">{euro(unit * qty)}</b>, déduite du gain de la commande et des bénéfices.</p>
          {err ? <div className="notice">{err}</div> : null}
          <div className="rt-actions">
            <button type="button" className="btn btn-outline" onClick={() => setOuvert(false)}>Annuler</button>
            <button type="button" className="btn btn-gold" disabled={busy || (sansProduit && !product)} onClick={enregistrer}>{busy ? "…" : "Enregistrer le raté"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Un bouton « Raté — à refaire » par article d'une commande, le MÊME partout (file de production,
// fiche complète, atelier, commandes sur devis), quel que soit le statut sauf annulée / remboursée
// (22/10/2026, gérant : « il faut que tout soit pareil… j'ai raté une flûte, je mets où »).
export function RatesCommande({ o, mat, adminKey, onSaved }) {
  if (["annulee", "remboursee"].includes(o.status)) return null;
  const specParLigne = apparierSpec(o.items, o.spec);
  const lignes = (o.items || []).map((it, i) => ({ it, s: specParLigne[i] }))
    .filter(({ it }) => !/livraison|point relais|retrait|exp[ée]dition/i.test(it.name || ""));
  if (!lignes.length) return null;
  return (
    <div className="rt-items">
      {lignes.map(({ it, s }, i) => (
        <div key={i}>
          {lignes.length > 1 ? <div className="rt-nom">{it.name}</div> : null}
          <BoutonRate o={o} item={{ slug: it.slug || "", name: it.name, stockId: it.stockId || "", variantTitle: s?.variantTitle || "", variantId: s?.variantId, variantDetail: s?.variantDetail || it.variantDetail }} mat={mat} adminKey={adminKey} onSaved={onSaved} />
        </div>
      ))}
    </div>
  );
}
