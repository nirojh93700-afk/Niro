"use client";

// =============================================================================
// ENVOI BOXTAL — panneau « copier-coller » d'une commande.
// -----------------------------------------------------------------------------
// En attendant l'automatisation complète (création d'étiquette via l'API), ce
// panneau reprend les champs DANS L'ORDRE EXACT du formulaire boxtal.com :
// Départ (l'atelier, pré-rempli) → Arrivée (la cliente) → Détails de l'envoi
// (poids estimé, valeur, description). Un bouton « Copier » par champ.
// Visible uniquement dans la gestion (jamais côté client).
// =============================================================================

import { nomLivraison, nomLivraisonDifferent, nomManquant, texteNomManquant } from "@/lib/nomLivraison";
import { useMemo, useState } from "react";
import { getProductBySlug } from "@/lib/products";

// Adresse de DÉPART (l'atelier) — telle que saisie sur boxtal.com.
const DEPART = [
  ["Prénom", "Création"],
  ["Nom", "Niv"],
  ["Société", "NivCréation"],
  ["Adresse", "3 Allée des Renardeaux"],
  ["Code postal ou ville", "95350 Saint-Brice-sous-Forêt"],
  ["E-mail", "nirojh@hotmail.fr"],
  ["Mobile", "07 66 15 31 02"],
];

// Dimensions conseillées du colis selon le contenu (modifiable avant copie).
function dimsParDefaut(items) {
  const cats = new Set((items || []).map((it) => getProductBySlug(it.slug)?.category).filter(Boolean));
  if (cats.has("cristal")) return { L: 25, l: 20, H: 15 };  // boîte cristaux
  if (cats.has("verres")) return { L: 30, l: 20, H: 15 };   // verres protégés
  if (cats.has("deco") || cats.has("mariage")) return { L: 30, l: 25, H: 10 };
  // Bijoux : carton HORLIMER 305×229×76 mm acheté par la gérante (assez grand
  // pour le bijou + le Pack emballage : sac, boîte cadeau, microfibre).
  return { L: 31, l: 23, H: 8 };
}

// Poids estimé (kg) depuis le catalogue : produit × quantité + marge emballage.
function poidsEstime(items) {
  let g = 0;
  for (const it of items || []) {
    const p = getProductBySlug(it.slug);
    g += (Number(p?.weight) || 200) * (Number(it.quantity) || 1);
  }
  return Math.max(0.1, Math.round((g / 1000) * 100) / 100);
}

function Ligne({ label, valeur, gras = false }) {
  const [ok, setOk] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", borderBottom: "1px solid #f2ece0" }}>
      <span style={{ width: 170, flexShrink: 0, fontSize: "0.8rem", color: "var(--ink-soft)" }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: "0.9rem", fontWeight: gras ? 700 : 400, overflowWrap: "anywhere" }}>{valeur || "—"}</span>
      {valeur ? (
        <button
          type="button"
          className="btn btn-outline"
          style={{ padding: "2px 10px", fontSize: "0.78rem", flexShrink: 0 }}
          onClick={async () => {
            try { await navigator.clipboard.writeText(String(valeur)); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* ignore */ }
          }}
        >
          {ok ? "✓ Copié" : "Copier"}
        </button>
      ) : null}
    </div>
  );
}

function Titre({ children }) {
  return <h4 style={{ margin: "14px 0 4px", fontFamily: "Georgia,serif", color: "var(--gold-dark)", fontSize: "1rem" }}>{children}</h4>;
}

function cleAdmin() {
  try { return sessionStorage.getItem("niv-admin-key") || ""; } catch { return ""; }
}

// Corriger le nom / l'adresse de l'étiquette (02/11/2026) : enregistré dans la commande (action « livraison »).
function CorrigerLivraison({ order, onSaved }) {
  const a = order.shippingAddress || {};
  const [ouvert, setOuvert] = useState(false);
  const [f, setF] = useState({
    shippingName: order.shippingName || "", shippingCompany: order.shippingCompany || "",
    line1: a.line1 || "", line2: a.line2 || "", postal_code: a.postal_code || "", city: a.city || "",
    customerPhone: order.customerPhone || "",
  });
  const [etat, setEtat] = useState("");
  const champ = (k, label, ph = "") => (
    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--ink-soft)", margin: "6px 0 0" }}>
      {label}
      <input value={f[k]} placeholder={ph} onChange={(e) => setF({ ...f, [k]: e.target.value })}
        style={{ display: "block", width: "100%", boxSizing: "border-box", minWidth: 0, padding: "6px 8px", border: "1px solid #e2d6bb", borderRadius: 6, fontSize: "0.9rem" }} />
    </label>
  );
  async function enregistrer() {
    setEtat("…");
    try {
      const r = await fetch("/api/admin/orders", {
        method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": cleAdmin() },
        body: JSON.stringify({ id: order.id, action: "livraison", ...f }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) { setEtat(d.error || "Erreur : rien n'a été enregistré."); return; }
      onSaved(d.patch || {});
      setEtat("Enregistré ✓");
      setOuvert(false);
    } catch { setEtat("Erreur réseau : rien n'a été enregistré."); }
  }
  if (!ouvert) {
    return (
      <p style={{ margin: "6px 0 0", fontSize: "0.82rem" }}>
        <button type="button" className="btn btn-outline" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => setOuvert(true)}>✏️ Corriger le nom ou l&apos;adresse</button>
        {etat ? <span style={{ marginLeft: 8, color: "#256b34", fontWeight: 600 }}>{etat}</span> : null}
      </p>
    );
  }
  return (
    <div style={{ margin: "8px 0 4px", padding: "8px 10px", background: "#fff", border: "1px solid #ece0c4", borderRadius: 8 }}>
      {champ("shippingName", "Nom sur le colis (prénom nom)")}
      {champ("shippingCompany", "Société / établissement (facultatif)", "ex. Hôtel …")}
      {champ("line1", "Adresse")}
      {champ("line2", "Complément d'adresse (facultatif)")}
      {champ("postal_code", "Code postal")}
      {champ("city", "Ville")}
      {champ("customerPhone", "Téléphone (SMS du transporteur)")}
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-gold" style={{ padding: "6px 12px", fontSize: "0.85rem" }} onClick={enregistrer}>Enregistrer dans la commande</button>
        <button type="button" className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.85rem" }} onClick={() => setOuvert(false)}>Annuler</button>
        {etat ? <span style={{ alignSelf: "center", fontSize: "0.82rem", color: "#b32b2b" }}>{etat}</span> : null}
      </div>
    </div>
  );
}

