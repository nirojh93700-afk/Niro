"use client";

// Gestion → Stock & achats → « Stock à recompter » (09/11/2026).
// Jusqu'au 09/11/2026 une vente pouvait ne pas faire baisser le stock (corrigé). Cette page liste ce qui
// s'est vendu depuis le début : le gérant compte ce qu'il a vraiment en main et écrit le bon chiffre.
import { useEffect, useState, useCallback } from "react";
import PageHead from "@/components/admin/PageHead";

const jour = (t) => (t ? new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");

export default function RecomptagePage() {
  const [key, setKey] = useState("");
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [val, setVal] = useState({});
  const [etat, setEtat] = useState({});
  const [filtre, setFiltre] = useState("suivis");

  const charger = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/recomptage", { headers: { "x-admin-key": k } });
      if (!r.ok) throw new Error(r.status === 401 ? "Mot de passe de Gestion demandé : ouvrez d'abord l'accueil de Gestion." : "Chargement impossible.");
      setD(await r.json()); setErr("");
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    setKey(k); charger(k);
  }, [charger]);

  const enregistrer = async (l) => {
    const brut = String(val[l.id] ?? "").trim();
    if (brut === "" || !/^\d+$/.test(brut)) { setEtat((e) => ({ ...e, [l.id]: "Écrivez un nombre entier." })); return; }
    setEtat((e) => ({ ...e, [l.id]: "…" }));
    try {
      const r = await fetch("/api/admin/stock", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ variantId: l.id, stock: Number(brut) }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error();
      setD((x) => ({ ...x, lignes: x.lignes.map((y) => (y.id === l.id ? { ...y, stock: j.stock ?? Number(brut), fait: true } : y)) }));
      setVal((v) => ({ ...v, [l.id]: "" }));
      setEtat((e) => ({ ...e, [l.id]: "ok" }));
    } catch { setEtat((e) => ({ ...e, [l.id]: "Non enregistré, réessayez." })); }
  };

  const lignes = d?.lignes || [];
  const suivis = lignes.filter((l) => l.stock !== null);
  const nonSuivis = lignes.filter((l) => l.stock === null);
  const vue = filtre === "suivis" ? suivis : nonSuivis;
  const faits = lignes.filter((l) => l.fait).length;

  return (
    <div className="container" style={{ padding: "28px 16px 60px", maxWidth: 980 }}>
      <PageHead eyebrow="Stock & achats" title="Stock à recompter"
        subtitle="Jusqu'au 9 novembre 2026, une vente pouvait ne pas faire baisser le stock. C'est corrigé. Voici tout ce qui s'est vendu depuis le début : comptez ce que vous avez vraiment, écrivez le bon chiffre, c'est tout."
        kpis={d ? [
          { label: "Lignes vendues, stock suivi", value: String(suivis.length) },
          { label: "Recomptées aujourd'hui", value: String(faits), tone: faits ? "good" : "" },
          { label: "Commandes lues", value: String(d.commandes), sub: d.sansListe ? `${d.sansListe} sans liste de stock (devis, anciennes)` : "" },
        ] : []} />
      {err ? <div className="notice">{err}</div> : null}
      {!d && !err ? <p>Chargement…</p> : null}
      {d ? (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 14px" }}>
            {[["suivis", `Stock suivi (${suivis.length})`], ["non", `Vendus sans stock saisi (${nonSuivis.length})`]].map(([k, t]) => (
              <button key={k} type="button" onClick={() => setFiltre(k)} className={filtre === k ? "btn btn-gold" : "btn"} style={{ padding: "8px 14px" }}>{t}</button>
            ))}
          </div>
          {filtre === "non" ? <p style={{ margin: "0 0 12px", fontSize: "0.88rem", color: "var(--ink-soft)" }}>Ces produits se sont vendus mais n&apos;ont aucun stock saisi : ils ne baissent jamais. Écrivez une quantité pour commencer à les suivre, ou laissez vide s&apos;ils sont faits à la demande.</p> : null}
          {!vue.length ? <p>Rien dans cette liste.</p> : null}
          <div style={{ display: "grid", gap: 8 }}>
            {vue.map((l) => (
              <div key={l.id} style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", alignItems: "center", background: l.fait ? "#eef8f0" : "#fff", border: `1px solid ${l.fait ? "#9fd0a8" : "#eadfc4"}`, borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ flex: "1 1 240px", minWidth: 0, overflowWrap: "anywhere" }}>
                  <b>{l.nom}</b>
                  <div style={{ fontSize: "0.84rem", color: "var(--ink-soft)" }}>
                    {l.vendus} vendu{l.vendus > 1 ? "s" : ""} en {l.commandes} commande{l.commandes > 1 ? "s" : ""}{l.derniere ? ` · dernière vente le ${jour(l.derniere)}` : ""}{l.annules ? ` · ${l.annules} dans des commandes annulées ou remboursées` : ""}
                  </div>
                </div>
                <div style={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}>Dans Gestion : <b>{l.stock === null ? "non suivi" : l.stock}</b></div>
                <input inputMode="numeric" placeholder="Compté" aria-label={`Quantité comptée : ${l.nom}`} value={val[l.id] ?? ""} onChange={(e) => setVal((v) => ({ ...v, [l.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") enregistrer(l); }}
                  style={{ width: 96, boxSizing: "border-box", minWidth: 0, padding: "8px 10px", border: "1px solid #d9c9a3", borderRadius: 8, fontSize: 16 }} />
                <button type="button" className="btn btn-gold" style={{ padding: "8px 14px" }} onClick={() => enregistrer(l)}>Enregistrer</button>
                {etat[l.id] ? <small style={{ flexBasis: "100%", color: etat[l.id] === "ok" ? "#2e7d32" : "#b02a25" }}>{etat[l.id] === "ok" ? "Enregistré." : etat[l.id]}</small> : null}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
