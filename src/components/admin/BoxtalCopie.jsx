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

import { nomLivraison, nomLivraisonDifferent } from "@/lib/nomLivraison";
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

export default function BoxtalCopie({ order }) {
  const a = order.shippingAddress || {};
  const dims = useMemo(() => dimsParDefaut(order.items), [order.items]);
  const poids = useMemo(() => poidsEstime(order.items), [order.items]);
  // Prénom / Nom : Boxtal les demande séparés — on coupe au premier espace.
  // Si le client a tapé son ADRESSE dans le champ « nom » (incident 0GTB1LZ5), on
  // prend le nom du devis / du client et on prévient.
  const { prenom, nom, suspect } = nomLivraison(order);
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
      {suspect ? (
        <p style={{ margin: "4px 0 6px", padding: "6px 10px", background: "#fdecec", border: "2px solid #d64545", borderRadius: 8, color: "#b32b2b", fontWeight: 700, fontSize: "0.85rem" }}>
          ⚠️ Le client a écrit une ADRESSE dans le champ « nom » du paiement : vérifie le prénom / nom ci-dessous (« {order.shippingName || order.customerName} »).
        </p>
      ) : null}
      {autreNom.different ? (
        <p style={{ margin: "4px 0 6px", padding: "6px 10px", background: "#fff4e0", border: "2px solid #e0a030", borderRadius: 8, color: "#8a5a00", fontWeight: 700, fontSize: "0.85rem" }}>
          ⚠️ Le colis est au nom de « {autreNom.livraison} », pas de la cliente (« {autreNom.cliente} ») : c&apos;est le nom saisi pour la livraison (un cadeau ?). Garde-le sur l&apos;étiquette, ou confirme avec elle en cas de doute.
        </p>
      ) : null}
      <Ligne label="Prénom" valeur={prenom} />
      <Ligne label="Nom" valeur={nom} gras />
      <Ligne label="Adresse" valeur={[a.line1, a.line2].filter(Boolean).join(", ")} />
      <Ligne label="Code postal ou ville" valeur={[a.postal_code, a.city].filter(Boolean).join(" ")} />
      <Ligne label="E-mail" valeur={order.customerEmail} />
      <Ligne label="Mobile" valeur={order.customerPhone} />
      {order.relaisPoint ? <Ligne label="📍 Point relais choisi" valeur={order.relaisPoint} gras /> : null}

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
