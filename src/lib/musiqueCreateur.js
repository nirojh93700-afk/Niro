// Créateur « plaque et porte-clés musique à scanner » (26/11/2026, gérant : « mets en ligne », maquette enregistrée v11,
// artifact YEY36tGKxeCeYo1kn56NnP). La cliente colle le lien de sa chanson : un QR code ordinaire est calculé et gravé sur du
// bois, avec un titre, une dédicace et, si elle veut, sa photo. Ce fichier est PUR : il sert à la fiche, au panier, au
// paiement (prix de confiance), à l'atelier et au fichier de la machine dans Gestion. Une seule géométrie pour tout le monde.
// ⛔ Jamais le code Spotify officiel (barres), interdit sur un produit vendu ; jamais le mot « Spotify » dans le nom du produit.
import qrcode from "qrcode-generator";
import { getFontLabel } from "@/lib/fonts";

export const MUS_MODELES = [
  { id: "plaque", nom: "Plaque simple", s: "QR au centre, titre dessous" },
  { id: "carte", nom: "Carte musique", s: "note de musique et titre en haut" },
  { id: "porte", nom: "Porte-clés", s: "QR carré, anneau sur le côté" },
];
// Largeur en mm. Les PRIX viennent des options du produit (products.js) : jamais d'ici.
export const MUS_TAILLES = {
  plaque: [{ id: "p", nom: "Petite", w: 80 }, { id: "m", nom: "Moyenne", w: 110 }, { id: "g", nom: "Grande", w: 150 }],
  porte: [{ id: "p", nom: "Petit", w: 50 }, { id: "m", nom: "Moyen", w: 60 }, { id: "g", nom: "Grand", w: 70 }],
};
export const MUS_POLICES = [
  ["playfair", "Playfair Display", "'Playfair Display',Georgia,serif"], ["cinzel", "Cinzel", "Cinzel,serif"],
  ["montserrat", "Montserrat", "Montserrat,sans-serif"], ["inter", "Inter", "Inter,sans-serif"],
  ["great-vibes", "Great Vibes", "'Great Vibes',cursive"], ["allura", "Allura", "Allura,cursive"],
  ["pacifico", "Pacifico", "Pacifico,cursive"], ["cinzel-deco", "Cinzel Decorative", "'Cinzel Decorative',serif"],
];
// Mousquetons du porte-clés (photo du gérant du 26/11, même prix pour les 7).
export const MUS_MOUSQUETONS = [
  ["or-rose", "Or rose"], ["anthracite", "Gris anthracite"], ["dore", "Doré"], ["argente", "Argenté"], ["noir", "Noir"], ["bronze", "Bronze"], ["champagne", "Champagne"],
].map(([id, nom]) => ({ id, nom, img: `/createurs/musique/mousquetons/${id}.png` }));
// Photo gravée : + 5 € la gravure (gérant, 26/11/2026).
export const MUS_PRIX = { photo: 5 };
export const MUS_EXEMPLE = "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC";
export const MUS_PHOTO_EXEMPLE = "/createurs/musique/photo-exemple.jpg";
export const MUS_MAX = { titre: 28, dedi: 36 };

