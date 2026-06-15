"use client";

// FICHE ATELIER : affiche, pour chaque article d'une commande, TOUS les réglages
// choisis par la cliente (emplacement, taille, position, textes, polices, motif,
// fond, options) + un visuel reconstruit du verre, pour graver à l'identique.

import { getProductBySlug } from "@/lib/products";
import { MODELES } from "@/lib/modeles";
import { getFontLabel } from "@/lib/fonts";
import { MOTIF_LIST } from "@/components/Motif";
import ModeleArt from "@/components/ModeleArt";

const LAYOUT_LABELS = { classic: "Classique", badge: "Médaillon rond", stack: "Simple", image: "Image" };
const motifLabel = (id) => (MOTIF_LIST.find((m) => m.id === id) || {}).label || id;

function GlassPreview({ item }) {
  const p = getProductBySlug(item.slug);
  const isFond = item.emplacement === "fond";
  const img = (isFond ? p?.fondImage : p?.engraveImage) || p?.images?.[0];
  if (!img) return null;
  const W = 300;
  const lay = item.layout?.modele || item.layout?.photo || item.layout?.text;
  const cx = lay?.cx ?? 0.5;
  const cy = lay?.cy ?? 0.45;
  const scale = lay?.scale ?? 0.1;
  const color = isFond ? "#f2efe9" : "#3a2f1d";

  return (
    <div style={{ position: "relative", width: W, maxWidth: "100%", borderRadius: 10, overflow: "hidden", background: "#111" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" style={{ width: "100%", display: "block" }} />
      <div style={{ position: "absolute", left: `${cx * 100}%`, top: `${cy * 100}%`, transform: "translate(-50%,-50%)" }}>
        {item.modele ? (
          <ModeleArt template={item.modeleTemplate} value={item.modele} color={color} base={Math.max(10, scale * W)} />
        ) : item.photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photoSrc} alt="" style={{ width: scale * W * 2, filter: isFond ? "brightness(3)" : "grayscale(1) contrast(1.4)", opacity: 0.9 }} />
        ) : null}
      </div>
    </div>
  );
}

function Row({ k, v }) {
  if (v === null || v === undefined || v === "") return null;
  return (
    <div style={{ display: "flex", gap: 8, padding: "3px 0", fontSize: "0.85rem" }}>
      <span style={{ minWidth: 130, color: "#777", flexShrink: 0 }}>{k}</span>
      <span style={{ fontWeight: 600 }}>{v}</span>
    </div>
  );
}

function ItemSheet({ item }) {
  if (!item) return null;
  const mv = item.modele;
  const tpl = item.modeleTemplate ? MODELES[item.modeleTemplate] : null;
  const layout = mv?.layout || tpl?.layout || tpl?.style || "stack";
  const lay = item.layout?.modele || item.layout?.photo || item.layout?.text;

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "12px 0", borderTop: "1px dashed #ddd" }}>
      <GlassPreview item={item} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.name}{item.variantTitle ? ` — ${item.variantTitle}` : ""}</div>
        <Row k="Emplacement" v={item.emplacement === "fond" ? "Au fond du verre" : "Face avant"} />
        {item.deuxEmplacement && <Row k="2e gravure" v="OUI (+7 €) — graver aussi au 2e endroit" />}

        {mv && tpl && (
          <>
            <Row k="Modèle" v={`${tpl.label} — style ${LAYOUT_LABELS[layout] || layout}`} />
            {tpl.lines.map((l) => {
              if (l.below && mv.addText === false) return null;
              const t = (mv.text?.[l.key] || "").trim();
              if (!t) return null;
              return <Row key={l.key} k={l.below ? "Texte ajouté" : l.label} v={`« ${t} »  ·  ${getFontLabel((mv.fonts || {})[l.key] || l.font)}`} />;
            })}
            {layout === "badge" && <Row k="Fond du badge" v={mv.bg === "plein" ? "Plein" : "Sans fond (au trait)"} />}
            {(layout === "classic" || layout === "stack") && mv.motif && mv.motif !== "aucun" && <Row k="Motif" v={motifLabel(mv.motif)} />}
          </>
        )}

        {item.photoSrc && !mv && <Row k="Logo / photo" v="fournie par la cliente (voir visuel)" />}
        {lay?.label && <Row k="Taille / position" v={lay.label} />}
        {item.personalization && <Row k="Résumé" v={item.personalization} />}

        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#888" }}>Tous les réglages (brut)</summary>
          <pre style={{ fontSize: "0.72rem", whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#faf7f1", padding: 8, borderRadius: 6, marginTop: 6 }}>
            {JSON.stringify({ ...item, personalization: undefined }, null, 1)}
          </pre>
        </details>
      </div>
    </div>
  );
}

export default function FicheAtelier({ spec }) {
  const items = Array.isArray(spec) ? spec.filter(Boolean) : spec ? [spec] : [];
  if (!items.length) {
    return <p style={{ fontSize: "0.85rem", color: "#999", padding: "8px 0" }}>Aucun réglage détaillé enregistré pour cette commande (commande passée avant la mise en place de la fiche atelier).</p>;
  }
  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 14px", marginTop: 8 }}>
      <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>🛠️ Fiche atelier — à graver à l'identique</div>
      {items.map((it, i) => <ItemSheet key={i} item={it} />)}
    </div>
  );
}
