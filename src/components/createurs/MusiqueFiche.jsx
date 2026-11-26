"use client";
// Fiche « Plaque et porte-clés musique à scanner » (26/11/2026, gérant : « mets en ligne »).
// C'est la maquette enregistrée (artifact YEY36tGKxeCeYo1kn56NnP, version 11) posée sur le site : mêmes étapes, mêmes
// classes (.mzq-*), même aperçu. Géométrie, QR code, vérifications et prix : src/lib/musiqueCreateur.js (le même calcul au
// paiement et pour le fichier de l'atelier). Les prix des tailles viennent des options du produit (Gestion peut les changer).
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { formatEuro } from "@/lib/format";
import { getProductInfo } from "@/lib/productInfo";
import { track, trackOnce } from "@/lib/track";
import WishlistButton from "@/components/WishlistButton";
import VacationNotice from "@/components/VacationNotice";
import DelaiFabrication from "@/components/DelaiFabrication";
import TrustSection from "@/components/TrustSection";
import { MUS_PLATS_HTML, MUS_POLICES_FICHIERS } from "@/lib/musiqueCreateurData";
import {
  MUS_MODELES, MUS_POLICES, MUS_MOUSQUETONS, MUS_PRIX, MUS_EXEMPLE, MUS_PHOTO_EXEMPLE, MUS_MAX, MUS_NOTE,
  musLireLien, musVariantId, musTaillesDe, musTaille, musPolice, musMousqueton, musNormaliser, musSupplement, musManque,
  musMatrice, musGeo, musApercu, musAjuster, musResume, musCm,
} from "@/lib/musiqueCreateur";
import "@/app/createur-musique.css";

const eur = (v) => formatEuro(v);
const enDonnees = (blob) => new Promise((ok, ko) => { const f = new FileReader(); f.onload = () => ok(f.result); f.onerror = ko; f.readAsDataURL(blob); });
const charger = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });

// La photo passée en nuances de brun (comme gravée sur le bois) pour l'aperçu.
async function traiter(src) {
  const im = await charger(src);
  if (!im) return null;
  const N = 520, c = document.createElement("canvas");
  c.width = c.height = N;
  const x = c.getContext("2d"), s = Math.min(im.width, im.height);
  x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, N, N);
  const p = x.getImageData(0, 0, N, N).data, g = x.createImageData(N, N);
  let mn = 255, mx = 0;
  for (let i = 0; i < p.length; i += 4) { const L = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]; if (L < mn) mn = L; if (L > mx) mx = L; }
  for (let i = 0; i < p.length; i += 4) {
    const L = (0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2] - mn) / Math.max(1, mx - mn), a = Math.pow(1 - L, 0.85);
    g.data[i] = 58; g.data[i + 1] = 38; g.data[i + 2] = 20; g.data[i + 3] = Math.round(a * 235);
  }
  x.putImageData(g, 0, 0);
  return c.toDataURL("image/png");
}
// La photo d'origine, ramenée à 1600 px au plus, pour l'atelier.
async function reduire(src) {
  const im = await charger(src);
  if (!im) return null;
  const k = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement("canvas");
  c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
  c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.9);
}
async function envoyerImage(dataUrl, slug) {
  const res = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl, productSlug: slug }) });
  const d = await res.json().catch(() => ({}));
  if (!res.ok || !d.ref) throw new Error(d.error || "L'envoi de la photo a échoué. Réessayez.");
  return "/api/img/" + d.ref;
}
// L'aperçu tel que la cliente le voit, en image, pour le panier et l'atelier.
async function capturer(svg) {
  if (!svg) return null;
  const copie = svg.cloneNode(true);
  copie.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const vb = svg.getAttribute("viewBox").split(/\s+/).map(Number);
  const W = 720, H = Math.round((W * vb[3]) / vb[2]);
  copie.setAttribute("width", W); copie.setAttribute("height", H);
  const familles = new Set([...copie.querySelectorAll("text")].map((t) => (t.getAttribute("font-family") || "").split(",")[0].replace(/['"]/g, "").trim()));
  let css = "";
  for (const p of MUS_POLICES_FICHIERS) {
    if (!familles.has(p.famille)) continue;
    try { css += `@font-face{font-family:'${p.famille}';src:url(${await enDonnees(await (await fetch("/createurs/polices/" + p.fichier)).blob())}) format('woff2');font-weight:${p.poids}}`; } catch { /* écriture de repli */ }
  }
  if (css) { const st = document.createElementNS("http://www.w3.org/2000/svg", "style"); st.textContent = css; copie.insertBefore(st, copie.firstChild); }
  const im = await charger("data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(copie)));
  if (!im) return null;
  const M = 40, c = document.createElement("canvas");
  c.width = W + 2 * M; c.height = H + 2 * M;
  const x = c.getContext("2d"); x.fillStyle = "#efe7d9"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, M, M, W, H);
  return c.toDataURL("image/jpeg", 0.88);
}

function iconeModele(id) {
  if (id === "porte") return `<svg viewBox="0 0 52 44"><path d="M8 6h26a3 3 0 0 1 3 3v8h7a5 5 0 0 1 0 10h-7v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z" fill="#ecd3a8" stroke="#9c6b3f" stroke-width="1.6"/><circle cx="44" cy="22" r="2" fill="#fff" stroke="#9c6b3f"/><rect x="11" y="12" width="20" height="20" fill="#3a2614" opacity=".75"/></svg>`;
  const carte = id === "carte";
  return `<svg viewBox="0 0 52 44"><rect x="12" y="2" width="28" height="40" rx="3" fill="#ecd3a8" stroke="#9c6b3f" stroke-width="1.6"/>${carte ? `<path transform="translate(15 5) scale(6)" d="${MUS_NOTE}" fill="#3a2614"/><rect x="22" y="7" width="13" height="2" fill="#3a2614"/>` : `<rect x="16" y="6" width="20" height="1.4" fill="#3a2614"/>`}<rect x="17" y="${carte ? 14 : 11}" width="18" height="18" fill="#3a2614" opacity=".75"/>${carte ? "" : `<rect x="18" y="34" width="16" height="2" fill="#3a2614"/>`}</svg>`;
}
const iconeTaille = (w, porte) => { const k = w / (porte ? 70 : 150); return `<svg viewBox="0 0 52 44"><rect x="${26 - 11 * k}" y="${22 - 11 * k}" width="${22 * k}" height="${22 * k}" rx="2" fill="#ecd3a8" stroke="#9c6b3f" stroke-width="1.6"/></svg>`; };

function Option({ actif, onClick, icone, titre, sous, disabled, title }) {
  return (
    <button type="button" className="mzq-opt" aria-pressed={actif ? "true" : "false"} onClick={onClick} disabled={disabled} title={title} style={disabled ? { opacity: 0.45 } : undefined}>
      {icone ? <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: icone }} /> : null}
      <span>{titre}</span>{sous ? <small>{sous}</small> : null}
    </button>
  );
}

export default function MusiqueFiche({ product, realisations = [] }) {
  const { addItem } = useCart();
  const V = product.variants;
  const info = getProductInfo(product.slug);
  const prixDe = (modele, tl) => V.find((x) => x.id === musVariantId(modele, tl))?.price ?? 0;
  const [lien, setLien] = useState("");
  const [modele, setModele] = useState("plaque");
  const [tl, setTl] = useState("m");
  const [titre, setTitre] = useState("");
  const [dedi, setDedi] = useState("");
  const [police, setPolice] = useState("playfair");
  const [scan, setScan] = useState(true);
  const [vue, setVue] = useState("face");
  const [cote, setCote] = useState("avant");
  const [mq, setMq] = useState("argente");
  const [ph, setPh] = useState("non");
  const [photo, setPhoto] = useState(null); // { g: brun pour l'aperçu, orig: à envoyer, nom }
  const [ex, setEx] = useState(null);
  const [aide, setAide] = useState("");
  const [occupe, setOccupe] = useState("");
  const [ajoute, setAjoute] = useState(false);
  const [erreur, setErreur] = useState("");
  const [stock, setStock] = useState({});
  const refSvg = useRef(null), refStage = useRef(null), refRes = useRef(null);

  const porte = modele === "porte", avecPhoto = ph === "oui";
  const l = musLireLien(lien), actif = l && l.ok ? l : null;
  const etat = { lien, modele, tl, titre, dedi, police, scan, mq, ph, photoChoisie: Boolean(photo) };
  const m = useMemo(() => musMatrice(actif ? actif.url : MUS_EXEMPLE), [actif?.url]); // eslint-disable-line react-hooks/exhaustive-deps
  const coteVu = porte && avecPhoto ? cote : "avant";
  const photoSrc = avecPhoto ? (photo?.g || ex || "") : "";
  const ap = musApercu(etat, m, coteVu, photoSrc);
  const g = musGeo(etat, "avant"), t = musTaille(etat);
  const prix = Math.round((prixDe(modele, t.id) + (avecPhoto ? MUS_PRIX.photo : 0)) * 100) / 100;
  const manque = musManque(etat);
  const exemples = []; if (!actif) exemples.push("collez votre lien"); if (avecPhoto && !photo) exemples.push("choisissez votre photo");
  const base = Math.min(...V.map((x) => x.price));

  useEffect(() => {
    trackOnce("vi-" + product.slug, "view_item", { slug: product.slug });
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "view_item", { currency: "EUR", value: base, items: [{ item_id: product.slug, item_name: product.name, item_category: product.category }] });
    }
    fetch("/api/stock").then((r) => r.json()).then((d) => setStock(d.stock || {})).catch(() => {});
    traiter(MUS_PHOTO_EXEMPLE).then(setEx);
  }, [product.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Un texte trop long est resserré ; à refaire à chaque dessin et quand les écritures sont arrivées.
  useEffect(() => {
    musAjuster(refSvg.current);
    let vivant = true;
    if (document.fonts?.ready) document.fonts.ready.then(() => { if (vivant) musAjuster(refSvg.current); });
    return () => { vivant = false; };
  });

  // Sous l'en-tête du site ; sur téléphone l'aperçu reste collé pendant les étapes puis se décolle au résumé (comme le support).
  useEffect(() => {
    const sousEntete = () => { const h = document.querySelector("header"); let top = 0; if (h && /sticky|fixed/.test(getComputedStyle(h).position)) top = h.offsetHeight; document.documentElement.style.setProperty("--mzq-top", top + "px"); };
    let attente = false;
    const decoller = () => {
      attente = false;
      const st = refStage.current, e = refRes.current;
      if (!st || !e) return;
      let d = 0;
      if (matchMedia("(max-width:900px)").matches) {
        const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--mzq-top")) || 0;
        d = Math.min(0, e.getBoundingClientRect().top - (top + st.offsetHeight + 8));
        d = Math.max(d, -(top + st.offsetHeight + 30));
      }
      st.style.transform = d ? `translateY(${Math.round(d)}px)` : "";
      st.style.visibility = d <= -st.offsetHeight ? "hidden" : "";
    };
    const defile = () => { if (!attente) { attente = true; requestAnimationFrame(decoller); } };
    const taille = () => { sousEntete(); decoller(); };
    sousEntete();
    window.addEventListener("scroll", defile, { passive: true });
    window.addEventListener("resize", taille);
    return () => { window.removeEventListener("scroll", defile); window.removeEventListener("resize", taille); document.documentElement.style.removeProperty("--mzq-top"); };
  }, []);

  function choisirModele(id) {
    setModele(id);
    const p = id === "porte";
    if (!p && avecPhoto && tl === "p") setTl("m");
    if (!p || !avecPhoto) setCote("avant");
  }
  function choisirPhoto(v) {
    setPh(v);
    if (v === "oui" && !porte && tl === "p") setTl("m");
    if (v !== "oui" || !porte) setCote("avant");
  }
  async function fichierChoisi(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const src = await enDonnees(f);
      const [gBrun, orig] = await Promise.all([traiter(src), reduire(src)]);
      if (gBrun && orig) { setPhoto({ g: gBrun, orig, nom: f.name }); setErreur(""); }
      else setErreur("Cette image n'a pas pu être lue. Essayez avec une autre photo (JPG ou PNG).");
    } catch { setErreur("Cette image n'a pas pu être lue. Essayez avec une autre photo (JPG ou PNG)."); }
  }
  async function coller() {
    try { const txt = await navigator.clipboard.readText(); setLien(txt); setAide(""); }
    catch { setAide("Appuyez longuement dans la case, puis « Coller »."); }
  }

  async function ajouter() {
    if (occupe) return;
    if (manque.length) { setErreur("Il manque " + manque.join(" et ") + "."); return; }
    const variante = V.find((x) => x.id === musVariantId(modele, t.id));
    if (!variante) { setErreur("Cette taille n'est pas disponible pour le moment."); return; }
    const sid = variante.stockId || variante.id;
    if (typeof stock[sid] === "number" && stock[sid] <= 0) { setErreur("Cette taille est épuisée : choisissez-en une autre."); return; }
    setErreur("");
    try {
      let photoUrl = "";
      if (avecPhoto) {
        setOccupe("Envoi de votre photo…");
        photoUrl = photo.url || await envoyerImage(photo.orig, product.slug);
        photo.url = photoUrl;
      }
      const mus = musNormaliser({ ...etat, tl: t.id, photo: photoUrl });
      if (!mus) throw new Error("Votre création n'a pas pu être enregistrée. Vérifiez le lien de votre chanson et recommencez.");
      setOccupe("Préparation de l'aperçu…");
      let previewImage = null;
      try {
        const img = await capturer(refSvg.current);
        if (img) previewImage = await envoyerImage(img, product.slug).catch(() => null);
      } catch { /* la commande passe sans l'image : Gestion redessine la création */ }
      const total = Math.round((variante.price + musSupplement(mus)) * 100) / 100;
      const resume = musResume(mus), fields = { mus };
      addItem({
        productSlug: product.slug, variantId: variante.id, name: product.name, variantTitle: variante.title, price: total,
        image: previewImage || product.images[0], personalization: resume, fields, cleLigne: `mus-${Date.now().toString(36)}`,
        spec: { slug: product.slug, name: product.name, variantTitle: variante.title, variantId: variante.id, fields, personalization: resume, previewImage },
        pickup: false, weight: variante.weight || product.weight, quantity: 1,
      });
      track("add_to_cart", { slug: product.slug, value: total });
      trackOnce("panier", "cart_open");
      setAjoute(true); setTimeout(() => setAjoute(false), 2400);
    } catch (e) {
      setErreur(e?.message || "Une erreur est survenue. Réessayez.");
    } finally { setOccupe(""); }
  }

  const L = [["Chanson", actif ? `lien ${actif.plat}` : "à coller"], ["Modèle", MUS_MODELES.find((x) => x.id === modele).nom], ["Taille", `${t.nom} · ${musCm(g.w)} × ${musCm(g.h)} cm`], ["Bois", "contreplaqué, 3 mm"]];
  if (porte) L.push(["Mousqueton", musMousqueton(mq).nom]);
  if (avecPhoto) L.push(["Photo", (porte ? "au dos" : "à côté du QR code") + (photo ? "" : ", à choisir") + ` (+${eur(MUS_PRIX.photo)})`]);
  if (!porte) { L.push(["Titre", titre || "aucun"]); L.push(["Dédicace", dedi || "aucune"]); if (titre || dedi) L.push(["Écriture", musPolice(police)[1]]); }

  return (
    <div className="container mzqf">
      <div className="product-layout">
        <div className="mzq-left">
          <div className="mzq-stage" id="stage" data-vue={vue} ref={refStage}>
            <span className="mzq-tag">Votre création</span>
            <div className="mzq-tools">
              <button type="button" aria-pressed={vue === "face" && coteVu === "avant" ? "true" : "false"} onClick={() => { setVue("face"); setCote("avant"); }}>De face</button>
              <button type="button" aria-pressed={vue === "relief" ? "true" : "false"} onClick={() => setVue("relief")}>En relief</button>
              {porte && avecPhoto ? <button type="button" aria-pressed={coteVu === "dos" ? "true" : "false"} onClick={() => { setCote("dos"); setVue("face"); }}>Le dos</button> : null}
            </div>
            <svg id="svg" ref={refSvg} aria-label="Aperçu de votre création" viewBox={ap.viewBox} dangerouslySetInnerHTML={{ __html: ap.html }} />
            {exemples.length ? <span className="mzq-ex">{"Exemple : " + exemples.join(" et ")}</span> : null}
          </div>
          <div className="mzq-scan">📱 <b>Testez-le :</b> scannez l&apos;aperçu avec l&apos;appareil photo de votre téléphone, la chanson doit s&apos;ouvrir. C&apos;est ce QR code qui sera gravé.</div>
        </div>
        <div className="product-info">
          <div className="breadcrumb"><Link href="/boutique">Boutique</Link>{" / "}<Link href="/boutique/cadeaux">Petits cadeaux</Link></div>
          <div className="pd-titrerow">
            <h1>{product.title}</h1>
            <WishlistButton slug={product.slug} name={product.name} image={product.images[0]} price={base} variant="titre" />
          </div>
          <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>{product.tagline}</p>
          <div className="price-lead">{eur(prix)}</div>

          <section className="mzq-step"><h3><span className="mzq-n">1</span>Votre chanson</h3>
            <div className="mzq-lien">
              <input type="url" inputMode="url" autoComplete="off" placeholder="Collez ici le lien de votre chanson" value={lien} onChange={(e) => { setLien(e.target.value); setAide(""); }} aria-label="Le lien de votre chanson" />
              <button type="button" onClick={coller}>Coller</button>
            </div>
            <div className={"mzq-ok" + (l ? (l.ok ? " bon" : " mauvais") : "")}>
              {l ? (l.ok ? `✓ Lien ${l.plat} reconnu : le QR code est sur l'aperçu.` : "Ce lien n'est pas un lien de musique (Spotify, Deezer, Apple Music, YouTube, SoundCloud). Vérifiez-le.") : aide}
            </div>
            <div className="mzq-plats" aria-label="Plateformes acceptées" dangerouslySetInnerHTML={{ __html: MUS_PLATS_HTML }} />
            <p className="mzq-sub">Dans votre appli de musique : « Partager » puis « Copier le lien ». Une chanson, un album ou une playlist (publique).</p>
          </section>

          <section className="mzq-step"><h3><span className="mzq-n">2</span>Le modèle</h3>
            <div className="mzq-grid">
              {MUS_MODELES.map((x) => <Option key={x.id} actif={modele === x.id} onClick={() => choisirModele(x.id)} icone={iconeModele(x.id)} titre={x.nom} sous={x.s} />)}
            </div>
            <div className="mzq-photo"><p className="mzq-sous2">Votre photo <small>(facultatif)</small></p>
              <div className="mzq-grid">
                <Option actif={!avecPhoto} onClick={() => choisirPhoto("non")} titre="QR code seul" sous="compris" />
                <Option actif={avecPhoto} onClick={() => choisirPhoto("oui")} titre={porte ? "Recto-verso : QR devant, photo au dos" : "QR code + ma photo"} sous={`+${eur(MUS_PRIX.photo)} la gravure`} />
              </div>
              {avecPhoto ? (
                <div id="photoUp">
                  <label className="mzq-up"><input type="file" accept="image/*" onChange={fichierChoisi} /><span>📷 Choisir ma photo</span></label>{" "}
                  <span className="mzq-sub">{photo ? "✓ " + photo.nom : ""}</span>
                  <p className="mzq-sub">{porte ? "Votre photo est gravée au dos du porte-clés. Touchez « Le dos » sur l'aperçu pour la voir." : "Votre photo est gravée sur le bois à côté du QR code, en nuances de brun (sans couleur). Tailles Moyenne et Grande seulement."}</p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="mzq-step"><h3><span className="mzq-n">3</span>La taille</h3>
            <div className="mzq-grid">
              {musTaillesDe(modele).map((x) => {
                const h = porte ? x.w * 0.833 : (avecPhoto ? x.w * 0.78 : x.w * 1.121), bloque = avecPhoto && !porte && x.id === "p";
                return <Option key={x.id} actif={t.id === x.id} onClick={() => setTl(x.id)} icone={iconeTaille(x.w, porte)} titre={x.nom} sous={`${musCm(x.w)} × ${musCm(h)} cm · ${eur(prixDe(modele, x.id))}`} disabled={bloque} title={bloque ? "Trop petite pour la photo et le QR code côte à côte" : undefined} />;
              })}
            </div>
            <p className="mzq-sub">{`QR code de ${musCm(g.qr.t)} cm de côté.` + (porte ? " Le mousqueton est fourni, dans la couleur choisie ci-dessous." : "") + (avecPhoto && !porte ? " Avec votre photo : taille Moyenne ou Grande." : "")}</p>
            {porte ? (
              <div><p className="mzq-sub" style={{ fontWeight: 700, color: "var(--ink)" }}>Couleur du mousqueton <small style={{ fontWeight: 500, color: "var(--ink-soft)" }}>· même prix</small></p>
                <div className="mzq-mq">
                  {MUS_MOUSQUETONS.map((x) => <button key={x.id} type="button" aria-pressed={mq === x.id ? "true" : "false"} onClick={() => setMq(x.id)}><img src={x.img} alt="" /><span>{x.nom}</span></button>)}
                </div>
              </div>
            ) : null}
          </section>

          {porte ? null : (
            <section className="mzq-step"><h3><span className="mzq-n">4</span>Vos textes <small style={{ font: "500 .78rem Inter,sans-serif", color: "var(--ink-soft)" }}>(facultatif, compris)</small></h3>
              <div className="mzq-champ"><label htmlFor="mzq-titre">Titre <small>{`${titre.length} / ${MUS_MAX.titre}`}</small></label><input id="mzq-titre" maxLength={MUS_MAX.titre} placeholder="Ex. Notre chanson" value={titre} onChange={(e) => setTitre(e.target.value)} /></div>
              <div className="mzq-champ"><label htmlFor="mzq-dedi">Dédicace <small>{`${dedi.length} / ${MUS_MAX.dedi}`}</small></label><input id="mzq-dedi" maxLength={MUS_MAX.dedi} placeholder="Ex. Léa & Tom · 14.06.2025" value={dedi} onChange={(e) => setDedi(e.target.value)} /></div>
              <div className="mzq-champ"><label htmlFor="mzq-police">Écriture</label>
                <select id="mzq-police" value={police} onChange={(e) => setPolice(e.target.value)}>{MUS_POLICES.map((p) => <option key={p[0]} value={p[0]} style={{ fontFamily: p[2] }}>{p[1]}</option>)}</select></div>
              <div className="mzq-champ"><label><span><input type="checkbox" checked={scan} onChange={(e) => setScan(e.target.checked)} style={{ width: "auto", margin: "0 6px 0 0", verticalAlign: "-2px" }} />Graver « Scannez pour écouter »</span></label></div>
            </section>
          )}

          <section className="mzq-step" ref={refRes}><h3><span className="mzq-n">{porte ? "4" : "5"}</span>Votre création</h3>
            <ul className="mzq-sum">{L.map(([a, b]) => <li key={a}><span>{a}</span><span>{b}</span></li>)}</ul>
            <div className="mzq-tot"><span>Total</span><b>{eur(prix)}</b></div>
            <VacationNotice compact />
            <div className="qty-row" style={{ marginTop: 10 }}>
              <button type="button" className="btn btn-gold mzq-cart" onClick={ajouter} disabled={manque.length > 0} aria-busy={occupe ? "true" : undefined}>{occupe || (ajoute ? "Ajouté au panier ✓" : "Ajouter au panier")}</button>
            </div>
            <p className="mzq-manque" role={erreur ? "alert" : undefined}>{erreur || (manque.length ? "Il manque " + manque.join(" et ") + "." : "")}</p>
          </section>
          <WishlistButton slug={product.slug} name={product.name} image={product.images[0]} price={base} variant="ligne" />

          <div className="trust-cards">
            <div className="tcard fr"><span className="ti">🇫🇷</span><span><b>Personnalisé en France</b><small>Dans notre atelier</small></span></div>
            <div className="tcard pay"><span className="ti">🔒</span><span><b>Paiement sécurisé</b><small>Carte &amp; PayPal</small></span></div>
            <div className="tcard hand"><span className="ti">✦</span><span><b>Gravé à la commande</b><small>Pièce unique</small></span></div>
            <div className="tcard ship"><span className="ti">🚚</span><span><b>Livraison suivie</b><small>Lettre &amp; point relais</small></span></div>
          </div>
          <div className="pd-perso">
            <b>✦ Pièce personnalisée</b>
            <DelaiFabrication><p>🕒 Gravée à la commande dans notre atelier, puis expédiée en lettre suivie.</p></DelaiFabrication>
          </div>
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
    </div>
  );
}