const PLATS = [
  [/(^|\.)spotify\.com$|^spotify\.link$/, "Spotify"], [/(^|\.)deezer\.com$|^deezer\.page\.link$|^link\.deezer\.com$/, "Deezer"],
  [/^music\.apple\.com$/, "Apple Music"], [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"], [/(^|\.)soundcloud\.com$/, "SoundCloud"],
];

/** Le lien collé par la cliente : null (vide), { ok:false } (pas un lien de musique) ou { ok:true, plat, url } (nettoyé). */
export function musLireLien(t) {
  t = String(t || "").trim();
  if (!t) return null;
  const m = t.match(/https?:\/\/\S+/);
  if (m) t = m[0];
  if (/^spotify:/.test(t)) { const p = t.split(":"); if (p.length >= 3) t = `https://open.spotify.com/${p[1]}/${p[2]}`; }
  let u;
  try { u = new URL(t.startsWith("http") ? t : "https://" + t); } catch { return { ok: false }; }
  if (!/^https?:$/.test(u.protocol)) return { ok: false };
  const h = u.hostname.replace(/^www\./, ""), p = PLATS.find(([r]) => r.test(h));
  if (!p) return { ok: false };
  ["si", "utm_source", "utm_medium", "utm_campaign", "feature", "pp"].forEach((k) => u.searchParams.delete(k));
  const url = u.toString().replace(/\?$/, "");
  if (url.length > 300) return { ok: false };
  return { ok: true, plat: p[1], url };
}

export const musFamille = (modele) => (modele === "porte" ? "porte" : "plaque");
export const musVariantId = (modele, tl) => `musique-${musFamille(modele)}-${tl}`;
export const musTaillesDe = (modele) => MUS_TAILLES[musFamille(modele)];
export const musTaille = (etat) => musTaillesDe(etat.modele).find((t) => t.id === etat.tl) || musTaillesDe(etat.modele)[1];
export const musPolice = (k) => MUS_POLICES.find((p) => p[0] === k) || MUS_POLICES[0];
export const musMousqueton = (id) => MUS_MOUSQUETONS.find((m) => m.id === id) || MUS_MOUSQUETONS[3];
const photoDe = (etat) => Boolean(etat && (etat.photo || etat.ph === "oui"));

const texte = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const photoValide = (src) => typeof src === "string" && /^\/api\/img\/[A-Za-z0-9_-]{6,80}$/.test(src);

/**
 * La création, vérifiée et nettoyée (ce qui est gardé avec la commande). Renvoie null si elle n'est pas valable :
 * lien qui n'est pas un lien de musique, modèle ou taille inconnus, photo non envoyée, petite plaque avec photo.
 */
export function musNormaliser(etat) {
  if (!etat || typeof etat !== "object") return null;
  const l = musLireLien(etat.lien);
  if (!l || !l.ok) return null;
  if (!MUS_MODELES.some((m) => m.id === etat.modele)) return null;
  if (!musTaillesDe(etat.modele).some((t) => t.id === etat.tl)) return null;
  const porte = etat.modele === "porte";
  let photo = "";
  if (etat.photo || etat.ph === "oui") {
    if (!photoValide(etat.photo)) return null;
    photo = etat.photo;
    if (!porte && etat.tl === "p") return null; // photo et QR côte à côte : Moyenne ou Grande seulement
  }
  return {
    lien: l.url, plat: l.plat, modele: etat.modele, tl: etat.tl,
    titre: porte ? "" : texte(etat.titre, MUS_MAX.titre), dedi: porte ? "" : texte(etat.dedi, MUS_MAX.dedi),
    police: musPolice(etat.police)[0], scan: porte ? false : etat.scan !== false,
    mq: porte ? musMousqueton(etat.mq).id : "", photo,
  };
}

/** Ce qui s'ajoute au prix de la taille : la photo gravée. */
export const musSupplement = (mus) => (mus && mus.photo ? MUS_PRIX.photo : 0);

/** Ce qu'il manque avant le panier (liste vide = prête). `etat` = l'état de la fiche (ph, photoChoisie). */
export function musManque(etat) {
  const manque = [];
  const l = musLireLien(etat.lien);
  if (!l || !l.ok) manque.push("le lien de votre chanson (étape 1)");
  if (etat.ph === "oui" && !etat.photoChoisie) manque.push("votre photo (étape 2)");
  return manque;
}

// ---------- QR code ----------
export function musMatrice(txt) {
  const q = qrcode(0, "M");
  q.addData(txt);
  q.make();
  const n = q.getModuleCount(), m = [];
  for (let r = 0; r < n; r++) { m.push([]); for (let c = 0; c < n; c++) m[r].push(q.isDark(r, c)); }
  return m;
}
export function musQrPath(m, x, y, taille) {
  const n = m.length, s = taille / n;
  let d = "";
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!m[r][c]) { c++; continue; }
      let e = c;
      while (e < n && m[r][e]) e++;
      d += `M${(x + c * s).toFixed(3)} ${(y + r * s).toFixed(3)}h${((e - c) * s).toFixed(3)}v${s.toFixed(3)}h${(-(e - c) * s).toFixed(3)}z`;
      c = e;
    }
  }
  return d;
}

