"use client";

import { useEffect, useState } from "react";
import PageHead from "@/components/admin/PageHead";

// =============================================================================
// Gestion → Santé du catalogue
// Panneau visible de la SURVEILLANCE AUTOMATIQUE : liste les produits mal
// configurés (bijou sans emballage, sans photo, sans prix = important ;
// sans fiche détaillée = mineur). Lecture seule ; source /api/admin/catalog-audit.
// =============================================================================

const SEV = {
  haute: { label: "Important", color: "#b4452f", bg: "#fbecea" },
  moyenne: { label: "À corriger", color: "#a86a00", bg: "#fbf3e2" },
  basse: { label: "Mineur", color: "#7a7268", bg: "#f2efe9" },
};

const HINTS = {
  emballage: "Gestion → Packaging & emballages : activer le produit et cocher ses emballages.",
  photo: "Gestion → Produits & Stock : ajouter au moins une photo.",
  prix: "Gestion → Produits & Stock : ajouter une variante avec un prix.",
  fiche: "Facultatif : ajouter une fiche détaillée (Taille & Matériaux / Entretien / Retour).",
};

export default function SanteCatalogue() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [msg, setMsg] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") : "";
    if (k) { setKey(k); load(k); }
  }, []);

  async function load(k) {
    setLoading(true);
    setMsg("Vérification du catalogue…");
    try {
      const res = await fetch("/api/admin/catalog-audit", { headers: { "x-admin-key": k } });
      if (!res.ok) throw new Error("Mot de passe incorrect.");
      const audit = await res.json();
      setData(audit);
      setAuthed(true);
      try { sessionStorage.setItem("niv-admin-key", k); } catch { /* ignore */ }
      setMsg("");
    } catch (e) { setMsg(e.message); }
    finally { setLoading(false); }
  }

  const important = data ? (data.issues || []).filter((i) => i.severity !== "basse") : [];
  const minor = data ? (data.issues || []).filter((i) => i.severity === "basse") : [];

  if (!authed) {
    return (
      <div style={{ maxWidth: 420, margin: "60px auto", padding: 16 }}>
        <h1 style={{ fontFamily: "Georgia, serif", color: "var(--gold)" }}>Santé du catalogue</h1>
        <p style={{ color: "var(--ink-soft)" }}>Entrez votre mot de passe d'administration.</p>
        <input
          type="password" value={key} onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(key)}
          placeholder="Mot de passe admin"
          style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }}
        />
        <button className="btn btn-gold" style={{ marginTop: 10 }} onClick={() => load(key)}>Ouvrir</button>
        {msg && <p style={{ color: "#b4452f", marginTop: 10 }}>{msg}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "16px 16px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <PageHead eyebrow="Catalogue" title="Santé du catalogue" subtitle="Produits mal configurés : sans emballage, sans photo, sans prix, sans fiche détaillée." />
        <button className="btn btn-outline" onClick={() => load(key)} disabled={loading}>
          {loading ? "Vérification…" : "Revérifier"}
        </button>
      </div>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Surveillance automatique : détecte les produits mal configurés (bijou sans emballage, sans photo, sans prix).
        Une vérification tourne aussi chaque semaine et vous alerte par e-mail s'il y a un point important.
      </p>

      {data && (
        <>
          {/* Bannière d'état */}
          {important.length === 0 ? (
            <div style={{ background: "#eaf5ec", color: "#2e6b3e", border: "1px solid #cbe6d1", borderRadius: 14, padding: "16px 18px", margin: "10px 0 20px" }}>
              <strong style={{ fontSize: "1.05rem" }}>✓ Tout est en ordre.</strong><br />
              {data.productCount} produits vérifiés, aucun point important à corriger.
              {minor.length > 0 && <span style={{ color: "#7a7268" }}> ({minor.length} produit(s) sans fiche détaillée — facultatif.)</span>}
            </div>
          ) : (
            <div style={{ background: "#fbecea", color: "#b4452f", border: "1px solid #f0cfc9", borderRadius: 14, padding: "16px 18px", margin: "10px 0 20px" }}>
              <strong style={{ fontSize: "1.05rem" }}>{important.length} point(s) important(s) à corriger</strong><br />
              sur {data.productCount} produits vérifiés.
              {!data.packagingLive && <span style={{ display: "block", marginTop: 6, color: "#a86a00" }}>Note : le packaging n'est pas encore activé sur le site (Gestion → Packaging → « visible sur le site »).</span>}
            </div>
          )}

          {/* Liste des points importants */}
          {important.map((i, n) => {
            const s = SEV[i.severity] || SEV.moyenne;
            return (
              <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                <span style={{ background: s.bg, color: s.color, fontSize: "0.78rem", fontWeight: 700, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{s.label}</span>
                <div style={{ minWidth: 0 }}>
                  <strong>{i.name}</strong> <span style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>({i.category}{i.hidden ? " · masqué" : ""})</span>
                  <div style={{ margin: "3px 0 0" }}>{i.message}</div>
                  {HINTS[i.type] && <div style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginTop: 3 }}>→ {HINTS[i.type]}</div>}
                </div>
              </div>
            );
          })}

          {/* Mineurs (fiche détaillée) : repliés en résumé */}
          {minor.length > 0 && (
            <details style={{ marginTop: 16, border: "1px solid var(--line)", borderRadius: 12, padding: "10px 14px" }}>
              <summary style={{ cursor: "pointer", color: "var(--ink-soft)" }}>
                {minor.length} produit(s) sans fiche détaillée (facultatif)
              </summary>
              <ul style={{ margin: "10px 0 0", color: "var(--ink-soft)", fontSize: "0.9rem" }}>
                {minor.map((i, n) => <li key={n}>{i.name}</li>)}
              </ul>
            </details>
          )}

          <p style={{ color: "var(--ink-soft)", fontSize: "0.8rem", marginTop: 18 }}>
            Dernière vérification : {new Date(data.checkedAt).toLocaleString("fr-FR")}
          </p>
        </>
      )}
      {msg && <p style={{ color: "#b4452f" }}>{msg}</p>}
    </div>
  );
}
