// Encadré « La pièce à prendre » en tête de chaque article de la fiche atelier (14/11/2026, gérant :
// « c'est marqué où quel verre utiliser, quels centilitres ?… je veux une case avec tout le détail »).
import { pieceAUtiliser } from "@/lib/pieceAtelier";

function Ligne({ k, v, fort }) {
  if (!v) return null;
  return (
    <div style={{ display: "flex", gap: 8, fontSize: "0.88rem", padding: "2px 0" }}>
      <span style={{ minWidth: 118, color: "#6b5d48", flexShrink: 0 }}>{k}</span>
      <span style={{ fontWeight: fort ? 800 : 600, minWidth: 0 }}>{v}</span>
    </div>
  );
}

export default function PieceAUtiliser({ item, quantite }) {
  const p = pieceAUtiliser(item, quantite);
  if (!p) return null;
  const verre = /verre|flûte|carafe|tumbler/i.test(p.nom);
  return (
    <div style={{ margin: "0 0 10px", padding: "10px 12px", border: "2px solid #2f5d8a", borderRadius: 10, background: "#f2f7fc" }}>
      <div style={{ fontWeight: 800, color: "#1f4466", fontSize: "0.95rem", marginBottom: 4 }}>{verre ? "🥃 Le verre à prendre" : "📦 La pièce à prendre"}</div>
      <Ligne k="Pièce" v={p.nom || p.produit} fort />
      <Ligne k="Référence" v={p.ref} />
      <Ligne k="Mesures" v={p.mesures} />
      <Ligne k="Produit commandé" v={p.option && p.option !== p.produit ? `${p.produit} — ${p.option}` : p.produit} />
      <Ligne k="Couleur" v={p.couleur} />
      <Ligne k="Combien" v={`${p.nb} ${p.nb > 1 ? "pièces à graver" : "pièce à graver"}`} fort />
      <Ligne k="Où graver" v={p.endroit} fort />
    </div>
  );
}
