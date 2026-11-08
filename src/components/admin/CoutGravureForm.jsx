"use client";

// =============================================================================
// COÛT DE GRAVURE PAR PIÈCE (08/11/2026) — Catalogue › Tailles & coûts.
// Le gérant saisit : prix du laser, durée de vie (heures), électricité (€/h),
// son heure de travail (€/h, 0 = non compté), puis les MINUTES de gravure par
// produit en vente. Le coût par pièce se calcule en direct ; « Enregistrer »
// écrit `settings.coutGravure` ; Finances › Bénéfices le déduit ensuite.
// Sans réglage, le bénéfice reste calculé comme aujourd'hui.
// Les suggestions par famille (MINUTES_DEFAUT) ne sont que des PLACEHOLDERS :
// rien n'est enregistré que le gérant n'ait tapé lui-même.
// =============================================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import { coutHoraire, coutPiece, familleProduit, FAMILLE_LABEL, minutesSuggerees, resumeReglage } from "@/lib/coutGravure";

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid #eadfc4", borderRadius: 8, font: "inherit", boxSizing: "border-box", minWidth: 0 };
const th = { padding: "10px 8px", borderBottom: "2px solid var(--line)", textAlign: "left", whiteSpace: "nowrap" };
const td = { padding: "8px 8px", borderBottom: "1px solid var(--line)", verticalAlign: "middle" };

// Lit un nombre saisi avec une virgule ou un point.
const num = (v) => { const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) && n >= 0 ? n : 0; };

