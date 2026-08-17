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
import { TableGravure } from "@/lib/engravingSheet";

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

      {/* Tableau « à graver » : une face par ligne (module partagé avec la
         page Atelier). C'est ce qu'on lit devant la machine. */}
      {(order.spec || []).map((item, i) => <TableGravure key={i} item={item} />)}

      <FicheAtelier spec={order.spec} />

      <p style={{ marginTop: 14, fontSize: "0.78rem", color: "#777" }}>
        Niv Création — fiche interne, à graver à l&apos;identique.
      </p>
    </div>,
    document.body
  );
}
