"use client";

import { useEffect, useState } from "react";
import {
  BIJOUX_HOME,
  BIJOUX_FREE_THRESHOLD,
  DECO_TIERS,
  GLASS_TIERS,
  PICKUP_FEE,
  resolveShippingConfig,
} from "@/lib/shipping";

// =============================================================================
// 🚚 Tarifs de livraison — page admin
// -----------------------------------------------------------------------------
// Permet de modifier TOUS les frais de livraison sans toucher au code :
//   - Bijoux (Lettre suivie) : prix + seuil « livraison offerte »
//   - Décorations (colis) : paliers selon la quantité
//   - Verres (fragiles) : paliers selon la quantité
//   - Retrait en main propre : prix
// Les tarifs sont appliqués IMMÉDIATEMENT au paiement (Stripe) et la barre
// « livraison offerte » du panier suit automatiquement. Le bouton « Rétablir »
// revient aux tarifs d'origine du code (src/lib/shipping.js).
// =============================================================================

const euro = (n) =>
  Number(n) === 0 ? "Gratuit" : `${Number(n).toFixed(2).replace(".", ",")} €`;

// Convertit la config effective (avec Infinity) en état de formulaire (chaînes).
function toForm(cfg) {
  const tierRows = (tiers) =>
    tiers.map((t) => ({
      maxQty: t.maxQty === Infinity || t.maxQty == null ? "" : String(t.maxQty),
      price: String(t.price),
    }));
  return {
    bijouxHome: String(cfg.bijouxHome),
    bijouxFreeThreshold: String(cfg.bijouxFreeThreshold),
    decoTiers: tierRows(cfg.decoTiers),
    glassTiers: tierRows(cfg.glassTiers),
    pickupFee: String(cfg.pickupFee),
  };
}

const DEFAULTS = resolveShippingConfig({});

// --- Petit éditeur de paliers (quantité → prix) ------------------------------
function TierEditor({ rows, onChange, unit }) {
  const setRow = (i, patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const removeRow = (i) => onChange(rows.filter((_, j) => j !== i));
  const addRow = () => {
    // Nouveau palier inséré avant le dernier (« et plus »).
    const beforeLast = rows.slice(0, -1);
    const last = rows[rows.length - 1];
    const prevMax = Number(beforeLast[beforeLast.length - 1]?.maxQty) || 0;
    onChange([...beforeLast, { maxQty: String(prevMax + 4), price: last?.price || "" }, last]);
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map((r, i) => {
        const isLast = i === rows.length - 1;
        const from = i === 0 ? 1 : (Number(rows[i - 1].maxQty) || 0) + 1;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", background: "#faf8f3", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px" }}>
            <span style={{ fontSize: "0.88rem", minWidth: 60 }}>
              {isLast ? `À partir de ${from}` : `De ${from} à`}
            </span>
            {!isLast && (
              <input
                type="number" min={from} step="1" value={r.maxQty}
                onChange={(e) => setRow(i, { maxQty: e.target.value })}
                style={{ width: 70, padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 8 }}
              />
            )}
            <span style={{ fontSize: "0.88rem" }}>{unit}{isLast ? "" : ""} →</span>
            <input
              type="number" min="0" step="0.1" value={r.price}
              onChange={(e) => setRow(i, { price: e.target.value })}
              style={{ width: 90, padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 8 }}
            />
            <span style={{ fontSize: "0.88rem" }}>€</span>
            {!isLast && rows.length > 2 && (
              <button onClick={() => removeRow(i)} title="Supprimer ce palier"
                style={{ marginLeft: "auto", border: "none", background: "none", color: "#b4452f", cursor: "pointer", fontSize: "1rem" }}>
                ✕
              </button>
            )}
          </div>
        );
      })}
      <button className="btn btn-outline" onClick={addRow} style={{ justifySelf: "start", padding: "6px 14px", fontSize: "0.85rem" }}>
        + Ajouter un palier
      </button>
    </div>
  );
}

