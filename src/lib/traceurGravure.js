// =============================================================================
// TRACEUR DES FICHIERS À GRAVER (21/11/2026, gérant : « l'agent doit tout préparer, il me demande si c'est bon,
// je valide et ça va dans la commande »). Fonctions PURES (aucun navigateur, aucun serveur) :
//  - estDessin : un visuel noir et blanc (dessin, logo, texte mis en page) ou une photo ?
//  - tracer    : image en niveaux de gris → contours (même méthode que public/atelier-outils/fabrique.js :
//                carrés mobiles au demi-ton, matière à droite, puis allègement)
//  - svgGravure: les contours → fichier SVG à la taille réelle en mm (noir, aucune image dedans).
// =============================================================================

/** Statistiques d'une image RVBA : est-ce un dessin noir sur fond clair ? */
export function estDessin(data, W, H) {
  let n = 0, neutre = 0, sombre = 0;
  const pas = Math.max(1, Math.floor(Math.sqrt((W * H) / 60000)));
  for (let y = 0; y < H; y += pas) {
    for (let x = 0; x < W; x += pas) {
      const k = (y * W + x) * 4;
      if (data[k + 3] < 20) { n++; neutre++; continue; }
      const r = data[k], g = data[k + 1], b = data[k + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (r * 77 + g * 150 + b * 29) >> 8;
      n++;
      if (mx - mn < 45 && (l < 95 || l > 175)) neutre++;
      if (l < 128) sombre++;
    }
  }
  const pNeutre = n ? neutre / n : 0, pSombre = n ? sombre / n : 0;
  return { dessin: pNeutre >= 0.86 && pSombre >= 0.01 && pSombre <= 0.6, pNeutre, pSombre };
}

/** Seuil d'Otsu sur un tableau de gris. */
export function seuilOtsu(G) {
  const h = new Array(256).fill(0);
  for (let i = 0; i < G.length; i++) h[G[i]]++;
  const total = G.length;
  let s = 0; for (let i = 0; i < 256; i++) s += i * h[i];
  let sb = 0, wb = 0, best = 0, t = 128;
  for (let i = 0; i < 256; i++) {
    wb += h[i]; if (!wb) continue;
    const wf = total - wb; if (!wf) break;
    sb += i * h[i];
    const mb = sb / wb, mf = (s - sb) / wf, v = wb * wf * (mb - mf) ** 2;
    if (v > best) { best = v; t = i; }
  }
  return t;
}

/** RVBA → gris bordé d'une marge blanche, recentré pour que le seuil tombe sur 127,5. */
export function grisPourTrace(data, W, H) {
  const g = new Uint8Array(W * H);
  for (let i = 0, k = 0; i < W * H; i++, k += 4) {
    const a = data[k + 3] / 255;
    const l = (data[k] * 77 + data[k + 1] * 150 + data[k + 2] * 29) >> 8;
    g[i] = Math.round(l * a + 255 * (1 - a));
  }
  const t = seuilOtsu(g);
  const Wn = W + 2, G = new Uint8Array(Wn * (H + 2)).fill(255);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = g[y * W + x] - t + 127.5;
    G[(y + 1) * Wn + x + 1] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
  }
  return G;
}

