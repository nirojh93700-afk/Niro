"use client";

// Dessin des motifs (fleurs = images détourées, symboles = glyphes) sur un
// canvas 2D. Partagé par les aperçus 3D (livre, enveloppe, etc.).

import { FLOWER_URLS, GLYPHS } from "@/lib/motifs";

const VS_TEXT = String.fromCharCode(0xfe0e); // rendu monochrome (anti emoji couleur)

const imageCache = new Map();
function getImg(url) {
  if (imageCache.has(url)) return imageCache.get(url);
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  imageCache.set(url, img);
  return img;
}

// Détoure une image (fond clair → transparent, lignes sombres → noir net).
const processedCache = new Map();
function getProcessedFlower(url) {
  if (processedCache.has(url)) return processedCache.get(url);
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
  catch { processedCache.set(url, img); return img; }
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    let a = 255 - lum;
    a = a < 45 ? 0 : Math.min(255, (a - 45) * 1.7);
    d[i] = 12; d[i + 1] = 12; d[i + 2] = 12; d[i + 3] = a;
  }
  octx.putImageData(data, 0, 0);
  processedCache.set(url, oc);
  return oc;
}

export function hasMotif(value) {
  return Boolean(value && (FLOWER_URLS[value] || GLYPHS[value]));
}

// Précharge les images de motifs et rappelle `onReady` une fois chargées.
export function preloadMotifs(values, onReady) {
  (values || []).forEach((v) => {
    const url = FLOWER_URLS[v];
    if (url) {
      const img = getImg(url);
      if (!img.complete) img.addEventListener("load", onReady, { once: true });
    }
  });
}

// Dessine le motif centré dans une boîte (cx,cy) de taille (maxW,maxH).
// `ink` = couleur du symbole (pour les glyphes). Renvoie true si dessiné.
export function drawMotifInBox(ctx, motifVal, cx, cy, maxW, maxH, ink, bevel) {
  if (!motifVal) return false;
  if (FLOWER_URLS[motifVal]) {
    const pc = getProcessedFlower(FLOWER_URLS[motifVal]);
    if (!pc) return false;
    const pw = pc.width || pc.naturalWidth;
    const ph = pc.height || pc.naturalHeight;
    let dw = maxW, dh = ph * (dw / pw);
    if (dh > maxH) { dh = maxH; dw = pw * (dh / ph); }
    ctx.drawImage(pc, cx - dw / 2, cy - dh / 2, dw, dh);
    return true;
  }
  if (GLYPHS[motifVal]) {
    const size = Math.min(maxW, maxH);
    ctx.save();
    ctx.font = `${size}px "Segoe UI Symbol", "Apple Color Emoji", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const m = GLYPHS[motifVal] + VS_TEXT;
    if (bevel) { ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.fillText(m, cx + 1.2, cy + 1.4); }
    ctx.fillStyle = ink;
    ctx.fillText(m, cx, cy);
    ctx.restore();
    return true;
  }
  return false;
}
