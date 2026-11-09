"use client";

// « À racheter bientôt » (09/11/2026) : ce qui va manquer au rythme des ventes, produits et matériel.
// Lecture seule : rien n'est commandé ni modifié d'ici.
import { useEffect, useState } from "react";
import { phraseReachat } from "@/lib/reachat";

export default function ARacheter() {
  const [d, setD] = useState(null);
  useEffect(() => {
    let vivant = true;
    const key = (() => { try { return sessionStorage.getItem("niv-admin-key") || ""; } catch { return ""; } })();
    fetch("/api/admin/reachat", { headers: { "x-admin-key": key } })
      .then((r) => (r.ok ? r.json() : null)).then((x) => { if (vivant) setD(x); }).catch(() => {});
    return () => { vivant = false; };
  }, []);
  if (!d) return null;
  const lignes = [...(d.produits || []), ...(d.materiel || [])];
  if (!lignes.length) {
    return <p style={{ margin: "0 0 16px", fontSize: "0.9rem", color: "var(--ink-soft)" }}>Rien à racheter pour l&apos;instant : au rythme des {d.fenetre} derniers jours, tous les stocks suivis tiennent plus de {d.horizon} jours.</p>;
  }
  return (
    <section style={{ margin: "0 0 20px", padding: "14px 16px", border: "1px solid #e6c9a0", borderRadius: 14, background: "#fff8ec" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: "1.02rem" }}>À racheter bientôt · {lignes.length}</h2>
      <p style={{ margin: "0 0 10px", fontSize: "0.84rem", color: "var(--ink-soft)" }}>
        Calculé sur les ventes des {d.fenetre} derniers jours : ce qui sera épuisé dans moins de {d.horizon} jours. La quantité conseillée couvre environ {d.couverture} jours.
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
        {lignes.map((l) => (
          <li key={l.type + l.id} style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", alignItems: "baseline", padding: "8px 10px", borderRadius: 10, background: "#fff", border: l.rupture ? "1px solid #d9534f" : "1px solid #eadfc8" }}>
            <strong style={{ flex: "1 1 220px", minWidth: 0, overflowWrap: "anywhere" }}>{l.nom}</strong>
            <span style={{ fontSize: "0.86rem", color: l.rupture ? "#b02a25" : "var(--ink-soft)" }}>{phraseReachat(l)}</span>
            <span style={{ fontSize: "0.86rem" }}>{l.type === "materiel" ? "matériel" : "produit"}{l.vendus ? ` · ${l.vendus} sorti${l.vendus > 1 ? "s" : ""} en ${d.fenetre} j` : ""}{l.aCommander ? ` · à commander : environ ${l.aCommander}` : ""}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