function contours(G, W, H) {
  const Wn = W + 2, Hn = H + 2, suiv = new Map();
  for (let y = 0; y < Hn - 1; y++) {
    for (let x = 0, i = y * Wn; x < Wn - 1; x++, i++) {
      const cas = (G[i] < 128 ? 8 : 0) | (G[i + 1] < 128 ? 4 : 0) | (G[i + Wn + 1] < 128 ? 2 : 0) | (G[i + Wn] < 128 ? 1 : 0);
      if (cas === 0 || cas === 15) continue;
      const T = 2 * i, B = 2 * (i + Wn), L = 2 * i + 1, D = 2 * (i + 1) + 1;
      let moy;
      switch (cas) {
        case 1: suiv.set(L, B); break; case 2: suiv.set(B, D); break; case 3: suiv.set(L, D); break; case 4: suiv.set(D, T); break;
        case 6: suiv.set(B, T); break; case 7: suiv.set(L, T); break; case 8: suiv.set(T, L); break; case 9: suiv.set(T, B); break;
        case 11: suiv.set(T, D); break; case 12: suiv.set(D, L); break; case 13: suiv.set(D, B); break; case 14: suiv.set(B, L); break;
        case 5: moy = (G[i] + G[i + 1] + G[i + Wn] + G[i + Wn + 1]) / 4; if (moy < 128) { suiv.set(L, T); suiv.set(D, B); } else { suiv.set(D, T); suiv.set(L, B); } break;
        case 10: moy = (G[i] + G[i + 1] + G[i + Wn] + G[i + Wn + 1]) / 4; if (moy < 128) { suiv.set(T, D); suiv.set(B, L); } else { suiv.set(T, L); suiv.set(B, D); } break;
        default: break;
      }
    }
  }
  const pt = (k) => {
    const n = k >> 1, v0 = G[n], nx = n % Wn, ny = (n - nx) / Wn;
    if (k & 1) { const v1 = G[n + Wn], t = (v0 - 127.5) / (v0 - v1); return [nx - 0.5, ny - 0.5 + t]; }
    const v1 = G[n + 1], t = (v0 - 127.5) / (v0 - v1); return [nx - 0.5 + t, ny - 0.5];
  };
  const boucles = [];
  for (const k0 of Array.from(suiv.keys())) {
    if (!suiv.has(k0)) continue;
    const pts = []; let k = k0, garde = 0;
    do { pts.push(pt(k)); const nx = suiv.get(k); suiv.delete(k); k = nx; } while (k !== undefined && k !== k0 && ++garde < 8e6);
    if (pts.length >= 4) boucles.push(pts);
  }
  return boucles;
}

function aire(p) { let a = 0; for (let i = 0, n = p.length; i < n; i++) { const q = p[(i + 1) % n]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return Math.abs(a) / 2; }

function alleger(pts, tol) {
  const n = pts.length; if (n < 8) return pts;
  let loin = 0, dm = -1;
  for (let i = 1; i < n; i++) { const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2; if (d > dm) { dm = d; loin = i; } }
  const garde = new Uint8Array(n); garde[0] = garde[loin] = 1;
  const pile = [0, loin, loin, n];
  while (pile.length) {
    const b = pile.pop(), a = pile.pop(), A = pts[a], Bp = pts[b % n], dx = Bp[0] - A[0], dy = Bp[1] - A[1], Lg = Math.hypot(dx, dy);
    let mx = -1, mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Lg < 1e-6 ? Math.hypot(pts[i][0] - A[0], pts[i][1] - A[1]) : Math.abs((pts[i][0] - A[0]) * dy - (pts[i][1] - A[1]) * dx) / Lg;
      if (d > mx) { mx = d; mi = i; }
    }
    if (mx > tol) { garde[mi] = 1; pile.push(a, mi, mi, b); }
  }
  const o = []; for (let i = 0; i < n; i++) if (garde[i]) o.push(pts[i]); return o;
}

/** Gris bordé → liste de tracés « d » en pixels de l'image, et le cadre de l'encre. */
export function tracer(G, W, H) {
  const r1 = (v) => Math.round(v * 10) / 10;
  const boucles = contours(G, W, H).filter((b) => aire(b) > 10).map((b) => alleger(b, 0.5));
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const b of boucles) for (const [x, y] of b) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  if (!boucles.length) return { paths: [], cadre: null };
  const paths = boucles.map((b) => b.map(([x, y], i) => (i ? "L" : "M") + r1(x - x0) + " " + r1(y - y0)).join("") + "Z");
  return { paths, cadre: { w: r1(x1 - x0), h: r1(y1 - y0) } };
}

export const D_VALIDE = /^[MLZ0-9. -]+$/;

/** Tracés + cadre (pixels) → SVG à la taille réelle (largeur en mm, hauteur au prorata). */
export function svgGravure(paths, cadre, largeurMm) {
  const w = Math.max(1, Number(cadre?.w) || 1), h = Math.max(1, Number(cadre?.h) || 1);
  const L = Math.max(5, Math.min(400, Number(largeurMm) || 50)), Hmm = Math.round((L * h / w) * 100) / 100;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${L}mm" height="${Hmm}mm" viewBox="0 0 ${w} ${h}">\n<path fill="#000000" fill-rule="evenodd" d="${paths.join("")}"/>\n</svg>\n`;
}
