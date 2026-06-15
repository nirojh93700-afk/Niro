"use client";

import { MODELES } from "@/lib/modeles";
import { Motif } from "./Motif";
import RoundBadge from "./RoundBadge";

// Rend la composition d'un modèle (lignes stylées + motif), sans positionnement.
// Utilisé dans l'aperçu sur le verre et dans la mini-vignette du formulaire.
// base = taille (px) de la ligne centrale ; les autres lignes suivent leur "em".
export default function ModeleArt({ template, value, color = "#fff", base = 28, placeholder = false }) {
  const tpl = MODELES[template];
  if (!tpl) return null;
  const text = value?.text || {};
  const fonts = value?.fonts || {};
  const motif = value?.motif;

  // Style "badge" : médaillon rond (texte courbé + couronne d'étoiles).
  if (tpl.style === "badge") {
    const get = (k) => {
      const l = tpl.lines.find((x) => x.key === k);
      const t = (text[k] || "").trim();
      return { txt: t || (placeholder ? l?.placeholder : "") || "", font: fonts[k] || l?.font };
    };
    const top = get("top"), mid = get("mid"), bot = get("bot");
    return (
      <RoundBadge
        size={base * 6.2}
        top={top.txt} mid={mid.txt} bot={bot.txt}
        fontTop={top.font} fontMid={mid.font} fontBot={bot.font}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.04, textAlign: "center" }}>
      {tpl.lines.map((l) => {
        const raw = (text[l.key] || "").trim();
        const shown = raw || (placeholder ? l.placeholder : "");
        if (!shown) return null;
        return (
          <span
            key={l.key}
            className={fonts[l.key] || l.font}
            style={{
              color,
              fontSize: base * (l.em || 1),
              fontWeight: l.bold ? 700 : 400,
              letterSpacing: l.spacing || 0,
              whiteSpace: "nowrap",
              opacity: raw ? 1 : 0.5,
            }}
          >
            {shown}
          </span>
        );
      })}
      {motif && motif !== "aucun" && (
        <span style={{ marginTop: base * 0.12, lineHeight: 0 }}>
          <Motif id={motif} color={color} size={base * 1.15} />
        </span>
      )}
    </div>
  );
}
