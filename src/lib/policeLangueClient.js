"use client";
// Charge dans le navigateur l'écriture d'une langue de gravure (07/11/2026) : seulement les lettres du
// texte, servies par le site (/api/police-gravure), jamais directement par Google. La classe CSS
// « fnt-lang-<code> » (globals.css) pointe vers la famille « NivGrav-<code> » chargée ici.
const etat = {}; // code -> { lettres: Set, face }

export function classeLangue(code) {
  return ["ta", "ar", "he", "zh"].includes(code) ? `fnt-lang-${code}` : "";
}

export async function chargerPoliceLangue(code, texte) {
  if (typeof window === "undefined" || !classeLangue(code) || !window.FontFace || !document.fonts) return;
  const e = etat[code] || (etat[code] = { lettres: new Set(), face: null });
  const nouvelles = [...String(texte || "")].filter((c) => !e.lettres.has(c));
  if (!nouvelles.length) return;
  nouvelles.forEach((c) => e.lettres.add(c));
  const tout = [...e.lettres].sort().join("");
  try {
    const face = new FontFace(`NivGrav-${code}`, `url(/api/police-gravure?l=${code}&t=${encodeURIComponent(tout)})`);
    await face.load();
    if (e.face) document.fonts.delete(e.face);
    document.fonts.add(face);
    e.face = face;
    window.dispatchEvent(new Event("niv-police-langue"));
  } catch { /* l'écriture du système prend le relais */ }
}
