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
  const layout = value?.layout || tpl.layout || tpl.style || "stack";

  const get = (k) => {
    const l = tpl.lines.find((x) => x.key === k);
    const raw = (text[k] || "").trim();
    return { raw, txt: raw || (placeholder ? l?.placeholder : "") || "", font: fonts[k] || l?.font, em: l?.em, bold: l?.bold, spacing: l?.spacing };
  };
  const subLine = tpl.lines.find((l) => l.below);
  const subTxt = subLine ? (text[subLine.key] || "").trim() || (placeholder ? subLine.placeholder : "") : "";
  const subRaw = subLine ? (text[subLine.key] || "").trim() : "";

  // Petit filet décoratif (volute).
  const Flourish = () => (
    <svg width={base * 4} height={base * 0.4} viewBox="0 0 100 10" style={{ margin: `${base * 0.05}px 0`, display: "block" }} aria-hidden="true">
      <line x1="6" y1="5" x2="94" y2="5" stroke={color} strokeWidth="1.6" />
      <circle cx="6" cy="5" r="2.4" fill={color} /><circle cx="94" cy="5" r="2.4" fill={color} />
      <polygon points="50,1 53.5,5 50,9 46.5,5" fill={color} />
    </svg>
  );

  const subEl = subTxt && value?.addText !== false ? (
    <span className={fonts[subLine.key] || subLine.font}
      style={{ color, fontSize: base * (subLine.em || 0.5), whiteSpace: "nowrap", marginTop: base * 0.16, opacity: subRaw ? 1 : 0.5 }}>
      {subTxt}
    </span>
  ) : null;

  // --- Style "médaillon rond" (badge) ---
  if (layout === "badge") {
    const top = get("top"), mid = get("mid"), bot = get("bot");
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.05 }}>
        <RoundBadge
          size={base * 6.2}
          top={top.txt} mid={mid.txt} bot={bot.txt}
          fontTop={top.font} fontMid={mid.font} fontBot={bot.font}
          color={color}
          filled={value?.bg === "plein"}
        />
        {subEl}
      </div>
    );
  }

  // --- Style "étiquette" (image fixe type Best Father + nom central modifiable) ---
  if (layout === "label") {
    const isLight = (color || "").toLowerCase() !== "#3a2f1d";
    const src = isLight ? tpl.labelImageLight : tpl.labelImageDark;
    const mid = get("mid");
    const W = base * 6.2;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", width: W }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" draggable={false} style={{ width: "100%", display: "block" }} />
          {mid.txt && (
            <span className={mid.font} style={{ position: "absolute", left: "50%", top: "36%", transform: "translate(-50%,-50%)", color, fontSize: W * 0.11, fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1, opacity: mid.raw ? 1 : 0.5 }}>
              {mid.txt}
            </span>
          )}
        </div>
        {subEl}
      </div>
    );
  }

  // --- Style "classique" (maquette empilée : élu / ★ PAPY ★ / DE L'ANNÉE + ancre) ---
  if (layout === "classic") {
    const top = get("top"), mid = get("mid"), bot = get("bot");
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.05, textAlign: "center" }}>
        {top.txt && (
          <span className={top.font} style={{ color, fontSize: base * (top.em || 0.85), whiteSpace: "nowrap", opacity: top.raw ? 1 : 0.5 }}>{top.txt}</span>
        )}
        <Flourish />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: base * 0.28 }}>
          <Motif id="etoile" color={color} size={base * 0.5} />
          {mid.txt && (
            <span className={mid.font} style={{ color, fontSize: base, fontWeight: mid.bold ? 700 : 400, letterSpacing: mid.spacing || 0, whiteSpace: "nowrap", opacity: mid.raw ? 1 : 0.5 }}>{mid.txt}</span>
          )}
          <Motif id="etoile" color={color} size={base * 0.5} />
        </div>
        <Flourish />
        {bot.txt && (
          <span className={bot.font} style={{ color, fontSize: base * (bot.em || 0.42), letterSpacing: bot.spacing || 0, whiteSpace: "nowrap", opacity: bot.raw ? 1 : 0.5 }}>{bot.txt}</span>
        )}
        {motif && motif !== "aucun" && (
          <span style={{ marginTop: base * 0.15, lineHeight: 0 }}><Motif id={motif} color={color} size={base * 0.95} /></span>
        )}
        {subEl}
      </div>
    );
  }

  // --- Style par défaut : lignes empilées + 1 motif ---
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.04, textAlign: "center" }}>
      {tpl.lines.filter((l) => !l.below).map((l) => {
        const raw = (text[l.key] || "").trim();
        const shown = raw || (placeholder ? l.placeholder : "");
        if (!shown) return null;
        return (
          <span key={l.key} className={fonts[l.key] || l.font}
            style={{ color, fontSize: base * (l.em || 1), fontWeight: l.bold ? 700 : 400, letterSpacing: l.spacing || 0, whiteSpace: "nowrap", opacity: raw ? 1 : 0.5 }}>
            {shown}
          </span>
        );
      })}
      {motif && motif !== "aucun" && (
        <span style={{ marginTop: base * 0.12, lineHeight: 0 }}>
          <Motif id={motif} color={color} size={base * 1.15} />
        </span>
      )}
      {subEl}
    </div>
  );
}
