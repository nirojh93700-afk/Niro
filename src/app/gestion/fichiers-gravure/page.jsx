"use client";

// Gestion › Commandes › SVG à valider (21/11/2026, gérant : « l'agent doit tout préparer, il doit me demander si
// c'est bon, moi je valide, et ça va dans la commande qui correspond »).
// À l'ouverture, l'agent passe sur les commandes à préparer / en fabrication, prend chaque image de cliente
// (formulaire, e-mail, devis, image rangée par l'atelier), regarde si c'est un DESSIN (noir sur fond clair :
// dessin, logo, texte mis en page) et en fait le fichier SVG. Les photos ne se tracent pas (gravure en photo).
// Rien n'est rangé dans la commande avant « C'est bon ».
import { useCallback, useEffect, useState } from "react";
import PageHead from "@/components/admin/PageHead";
import { estDessin, grisPourTrace, tracer, svgGravure } from "@/lib/traceurGravure";

const ACTIFS = new Set(["a_preparer", "en_gravure"]);
const CLES_APERCU = /^(previewImage|apercu3dImage|apercu|preview)/i;
const idDe = (src) => (String(src).match(/\/api\/img\/([A-Za-z0-9_-]+)/) || [])[1] || "";

function imagesDeLaCommande(o) {
  const vues = new Map();
  for (const im of o.imagesEchangees || []) {
    const id = idDe(im.src); if (id && !vues.has(id)) vues.set(id, { id, src: im.src, origine: im.de === "atelier" ? "rangée par l'atelier" : "envoyée par la cliente", at: im.at || 0 });
  }
  for (const it of o.spec || []) {
    for (const k of ["photoSrc", "artworkImage"]) {
      const id = idDe(it?.[k]); if (id && !vues.has(id)) vues.set(id, { id, src: `/api/img/${id}`, origine: "jointe à la commande", at: 0 });
    }
    const f = it?.fields || {};
    for (const [k, v] of Object.entries(f)) {
      if (CLES_APERCU.test(k) || typeof v !== "string") continue;
      const id = idDe(v); if (id && !vues.has(id)) vues.set(id, { id, src: `/api/img/${id}`, origine: "jointe à la commande", at: 0 });
    }
  }
  return [...vues.values()];
}

function largeurConseillee(o) {
  const t = JSON.stringify(o.items || []).toLowerCase();
  if (/whisky|tumbler/.test(t)) return 55;
  if (/vin|flûte|flute|cocktail/.test(t)) return 45;
  if (/carafe/.test(t)) return 70;
  if (/bracelet|collier|pendentif/.test(t)) return 20;
  return 50;
}

function chargerImage(src) {
  return new Promise((ok, ko) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => ok(im); im.onerror = () => ko(new Error("Image illisible.")); im.src = src; });
}

async function preparer(src) {
  const im = await chargerImage(src);
  const M = 1600, k = Math.min(1, M / Math.max(im.naturalWidth, im.naturalHeight)) * (Math.max(im.naturalWidth, im.naturalHeight) < 700 ? 2 : 1);
  const W = Math.max(1, Math.round(im.naturalWidth * k)), H = Math.max(1, Math.round(im.naturalHeight * k));
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); x.drawImage(im, 0, 0, W, H);
  const data = x.getImageData(0, 0, W, H).data;
  const classe = estDessin(data, W, H);
  if (!classe.dessin) return { dessin: false };
  const t = tracer(grisPourTrace(data, W, H), W, H);
  if (!t.paths.length) return { dessin: false };
  return { dessin: true, ...t };
}

