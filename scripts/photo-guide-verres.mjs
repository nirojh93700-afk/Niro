// Génère un visuel autonome "Bien choisir sa photo à graver" (cristal / verres)
// aux couleurs de Niv Création. Sortie : PNG (et SVG source) dans /tmp.
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";

const W = 1080, H = 1380;
const C = {
  bg: "#faf6ef", card: "#fffdf9", thumb: "#f3ece0",
  ink: "#2b2620", soft: "#5a5247", gold: "#c2a14e", goldD: "#a98935",
  line: "#e7ddcd", face: "#d8c4a0",
  good: "#4f7a4a", goodBg: "#e7f0e5", bad: "#b4452f", badBg: "#f6e4df",
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const SANS = "Liberation Sans, DejaVu Sans, sans-serif";
const SERIF = "DejaVu Serif, serif";

// Texte multi-lignes centré.
function text(x, y, lines, { size = 20, weight = 400, fill = C.ink, font = SANS, lh = 1.2, anchor = "middle", spacing = 0 } = {}) {
  return lines.map((ln, i) =>
    `<text x="${x}" y="${y + i * size * lh}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${spacing ? ` letter-spacing="${spacing}"` : ""}>${esc(ln)}</text>`
  ).join("");
}

// Visage stylisé (buste) centré sur (cx,cy), échelle s.
function face(cx, cy, s = 1, fill = C.face) {
  return `<g transform="translate(${cx} ${cy}) scale(${s})" fill="${fill}">
    <circle cx="0" cy="-20" r="30"/>
    <path d="M -50 62 C -50 20, -28 8, 0 8 C 28 8, 50 20, 50 62 Z"/>
  </g>`;
}

// Pastille ✓ / ✕ en haut à droite d'une vignette.
function badge(x, y, kind) {
  const col = kind === "good" ? C.good : C.bad;
  const mark = kind === "good"
    ? `<path d="M -8 0 L -3 6 L 9 -7" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<g stroke="#fff" stroke-width="4.5" stroke-linecap="round"><line x1="-7" y1="-7" x2="7" y2="7"/><line x1="7" y1="-7" x2="-7" y2="7"/></g>`;
  return `<g transform="translate(${x} ${y})"><circle r="20" fill="${col}"/><g>${mark}</g></g>`;
}

let clipId = 0;
// Une vignette illustrée selon la variante.
function thumb(x, y, size, variant, kind) {
  const id = "clip" + (clipId++);
  const cx = x + size / 2, cy = y + size / 2;
  let inner = "";
  switch (variant) {
    case "light":
      inner = face(cx, cy + 6, 1.15);
      break;
    case "sharp":
      inner = face(cx, cy + 6, 1.15) +
        `<g stroke="${C.goldD}" stroke-width="3" fill="none" opacity="0.55">
          <path d="M ${x+16} ${y+16} h22 M ${x+16} ${y+16} v22"/>
          <path d="M ${x+size-16} ${y+16} h-22 M ${x+size-16} ${y+16} v22"/>
          <path d="M ${x+16} ${y+size-16} h22 M ${x+16} ${y+size-16} v-22"/>
          <path d="M ${x+size-16} ${y+size-16} h-22 M ${x+size-16} ${y+size-16} v-22"/>
        </g>`;
      break;
    case "center":
      inner = `<g stroke="${C.goldD}" stroke-width="2" stroke-dasharray="6 7" opacity="0.5">
          <line x1="${cx}" y1="${y+10}" x2="${cx}" y2="${y+size-10}"/>
          <line x1="${x+10}" y1="${cy}" x2="${x+size-10}" y2="${cy}"/>
        </g>` + face(cx, cy + 6, 1.05);
      break;
    case "space":
      inner = `<rect x="${x+24}" y="${y+24}" width="${size-48}" height="${size-48}" rx="14" fill="none" stroke="${C.goldD}" stroke-width="2" stroke-dasharray="6 7" opacity="0.5"/>` +
        face(cx, cy + 8, 0.74);
      break;
    case "dark":
      inner = face(cx, cy + 6, 1.15) +
        `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#1c1813" opacity="0.62"/>`;
      break;
    case "crop":
      inner = face(cx, cy + 30, 2.25);
      break;
    case "hidden":
      inner = face(cx, cy + 6, 1.15) +
        // lunettes
        `<g fill="#2b2620"><rect x="${cx-26}" y="${cy-22}" width="20" height="13" rx="5"/><rect x="${cx+6}" y="${cy-22}" width="20" height="13" rx="5"/><rect x="${cx-7}" y="${cy-18}" width="14" height="4"/></g>` +
        // main qui masque le bas
        `<path d="M ${cx-34} ${y+size} C ${cx-30} ${cy+6}, ${cx+30} ${cy+6}, ${cx+34} ${y+size} Z" fill="#e3c9a8"/>`;
      break;
    case "crowd": {
      const pts = [];
      for (let r = 0; r < 2; r++) for (let cN = 0; cN < 3; cN++) {
        pts.push([x + size * (0.27 + cN * 0.23), y + size * (0.38 + r * 0.3)]);
      }
      inner = pts.map(([px, py]) => face(px, py, 0.34)).join("");
      break;
    }
  }
  return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="16"/></clipPath></defs>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="16" fill="${C.thumb}"/>
    <g clip-path="url(#${id})">${inner}</g>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="16" fill="none" stroke="${C.line}" stroke-width="1.5"/>
    ${badge(x + size - 22, y + 22, kind)}`;
}

const GOOD = [
  { v: "light",  t: ["Lumière douce", "et uniforme"],   d: ["Visage bien éclairé,", "sans ombre dure."] },
  { v: "sharp",  t: ["Photo nette", "et de qualité"],    d: ["Image bien définie,", "sans flou."] },
  { v: "center", t: ["Sujet bien centré"],               d: ["Au milieu,", "face à l'objectif."] },
  { v: "space",  t: ["De l'espace autour"],              d: ["Un peu de marge,", "fond simple."] },
];
const BAD = [
  { v: "dark",   t: ["Photo trop sombre"],               d: ["Visage dans l'ombre,", "détails perdus."] },
  { v: "crop",   t: ["Cadrage trop serré"],              d: ["Une partie du visage", "est coupée."] },
  { v: "hidden", t: ["Visage caché", "ou masqué"],       d: ["Main, lunettes ou", "cheveux devant."] },
  { v: "crowd",  t: ["Trop de personnes", "ou trop loin"], d: ["Sujet principal", "indistinct."] },
];

// Rangée de 4 vignettes + légendes.
function row(items, topY, kind) {
  const margin = 50, gap = 22, n = 4;
  const tw = (W - margin * 2 - gap * (n - 1)) / n;
  return items.map((it, i) => {
    const x = margin + i * (tw + gap);
    const titleY = topY + tw + 34;
    const descTop = titleY + it.t.length * 23 + 6;
    return thumb(x, topY, tw, it.v, kind) +
      text(x + tw / 2, titleY, it.t, { size: 19, weight: 700, fill: C.ink }) +
      text(x + tw / 2, descTop, it.d, { size: 15.5, fill: C.soft, lh: 1.25 });
  }).join("");
}

function sectionLabel(y, kind, label) {
  const col = kind === "good" ? C.good : C.bad;
  const bg = kind === "good" ? C.goodBg : C.badBg;
  return `<g transform="translate(50 ${y})">
    <rect x="0" y="-26" width="${W-100}" height="0"/>
    <circle cx="16" cy="-9" r="16" fill="${bg}"/>
    ${kind === "good"
      ? `<path d="M 9 -9 L 14 -4 L 24 -15" fill="none" stroke="${col}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<g stroke="${col}" stroke-width="3.4" stroke-linecap="round"><line x1="10" y1="-15" x2="22" y2="-3"/><line x1="22" y1="-15" x2="10" y2="-3"/></g>`}
    <text x="44" y="-1" font-family="${SANS}" font-size="26" font-weight="700" fill="${col}" letter-spacing="1.5">${esc(label)}</text>
  </g>`;
}

const goodTop = 312, badTop = 712;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <rect x="22" y="22" width="${W-44}" height="${H-44}" rx="26" fill="none" stroke="${C.gold}" stroke-width="2" opacity="0.55"/>

  ${text(W/2, 92, ["NIV CRÉATION"], { size: 22, weight: 700, fill: C.goldD, spacing: 8 })}
  ${text(W/2, 165, ["Bien choisir sa photo à graver"], { size: 50, weight: 700, fill: C.ink, font: SERIF })}
  ${text(W/2, 210, ["Pour une gravure photo réussie sur cristal"], { size: 23, fill: C.soft })}
  <line x1="${W/2-70}" y1="244" x2="${W/2+70}" y2="244" stroke="${C.gold}" stroke-width="2.5"/>

  ${sectionLabel(goodTop - 22, "good", "À PRIVILÉGIER")}
  ${row(GOOD, goodTop, "good")}

  ${sectionLabel(badTop - 22, "bad", "À ÉVITER")}
  ${row(BAD, badTop, "bad")}

  <g transform="translate(50 ${H-150})">
    <rect x="0" y="0" width="${W-100}" height="98" rx="16" fill="${C.card}" stroke="${C.line}" stroke-width="1.5"/>
    ${text((W-100)/2, 42, ["Une photo nette, lumineuse et avec le sujet bien détaché"], { size: 19, weight: 700, fill: C.ink })}
    ${text((W-100)/2, 70, ["donne toujours la plus belle gravure. Un doute ? Envoyez-la nous,", "nous vous dirons si elle convient."], { size: 16, fill: C.soft, lh: 1.3 })}
  </g>
</svg>`;

writeFileSync("/tmp/guide-photo-verres.svg", svg);
const png = new Resvg(svg, { font: { loadSystemFonts: true }, fitTo: { mode: "width", value: 1080 } }).render().asPng();
writeFileSync("/tmp/guide-photo-verres.png", png);
console.log("OK -> /tmp/guide-photo-verres.png", png.length, "bytes");