// ---------- géométrie (mm) : la même pour l'aperçu, le fichier de l'atelier et les contrôles ----------
const rect = (W, H, r) => `M${r} 0H${W - r}A${r} ${r} 0 0 1 ${W} ${r}V${H - r}A${r} ${r} 0 0 1 ${W - r} ${H}H${r}A${r} ${r} 0 0 1 0 ${H - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
/** `cote` = "avant" ou "dos" (le dos n'existe que pour le porte-clés avec photo). */
export function musGeo(etat, cote = "avant") {
  const W = musTaille(etat).w, photo = photoDe(etat);
  if (etat.modele === "porte") {
    const B = W * 0.833, tab = W - B, th = B * 0.36, hole = W * 0.08, r = B * 0.08;
    const contour = `M${r} 0H${B - r}A${r} ${r} 0 0 1 ${B} ${r}V${(B - th) / 2}H${B + tab - th / 2}A${th / 2} ${th / 2} 0 0 1 ${B + tab - th / 2} ${(B + th) / 2}H${B}V${B - r}A${r} ${r} 0 0 1 ${B - r} ${B}H${r}A${r} ${r} 0 0 1 0 ${B - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
    const q = B * 0.78, trou = { cx: B + tab - th / 2, cy: B / 2, r: hole / 2 };
    if (photo && cote === "dos") return { w: W, h: B, contour, trou, miroir: true, qr: null, photo: { x: W - B + (B - q) / 2, y: (B - q) / 2, t: q }, textes: [] };
    return { w: W, h: B, contour, trou, qr: { x: (B - q) / 2, y: (B - q) / 2, t: q }, textes: [] };
  }
  const f = musPolice(etat.police)[2], scan = etat.scan !== false ? "SCANNEZ POUR ÉCOUTER" : "", T = [];
  if (photo) {
    // photo à gauche, QR code à droite, côte à côte (plaque et carte, tailles Moyenne et Grande)
    const H = W * 0.78, mg = W * 0.07, s = (W - 3 * mg) / 2, y0 = W * 0.17;
    if (etat.modele === "plaque") { T.push({ ligne: [W * 0.1, W * 0.06, W * 0.9, W * 0.06] }); if (scan) T.push({ t: scan, x: W / 2, y: W * 0.125, s: W * 0.038, f: "Inter,sans-serif", w: 700, ls: W * 0.003 }); }
    else { T.push({ note: true, x: W * 0.07, y: W * 0.035, s: W * 0.1 }); if (scan) T.push({ t: scan, x: W * 0.62, y: W * 0.11, s: W * 0.034, f: "Inter,sans-serif", w: 700, ls: W * 0.003 }); }
    if (etat.titre) T.push({ t: etat.titre, x: W / 2, y: y0 + s + W * 0.085, s: W * 0.06, f, w: 600 });
    if (etat.dedi) T.push({ t: etat.dedi, x: W / 2, y: y0 + s + W * 0.14, s: W * 0.036, f: "Inter,sans-serif", w: 500 });
    return { w: W, h: H, contour: rect(W, H, W * 0.06), qr: { x: mg * 2 + s, y: y0, t: s }, photo: { x: mg, y: y0, t: s }, textes: T };
  }
  const H = W * 1.121, contour = rect(W, H, W * 0.06);
  if (etat.modele === "plaque") {
    const q = W * 0.6, y0 = W * 0.2;
    T.push({ ligne: [W * 0.1, W * 0.075, W * 0.9, W * 0.075] });
    if (scan) T.push({ t: scan, x: W / 2, y: W * 0.15, s: W * 0.048, f: "Inter,sans-serif", w: 700, ls: W * 0.004 });
    if (etat.titre) T.push({ t: etat.titre, x: W / 2, y: W * 0.92, s: W * 0.075, f, w: 600 });
    if (etat.dedi) T.push({ t: etat.dedi, x: W / 2, y: W * 1.015, s: W * 0.045, f: "Inter,sans-serif", w: 500 });
    return { w: W, h: H, contour, qr: { x: (W - q) / 2, y: y0 + (etat.titre || etat.dedi ? 0 : W * 0.06), t: q }, textes: T };
  }
  const q = W * 0.58;
  T.push({ note: true, x: W * 0.08, y: W * 0.07, s: W * 0.15 });
  if (etat.titre) T.push({ t: etat.titre, x: W * 0.27, y: W * 0.14, s: W * 0.07, f, w: 600, a: "start" });
  if (etat.dedi) T.push({ t: etat.dedi, x: W * 0.27, y: W * 0.205, s: W * 0.042, f: "Inter,sans-serif", w: 500, a: "start" });
  if (scan) T.push({ t: scan, x: W / 2, y: W * 1.055, s: W * 0.048, f: "Inter,sans-serif", w: 700, ls: W * 0.004 });
  return { w: W, h: H, contour, qr: { x: (W - q) / 2, y: W * 0.28, t: q }, textes: T };
}

