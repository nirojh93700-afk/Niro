"use client";

// Dessin des motifs (tous en SVG local) sur un canvas 2D, teintés à la couleur
// de gravure. Partagé par les aperçus 3D (barre, livre, enveloppe, plaque…).

import { MOTIF_SVG } from "@/lib/motifs";

const imageCache = new Map();
function getImg(url) {
  if (imageCache.has(url)) return imageCache.get(url);
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  imageCache.set(url, img);
  return img;
}

export function hasMotif(value) {
  return Boolean(value && MOTIF_SVG[value]);
}

// Précharge les SVG de motifs et rappelle `onReady` une fois chargés.
export function preloadMotifs(values, onReady) {
  (values || []).forEach((v) => {
    const url = MOTIF_SVG[v];
    if (!url) return;
    const img = getImg(url);
    if (!img.complete) img.addEventListener("load", onReady, { once: true });
  });
}

// Dessine le motif centré dans une boîte (cx,cy) de taille (maxW,maxH), teinté
// en `ink`. Renvoie true si dessiné.
export function drawMotifInBox(ctx, motifVal, cx, cy, maxW, maxH, ink, bevel) {
  const url = motifVal && MOTIF_SVG[motifVal];
  if (!url) return false;
  const img = getImg(url);
  if (!img.complete || !img.naturalWidth) return false;

  const iw = img.naturalWidth, ih = img.naturalHeight;
  const ir = iw / ih, cr = maxW / maxH;
  let dw, dh;
  if (ir > cr) { dw = maxW; dh = maxW / ir; } else { dh = maxH; dw = maxH * ir; }
  dw = Math.max(1, Math.round(dw)); dh = Math.max(1, Math.round(dh));

  // Teinte : on dessine le SVG puis on le recolore avec l'encre de gravure.
  const oc = document.createElement("canvas");
  oc.width = dw; oc.height = dh;
  const octx = oc.getContext("2d");
  octx.drawImage(img, 0, 0, dw, dh);
  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = ink || "#161412";
  octx.fillRect(0, 0, dw, dh);

  const x = cx - dw / 2, y = cy - dh / 2;
  if (bevel) {
    ctx.globalAlpha = 0.28;
    ctx.drawImage(oc, x + 1.2, y + 1.4);
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(oc, x, y);
  return true;
}