export default function BoxtalCopie({ order: orderInitial }) {
  const [order, setOrder] = useState(orderInitial);
  const a = order.shippingAddress || {};
  const dims = useMemo(() => dimsParDefaut(order.items), [order.items]);
  const poids = useMemo(() => poidsEstime(order.items), [order.items]);
  // Prénom / Nom : Boxtal les demande séparés — on coupe au premier espace.
  // Si le client a tapé son ADRESSE dans le champ « nom » (incident 0GTB1LZ5), on
  // prend le nom du devis / du client et on prévient.
  const { prenom, nom, lieu } = nomLivraison(order);
  const manque = nomManquant(order);
  const autreNom = nomLivraisonDifferent(order);
  const description = (order.items || []).map((it) => it.name).join(", ").slice(0, 80) || "Cadeau personnalisé";

  return (
    <div style={{ background: "#faf6ee", border: "1px solid #ece0c4", borderRadius: 10, padding: "12px 14px", margin: "0 0 10px" }}>
      <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
        Les champs dans l&apos;ordre du formulaire <strong>boxtal.com</strong> — un bouton Copier par champ.
        {order.relaisPoint ? " Livraison en POINT RELAIS : choisis le point ci-dessous sur la carte Boxtal." : ""}
      </p>

      {/* Tout en haut du formulaire Boxtal : sert à retrouver l'envoi sur la
         facture Boxtal → on y met le n° de commande du site. */}
      <Ligne label="Référence interne" valeur={order.ref || ""} gras />

      <Titre>Départ (atelier)</Titre>
      {DEPART.map(([l, v]) => <Ligne key={l} label={l} valeur={v} />)}

      <Titre>Arrivée (cliente)</Titre>
      {manque.manquant && !manque.propose ? (
        <p style={{ margin: "4px 0 6px", padding: "6px 10px", background: "#fdecec", border: "2px solid #d64545", borderRadius: 8, color: "#b32b2b", fontWeight: 700, fontSize: "0.85rem" }}>
          ⚠️ Nom manquant : {texteNomManquant(manque)}. Aucun autre nom connu : demande-lui le nom à mettre sur le colis, puis « Corriger le nom ou l&apos;adresse ».
        </p>
      ) : null}
      {manque.manquant && manque.propose ? (
        <p style={{ margin: "4px 0 6px", padding: "6px 10px", background: "#fff4e0", border: "2px solid #e0a030", borderRadius: 8, color: "#8a5a00", fontWeight: 700, fontSize: "0.85rem" }}>
          ⚠️ Nom manquant au paiement : {texteNomManquant(manque)}. Nom repris {manque.source.startsWith("nom du ") ? `du ${manque.source.slice(7)}` : `(${manque.source})`} : « {manque.propose} », à confirmer avec la cliente en cas de doute.
        </p>
      ) : null}
      {autreNom.different ? (
        <p style={{ margin: "4px 0 6px", padding: "6px 10px", background: "#fff4e0", border: "2px solid #e0a030", borderRadius: 8, color: "#8a5a00", fontWeight: 700, fontSize: "0.85rem" }}>
          ⚠️ Le colis est au nom de « {autreNom.livraison} », pas de la cliente (« {autreNom.cliente} ») : c&apos;est le nom saisi pour la livraison (un cadeau ?). Garde-le sur l&apos;étiquette, ou confirme avec elle en cas de doute.
        </p>
      ) : null}
      <Ligne label="Prénom" valeur={prenom} />
      <Ligne label="Nom" valeur={nom} gras />
      <Ligne label="Société" valeur={order.shippingCompany || lieu || ""} gras />
      <Ligne label="Adresse" valeur={[a.line1, a.line2].filter(Boolean).join(", ")} />
      <Ligne label="Code postal ou ville" valeur={[a.postal_code, a.city].filter(Boolean).join(" ")} />
      <Ligne label="E-mail" valeur={order.customerEmail} />
      <Ligne label="Mobile" valeur={order.customerPhone} />
      {order.relaisPoint ? <Ligne label="📍 Point relais choisi" valeur={order.relaisPoint} gras /> : null}
      <CorrigerLivraison key={order.shippingName + (order.shippingCompany || "")} order={order} onSaved={(p) => setOrder((o) => ({ ...o, ...p }))} />

      <Titre>Détails de l&apos;envoi</Titre>
      <Ligne label="L (cm)" valeur={dims.L} />
      <Ligne label="l (cm)" valeur={dims.l} />
      <Ligne label="H (cm)" valeur={dims.H} />
      <Ligne label="Poids (kg) — estimé" valeur={poids} />
      <Ligne label="Valeur (€)" valeur={(Number(order.total) || 0).toFixed(2)} />
      <Ligne label="Description du contenu" valeur={description} />
      <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "var(--ink-soft)" }}>
        Dimensions et poids = suggestions (selon les produits du colis) : ajuste sur Boxtal si ton carton diffère.
      </p>
    </div>
  );
}