export default function CoutGravureForm() {
  const [key, setKey] = useState("");
  const [produits, setProduits] = useState([]);
  const [regl, setRegl] = useState({ laser: "", heures: "", elec: "", main: "" });
  const [minutes, setMinutes] = useState({});
  const [etat, setEtat] = useState("chargement"); // chargement | pret | sans-cle | erreur
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [filtre, setFiltre] = useState("");

  const charger = useCallback(async (k) => {
    try {
      const [rs, rp] = await Promise.all([
        fetch("/api/admin/settings", { headers: { "x-admin-key": k }, cache: "no-store" }),
        fetch("/api/admin/products", { headers: { "x-admin-key": k }, cache: "no-store" }),
      ]);
      if (rs.status === 401 || rp.status === 401) { setEtat("sans-cle"); return; }
      if (!rs.ok || !rp.ok) { setEtat("erreur"); return; }
      const { settings } = await rs.json();
      const { editable } = await rp.json();
      const c = settings?.coutGravure;
      if (c && typeof c === "object") {
        const aff = (v) => (v || v === 0 ? String(v).replace(".", ",") : "");
        setRegl({ laser: aff(c.laser), heures: aff(c.heures), elec: aff(c.elec), main: aff(c.main) });
        const m = {};
        for (const [slug, v] of Object.entries(c.minutes || {})) m[slug] = aff(v);
        setMinutes(m);
      }
      // Produits EN VENTE seulement (ni masqués seuls, ni retirés par leur catégorie / rayon).
      const liste = (Array.isArray(editable) ? editable : [])
        .filter((p) => !p.hidden && !p.masqueGroupe)
        .map((p) => ({ slug: p.slug, name: p.name || p.slug, category: p.category || "", famille: familleProduit(p) }))
        .sort((a, b) => a.famille.localeCompare(b.famille) || a.name.localeCompare(b.name, "fr"));
      setProduits(liste);
      setEtat("pret");
    } catch { setEtat("erreur"); }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (!k) { setEtat("sans-cle"); return; }
    setKey(k);
    charger(k);
  }, [charger]);

  // Réglage courant (nombres) pour le calcul en direct.
  const courant = useMemo(() => {
    const m = {};
    for (const [slug, v] of Object.entries(minutes)) { const n = num(v); if (n > 0) m[slug] = n; }
    return { laser: num(regl.laser), heures: num(regl.heures), elec: num(regl.elec), main: num(regl.main), minutes: m };
  }, [regl, minutes]);
  const horaire = coutHoraire(courant);
  const nbRegles = Object.keys(courant.minutes).length;

  async function enregistrer() {
    setSaving(true); setMsg("");
    try {
      const r = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ coutGravure: { laser: regl.laser, heures: regl.heures, elec: regl.elec, main: regl.main, minutes } }),
      });
      if (!r.ok) throw new Error();
      setMsg("Enregistré ✓ — Finances › Bénéfices déduit maintenant ce coût.");
    } catch { setMsg("Enregistrement impossible. Réessayez."); }
    setSaving(false);
  }

  const visibles = filtre.trim()
    ? produits.filter((p) => (p.name + " " + p.slug).toLowerCase().includes(filtre.trim().toLowerCase()))
    : produits;

  return (
    <section style={{ marginTop: 34, paddingTop: 22, borderTop: "2px solid var(--line)" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: "1.15rem" }}>Coût de gravure par pièce</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", margin: "0 0 14px" }}>
        Ce que chaque pièce vous coûte vraiment à graver : l&apos;usure du laser, l&apos;électricité et, si vous le souhaitez, votre temps.
        Ce coût est déduit commande par commande dans <a href="/gestion/benefices" style={{ color: "var(--gold-dark)" }}>Finances › Bénéfices</a>.
        {" "}<strong>Sans réglage, le bénéfice reste calculé comme aujourd&apos;hui.</strong>
      </p>

      {etat === "sans-cle" && <p style={{ color: "var(--ink-soft)" }}>Ouvrez d&apos;abord Gestion pour saisir votre mot de passe, puis revenez ici.</p>}
      {etat === "chargement" && <p style={{ color: "var(--ink-soft)" }}>Chargement…</p>}
      {etat === "erreur" && <p style={{ color: "#b4452f" }}>Chargement impossible. Rechargez la page.</p>}

      {etat === "pret" && (
        <>
          {/* Les 4 réglages de la machine et du temps */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 12 }}>
            {[
              ["laser", "Prix du laser (€)", "3 500"],
              ["heures", "Durée de vie estimée (heures de gravure)", "8 000"],
              ["elec", "Électricité (€ par heure de gravure)", "0,25"],
              ["main", "Votre heure de travail (€ ; 0 = non compté)", "0"],
            ].map(([k, label, ph]) => (
              <label key={k} style={{ display: "block", minWidth: 0 }}>
                <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginBottom: 3 }}>{label}</div>
                <input value={regl[k]} inputMode="decimal" placeholder={ph} onChange={(e) => setRegl((r) => ({ ...r, [k]: e.target.value }))} style={inputStyle} />
              </label>
            ))}
          </div>
          <div style={{ background: "#fbf4e6", border: "1px solid #e7d3a1", borderRadius: 10, padding: "10px 14px", fontSize: "0.88rem", marginBottom: 16 }}>
            <strong>Coût d&apos;une heure de gravure :</strong> {resumeReglage(courant)}
            {horaire === 0 && <span style={{ color: "var(--ink-soft)" }}> — renseignez au moins le prix du laser et sa durée de vie.</span>}
          </div>

          {/* Minutes par produit */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
            <div style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>
              Minutes de gravure par pièce, pour chaque produit en vente. Les chiffres grisés sont des suggestions par famille : ils ne comptent pas tant que vous ne les avez pas tapés.
            </div>
            <input value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder="Chercher un produit…" style={{ ...inputStyle, width: "auto", flex: "1 1 180px", maxWidth: 260 }} />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", minWidth: 520 }}>
              <thead>
                <tr style={{ background: "var(--paper)" }}>
                  <th style={th}>Produit</th>
                  <th style={th}>Famille</th>
                  <th style={{ ...th, textAlign: "center" }}>Minutes / pièce</th>
                  <th style={{ ...th, textAlign: "right" }}>Coût / pièce</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => {
                  const saisi = num(minutes[p.slug]) > 0;
                  const cout = coutPiece(courant, p.slug);
                  return (
                    <tr key={p.slug}>
                      <td style={{ ...td, fontWeight: 600 }}>{p.name}</td>
                      <td style={{ ...td, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{FAMILLE_LABEL[p.famille] || "Autre"}</td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <input
                          value={minutes[p.slug] ?? ""}
                          inputMode="decimal"
                          placeholder={String(minutesSuggerees(p))}
                          aria-label={`Minutes de gravure : ${p.name}`}
                          onChange={(e) => setMinutes((m) => ({ ...m, [p.slug]: e.target.value }))}
                          style={{ ...inputStyle, width: 76, textAlign: "center" }}
                        />
                      </td>
                      <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: saisi ? 700 : 400, color: saisi ? "#256b34" : "var(--ink-soft)", whiteSpace: "nowrap" }}>
                        {saisi ? euro(cout) : "—"}
                      </td>
                    </tr>
                  );
                })}
                {visibles.length === 0 && (
                  <tr><td colSpan={4} style={{ ...td, color: "var(--ink-soft)" }}>{produits.length ? "Aucun produit ne correspond." : "Aucun produit en vente."}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
            <button type="button" className="btn btn-gold" onClick={enregistrer} disabled={saving} style={{ padding: "8px 18px" }}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <span style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              {nbRegles ? `${nbRegles} produit${nbRegles > 1 ? "s" : ""} avec un temps saisi.` : "Aucun temps saisi : le bénéfice ne change pas."}
            </span>
            {msg && <span style={{ fontSize: "0.85rem", color: msg.startsWith("Enregistré") ? "#256b34" : "#b4452f" }}>{msg}</span>}
          </div>
        </>
      )}
    </section>
  );
}
