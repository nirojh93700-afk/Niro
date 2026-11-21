"use client";
// Fichiers SVG validés par le gérant pour cette commande (21/11/2026), dans la fiche atelier : télécharger pour xTool.
import { useEffect, useState } from "react";

export default function SvgValides({ order, adminKey, print = false }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const k = adminKey || (typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") : "");
    if (!order?.id || !k) return;
    let vivant = true;
    fetch(`/api/admin/fichiers-gravure?orderId=${encodeURIComponent(order.id)}`, { headers: { "x-admin-key": k } })
      .then((r) => r.json()).then((j) => {
        const c = j?.fichiers?.[order.id];
        if (vivant && c?.items) setItems(Object.entries(c.items).filter(([, v]) => v.statut === "valide").map(([id, v]) => ({ id, ...v })));
      }).catch(() => {});
    return () => { vivant = false; };
  }, [order?.id, adminKey]);
  if (!items.length) return null;
  return (
    <div className="svgv">
      <div className="svgv-t">✂️ Fichier{items.length > 1 ? "s" : ""} SVG à graver — validé{items.length > 1 ? "s" : ""}</div>
      <div className="svgv-l">
        {items.map((f, i) => (
          <div key={f.id} className="svgv-c">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/img/${f.svgId}`} alt="" />
            <span>{f.largeurMm} mm de large</span>
            {!print ? <a className="btn btn-gold" href={`/api/img/${f.svgId}?dl=gravure-${order.ref || "commande"}${items.length > 1 ? "-" + (i + 1) : ""}`}>⬇ Télécharger le SVG</a> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
