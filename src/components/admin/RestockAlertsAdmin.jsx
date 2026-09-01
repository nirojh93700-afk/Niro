"use client";

import { useCallback, useEffect, useState } from "react";

// Panneau « 📩 Clients en attente de retour en stock » (Gestion → Produits & Stock).
// Montre le nombre d'inscrits par produit (= la demande réelle, utile pour
// décider quoi racheter). RIEN ne part automatiquement : le bouton « Prévenir »
// envoie l'e-mail « Il est de retour » aux inscrits, au clic de la gérante,
// puis vide la liste. « Vider » supprime la liste sans rien envoyer.
export default function RestockAlertsAdmin({ adminKey }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState("");
  const [info, setInfo] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/restock-alerts", { headers: { "x-admin-key": adminKey } });
      if (res.ok) setRows((await res.json()).rows || []);
    } catch { /* silencieux */ }
  }, [adminKey]);
  useEffect(() => { load(); }, [load]);

  async function action(slug, act, count) {
    if (act === "send" && !window.confirm(`Envoyer l'e-mail « Il est de retour » aux ${count} inscrit(s) ? (Vérifiez que le stock est bien remis avant.)`)) return;
    if (act === "clear" && !window.confirm("Vider la liste SANS rien envoyer ?")) return;
    setBusy(slug + act);
    try {
      const res = await fetch("/api/admin/restock-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ slug, action: act }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setInfo(act === "send" ? `✓ ${d.sent} e-mail(s) envoyé(s)${d.failed ? ` · ${d.failed} en échec` : ""}` : "✓ Liste vidée");
      else setInfo(d.error || "Échec.");
      await load();
    } catch { setInfo("Échec."); }
    setBusy("");
    setTimeout(() => setInfo(""), 6000);
  }

  if (!rows.length) return null;

  return (
    <div style={{ background: "#fff", border: "1px solid #ece3d2", borderRadius: 14, padding: "14px 16px", margin: "0 0 18px" }}>
      <h3 style={{ margin: "0 0 4px", fontSize: "1rem" }}>📩 Clients en attente de retour en stock</h3>
      <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
        Rien ne part automatiquement : remettez le stock tranquillement, puis cliquez « Prévenir » quand vous êtes prête.
      </p>
      {rows.map((r) => (
        <div key={r.slug} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px solid #f2ece0", fontSize: "0.88rem", flexWrap: "wrap" }}>
          <span>{r.name} <strong style={{ color: "#8a6d1f" }}>· {r.count} inscrit{r.count > 1 ? "s" : ""}</strong></span>
          <span style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-gold" style={{ padding: "5px 12px", fontSize: "0.8rem" }} disabled={busy === r.slug + "send"} onClick={() => action(r.slug, "send", r.count)}>
              📩 Prévenir les {r.count}
            </button>
            <button className="btn btn-outline" style={{ padding: "5px 10px", fontSize: "0.8rem" }} disabled={busy === r.slug + "clear"} onClick={() => action(r.slug, "clear", r.count)}>
              Vider
            </button>
          </span>
        </div>
      ))}
      {info && <div style={{ marginTop: 8, fontSize: "0.85rem", color: info.startsWith("✓") ? "#256b34" : "#b4452f", fontWeight: 600 }}>{info}</div>}
    </div>
  );
}
