"use client";
// Fiche des marque-pages (mise en vente du 27/10/2026, gérant : « mets en vente, sur le site, les maquettes »).
// Reproduit les maquettes enregistrées le 24/10/2026 (modèle 1 v17 · modèle 2 v16 · métal v4), SANS l'encadré précommande :
// couleur en haut, format (seul, en boîte, coffret de 2 ou de 4), gravure à QUATRE emplacements (face / dos, en haut /
// au milieu), planches numérotées du gobelet, aperçu face + dos dans la couleur choisie (posé dans la grande photo),
// coffret composé pas à pas (une pièce à la fois, « la même gravure sur les N »). Prix : src/lib/marquePages.js
// (le même calcul au paiement). Données des aperçus : src/lib/marquePagesData.js (généré par tools/marque-pages-site.py).
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { formatEuro } from "@/lib/format";
import { FONTS } from "@/lib/fonts";
import { getProductInfo } from "@/lib/productInfo";
import { track, trackOnce } from "@/lib/track";
import WishlistButton from "@/components/WishlistButton";
import VacationNotice from "@/components/VacationNotice";
import DelaiFabrication from "@/components/DelaiFabrication";
import RestockAlerte from "@/components/RestockAlerte";
import PayInfoModal from "@/components/PayInfo";
import TrustSection from "@/components/TrustSection";
import { MP_DATA } from "@/lib/marquePagesData";
import {
  MP_MAX, mpFormat, mpBoitesPour, mpBoitesTexte, MP_BOITES, MP_EMPLACEMENTS, MP_NUMS_OK, mpAutorise, mpCalcul, mpNormaliser, mpResume, mpPrixGravure,
} from "@/lib/marquePages";

const vide = () => Object.fromEntries(MP_EMPLACEMENTS.map(([s, z]) => [`${s}|${z}`, { k: "", t: "", n: 0, src: null }]));
const copie = (v) => Object.fromEntries(Object.entries(v).map(([k, e]) => [k, { ...e }]));
const NUMS = new Set(MP_NUMS_OK);
const EMP_COURT = { "face|haut": "face, en haut", "face|bas": "face, au milieu", "dos|haut": "dos, en haut", "dos|bas": "dos, au milieu" };

function itemsDe(v, police) {
  const it = [];
  for (const key of Object.keys(v || {})) {
    const e = v[key]; const [side, zone] = key.split("|");
    const font = "fnt-" + (police || "playfair");
    if (e.k === "texte" && (e.t || "").trim()) it.push({ kind: "texte", text: e.t, font, side, zone });
    else if (e.k === "dessin" && e.n) it.push({ kind: "dessin", num: e.n, text: e.n >= 75 ? e.t : "", font, side, zone });
    else if (e.k === "photo") it.push({ kind: "photo", src: e.src, side, zone });
  }
  return it;
}
function resumeDe(v) {
  const r = [];
  for (const key of Object.keys(v || {})) {
    const e = v[key]; let s = "";
    if (e.k === "texte" && (e.t || "").trim()) s = `« ${e.t.trim()} »`;
    else if (e.k === "dessin") s = e.n ? (e.n >= 75 ? `cadre n° ${e.n}${(e.t || "").trim() ? ` « ${e.t.trim()} »` : ""}` : `dessin n° ${e.n}`) : "dessin à choisir";
    else if (e.k === "photo") s = e.src ? "votre photo" : "photo à envoyer";
    if (s) r.push(`${EMP_COURT[key]} : ${s}`);
  }
  return r;
}

// --- Envoi d'une photo (même chemin que les autres fiches : /api/upload → /api/img/<id>) ---------------------------
function compresser(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * sc)), h = Math.max(1, Math.round(img.height * sc));
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
        try { resolve(c.toDataURL("image/jpeg", quality)); } catch { resolve(r.result); }
      };
      img.onerror = reject; img.src = r.result;
    };
    r.onerror = reject; r.readAsDataURL(file);
  });
}
async function envoyerPhoto(file, productSlug) {
  const dataUrl = await compresser(file);
  const res = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl, productSlug }) });
  const d = await res.json().catch(() => ({}));
  if (!res.ok || !d.ref) throw new Error(d.error || "L'envoi a échoué, réessayez.");
  return "/api/img/" + d.ref;
}