// ---------- dessin (chaînes SVG) ----------
export const MUS_NOTE = "M0.05 0.888A0.17 0.12 -20 1 1 0.37 0.772A0.17 0.12 -20 1 1 0.05 0.888ZM0.335 0.80V0.27H0.375V0.80ZM0.875 0.69V0.15H0.915V0.69ZM0.335 0.36V0.25L0.915 0.12V0.23ZM0.59 0.768A0.17 0.12 -20 1 1 0.91 0.652A0.17 0.12 -20 1 1 0.59 0.768Z";
export const musEsc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function musTexteSvg(t, clr, maxW, W) {
  if (t.ligne) return `<line x1="${t.ligne[0]}" y1="${t.ligne[1]}" x2="${t.ligne[2]}" y2="${t.ligne[3]}" stroke="${clr}" stroke-width="${W * 0.008}"/>`;
  if (t.note) return `<path transform="translate(${t.x} ${t.y}) scale(${t.s})" d="${MUS_NOTE}" fill="${clr}"/>`;
  return `<text x="${t.x}" y="${t.y}" text-anchor="${t.a || "middle"}" font-family="${musEsc(t.f)}" font-weight="${t.w || 400}" font-size="${t.s}" letter-spacing="${t.ls || 0}" fill="${clr}" data-max="${maxW}">${musEsc(t.t)}</text>`;
}
export function musPhotoSvg(p, src, id) {
  const r = p.t * 0.05;
  return `<clipPath id="${id}"><rect x="${p.x}" y="${p.y}" width="${p.t}" height="${p.t}" rx="${r}"/></clipPath><image href="${src}" x="${p.x}" y="${p.y}" width="${p.t}" height="${p.t}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
}

/** L'aperçu sur bois : { viewBox, html } à poser dans un <svg>. `photoSrc` = la photo déjà passée en nuances de brun. */
export function musApercu(etat, m, cote, photoSrc) {
  const g = musGeo(etat, cote), pad = Math.max(g.w, g.h) * 0.04;
  const clr = "#3a2614", maxW = g.w * 0.86, mir = g.miroir ? ` transform="translate(${g.w} 0) scale(-1 1)"` : "";
  const html = `<defs><linearGradient id="bois" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ecd3a8"/><stop offset=".5" stop-color="#e2c393"/><stop offset="1" stop-color="#d9b682"/></linearGradient>
   <pattern id="fil" width="${g.w}" height="${g.h / 7}" patternUnits="userSpaceOnUse"><path d="M0 ${g.h / 14} C ${g.w * 0.3} ${g.h / 20}, ${g.w * 0.6} ${g.h / 10}, ${g.w} ${g.h / 14}" stroke="#b98d55" stroke-opacity=".18" stroke-width="${g.w * 0.004}" fill="none"/></pattern>
   <filter id="omb" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="${g.w * 0.012}" stdDeviation="${g.w * 0.012}" flood-color="#4b3214" flood-opacity=".35"/></filter></defs>
   <g${mir}><g filter="url(#omb)"><path d="${g.contour}" fill="url(#bois)"/></g><path d="${g.contour}" fill="url(#fil)"/>
   ${g.trou ? `<circle cx="${g.trou.cx}" cy="${g.trou.cy}" r="${g.trou.r}" fill="#e7dccb" stroke="#9c6b3f" stroke-width="${g.w * 0.006}"/><circle cx="${g.trou.cx}" cy="${g.trou.cy}" r="${g.trou.r * 1.9}" fill="none" stroke="#b9b9b9" stroke-width="${g.w * 0.02}"/>` : ""}</g>
   ${g.photo && photoSrc ? musPhotoSvg(g.photo, photoSrc, "cpA") : ""}
   ${g.qr ? `<path d="${musQrPath(m, g.qr.x, g.qr.y, g.qr.t)}" fill="${clr}" fill-opacity=".92"/>` : ""}
   ${g.textes.map((t) => musTexteSvg(t, clr, maxW, g.w)).join("")}
   <g${mir}><path d="${g.contour}" fill="none" stroke="#9c6b3f" stroke-width="${g.w * 0.005}"/></g>`;
  return { viewBox: `${-pad} ${-pad} ${g.w + 2 * pad} ${g.h + 2 * pad}`, html, g, maxW };
}

/** Un texte trop long est resserré dans sa largeur (à appeler après la pose du SVG dans la page). */
export function musAjuster(svg) {
  if (!svg) return;
  svg.querySelectorAll("text[data-max]").forEach((e) => {
    const w = e.getComputedTextLength ? e.getComputedTextLength() : 0, m = +e.dataset.max * (e.getAttribute("text-anchor") === "start" ? 0.7 : 1);
    if (w > m && w > 0) { e.setAttribute("textLength", m); e.setAttribute("lengthAdjust", "spacingAndGlyphs"); }
  });
}

/**
 * Le fichier de l'atelier, à la taille réelle en mm : rouge = découpe (contour et trou), noir = gravure.
 * `photoSrc` = la photo en niveaux de gris ; `textes` (facultatif) = { avant: "<path…>" } : les textes déjà passés en tracés
 * (le logiciel du laser ne lit pas les textes d'un SVG) ; sans lui, les textes restent des <text>.
 */
export function musFichier(mus, m, photoSrc, traces) {
  const M = 4, g = musGeo(mus, "avant"), dos = mus.modele === "porte" && photoDe(mus), gd = dos ? musGeo(mus, "dos") : null, dx = g.w + 10;
  const W = g.w + 2 * M + (dos ? dx : 0), H = g.h + 2 * M + 8, fs = Math.min(3, g.w * 0.034);
  const piece = (gg, off, id, cote) => `<g id="piece-${cote}" transform="translate(${off} 0)">`
    + (gg.photo && photoSrc ? `<g id="photo-${cote}">${musPhotoSvg(gg.photo, photoSrc, id)}</g>` : "")
    + (gg.qr ? `<path id="qr-code" d="${musQrPath(m, gg.qr.x, gg.qr.y, gg.qr.t)}" fill="#000000"/>` : "")
    + (traces && cote === "avant" ? traces : gg.textes.map((t) => musTexteSvg(t, "#000000", gg.w * 0.86, gg.w)).join(""))
    + `<g id="decoupe-${cote}"${gg.miroir ? ` transform="translate(${gg.w} 0) scale(-1 1)"` : ""}><path d="${gg.contour}" fill="none" stroke="#ff0000" stroke-width=".2"/>`
    + (gg.trou ? `<circle cx="${gg.trou.cx}" cy="${gg.trou.cy}" r="${gg.trou.r}" fill="none" stroke="#ff0000" stroke-width=".2"/>` : "") + `</g></g>`;
  const dim = `${g.w} × ${g.h.toFixed(1).replace(".", ",")} mm`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-M} ${-M} ${W} ${H}" width="${W}mm" height="${H}mm"><rect x="${-M}" y="${-M}" width="${W}" height="${H}" fill="#fff"/>`
    + piece(g, 0, "cpF", "avant") + (dos ? piece(gd, dx, "cpD", "dos") + `<text x="${dx}" y="${g.h + 6}" font-size="${fs}" fill="#777" font-family="Inter,sans-serif">dos : retourner la pièce</text>` : "")
    + `<text x="0" y="${g.h + 6}" font-size="${fs}" fill="#777" font-family="Inter,sans-serif">${dim} · rouge = découpe · noir = gravure</text></svg>`;
  return { svg, g, gd, dim, W, H };
}

