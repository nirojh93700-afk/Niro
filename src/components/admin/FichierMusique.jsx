"use client";

// « Fichier pour la machine » d'une plaque ou d'un porte-clés musique à scanner (26/11/2026, gérant : « si quelqu'un commande,
// tout sera prêt dans la commande »). Fabriqué dans Gestion à partir de la création gardée avec la commande :
// rouge = découpe (contour, trou), noir = gravure (QR code, textes passés en tracés, photo en niveaux de gris), taille réelle en mm.
// Le QR code est RELU ici (jsQR) et comparé au lien de la cliente avant d'être proposé.
import { useEffect, useState } from "react";
import { MUS_POLICES_FICHIERS } from "@/lib/musiqueCreateurData";
import { musMatrice, musGeo, musFichier, musTexteSvg, musAjuster, musMousqueton, musNomModele, musCm } from "@/lib/musiqueCreateur";
import { grisPourTrace, tracerEnPlace } from "@/lib/traceurGravure";

const propre = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
const charger = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
const enDonnees = (blob) => new Promise((ok, ko) => { const f = new FileReader(); f.onload = () => ok(f.result); f.onerror = ko; f.readAsDataURL(blob); });
function telecharger(blob, nom) {
  const a = document.createElement("a"), url = URL.createObjectURL(blob);
  a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// Le QR dessiné est relu : il doit rendre exactement le lien de la commande.
async function verifierQr(m, attendu) {
  try {
    const jsQR = (await import("jsqr")).default;
    const n = m.length, k = 8, q = 4, N = (n + 2 * q) * k, c = document.createElement("canvas");
    c.width = c.height = N;
    const x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, N, N); x.fillStyle = "#000";
    for (let r = 0; r < n; r++) for (let j = 0; j < n; j++) if (m[r][j]) x.fillRect((j + q) * k, (r + q) * k, k, k);
    const res = jsQR(x.getImageData(0, 0, N, N).data, N, N);
    return Boolean(res && res.data === attendu);
  } catch { return null; }
}

// La photo de la cliente : carré centré, niveaux de gris, écrite dans le fichier.
async function photoGrise(src) {
  const im = await charger(src);
  if (!im) return "";
  const N = 1200, c = document.createElement("canvas");
  c.width = c.height = N;
  const x = c.getContext("2d"), s = Math.min(im.width, im.height);
  x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, N, N);
  const d = x.getImageData(0, 0, N, N), p = d.data;
  let mn = 255, mx = 0;
  for (let i = 0; i < p.length; i += 4) { const L = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]; if (L < mn) mn = L; if (L > mx) mx = L; }
  for (let i = 0; i < p.length; i += 4) {
    const L = (0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2] - mn) / Math.max(1, mx - mn), v = Math.round(255 * (1 - Math.pow(1 - L, 0.85)));
    p[i] = p[i + 1] = p[i + 2] = v; p[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  return c.toDataURL("image/jpeg", 0.9);
}