// --- Aperçu : un côté du marque-page, gravure posée dans ses zones (port de mqApercu) ------------------------------
function ajuster(t, maxW, maxH) {
  let fs = maxH; t.style.fontSize = fs + "px"; let n = 0;
  while (n++ < 40 && fs > 4 && t.offsetWidth > maxW) { fs *= 0.9; t.style.fontSize = fs + "px"; }
  try { // centrage sur l'encre des lettres (24/10) : on mesure les lettres réelles et on compense
    const cs = getComputedStyle(t), f = parseFloat(cs.fontSize); if (!f) return;
    const c = ajuster.c || (ajuster.c = document.createElement("canvas").getContext("2d"));
    c.font = `${cs.fontStyle} ${cs.fontWeight} ${f}px ${cs.fontFamily}`;
    const m = c.measureText(t.textContent);
    let A = m.fontBoundingBoxAscent, D = m.fontBoundingBoxDescent; if (A == null) { A = f * 0.8; D = f * 0.2; }
    const lh = t.offsetHeight || f, base = (lh - A - D) / 2 + A;
    const dy = base - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2 - lh / 2;
    const dx = (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2 - m.width / 2;
    t.style.setProperty("--dx", dx.toFixed(2) + "px"); t.style.setProperty("--dy", dy.toFixed(2) + "px");
  } catch { /* mesure impossible : texte laissé tel quel */ }
}

function Signet({ modele, side, items, H, couleur, onZoom }) {
  const A = MP_DATA.modeles[modele];
  const ref = useRef(null);
  const W = Math.round(H * A.ratio);
  const PH = A.couleurs[couleur] || A.photos;
  const els = [];
  (items || []).filter((e) => e.side === side && (e.kind !== "texte" || (e.text || "").trim())).forEach((e, i) => {
    const z = A.zones[side]?.[e.zone || "haut"]; if (!z) return;
    const zz = e.kind === "texte" ? z.nom : z.dessin;
    const asp = e.kind === "dessin" ? (MP_DATA.dessins.aspect[e.num] || 1) : e.kind === "photo" ? 0.8 : 9;
    const vertical = e.zone === "bas" && (e.kind === "texte" || (e.kind === "dessin" && (e.num >= 75 || asp > 1.15)));
    let x = zz.x * W; const y = zz.y * H, w = zz.w * W, h = zz.h * H;
    if (A.centrer?.[side]) x = (W - w) / 2;
    const st = vertical
      ? { width: h, height: w, left: x + w / 2 - h / 2, top: y + h / 2 - w / 2, transform: "rotate(-90deg)" }
      : { left: x, top: y, width: w, height: h };
    const bw = vertical ? h : w, bh = vertical ? w : h;
    const cadre = e.kind === "dessin" && e.num >= 75;
    let inner = null;
    if (e.kind === "dessin") {
      const src = `/marque-pages/dessins/${String(e.num).padStart(3, "0")}.png`;
      let t = null;
      if (cadre && (e.text || "").trim()) {
        const cc = MP_DATA.dessins.centre[e.num] || [0.5, 0.5, 0.5];
        const dw = Math.min(bw, bh * asp), dh = Math.min(bh, bw / asp);
        t = <span className={`t ${e.font}`} data-mw={dw * 0.6} data-mh={dh * (cc[2] || 0.5)} style={{ left: (bw - dw) / 2 + cc[0] * dw, top: (bh - dh) / 2 + cc[1] * dh }}>{e.text.trim()}</span>;
      }
      // eslint-disable-next-line @next/next/no-img-element
      inner = <><img src={src} alt="" />{t}</>;
    } else if (e.kind === "photo") {
      // eslint-disable-next-line @next/next/no-img-element
      inner = <div className={`ph${e.src ? " on" : ""}`}>{e.src ? <img src={e.src} alt="" /> : "votre photo"}</div>;
    } else {
      inner = <span className={`t ${e.font}`} data-mw={bw * 0.96} data-mh={bh * 0.9}>{e.text.trim()}</span>;
    }
    els.push(<div key={i} className={`mq-el${cadre ? " cadre" : ""}`} style={st}>{inner}</div>);
  });
  const sig = JSON.stringify([items, H, couleur]);
  useLayoutEffect(() => {
    const run = () => ref.current?.querySelectorAll(".t").forEach((t) => ajuster(t, +t.dataset.mw, +t.dataset.mh));
    run();
    let vivant = true;
    if (document.fonts?.ready) document.fonts.ready.then(() => { if (vivant) run(); }); // la police peut arriver après la mesure
    return () => { vivant = false; };
  }, [sig]);
  return (
    <div className="mq-aps">
      <div className="mq-bm" ref={ref} style={{ width: W, height: H, cursor: onZoom ? "zoom-in" : "default" }} onClick={onZoom}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" src={PH[side]} alt="" />
        {els}
      </div>
      <small>{side === "face" ? "Face" : "Dos"}</small>
    </div>
  );
}

function Apercu({ modele, items, H, couleur }) {
  const [zoom, setZoom] = useState(null);
  const A = MP_DATA.modeles[modele];
  let k = 1;
  if (zoom && typeof window !== "undefined") k = Math.min((0.8 * window.innerHeight) / H, (window.innerWidth - 60) / (H * A.ratio));
  return (
    <>
      <div className="mq-apw">
        {["face", "dos"].map((s) => <Signet key={s} modele={modele} side={s} items={items} H={H} couleur={couleur} onZoom={() => setZoom(s)} />)}
      </div>
      {zoom && createPortal(
        <div className="mq-zoom" onClick={(e) => { if (e.target === e.currentTarget) setZoom(null); }}>
          <div className="mq-zoom-in mq-zoom-in-ap" style={{ maxWidth: "none", width: "auto" }}>
            <button type="button" className="mq-zoom-x" aria-label="Fermer" onClick={() => setZoom(null)}>×</button>
            <Signet modele={modele} side={zoom} items={items} H={Math.round(H * k)} couleur={couleur} />
          </div>
        </div>, document.body)}
    </>
  );
}

// --- Planches numérotées du gobelet (classes .prc-* du site) ------------------------------------------------------
function Planches({ valeur, onChoix, onFermer }) {
  const [num, setNum] = useState(valeur ? String(valeur) : "");
  const [zoom, setZoom] = useState(null);
  const [on, setOn] = useState(-1);
  const n = parseInt(num, 10);
  const ok = NUMS.has(n);
  const valider = () => { if (ok) { onChoix(n); onFermer(); } };
  return (
    <div className="mq-dessins">
      <p className="mq-dh">Choisissez votre dessin</p>
      <p className="prc-legend">Touchez une planche pour l&apos;agrandir et lire les numéros, puis indiquez le numéro. Un <b>dessin</b> (n° 1 à 74) ou un <b>cadre</b> dans lequel s&apos;écrit votre texte (n° 88 à 94, 96, 98, 100 à 102).</p>
      <div className="prc-grid mq-grid">
        {MP_DATA.planches.map((p, i) => (
          <button type="button" key={p.src} className={`prc-model${on === i ? " on" : ""}`} data-kind={p.kind} onClick={() => { setOn(i); setZoom(p.src); }}>
            <span className="prc-mn">{p.a}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="prc-mimg prc-mimg-photo"><img src={p.src} alt={`Planche ${p.a}`} loading="lazy" /></span>
            <span className="prc-ml">{p.b}<br /><em>n° {p.a}</em></span>
          </button>
        ))}
      </div>
      <div className="field mq-numf">
        <label>Numéro du dessin ou du cadre</label>
        <div className="mq-numrow">
          <input type="number" min="1" max="102" inputMode="numeric" placeholder="Ex : 12" value={num}
            onChange={(e) => { setNum(e.target.value); const m = parseInt(e.target.value, 10); if (NUMS.has(m)) onChoix(m); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); valider(); } }} />
          <button type="button" className="mq-numok" disabled={!ok} onClick={valider}>Valider ✓</button>
        </div>
      </div>
      {num ? (
        <p className={`prc-choisi${ok ? "" : " prc-miss"}`}>
          {ok ? (n >= 75 ? `Cadre n° ${n} choisi ✓ — votre texte s'écrit au milieu du cadre.` : `Dessin n° ${n} choisi ✓`) : "Numéro : 1 à 74 pour un dessin, 88 à 94, 96, 98, 100 à 102 pour un cadre."}
        </p>
      ) : null}
      {zoom && createPortal(
        <div className="mq-zoom" onClick={(e) => { if (e.target === e.currentTarget) setZoom(null); }}>
          <div className="mq-zoom-in">
            <button type="button" className="mq-zoom-x" aria-label="Fermer" onClick={() => setZoom(null)}>×</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoom} alt="" />
          </div>
        </div>, document.body)}
    </div>
  );
}