// ---------- textes de la commande ----------
const cm = (v) => (Math.round(v) / 10).toFixed(1).replace(".0", "").replace(".", ",");
export const musCm = cm;
const ecriture = (k) => getFontLabel(k).split(" — ")[0] || musPolice(k)[1];
export const musNomModele = (id) => (MUS_MODELES.find((m) => m.id === id) || MUS_MODELES[0]).nom;

/** Le résumé en une ligne (panier, paiement, e-mails). */
export function musResume(mus) {
  if (!mus) return "";
  const t = musTaille(mus), g = musGeo(mus, "avant");
  const p = [musNomModele(mus.modele), `${t.nom} ${cm(g.w)} × ${cm(g.h)} cm`, `Lien ${mus.plat} : ${mus.lien}`];
  if (mus.modele === "porte") p.push(`Mousqueton ${musMousqueton(mus.mq).nom.toLowerCase()}`);
  if (mus.photo) p.push(mus.modele === "porte" ? "Photo gravée au dos" : "Photo gravée à côté du QR code");
  if (mus.titre) p.push(`Titre : « ${mus.titre} »`);
  if (mus.dedi) p.push(`Dédicace : « ${mus.dedi} »`);
  if (mus.titre || mus.dedi) p.push(`Écriture ${ecriture(mus.police)}`);
  if (mus.modele !== "porte") p.push(mus.scan ? "avec « Scannez pour écouter »" : "sans « Scannez pour écouter »");
  return p.join(" · ");
}