// Les textes (titre, dédicace, « Scannez pour écouter ») passés en tracés noirs, à leur place, en millimètres :
// le logiciel du laser ne lit pas les textes d'un SVG. La ligne et la note de musique sont déjà des vecteurs.
async function tracerTextes(g) {
  const vecteurs = g.textes.filter((t) => t.ligne || t.note).map((t) => musTexteSvg(t, "#000000", g.w * 0.86, g.w)).join("");
  const textes = g.textes.filter((t) => t.t);
  if (!textes.length) return { svg: vecteurs, ok: true };
  const familles = new Set(textes.map((t) => String(t.f).split(",")[0].replace(/['"]/g, "").trim()));
  let css = "";
  for (const p of MUS_POLICES_FICHIERS) {
    if (!familles.has(p.famille)) continue;
    const url = await enDonnees(await (await fetch("/createurs/polices/" + p.fichier)).blob());
    css += `@font-face{font-family:'${p.famille}';src:url(${url}) format('woff2');font-weight:${p.poids}}`;
    try { const ff = new FontFace(p.famille, `url(${url})`, { weight: p.poids }); await ff.load(); document.fonts.add(ff); } catch { /* mesure avec l'écriture de repli */ }
  }
  // 1. mesure dans la page (un texte trop long est resserré, comme sur l'aperçu de la cliente)
  const hote = document.createElement("div");
  hote.style.cssText = "position:fixed;left:-99999px;top:0;width:10px;height:10px;overflow:hidden";
  hote.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.w} ${g.h}" width="${g.w}" height="${g.h}">${textes.map((t) => musTexteSvg(t, "#000000", g.w * 0.86, g.w)).join("")}</svg>`;
  document.body.appendChild(hote);
  const svg = hote.firstChild;
  musAjuster(svg);
  // 2. rendu en image, puis suivi de contour
  const ppm = Math.max(12, Math.min(30, Math.floor(Math.sqrt(14e6 / (g.w * g.h)))));
  const W = Math.round(g.w * ppm), H = Math.round(g.h * ppm);
  svg.setAttribute("width", W); svg.setAttribute("height", H);
  const st = document.createElementNS("http://www.w3.org/2000/svg", "style"); st.textContent = css; svg.insertBefore(st, svg.firstChild);
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  hote.remove();
  const im = await charger(src);
  if (!im) return { svg: vecteurs + textes.map((t) => musTexteSvg(t, "#000000", g.w * 0.86, g.w)).join(""), ok: false };
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); x.drawImage(im, 0, 0, W, H);
  const d = tracerEnPlace(grisPourTrace(x.getImageData(0, 0, W, H).data, W, H), W, H, 1 / ppm);
  if (!d) return { svg: vecteurs + textes.map((t) => musTexteSvg(t, "#000000", g.w * 0.86, g.w)).join(""), ok: false };
  return { svg: vecteurs + `<path id="textes" fill="#000000" fill-rule="evenodd" d="${d}"/>`, ok: true };
}

export default function FichierMusique({ item, refCommande }) {
  const mus = item?.fields?.mus;
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const cle = JSON.stringify(mus || {});
  useEffect(() => {
    let fini = false;
    setRes(null); setErr("");
    (async () => {
      const m = musMatrice(mus.lien), g = musGeo(mus, "avant");
      const [qrOk, photo, tr] = await Promise.all([verifierQr(m, mus.lien), mus.photo ? photoGrise(mus.photo) : "", tracerTextes(g)]);
      const f = musFichier(mus, m, photo, tr.svg);
      return { ...f, m, qrOk, tracesOk: tr.ok, photoOk: !mus.photo || Boolean(photo) };
    })().then((r) => { if (!fini) setRes(r); }).catch((e) => { if (!fini) setErr(String(e?.message || e)); });
    return () => { fini = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);
  if (!mus || !mus.lien) return null;
  const btn = { fontWeight: 700, color: "#7a5c12", background: "#fff", border: "1.5px solid #c9a24b", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: "0.85rem", fontFamily: "inherit" };
  const puce = (ok) => ({ fontSize: "0.8rem", borderRadius: 999, padding: "3px 10px", border: "1px solid " + (ok === false ? "#f0b3ae" : ok ? "#9ccc9f" : "#e7d3a1"), background: ok === false ? "#fdeeed" : ok ? "#eef8ee" : "#fff", color: ok === false ? "#8a1c14" : ok ? "#1f5f22" : "#4a4032", fontWeight: ok == null ? 500 : 700, overflowWrap: "anywhere", maxWidth: "100%" });
  const nom = res ? `musique-${propre(refCommande || "commande")}-${propre(musNomModele(mus.modele))}-${Math.round(res.g.w)}x${Math.round(res.g.h)}mm` : "musique";
  const png = async () => {
    const k = 12, im = await charger("data:image/svg+xml;charset=utf-8," + encodeURIComponent(res.svg));
    if (!im) return;
    const c = document.createElement("canvas"); c.width = Math.round(res.W * k); c.height = Math.round(res.H * k);
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
    c.toBlob((b) => b && telecharger(b, `${nom}.png`), "image/png");
  };
  return (
    <div className="no-print" style={{ margin: "8px 0 10px", padding: "10px 12px", border: "2px solid #c9a24b", borderRadius: 10, background: "#fffaf0" }}>
      <div style={{ fontWeight: 800, color: "#7a5c12", fontSize: "0.95rem" }}>📥 Fichier pour la machine — musique à scanner</div>
      <div style={{ fontSize: "0.8rem", color: "#6b5d48", margin: "2px 0 6px" }}>Taille réelle en millimètres, contreplaqué 3 mm. Rouge = découpe (contour et trou), noir = gravure (QR code, textes en tracés, photo). Scannez le QR code du fichier avant de graver.</div>
      {err ? <div style={{ color: "#b02a25", fontSize: "0.84rem" }}>Fichier impossible à fabriquer ({err}). Rechargez la page ; sinon dites-le-moi.</div> : null}
      {!res && !err ? <div style={{ fontSize: "0.84rem", color: "#8a7a5c" }}>Fabrication du fichier…</div> : null}
      {res ? (
        <>
          <div style={{ background: "#fff", border: "1px solid #e7d3a1", borderRadius: 6, padding: 8, overflowX: "auto" }}>
            <div style={{ maxWidth: 420, margin: "0 auto" }} className="fmus-svg" dangerouslySetInnerHTML={{ __html: res.svg.replace(/ width="[^"]*mm" height="[^"]*mm"/, ' style="display:block;width:100%;height:auto"') }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0" }}>
            <span style={puce(res.qrOk)}>{res.qrOk ? "✓ QR vérifié : il ouvre bien le lien de la cliente" : res.qrOk === false ? "✗ QR illisible : ne pas graver, dites-le-moi" : "QR non relu sur cet appareil : scannez-le avant de graver"}</span>
            <span style={puce()}>Lien ({mus.plat}) : <a href={mus.lien} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>{mus.lien}</a></span>
            <span style={puce()}>{musNomModele(mus.modele)} · {res.dim}</span>
            <span style={puce()}>QR : {res.m.length} × {res.m.length} carrés de {(res.g.qr.t / res.m.length).toFixed(2).replace(".", ",")} mm ({musCm(res.g.qr.t)} cm de côté)</span>
            {mus.modele === "porte" ? <span style={puce()}>Mousqueton : {musMousqueton(mus.mq).nom}</span> : null}
            {mus.photo ? <span style={puce(res.photoOk ? undefined : false)}>{res.photoOk ? `Photo : ${mus.modele === "porte" ? "au dos (pièce de droite, retourner la pièce)" : "à gauche du QR code"}, en niveaux de gris` : "✗ Photo introuvable : dites-le-moi"}</span> : null}
            {!res.tracesOk ? <span style={puce(false)}>Textes restés en écriture (pas en tracés) : rechargez la page</span> : null}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={btn} onClick={() => telecharger(new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${res.svg}`], { type: "image/svg+xml" }), `${nom}.svg`)}>⬇ SVG (pour la machine)</button>
            <button type="button" style={btn} onClick={png}>⬇ PNG (aperçu)</button>
          </div>
        </>
      ) : null}
    </div>
  );
}