// --- Éditeur à quatre emplacements (port de mqEditeur) -------------------------------------------------------------
function Editeur({ modele, v, onChange, owner, grille, setGrille, productSlug }) {
  const A = MP_DATA.modeles[modele];
  const [envoi, setEnvoi] = useState({});
  const maj = (key, patch) => onChange({ ...v, [key]: { ...v[key], ...patch } });
  return (
    <div className="mq-ed">
      <p className="mq-edi">Quatre emplacements, chacun avec son menu : gravez-en un seul ou plusieurs. Par exemple un texte en haut et un dessin au milieu, ou l&apos;inverse, sur la face comme au dos. Un texte +3 €, un dessin, un cadre ou votre photo +4 €. Rien de coché = marque-page nu.</p>
      {MP_EMPLACEMENTS.map(([side, zone]) => {
        const key = `${side}|${zone}`;
        const ok = mpAutorise(modele, side, zone);
        if (!ok.length) return null;
        const e = v[key];
        let lab = A.labels?.[side]?.[zone] || zone; lab = lab.charAt(0).toLowerCase() + lab.slice(1);
        const sub = ok.length === 1 ? (zone === "haut" ? "texte sur une ligne" : "texte à la verticale") : (zone === "haut" ? "texte sur une ligne · dessin petit" : "texte à la verticale · dessin grand");
        const gk = `${owner}|${key}`;
        const ouverte = grille === gk;
        return (
          <div key={key} className={`mq-emp${e.k ? " on" : ""}`}>
            <div className="mq-emph">
              <span className="mq-empl"><b>{side === "face" ? "Face" : "Dos"} · {lab}</b><small>{sub}</small></span>
              <select className="mq-empk" value={e.k} aria-label={`${side === "face" ? "Face" : "Dos"} · ${lab}`}
                onChange={(ev) => {
                  const k = ev.target.value;
                  maj(key, { k, n: k === "dessin" ? e.n : 0, src: k === "photo" ? e.src : null, t: k === "photo" ? "" : e.t });
                  setGrille(k === "dessin" && !e.n ? gk : (ouverte ? null : grille));
                }}>
                <option value="">Rien</option>
                {ok.includes("texte") && <option value="texte">Texte (+3 €)</option>}
                {ok.includes("dessin") && <option value="dessin">Dessin ou cadre (+4 €)</option>}
                {ok.includes("photo") && <option value="photo">Ma photo (+4 €)</option>}
              </select>
            </div>
            {e.k ? (
              <div className="mq-empb">
                {e.k === "texte" && (
                  <input type="text" className="mq-empt" maxLength={24} placeholder="Ex : Léa" value={e.t} onChange={(ev) => maj(key, { t: ev.target.value })} />
                )}
                {e.k === "dessin" && (
                  <div className="mq-empd">
                    {!ouverte && e.n ? <p className="mq-empok">{e.n >= 75 ? `Cadre n° ${e.n} choisi ✓` : `Dessin n° ${e.n} choisi ✓`}</p> : null}
                    {!ouverte && <button type="button" className="prc-change mq-empgo" onClick={() => setGrille(gk)}>{e.n ? "Changer de dessin" : "Choisir dans les planches"}</button>}
                    {ouverte && <Planches valeur={e.n} onChoix={(n) => maj(key, { n, t: n >= 75 ? e.t : "" })} onFermer={() => setGrille(null)} />}
                    {e.n >= 75 && (
                      <label className="mq-empcl">Votre texte au milieu du cadre (+3 €), facultatif
                        <input type="text" className="mq-empct" maxLength={24} placeholder="Ex : Léa" value={e.t} onChange={(ev) => maj(key, { t: ev.target.value })} />
                      </label>
                    )}
                  </div>
                )}
                {e.k === "photo" && (
                  <div className="mq-empp">
                    <label className="mq-pbtn">📷 {e.src ? "Changer de photo" : "Choisir ma photo"}
                      <input type="file" accept="image/*" hidden onChange={async (ev) => {
                        const f = ev.target.files?.[0]; ev.target.value = ""; if (!f) return;
                        setEnvoi((x) => ({ ...x, [key]: "Envoi de la photo…" }));
                        try { const src = await envoyerPhoto(f, productSlug); maj(key, { src }); setEnvoi((x) => ({ ...x, [key]: "" })); }
                        catch (err) { setEnvoi((x) => ({ ...x, [key]: err.message || "L'envoi a échoué, réessayez." })); }
                      }} />
                    </label>
                    {envoi[key] ? <span className="mq-photo-ok">{envoi[key]}</span> : e.src ? <span className="mq-photo-ok">Photo envoyée ✓</span> : null}
                    <p className="mq-sinfo">Nous la gravons en noir et blanc, bien au centre.</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// --- La fiche ------------------------------------------------------------------------------------------------------
export default function MarquePagesFiche({ product, realisations = [] }) {
  const { addItem } = useCart();
  const cfg = product.marquePages;
  const modele = cfg.modele;
  const gravure = Boolean(cfg.gravure);
  const V = product.variants;
  const info = getProductInfo(product.slug);
  const dossier = modele === 3 ? "metal" : `m${modele}`;
  const boites = { 1: `/marque-pages/${dossier}/boite1.jpg`, 2: `/marque-pages/${dossier}/boite2.jpg`, 4: `/marque-pages/${dossier}/boite4.jpg` };
  const galerie = useMemo(() => [...product.images, boites[1], boites[2], boites[4]], [product.images]); // eslint-disable-line react-hooks/exhaustive-deps

  const [stock, setStock] = useState({});
  useEffect(() => { fetch("/api/stock").then((r) => r.json()).then((d) => setStock(d.stock || {})).catch(() => {}); }, []);
  const epuise = (sid, besoin = 1) => typeof stock[sid] === "number" && stock[sid] < besoin;

  const [ci, setCi] = useState(0); // couleur choisie en haut
  // « Combien de marque-pages ? » puis « Boîte cadeau ? » (27/10/2026).
  const [nb, setNb] = useState(1);
  const [avecBoite, setAvecBoite] = useState(false);
  const fid = `n${nb}${avecBoite ? "b" : ""}`;
  const fmt = mpFormat(fid);
  const [police, setPolice] = useState("playfair");
  const [vPage, setVPage] = useState(vide);
  const defC = (n, i) => (n > 1 && modele !== 1 ? i % V.length : ci);
  const [slots, setSlots] = useState([]);
  const [meme, setMeme] = useState(false);
  const [cur, setCur] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [grille, setGrille] = useState(null);
  const qty = 1; // le nombre se choisit avec « Combien de marque-pages ? »
  const [ajoute, setAjoute] = useState(false);
  const [vue, setVue] = useState(0); // index de la galerie, ou "ap" = aperçu
  const galRef = useRef(null);
  const [galH, setGalH] = useState(520);
  const [winH, setWinH] = useState(800);
  useEffect(() => {
    const m = () => { if (galRef.current) setGalH(galRef.current.clientHeight || 520); setWinH(window.innerHeight || 800); };
    m(); window.addEventListener("resize", m); return () => window.removeEventListener("resize", m);
  }, []);

  const composition = fmt.n === 1 ? [{ c: ci, v: vPage }] : slots;
  const mp = { format: fid, police, slots: composition.map((s) => ({ c: V[s.c].id, v: s.v })) };
  const norme = mpNormaliser(product, mp);
  const calc = norme ? mpCalcul(product, norme) : null;
  const total = calc ? calc.total : 0;
  const itemsPage = gravure && fmt.n === 1 ? itemsDe(vPage, police) : [];

  // L'aperçu se pose dans la grande photo dès qu'il y a une gravure (24/10 soir, « comme pour le carnet »).
  const sigPage = JSON.stringify([itemsPage, ci]);
  useEffect(() => { if (itemsPage.length) setVue("ap"); else setVue((x) => (x === "ap" ? Math.max(0, galerie.indexOf(V[ci].image)) : x)); }, [sigPage]); // eslint-disable-line react-hooks/exhaustive-deps

  function choisirCouleur(k) {
    setCi(k);
    setSlots((ss) => ss.map((o) => (o.touched || modele !== 1 ? o : { ...o, c: k })));
    const idx = galerie.indexOf(V[k].image);
    if (idx >= 0) setVue(idx);
  }
  // Changer le nombre garde les marque-pages déjà réglés (on en ajoute ou on retire les derniers).
  function choisirNombre(n) {
    setNb(n); setGrille(null); setCur(0); setMeme(false);
    setSlots((ss) => {
      if (n <= 1) return [];
      const base = ss.length ? ss : [{ c: ci, v: vPage, touched: mpPrixGravure(vPage) > 0 }];
      return Array.from({ length: n }, (_, i) => base[i] || { c: defC(n, i), v: vide(), touched: false });
    });
  }
  function choisirBoite(on) {
    setAvecBoite(on);
    const b = on ? mpBoitesPour(nb)[0] : 0;
    const idx = b ? galerie.indexOf(boites[b]) : galerie.indexOf(V[ci].image);
    if (idx >= 0) setVue(idx);
  }
  function majSlot(i, patch) {
    setSlots((ss) => {
      let n = ss.map((o, j) => (j === i ? { ...o, ...patch, touched: true } : o));
      if (meme && i === 0 && patch.v) n = n.map((o, j) => (j === 0 ? o : { ...o, v: copie(patch.v) }));
      return n;
    });
  }
  function basculerMeme(on) {
    setMeme(on);
    if (on) setSlots((ss) => ss.map((o, j) => (j === 0 ? o : { ...o, v: copie(ss[0].v) })));
  }

  // Disponibilité : chaque couleur demandée + la boîte du format.
  const besoins = {};
  for (const s of composition) { const sid = V[s.c].stockId || V[s.c].id; besoins[sid] = (besoins[sid] || 0) + qty; }
  for (const b of fmt.boites) besoins[MP_BOITES[b].stockId] = (besoins[MP_BOITES[b].stockId] || 0) + qty;
  const manque = Object.entries(besoins).find(([sid, q]) => epuise(sid, q));
  const photoEnCours = composition.some((s) => Object.values(s.v).some((e) => e.k === "photo" && !e.src));
  const dessinManquant = composition.some((s) => Object.values(s.v).some((e) => e.k === "dessin" && !e.n));
  const bloque = !calc || Boolean(manque) || photoEnCours || dessinManquant;
  const raison = manque ? (manque[0].startsWith("mp-boite") ? "Cette boîte est momentanément épuisée : choisissez un autre format." : "Une couleur choisie est épuisée (ou il n'en reste pas assez) : choisissez-en une autre.")
    : photoEnCours ? "Il manque une photo : envoyez-la, ou choisissez « Rien » à cet emplacement."
      : dessinManquant ? "Il manque le numéro d'un dessin : choisissez-le dans les planches, ou choisissez « Rien »." : "";

  function ajouter() {
    if (bloque) return;
    const resume = mpResume(product, norme);
    const couleurs = norme.slots.map((s) => V.find((x) => x.id === s.c)?.title).join(", ");
    const cle = norme.slots.map((s) => Object.values(s.v).map((e) => e.src || "").join(",")).join(";");
    addItem({
      productSlug: product.slug,
      variantId: norme.slots[0].c,
      name: product.name,
      variantTitle: `${fmt.titre} · ${couleurs}`,
      price: total,
      image: fmt.boites.length ? boites[fmt.boites[0]] : V[ci].image || product.images[0],
      personalization: resume,
      fields: { mp: norme },
      cleLigne: cle.replace(/[;,]/g, "") ? cle : undefined,
      spec: { slug: product.slug, name: product.name, variantTitle: `${fmt.titre} · ${couleurs}`, fields: { mp: norme }, personalization: resume },
      pickup: false,
      weight: calc.grams,
      quantity: qty,
    });
    track("add_to_cart", { slug: product.slug, value: Number((total * qty).toFixed(2)) });
    trackOnce("panier", "cart_open");
    setAjoute(true); setTimeout(() => setAjoute(false), 2200);
  }

  // Prix des marque-pages seuls (gravure comprise), puis la ou les boîtes pour ce nombre.
  const prixPieces = nb > 1 ? slots.reduce((a, o) => a + V[o.c].price + mpPrixGravure(o.v), 0) : V[ci].price + mpPrixGravure(vPage);
  const boitesNb = mpBoitesPour(nb);
  const prixBoitesNb = boitesNb.reduce((a, b) => a + MP_BOITES[b].prix, 0);
  const boiteEpuisee = boitesNb.some((b) => epuise(MP_BOITES[b].stockId));
  const coffret = fmt.n > 1;
  const quoi = avecBoite ? `Votre coffret de ${fmt.n} marque-pages` : `Vos ${fmt.n} marque-pages`;
  const cust = slots.some((o) => o.touched || mpPrixGravure(o.v) > 0);
  const rtxt = cust ? `${quoi} :`
    : modele === 1 ? `${quoi}, tous de couleur ${(V[slots[0]?.c]?.title || "").toLowerCase()}. Changez la couleur et la gravure de chacun si vous voulez :`
      : modele === 2 ? `${quoi}, de couleurs différentes. Changez la couleur et la gravure de chacun si vous voulez :`
        : `${quoi}, de tableaux différents. Changez-les si vous voulez :`;
  const composer = gravure ? (avecBoite ? "Composer mon coffret" : "Composer mes marque-pages") : (avecBoite ? "Voir et personnaliser mon coffret" : "Voir et personnaliser mes marque-pages");
  const shH = Math.round(Math.min(560, winH * 0.62));
  const libelleCouleur = modele === 3 ? "Choisissez votre tableau" : "Choisissez votre couleur";

  return (
    <div className="container mp-fiche">
      <div className="product-layout">
        {/* Galerie */}
        <div>
          <div className="gallery-main" ref={galRef}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="gallery-bg" src={galerie[typeof vue === "number" ? vue : Math.max(0, galerie.indexOf(V[ci].image))]} alt={product.name} />
            {vue === "ap" && itemsPage.length > 0 && (
              <div className="mq-galap">
                <Apercu modele={modele} items={itemsPage} H={Math.round(galH * 0.9)} couleur={V[ci].title} />
                <p className="mq-galap-l">Votre aperçu, dans la couleur choisie — touchez un marque-page pour l&apos;agrandir</p>
              </div>
            )}
            <button type="button" className="gallery-arrow gallery-arrow-prev" aria-label="Photo précédente" onClick={() => setVue((x) => ((typeof x === "number" ? x : 0) - 1 + galerie.length) % galerie.length)}>‹</button>
            <button type="button" className="gallery-arrow gallery-arrow-next" aria-label="Photo suivante" onClick={() => setVue((x) => ((typeof x === "number" ? x : -1) + 1) % galerie.length)}>›</button>
          </div>
          <div className="gallery-thumbs">
            {galerie.map((src, i) => (
              <button key={src} type="button" className={`${vue === i ? "active" : ""}${/exemple-/.test(src) ? " mq-thex" : ""}`} aria-label={`Voir le visuel ${i + 1}`} onClick={() => setVue(i)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" />{/exemple-/.test(src) ? <span>Exemple</span> : null}
              </button>
            ))}
            {itemsPage.length > 0 && (
              <button type="button" className={`mq-thap${vue === "ap" ? " active" : ""}`} aria-label="Votre aperçu" onClick={() => setVue("ap")}><span>Votre<br />aperçu</span></button>
            )}
          </div>
        </div>

        <div className="product-info">
          <div className="breadcrumb">
            <Link href="/boutique">Boutique</Link>{" / "}<Link href="/boutique/marque-pages">Marque-pages</Link>
          </div>
          <div className="pd-titrerow">
            <h1>{product.title}</h1>
            <WishlistButton slug={product.slug} name={product.name} image={product.images[0]} price={V[0].price} variant="titre" />
          </div>
          <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>{product.tagline}</p>
          <div className="price-lead">{formatEuro(V[ci].price)}</div>

          <div className="field">
            <label>{libelleCouleur}</label>
            <div className="variant-swatches">
              {V.map((v, k) => {
                const off = epuise(v.stockId || v.id);
                return (
                  <button key={v.id} type="button" className={`variant-swatch has-img${k === ci ? " active" : ""}${off ? " sold-out" : ""}`} aria-pressed={k === ci} onClick={() => choisirCouleur(k)}>
                    {off && <span className="vs-out">Épuisé</span>}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.image} alt={`${product.name} — ${v.title}`} />
                    <span className="vs-title">{v.title}</span>
                    <span className="vs-price"><span className="vs-now">{formatEuro(v.price)}</span></span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field">
            <label>Combien de marque-pages ?</label>
            <div className="mq-nbs" role="group" aria-label="Nombre de marque-pages">
              {Array.from({ length: MP_MAX }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={`mq-nb${n === nb ? " on" : ""}`} aria-pressed={n === nb} onClick={() => choisirNombre(n)}>{n}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Boîte cadeau ?</label>
            <div className="mq-fmts">
              <button type="button" className={`mq-fmt${!avecBoite ? " on" : ""}`} onClick={() => choisirBoite(false)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="mq-fimg" src={V[ci].image} alt="Marque-page sans boîte" />
                <span className="mq-ft">
                  <b>Sans boîte</b>
                  <span>{nb > 1 ? `${nb} marque-pages, ` : ""}{modele === 2 ? "avec son cordon à perles de verre" : modele === 3 ? "avec son pompon et sa carte" : "avec son pompon"}</span>
                  <em>{formatEuro(prixPieces)}</em>
                </span>
              </button>
              <button type="button" className={`mq-fmt${avecBoite ? " on" : ""}`} onClick={() => choisirBoite(true)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="mq-fimg" src={boites[boitesNb[0]]} alt={`Boîte cadeau bleu nuit, ${mpBoitesTexte(boitesNb)}`} />
                <span className="mq-ft">
                  <b>En boîte cadeau</b>
                  <span>Boîte bleu nuit : {mpBoitesTexte(boitesNb)} (+{formatEuro(prixBoitesNb)})</span>
                  <em>{boiteEpuisee ? "Boîte épuisée" : formatEuro(prixPieces + prixBoitesNb)}</em>
                </span>
              </button>
            </div>
          </div>

          {coffret && (
            <>
              <div className="mq-recap">
                <p className="mq-rtxt">{rtxt}</p>
                <div className="mq-strip">
                  {slots.map((o, i) => (
                    <span className="mq-ch" key={i}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={V[o.c].image} alt="" /><small>{V[o.c].title}</small>
                      {resumeDe(o.v).map((x) => <b key={x}>{x}</b>)}
                    </span>
                  ))}
                </div>
                <button type="button" className="mq-open" onClick={() => { setSheet(true); setCur(0); setGrille(null); }}>{composer}</button>
              </div>
              <p className="mq-gnote">{gravure ? `La gravure (texte, dessin, photo — face et dos, en haut et au milieu) se choisit pour chaque marque-page dans « ${composer} ».` : `Les marque-pages sont de tableaux différents : vous pouvez en changer dans « ${composer} ».`}</p>
            </>
          )}

          {gravure && !coffret && (
            <div style={{ marginBottom: 6 }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 12 }}>Personnalisation — gravure</p>
              <Editeur modele={modele} v={vPage} onChange={setVPage} owner="page" grille={grille} setGrille={setGrille} productSlug={product.slug} />
            </div>
          )}
          {gravure && (
            <div className="field">
              <label htmlFor="mp-police">Écriture du texte</label>
              <select id="mp-police" value={police} onChange={(e) => setPolice(e.target.value)}>
                {FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              <p className={`mp-polaff ${FONTS.find((f) => f.key === police)?.cls || ""}`}>Léa · Camille · 2026</p>
              <p className="field-note">Laissez « Rien » partout pour un marque-page sans gravure.</p>
            </div>
          )}

          <div className="pd-totbox">
            <span className="lab">Total tout compris</span>
            <span className="val">{formatEuro(total * qty)}</span>
          </div>
          <p className="pd-nfois">
            💳 <strong>Payez en plusieurs fois sans frais</strong> — 4× avec PayPal (dès 30 €) ou 3× avec Klarna (dès 50 €). <PayInfoModal label="En savoir plus" className="pd-nfois-link" />
          </p>
          <VacationNotice compact />
          <div className="qty-row">
            <button className={`btn btn-gold${bloque ? " prc-off" : ""}`} style={{ flex: 1 }} onClick={ajouter} disabled={bloque}>
              {manque ? "Épuisé" : ajoute ? "Ajouté au panier ✓" : "Ajouter au panier"}
            </button>
          </div>
          {bloque && raison ? <p className="prc-addhint">{raison}</p> : null}
          <WishlistButton slug={product.slug} name={product.name} image={product.images[0]} price={V[0].price} variant="ligne" />
          {manque && !manque[0].startsWith("mp-boite") ? <RestockAlerte slug={product.slug} /> : null}

          <div className="trust-cards">
            <div className="tcard fr"><span className="ti">🇫🇷</span><span><b>{gravure ? "Personnalisé en France" : "Expédié de France"}</b><small>Dans notre atelier</small></span></div>
            <div className="tcard pay"><span className="ti">🔒</span><span><b>Paiement sécurisé</b><small>Carte &amp; PayPal</small></span></div>
            <div className="tcard hand"><span className="ti">✦</span><span><b>{gravure ? "Gravé à la commande" : "Série limitée"}</b><small>{gravure ? "Pièce unique" : "Huit tableaux"}</small></span></div>
            <div className="tcard ship"><span className="ti">🚚</span><span><b>Livraison suivie</b><small>Lettre suivie &amp; colis</small></span></div>
          </div>
          {gravure && (
            <div className="pd-perso">
              <b>✦ Pièce personnalisée</b>
              <DelaiFabrication><p>🕒 Personnalisé à la commande : fabrication 3 à 5 jours ouvrés, puis expédié en lettre suivie (en colis s&apos;il est en boîte cadeau).</p></DelaiFabrication>
            </div>
          )}
          <div className="product-desc" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
          {info && (
            <div className="info-accordion">
              {info.material && <details><summary>📏 Taille & Matériaux</summary><div className="info-body">{info.material}</div></details>}
              {info.usage && <details><summary>✨ Personnalisation & Entretien</summary><div className="info-body">{info.usage}</div></details>}
              {info.returns && <details><summary>🚚 Expédition & Retour</summary><div className="info-body">{info.returns}</div></details>}
            </div>
          )}
        </div>
      </div>

      <TrustSection realisations={realisations} />

      {/* Fenêtre « Composer mon coffret » : une pièce à la fois (24/10 soir). */}
      {sheet && coffret && createPortal(
        <div className="mq-sheet" onClick={(e) => { if (e.target === e.currentTarget) setSheet(false); }}>
          <div className="mq-sheetin">
            <div className="mq-shh"><b>{avecBoite ? `Mon coffret de ${fmt.n}` : `Mes ${fmt.n} marque-pages`}</b><button type="button" aria-label="Fermer" onClick={() => setSheet(false)}>×</button></div>
            <div className="mq-shb">
              <div className="mq-steps">
                {slots.map((o, i) => (
                  <button key={i} type="button" className={`mq-step${i === cur ? " on" : ""}${mpPrixGravure(o.v) > 0 ? " done" : ""}`} onClick={() => { setCur(i); setGrille(null); }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={V[o.c].image} alt="" /><span>{i + 1}</span>
                  </button>
                ))}
              </div>
              <div className="mq-stepnav">
                <button type="button" disabled={cur === 0} onClick={() => { setCur(cur - 1); setGrille(null); }}>‹ Précédent</button>
                <span className="mq-stepn">Marque-page {cur + 1} sur {fmt.n}</span>
                <button type="button" onClick={() => { if (cur === fmt.n - 1) setSheet(false); else { setCur(cur + 1); setGrille(null); } }}>{cur === fmt.n - 1 ? "Terminer ✓" : "Suivant ›"}</button>
              </div>
              {gravure && (
                <label className="mq-same"><input type="checkbox" checked={meme} onChange={(e) => basculerMeme(e.target.checked)} /><span>La même gravure sur les {fmt.n} marque-pages <small>(chacun garde sa couleur)</small></span></label>
              )}
              {slots.map((o, i) => (i !== cur ? null : (
                <div key={i} className={`mq-sc${meme && i > 0 ? " mq-locked" : ""}`}>
                  <p>Marque-page {i + 1} <small className="mq-scc">· {V[o.c].title}</small></p>
                  <div className="mq-row" style={modele === 2 ? { gridTemplateColumns: "repeat(4,minmax(0,1fr))" } : undefined}>
                    {V.map((v, k) => (
                      <button key={v.id} type="button" className={`mq-c${k === o.c ? " on" : ""}`} aria-label={v.title} onClick={() => majSlot(i, { c: k })}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.image} alt="" /><span>{v.title}</span>
                      </button>
                    ))}
                  </div>
                  {gravure && (
                    <>
                      {meme && i > 0 ? <p className="mq-lock-note">Gravé comme le marque-page 1 — décochez « la même gravure » pour le changer.</p> : null}
                      <div className="mq-grav"><Editeur modele={modele} v={o.v} onChange={(v) => majSlot(i, { v })} owner={`s${i}`} grille={grille} setGrille={setGrille} productSlug={product.slug} /></div>
                      <div className="mq-ap">
                        <p className="mq-aph">Votre aperçu <small>— touchez pour agrandir</small></p>
                        <Apercu modele={modele} items={itemsDe(o.v, police)} H={shH} couleur={V[o.c].title} />
                      </div>
                    </>
                  )}
                </div>
              )))}
              {gravure && (
                <div className="mq-sc mq-pol">
                  <p>Écriture du texte (la même pour tous les marque-pages)</p>
                  <select value={police} onChange={(e) => setPolice(e.target.value)}>
                    {FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="mq-shf"><span>{avecBoite ? "Total du coffret" : "Total"}<br /><b>{formatEuro(total)}</b></span><button type="button" className="mq-open" onClick={() => setSheet(false)}>{avecBoite ? "Valider mon coffret" : "Valider mes marque-pages"}</button></div>
          </div>
        </div>, document.body)}
    </div>
  );
}
