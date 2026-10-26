"use client";
// Date limite d'expédition d'une commande, en jours ouvrés ET calendaires (26/10/2026). Voir src/lib/delaiCommande.js.
import { delaiCommande, texteDelai } from "@/lib/delaiCommande";

const COULEUR = {
  ok: { bg: "#eef7ee", c: "#2e6b34", b: "#cfe6d0" },
  bientot: { bg: "#fff4e0", c: "#8a5a00", b: "#f1d9a6" },
  depasse: { bg: "#fdecec", c: "#a12a2a", b: "#f2c4c4" },
  parti: { bg: "#f4f1ea", c: "#6b6253", b: "#e6dfcf" },
};

export default function DelaiCommande({ order, style }) {
  const d = delaiCommande(order);
  if (!d || ["annulee", "remboursee"].includes(order?.status)) return null;
  const k = d.etat === "parti" && !d.aTemps ? "depasse" : d.etat;
  const c = COULEUR[k] || COULEUR.parti;
  return (
    <div
      title="Délai promis sur le site : 5 jours ouvrés de fabrication (du lundi au vendredi, sans les jours fériés), à partir du lendemain de la commande."
      style={{ background: c.bg, color: c.c, border: `1px solid ${c.b}`, borderRadius: 8, padding: "5px 9px", fontSize: "0.8rem", lineHeight: 1.4, overflowWrap: "anywhere", ...style }}
    >
      ⏱ {texteDelai(d)}
    </div>
  );
}
