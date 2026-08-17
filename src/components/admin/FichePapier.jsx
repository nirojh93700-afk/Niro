"use client";

// =============================================================================
// FICHE PAPIER — la feuille qui sort de l'imprimante pour une commande.
// -----------------------------------------------------------------------------
// Rendue dans un PORTAIL, à la racine de la page : à l'impression, seule cette
// feuille est envoyée à l'imprimante (le reste de l'écran est masqué par la
// règle `@media print` de globals.css). Sans ce portail, l'écran très long de la
// gestion sortait en pages blanches supplémentaires.
// Invisible à l'écran : elle ne sert qu'au papier.
// =============================================================================

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import FicheAtelier from "@/components/admin/FicheAtelier";
import { getProductBySlug } from "@/lib/products";
import { getFontLabel } from "@/lib/fonts";

// « Quel texte sur quelle face » : une ligne par face réellement gravée.
// Les libellés du site (« Gravure — Page 1 (+5 €) ») sont nettoyés de leur prix,
// inutile à l'atelier. Les faces laissées vides ne sont pas listées.
function lignesGravure(item) {
  const produit = getProductBySlug(item.slug);
  const champs = item.fields || {};
  const lignes = [];
  for (const f of produit?.personalizationFields || []) {
    if (f.type === "note" || f.type === "photo") continue;
    const brut = champs[f.key];
    if (typeof brut !== "string" || !brut.trim()) continue;
    const face = String(f.label || f.key)
      .replace(/^Gravure\s*[—-]\s*/i, "")
      .replace(/\s*\(\s*\+?[\d.,]+\s*€\s*\)/gi, "")
      .replace(/\s*\(texte inclus\)/gi, "")
      .trim();
    let texte = brut.trim();
    if (f.type === "font") texte = getFontLabel(texte) || texte;
    else if (f.type === "select") texte = (f.options || []).find((o) => o.value === texte)?.label || texte;
    lignes.push({ face: f.type === "font" ? "Police de gravure" : face, texte, police: f.type === "font" });
  }
  return lignes;
}

export default function FichePapier({ order, fmtDate }) {
  const [pret, setPret] = useState(false);
  useEffect(() => setPret(true), []); // portail seulement côté navigateur
  if (!pret || typeof document === "undefined") return null;

  const a = order.shippingAddress || {};
  const adresse = [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(" "), a.country]
    .filter(Boolean).join(", ");
  // Point relais : on l'affiche SEUL (il contient déjà le transporteur et
  // l'adresse), sinon on affiche le mode de livraison.
  const livraison = order.relaisPoint || order.shippingMethod || "";

  return createPortal(
    <div className="zone-impression">
      <div className="entete-impression">
        <h2 style={{ margin: 0, fontFamily: "Georgia,serif", fontSize: "1.5rem" }}>
          Fiche atelier — commande #{order.ref}
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: "0.9rem" }}>
          {fmtDate ? fmtDate(order.createdAt) : ""} · {order.customerName}
          {order.customerPhone ? ` · ${order.customerPhone}` : ""}
        </p>

        <table style={{ marginTop: 10, borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <tbody>
            <tr>
              <td style={{ padding: "2px 10px 2px 0", verticalAlign: "top", color: "#666" }}>Livrer à</td>
              <td style={{ padding: "2px 0" }}>
                <strong>{order.shippingName || order.customerName}</strong>
                {adresse ? <> — {adresse}</> : null}
              </td>
            </tr>
            {livraison ? (
              <tr>
                <td style={{ padding: "2px 10px 2px 0", verticalAlign: "top", color: "#666" }}>Livraison</td>
                <td style={{ padding: "2px 0" }}>{livraison}</td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10, fontSize: "0.9rem" }}>
          <tbody>
            {(order.items || []).map((it, i) => (
              <tr key={i}>
                <td style={{ padding: "4px 0", borderTop: "1px solid #ddd" }}>
                  <strong>{it.quantity}× {it.name}</strong>
                  {it.details ? <div style={{ color: "#555" }}>{it.details}</div> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {order.demandeGravure || order.messageGraver ? (
          <p style={{ marginTop: 8, padding: "6px 10px", border: "1px solid #c9a24b", fontSize: "0.9rem" }}>
            <strong>Demandé par la cliente :</strong>{" "}
            {[order.demandeGravure, order.messageGraver].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>

      {/* Tableau « à graver » : une face par ligne, dans l'ordre de la fiche
         produit. C'est ce qu'on lit devant la machine. */}
      {(order.spec || []).map((item, i) => {
        const lignes = lignesGravure(item);
        if (!lignes.length) return null;
        return (
          <div key={i} style={{ marginBottom: 14 }}>
            <h3 style={{ margin: "0 0 6px", fontFamily: "Georgia,serif", fontSize: "1.05rem" }}>
              À graver — {item.name}{item.variantTitle ? ` (${item.variantTitle})` : ""}
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
              <tbody>
                {lignes.map((l, j) => (
                  <tr key={j} style={{ background: l.police ? "#f7f2e6" : "transparent" }}>
                    <td style={{ border: "1px solid #999", padding: "6px 10px", width: "38%", fontWeight: 600 }}>
                      {l.face}
                    </td>
                    <td style={{ border: "1px solid #999", padding: "6px 10px", fontSize: l.police ? "0.95rem" : "1.15rem" }}>
                      {l.texte}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <FicheAtelier spec={order.spec} />

      <p style={{ marginTop: 14, fontSize: "0.78rem", color: "#777" }}>
        Niv Création — fiche interne, à graver à l&apos;identique.
      </p>
    </div>,
    document.body
  );
}
