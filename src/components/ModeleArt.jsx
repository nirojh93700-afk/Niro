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

  // Style "image" : badge fixe (image identique) + texte ajouté en dessous.
  if (tpl.style === "image") {
    const isLight = (color || "").toLowerCase() !== "#3a2f1d";
    const src = isLight ? tpl.imageLight : tpl.imageDark;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.05 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" style={{ width: base * 6.2, height: "auto", display: "block" }} draggable={false} />
        {tpl.lines.map((l) => {
          const raw = (text[l.key] || "").trim();
          const shown = raw || (placeholder ? l.placeholder : "");
          if (!shown) return null;
          return (
            <span key={l.key} className={fonts[l.key] || l.font}
              style={{ color, fontSize: base * (l.em || 0.7), whiteSpace: "nowrap", marginTop: base * 0.12, opacity: raw ? 1 : 0.5 }}>
              {shown}
            </span>
          );
        })}
      </div>
    );
  }

  // Style "badge" : médaillon rond (texte courbé + couronne d'étoiles).
  if (tpl.style === "badge") {
    const get = (k) => {
      const l = tpl.lines.find((x) => x.key === k);
      const t = (text[k] || "").trim();
      return { txt: t || (placeholder ? l?.placeholder : "") || "", font: fonts[k] || l?.font };
    };
    const top = get("top"), mid = get("mid"), bot = get("bot");
    const sub = tpl.lines.find((l) => l.below);
    const subTxt = sub ? (text[sub.key] || "").trim() || (placeholder ? sub.placeholder : "") : "";
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.05 }}>
        <RoundBadge
          size={base * 6.2}
          top={top.txt} mid={mid.txt} bot={bot.txt}
          fontTop={top.font} fontMid={mid.font} fontBot={bot.font}
        />
        {subTxt && (
          <span className={(fonts[sub.key] || sub.font)}
            style={{ color, fontSize: base * (sub.em || 0.5), whiteSpace: "nowrap", marginTop: base * 0.18,
              opacity: (text[sub.key] || "").trim() ? 1 : 0.5 }}>
            {subTxt}
          </span>
        )}
      </div>
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