/** Pour la fiche atelier : les lignes générales, puis un bloc par face. */
export function musConsignes(mus) {
  const t = musTaille(mus), g = musGeo(mus, "avant"), porte = mus.modele === "porte";
  const general = [
    { k: "Modèle", v: musNomModele(mus.modele), fort: true },
    { k: "Taille", v: `${t.nom} · ${g.w} × ${g.h.toFixed(1).replace(".", ",")} mm`, fort: true },
    { k: "Bois", v: "contreplaqué 3 mm" },
    { k: `Lien (${mus.plat})`, v: mus.lien, fort: true },
    { k: "QR code", v: `${cm(g.qr.t)} cm de côté, calculé à partir du lien : fichier prêt ci-dessous (« Fichier pour la machine »). Le scanner avant de graver.` },
  ];
  if (porte) general.push({ k: "Mousqueton", v: musMousqueton(mus.mq).nom, fort: true });
  const avant = [];
  if (!porte) {
    avant.push({ k: "Titre", v: mus.titre ? `« ${mus.titre} » — écriture ${ecriture(mus.police)}` : "aucun", texte: Boolean(mus.titre) });
    avant.push({ k: "Dédicace", v: mus.dedi ? `« ${mus.dedi} »` : "aucune", texte: Boolean(mus.dedi) });
    avant.push({ k: "« Scannez pour écouter »", v: mus.scan ? "oui, gravé" : "NON, ne pas le graver" });
    if (mus.modele === "carte") avant.push({ k: "Note de musique", v: "gravée en haut à gauche" });
  }
  if (mus.photo && !porte) avant.push({ k: `Photo (+${MUS_PRIX.photo} €)`, v: `à gauche du QR code, ${cm(g.photo.t)} × ${cm(g.photo.t)} cm, en niveaux de gris`, img: mus.photo });
  const faces = [{ nom: porte ? "Face avant : le QR code seul" : "Face avant : QR code et textes", lignes: avant, vide: false }];
  if (mus.photo && porte) {
    const gd = musGeo(mus, "dos");
    faces.push({ nom: "Dos : retourner la pièce", lignes: [{ k: `Photo (+${MUS_PRIX.photo} €)`, v: `${cm(gd.photo.t)} × ${cm(gd.photo.t)} cm, en niveaux de gris`, img: mus.photo }], vide: false });
  }
  return { general, faces };
}

/** La photo envoyée par la cliente (adresse du site), pour l'afficher et la télécharger dans Gestion. */
export const musPhotos = (mus) => (mus && photoValide(mus.photo) ? [mus.photo] : []);