function Carte({ o, img, decision, cle, onFait }) {
  const [etat, setEtat] = useState({ charge: true });
  const [largeur, setLargeur] = useState(largeurConseillee(o));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    let vivant = true;
    preparer(img.src).then((r) => { if (vivant) setEtat({ charge: false, ...r }); }).catch((e) => { if (vivant) setEtat({ charge: false, erreur: e.message }); });
    return () => { vivant = false; };
  }, [img.src]);
  const apercu = etat.dessin ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgGravure(etat.paths, etat.cadre, largeur)) : "";
  const hauteur = etat.cadre ? Math.round((largeur * etat.cadre.h / etat.cadre.w) * 10) / 10 : 0;
  const envoyer = async (action) => {
    setBusy(true); setErr("");
    try {
      const corps = { action, orderId: o.id, ref: o.ref, imageId: img.id, src: img.src };
      if (action === "valider") Object.assign(corps, { largeurMm: largeur, cadre: etat.cadre, paths: etat.paths });
      const r = await fetch("/api/admin/fichiers-gravure", { method: "POST", headers: { "content-type": "application/json", "x-admin-key": cle }, body: JSON.stringify(corps) });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Échec.");
      onFait();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  if (decision?.statut === "valide") {
    return (
      <div className="fg-carte ok">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="fg-src" src={img.src} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="fg-svg" src={`/api/img/${decision.svgId}`} alt="" />
        <div className="fg-act">
          <b>✓ Rangé dans la commande · {decision.largeurMm} mm</b>
          <a className="btn btn-gold" href={`/api/img/${decision.svgId}?dl=gravure-${o.ref}`}>⬇ Télécharger le SVG</a>
          <button type="button" className="btn" disabled={busy} onClick={() => envoyer("annuler")}>Retirer</button>
        </div>
      </div>
    );
  }
  if (decision?.statut === "refuse") {
    return (
      <div className="fg-carte non">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="fg-src" src={img.src} alt="" />
        <div className="fg-act"><span>Pas besoin de fichier</span><button type="button" className="btn" disabled={busy} onClick={() => envoyer("annuler")}>Revenir</button></div>
      </div>
    );
  }
  return (
    <div className={`fg-carte${etat.dessin ? " q" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="fg-src" src={img.src} alt="" />
      {etat.charge ? <div className="fg-svg fg-att">L&apos;agent prépare le fichier…</div>
        : etat.dessin ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="fg-svg" src={apercu} alt="Fichier SVG proposé" />
        ) : <div className="fg-svg fg-att">{etat.erreur ? `Image illisible (${etat.erreur})` : "Photo ou aperçu : pas de fichier SVG (gravure en photo)."}</div>}
      <div className="fg-act">
        <span className="fg-or">{img.origine}</span>
        {etat.dessin ? (
          <>
            <label>Largeur <input type="number" min="5" max="400" value={largeur} onChange={(e) => setLargeur(Number(e.target.value) || 0)} /> mm{hauteur ? ` × ${hauteur} mm` : ""}</label>
            <button type="button" className="btn btn-gold" disabled={busy || !largeur} onClick={() => envoyer("valider")}>✓ C&apos;est bon, ranger dans la commande</button>
            <button type="button" className="btn" disabled={busy} onClick={() => envoyer("refuser")}>Pas besoin</button>
          </>
        ) : null}
        {err ? <span className="fg-err">{err}</span> : null}
      </div>
    </div>
  );
}

export default function FichiersGravurePage() {
  const [cle, setCle] = useState("");
  const [cmds, setCmds] = useState(null);
  const [dec, setDec] = useState({});
  const [err, setErr] = useState("");
  const charger = useCallback(async (k) => {
    try {
      const [ro, rf] = await Promise.all([
        fetch("/api/admin/orders", { headers: { "x-admin-key": k }, cache: "no-store" }).then((r) => r.json()),
        fetch("/api/admin/fichiers-gravure", { headers: { "x-admin-key": k }, cache: "no-store" }).then((r) => r.json()),
      ]);
      if (ro.error) throw new Error(ro.error);
      setCmds((ro.orders || []).filter((o) => ACTIFS.has(o.status)).map((o) => ({ o, imgs: imagesDeLaCommande(o) })).filter((x) => x.imgs.length));
      setDec(rf.fichiers || {});
    } catch (e) { setErr(e.message || "Lecture impossible."); }
  }, []);
  useEffect(() => {
    const k = sessionStorage.getItem("niv-admin-key") || "";
    setCle(k);
    if (k) charger(k); else setErr("Connectez-vous d'abord à Gestion.");
  }, [charger]);
  const recharger = () => fetch("/api/admin/fichiers-gravure", { headers: { "x-admin-key": cle }, cache: "no-store" }).then((r) => r.json()).then((j) => setDec(j.fichiers || {})).catch(() => {});

  return (
    <div className="fg">
      <PageHead eyebrow="Commandes" title="SVG à valider"
        subtitle="L'agent prépare un fichier SVG pour chaque dessin, logo ou texte mis en page envoyé par une cliente. Vous vérifiez, vous réglez la largeur, puis « C'est bon » : le fichier est rangé dans la fiche de la commande. Les photos ne se tracent pas." />
      {err ? <p className="notice">{err}</p> : null}
      {!cmds && !err ? <p>L&apos;agent regarde les commandes…</p> : null}
      {cmds && !cmds.length ? <p>Aucune image de cliente dans les commandes en cours.</p> : null}
      {(cmds || []).map(({ o, imgs }) => (
        <section key={o.id} className="fg-cmd">
          <h2><a href={`/gestion/commande/${encodeURIComponent(o.ref)}`}>#{o.ref}</a> · {o.customerName || o.quoteClientName || "—"} <small>{(o.items || []).map((i) => i.name).join(" · ").slice(0, 120)}</small></h2>
          {imgs.map((img) => <Carte key={img.id} o={o} img={img} cle={cle} decision={dec?.[o.id]?.items?.[img.id]} onFait={recharger} />)}
        </section>
      ))}
    </div>
  );
}
