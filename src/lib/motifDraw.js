"use client";

// Dessin des motifs (fleurs = images détourées, symboles = SVG teintés) sur un
// canvas 2D. Utilisé par les aperçus 3D (livre…). N'altère pas la liste des
// motifs : lit FLOWER_URLS / GLYPHS / GLYPH_THUMBS tels quels.

import { FLOWER_URLS, GLYPHS, GLYPH_THUMBS } from "@/lib/motifs";

const VS_TEXT = String.fromCharCode(0xfe0e);

const imgCache = new Map();
function getImg(url) {
  if (imgCache.has(url)) return imgCache.get(url);
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  imgCache.set(url, img);
  return img;
}

// Détoure une fleur (fond clair -> transparent, lignes sombres -> noir net).
const procCache = new Map();
function getProcessedFlower(url) {
  if (procCache.has(url)) return procCache.get(url);
  const img = getImg(url);
  if (!img.complete || !img.naturalWidth) return null;
  const scale = Math.min(1, 700 / Math.max(img.naturalWidth, img.naturalHeight));
  const oc = document.createElement("canvas");
  oc.width = Math.max(1, Math.round(img.naturalWidth * scale));
  oc.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const octx = oc.getContext("2d");
  octx.drawImage(img, 0, 0, oc.width, oc.height);
  let data;
  try { data = octx.getImageData(0, 0, oc.width, oc.height); }
  catch { procCache.set(url, img); return img; }
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    let a = 255 - lum;
    a = a < 45 ? 0 : Math.min(255, (a - 45) * 1.7);
    d[i] = 12; d[i + 1] = 12; d[i + 2] = 12; d[i + 3] = a;
  }
  octx.putImageData(data, 0, 0);
  procCache.set(url, oc);
  return oc;
}

// Symbole SVG teinté à la couleur de gravure.
const tintCache = new Map();
function getTintedGlyph(url, ink) {
  const key = url + "|" + ink;
  if (tintCache.has(key)) return tintCache.get(key);
  const img = getImg(url);
  if (!img.complete || !img.naturalWidth) return null;
  const oc = document.createElement("canvas");
  oc.width = img.naturalWidth; oc.height = img.naturalHeight;
  const o = oc.getContext("2d");
  o.drawImage(img, 0, 0);
  o.globalCompositeOperation = "source-in";
  o.fillStyle = ink;
  o.fillRect(0, 0, oc.width, oc.height);
  tintCache.set(key, oc);
  return oc;
}

export function hasMotif(value) {
  return Boolean(value && (FLOWER_URLS[value] || GLYPHS[value]));
}

export function preloadMotifs(values, onReady) {
  (values || []).forEach((v) => {
    const url = FLOWER_URLS[v] || GLYPH_THUMBS[v];
    if (!url) return;
    const img = getImg(url);
    if (!img.complete) img.addEventListener("load", onReady, { once: true });
  });
}

// Dessine le motif centré dans la boîte (cx,cy) de taille (maxW,maxH), teinté en `ink`.
export function drawMotifInBox(ctx, motifVal, cx, cy, maxW, maxH, ink, bevel) {
  if (!motifVal) return false;
  if (FLOWER_URLS[motifVal]) {
    const pc = getProcessedFlower(FLOWER_URLS[motifVal]);
    if (!pc) return false;
    const pw = pc.width || pc.naturalWidth, ph = pc.height || pc.naturalHeight;
    let dw = maxW, dh = ph * (dw / pw);
    if (dh > maxH) { dh = maxH; dw = pw * (dh / ph); }
    ctx.drawImage(pc, cx - dw / 2, cy - dh / 2, dw, dh);
    return true;
  }
  const g = GLYPH_THUMBS[motifVal] && getTintedGlyph(GLYPH_THUMBS[motifVal], ink);
  if (g) {
    let dh = maxH, dw = g.width * (dh / g.height);
    if (dw > maxW) { dw = maxW; dh = g.height * (dw / g.width); }
    if (bevel) { ctx.globalAlpha = 0.28; ctx.drawImage(g, cx - dw / 2 + 1.2, cy - dh / 2 + 1.4, dw, dh); ctx.globalAlpha = 1; }
    ctx.drawImage(g, cx - dw / 2, cy - dh / 2, dw, dh);
    return true;
  }
  // Repli : symbole de police.
  if (GLYPHS[motifVal]) {
    const size = Math.min(maxW, maxH);
    ctx.save();
    ctx.font = `${size}px "Segoe UI Symbol", serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = ink;
    ctx.fillText(GLYPHS[motifVal] + VS_TEXT, cx, cy);
    ctx.restore();
    return true;
  }
  return false;
}