export default function ShippingAdmin({ adminKey }) {
  const [form, setForm] = useState(null);
  const [boxtal, setBoxtalState] = useState({ enabled: false, pointRelaisPrice: 4.9 });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings", { headers: { "x-admin-key": adminKey } });
        if (res.ok) {
          const data = (await res.json()).settings;
          setForm(toForm(resolveShippingConfig(data?.shipping)));
          if (data?.boxtal) setBoxtalState({ enabled: !!data.boxtal.enabled, pointRelaisPrice: data.boxtal.pointRelaisPrice ?? 4.9 });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [adminKey]);

  async function saveBoxtal() {
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ boxtal: { enabled: boxtal.enabled, pointRelaisPrice: Number(boxtal.pointRelaisPrice) } }),
      });
      if (res.ok) {
        const d = (await res.json()).settings;
        if (d?.boxtal) setBoxtalState({ enabled: !!d.boxtal.enabled, pointRelaisPrice: d.boxtal.pointRelaisPrice ?? 4.9 });
        setMsg("Point relais enregistré ✓ — appliqué immédiatement au paiement.");
      } else setMsg("Échec de l'enregistrement. Réessaie.");
    } catch { setMsg("Échec de l'enregistrement. Réessaie."); }
    finally { setSaving(false); }
  }

  async function post(shipping, label) {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ shipping }),
      });
      if (res.ok) {
        const data = (await res.json()).settings;
        setForm(toForm(resolveShippingConfig(data?.shipping)));
        setMsg(label + " ✓ — appliqué immédiatement au paiement.");
      } else {
        setMsg("Échec de l'enregistrement. Réessaie.");
      }
    } catch {
      setMsg("Échec de l'enregistrement. Réessaie.");
    } finally {
      setSaving(false);
    }
  }

  function saveAll() {
    const tiers = (rows) =>
      rows.map((r, i) => ({
        maxQty: i === rows.length - 1 ? null : Number(r.maxQty) || null,
        price: Number(r.price),
      }));
    post(
      {
        bijouxHome: Number(form.bijouxHome),
        bijouxFreeThreshold: Number(form.bijouxFreeThreshold),
        decoTiers: tiers(form.decoTiers),
        glassTiers: tiers(form.glassTiers),
        pickupFee: Number(form.pickupFee),
      },
      "Tarifs enregistrés"
    );
  }

  if (loading) return <p style={{ color: "var(--ink-soft)" }}>Chargement…</p>;
  if (!form) return <div className="notice">Impossible de charger les tarifs.</div>;

  const set = (patch) => setForm({ ...form, ...patch });

  // Aperçu « ce que paiera la cliente » à partir du formulaire en cours.
  const preview = resolveShippingConfig({
    bijouxHome: Number(form.bijouxHome),
    bijouxFreeThreshold: Number(form.bijouxFreeThreshold),
    decoTiers: form.decoTiers.map((r, i) => ({ maxQty: i === form.decoTiers.length - 1 ? null : Number(r.maxQty), price: Number(r.price) })),
    glassTiers: form.glassTiers.map((r, i) => ({ maxQty: i === form.glassTiers.length - 1 ? null : Number(r.maxQty), price: Number(r.price) })),
    pickupFee: Number(form.pickupFee),
  });

  const tierLabel = (tiers, i, unit) => {
    const from = i === 0 ? 1 : tiers[i - 1].maxQty + 1;
    const t = tiers[i];
    return t.maxQty === Infinity ? `${from} ${unit} et plus` : from === t.maxQty ? `${from} ${unit}` : `${from} à ${t.maxQty} ${unit}`;
  };

  const isDefault =
    preview.bijouxHome === DEFAULTS.bijouxHome &&
    preview.bijouxFreeThreshold === DEFAULTS.bijouxFreeThreshold &&
    preview.pickupFee === DEFAULTS.pickupFee &&
    JSON.stringify(preview.decoTiers) === JSON.stringify(DEFAULTS.decoTiers) &&
    JSON.stringify(preview.glassTiers) === JSON.stringify(DEFAULTS.glassTiers);

  const th = { textAlign: "left", padding: "8px 10px", borderBottom: "2px solid var(--line)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-soft)" };
  const td = { padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: "0.92rem" };
  const tdPrice = { ...td, fontWeight: 700, whiteSpace: "nowrap", textAlign: "right" };

  return (
    <>
      <h2 style={{ marginTop: 0 }}>🚚 Tarifs de livraison</h2>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Modifie ici tous les frais de livraison du site. Les nouveaux tarifs s'appliquent
        <strong> immédiatement</strong> au paiement (aucun redéploiement nécessaire), et la barre
        « livraison offerte » du panier suit automatiquement.
      </p>

      {msg && <div className="notice">{msg}</div>}

      {/* ============ BIJOUX (Lettre suivie) ============ */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>💍 Bijoux & petits objets — Lettre suivie (≤ 2 kg)</h3>
        <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.88rem" }}>
          S'applique quand le panier ne contient QUE des articles légers (bijoux, petits objets).
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <label className="admin-field" style={{ maxWidth: 220 }}>
            Prix de la livraison (€)
            <input type="number" min="0" step="0.1" value={form.bijouxHome}
              onChange={(e) => set({ bijouxHome: e.target.value })} />
          </label>
          <label className="admin-field" style={{ maxWidth: 260 }}>
            Livraison offerte à partir de (€)
            <input type="number" min="0" step="1" value={form.bijouxFreeThreshold}
              onChange={(e) => set({ bijouxFreeThreshold: e.target.value })} />
          </label>
        </div>
        <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.82rem" }}>
          💡 Astuce anti-abandon de panier : un seuil un peu au-dessus du panier moyen pousse à ajouter
          un article pour débloquer la livraison offerte.
        </p>
      </div>

      {/* ============ DÉCO (colis) ============ */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>📦 Décorations & bois — Colis suivi</h3>
        <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.88rem" }}>
          Tarif selon le nombre d'articles déco dans le panier (le colis grossit → le prix monte).
        </p>
        <TierEditor rows={form.decoTiers} unit="article(s)" onChange={(decoTiers) => set({ decoTiers })} />
      </div>

      {/* ============ VERRES (fragiles) ============ */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>🥂 Verres gravés — Colis renforcé (fragile)</h3>
        <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.88rem" }}>
          Tarif selon le nombre de verres (emballage renforcé, La Poste facture au poids).
          Si le panier mélange verres et déco, la cliente ne paie qu'UNE livraison : la plus chère des deux.
        </p>
        <TierEditor rows={form.glassTiers} unit="verre(s)" onChange={(glassTiers) => set({ glassTiers })} />
      </div>

      {/* ============ RETRAIT ============ */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>🤝 Retrait en main propre — Val-d'Oise (95)</h3>
        <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.88rem" }}>
          Proposé uniquement pour la déco/mariage, si le code postal est dans la zone autorisée
          (zone réglable dans l'onglet Réglages).
        </p>
        <label className="admin-field" style={{ maxWidth: 220 }}>
          Prix du retrait (€) — 0 = gratuit
          <input type="number" min="0" step="0.5" value={form.pickupFee}
            onChange={(e) => set({ pickupFee: e.target.value })} />
        </label>
      </div>

      {/* ============ POINT RELAIS (Boxtal) ============ */}
      <div className="admin-block" style={{ display: "grid", gap: 10, borderColor: "#c9a24b" }}>
        <h3 style={{ margin: 0 }}>📍 Point relais (Boxtal) — tous les transporteurs</h3>
        <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.88rem" }}>
          Ajoute au paiement une option <strong>« Livraison en point relais »</strong> (moins chère que le domicile).
          Objectif : la cliente choisit son transporteur + son point relais sur une carte (comme sur Boxtal).
        </p>
        <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={boxtal.enabled} onChange={(e) => setBoxtalState({ ...boxtal, enabled: e.target.checked })} style={{ width: "auto" }} />
          Proposer la livraison en point relais au paiement
        </label>
        <label className="admin-field" style={{ maxWidth: 240 }}>
          Prix du point relais (€)
          <input type="number" min="0" step="0.1" value={boxtal.pointRelaisPrice}
            onChange={(e) => setBoxtalState({ ...boxtal, pointRelaisPrice: e.target.value })} />
        </label>
        <div style={{ background: "#fbf4e6", border: "1px solid #e7d3a1", borderRadius: 10, padding: "10px 12px", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
          🔑 Tes <strong>clés Boxtal</strong> se mettent dans les <strong>secrets</strong> (là où sont tes autres clés), sous les noms <code>BOXTAL_APP_ID</code> et <code>BOXTAL_APP_SECRET</code>.
          Tant que les clés ne sont pas en place, l'option apparaît à <strong>prix fixe</strong> (ci-dessus) et la cliente t'indique son point relais par message.
          Une fois les clés en place, on active la <strong>carte des points relais + le choix du transporteur</strong> au paiement.
        </div>
        <button className="btn btn-gold" onClick={saveBoxtal} disabled={saving} style={{ justifySelf: "start" }}>
          {saving ? "Enregistrement…" : "💾 Enregistrer le point relais"}
        </button>
      </div>

      {/* ============ ACTIONS ============ */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "14px 0" }}>
        <button className="btn btn-gold" onClick={saveAll} disabled={saving}>
          {saving ? "Enregistrement…" : "💾 Enregistrer les tarifs"}
        </button>
        <button className="btn btn-outline" disabled={saving}
          onClick={() => { if (confirm("Revenir aux tarifs d'origine ?")) post({}, "Tarifs d'origine rétablis"); }}>
          ↩︎ Rétablir les tarifs d'origine
        </button>
      </div>

      {/* ============ RÉCAPITULATIF PRO ============ */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>
          📋 Récapitulatif — ce que paie la cliente
          {!isDefault && <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8a6d3b", marginLeft: 8 }}>(tarifs personnalisés)</span>}
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Type de panier</th>
                <th style={th}>Mode d'envoi</th>
                <th style={{ ...th, textAlign: "right" }}>Prix</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>Bijoux / petits objets</td>
                <td style={td}>Lettre suivie (2-4 j ouvrés)</td>
                <td style={tdPrice}>{euro(preview.bijouxHome)}</td>
              </tr>
              <tr>
                <td style={td}>Bijoux — panier ≥ {euro(preview.bijouxFreeThreshold)}</td>
                <td style={td}>Lettre suivie (2-4 j ouvrés)</td>
                <td style={{ ...tdPrice, color: "#256b34" }}>Offerte</td>
              </tr>
              {preview.decoTiers.map((t, i) => (
                <tr key={`d${i}`}>
                  <td style={td}>Déco / bois — {tierLabel(preview.decoTiers, i, "article(s)")}</td>
                  <td style={td}>Colis suivi (2-5 j ouvrés)</td>
                  <td style={tdPrice}>{euro(t.price)}</td>
                </tr>
              ))}
              {preview.glassTiers.map((t, i) => (
                <tr key={`g${i}`}>
                  <td style={td}>Verres gravés — {tierLabel(preview.glassTiers, i, "verre(s)")}</td>
                  <td style={td}>Colis renforcé (2-5 j ouvrés)</td>
                  <td style={tdPrice}>{euro(t.price)}</td>
                </tr>
              ))}
              <tr>
                <td style={td}>Déco / mariage — retrait sur rendez-vous</td>
                <td style={td}>Main propre, Val-d'Oise (95)</td>
                <td style={{ ...tdPrice, color: preview.pickupFee === 0 ? "#256b34" : undefined }}>{euro(preview.pickupFee)}</td>
              </tr>
              <tr>
                <td style={td}>Article « livraison incluse » (option produit)</td>
                <td style={td}>Selon le produit</td>
                <td style={{ ...tdPrice, color: "#256b34" }}>Offerte</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.82rem" }}>
          Tarifs d'origine (code) : bijoux {euro(BIJOUX_HOME)} (offerte dès {euro(BIJOUX_FREE_THRESHOLD)}) ·
          déco {DECO_TIERS.map((t) => euro(t.price)).join(" / ")} ·
          verres {GLASS_TIERS.map((t) => euro(t.price)).join(" / ")} ·
          retrait {euro(PICKUP_FEE)}.
        </p>
      </div>
    </>
  );
}
