"use client";
// Fiche « Créez votre support de téléphone » (14/11/2026, gérant : « OK pour remplacer et mettre en ligne »).
// C'est la maquette enregistrée (artifact ARNf7BxbQxsTvkpJxgQKD7, version 11) posée sur le site : l'aperçu à gauche et les
// quatre étapes à droite sont les deux morceaux de page de la maquette, animés par SON script (public/createurs/support/
// outil.js, fabriqué par tools/createurs/support-site.py). React porte le reste de la fiche : titre, favoris, total, bouton
// du panier, réassurance, description, volets. Prix et vérification : src/lib/supportCreateur.js (le même calcul au paiement).
import { memo, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { formatEuro } from "@/lib/format";
import { getProductInfo } from "@/lib/productInfo";
import { track, trackOnce } from "@/lib/track";
import WishlistButton from "@/components/WishlistButton";
import VacationNotice from "@/components/VacationNotice";
import DelaiFabrication from "@/components/DelaiFabrication";
import PayInfoModal from "@/components/PayInfo";
import TrustSection from "@/components/TrustSection";
import { SUP_GAUCHE, SUP_ETAPES, SUP_POLICES_FICHIERS } from "@/lib/supportCreateurData";
import { supVariantId, supNormaliser, supSupplement, supManque, supResume, SUP_TAILLES } from "@/lib/supportCreateur";
import "@/app/createur-support.css";

const SCRIPT = "/createurs/support/outil.js";
// Les familles d'écriture de l'aperçu (celles que le script écrit dans le dessin).
const FAMILLES = { playfair: "Playfair Display", cinzel: "Cinzel", "cinzel-deco": "Cinzel Decorative", montserrat: "Montserrat", inter: "Inter", "great-vibes": "Great Vibes", allura: "Allura", pacifico: "Pacifico" };

// Les deux morceaux de la maquette : React les pose une fois, le script les anime ensuite (jamais redessinés par React).
const Gauche = memo(function Gauche({ refEl, html }) { return <div className="sc-left" ref={refEl} dangerouslySetInnerHTML={{ __html: html }} />; });
const Etapes = memo(function Etapes({ refEl }) { return <div className="prc" id="prc" ref={refEl} dangerouslySetInnerHTML={{ __html: SUP_ETAPES }} />; });

function chargerScript() {
  return new Promise((ok, ko) => {
    if (window.NivSupport) return ok();
    let s = document.querySelector(`script[data-niv="support"]`);
    if (!s) { s = document.createElement("script"); s.src = SCRIPT; s.async = true; s.dataset.niv = "support"; document.head.appendChild(s); }
    s.addEventListener("load", () => ok());
    s.addEventListener("error", () => ko(new Error("script")));
  });
}

const enDonnees = (blob) => new Promise((ok, ko) => { const f = new FileReader(); f.onload = () => ok(f.result); f.onerror = ko; f.readAsDataURL(blob); });

async function envoyerImage(dataUrl, slug) {
  const res = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl, productSlug: slug }) });
  const d = await res.json().catch(() => ({}));
  if (!res.ok || !d.ref) throw new Error(d.error || "L'envoi de la photo a échoué. Réessayez.");
  return "/api/img/" + d.ref;
}

// L'aperçu tel que la cliente le voit (le dessin du support, sans la sélection), en image, pour la commande et l'atelier.
async function capturerApercu(etat) {
  const svg = document.getElementById("scene");
  if (!svg) return null;
  const copie = svg.cloneNode(true);
  copie.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copie.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  const vb = (svg.getAttribute("viewBox") || "40 14 320 536").split(/\s+/).map(Number);
  const W = 640, H = Math.round((W * vb[3]) / vb[2]);
  copie.setAttribute("width", W); copie.setAttribute("height", H);
  // Les écritures utilisées, écrites dans l'image (un dessin passé en image ne lit pas les polices de la page).
  const familles = new Set((etat.els || []).filter((e) => e.type === "texte" || (e.type === "lettre" && e.nom)).map((e) => FAMILLES[e.police] || FAMILLES.playfair));
  let css = "";
  for (const p of SUP_POLICES_FICHIERS) {
    if (!familles.has(p.famille)) continue;
    try {
      const b = await (await fetch("/createurs/polices/" + p.fichier)).blob();
      css += `@font-face{font-family:'${p.famille}';src:url(${await enDonnees(b)}) format('woff2');font-weight:${p.poids}}`;
    } catch { /* l'aperçu sortira dans une écriture de repli */ }
  }
  if (css) { const st = document.createElementNS("http://www.w3.org/2000/svg", "style"); st.textContent = css; copie.insertBefore(st, copie.firstChild); }
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(copie));
  const im = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d"); x.fillStyle = "#f6efe2"; x.fillRect(0, 0, W, H); x.drawImage(im, 0, 0, W, H);
  return c.toDataURL("image/jpeg", 0.86);
}

export default function SupportFiche({ product, realisations = [] }) {
  const { addItem } = useCart();
  const V = product.variants;
  const info = getProductInfo(product.slug);
  const prixDe = (t) => V.find((x) => x.id === supVariantId(t))?.price;
  const base = prixDe("petit") ?? V[0].price;
  const refG = useRef(null), refE = useRef(null);
  // La première photo de la fiche est écrite dans la page dès le départ (le script pose ensuite la galerie entière).
  const gauche = useMemo(() => SUP_GAUCHE.replace('id="grande"', `id="grande" src="${String(product.images[0] || "").replace(/"/g, "")}"`), [product.images]);
  const [pret, setPret] = useState(false);
  const [panne, setPanne] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [ajoute, setAjoute] = useState(false);
  const [erreur, setErreur] = useState("");
  const [stock, setStock] = useState({});

  useEffect(() => {
    trackOnce("vi-" + product.slug, "view_item", { slug: product.slug });
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "view_item", { currency: "EUR", value: base, items: [{ item_id: product.slug, item_name: product.name, item_category: product.category }] });
    }
    fetch("/api/stock").then((r) => r.json()).then((d) => setStock(d.stock || {})).catch(() => {});
  }, [product.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Le script de la maquette : monté à l'arrivée, démonté au départ (écoutes de la fenêtre retirées, morceaux remis à neuf).
  useEffect(() => {
    let vivant = true, demonter = null;
    chargerScript().then(() => {
      if (!vivant || !window.NivSupport) return;
      demonter = window.NivSupport.monter({
        photos: product.images,
        prix: { base, taille: { petit: 0, standard: Math.round(((prixDe("standard") ?? base + 3) - base) * 100) / 100, grand: Math.round(((prixDe("grand") ?? base + 6) - base) * 100) / 100 }, element: 3, ajoure: 3 },
      });
      setPret(true);
    }).catch(() => { if (vivant) setPanne(true); });
    return () => {
      vivant = false;
      try { demonter?.(); } catch { /* rien */ }
      if (refG.current) refG.current.innerHTML = gauche;
      if (refE.current) refE.current.innerHTML = SUP_ETAPES;
    };
  }, [product.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  async function ajouter() {
    const site = typeof window !== "undefined" ? window.scSite : null;
    if (!site || occupe) return;
    const S = site.S;
    const manque = supManque(S);
    if (manque) { setErreur(manque); return; }
    const variante = V.find((x) => x.id === supVariantId(S.taille));
    if (!variante) { setErreur("Cette taille n'est pas disponible pour le moment."); return; }
    const sid = variante.stockId || variante.id;
    if (typeof stock[sid] === "number" && stock[sid] <= 0) { setErreur(`La taille « ${SUP_TAILLES[S.taille].nom} » est épuisée : choisissez-en une autre.`); return; }
    setErreur("");
    try {
      // 1. Les photos de la cliente partent sur le site (la commande ne garde que leur adresse).
      const photos = S.grave ? S.els.filter((e) => e.type === "photo" && !e.url) : [];
      if (photos.length) setOccupe("Envoi de votre photo…");
      for (const e of photos) e.url = await envoyerImage(e.src, product.slug);
      const sup = supNormaliser(S);
      if (!sup) throw new Error("Votre création n'a pas pu être enregistrée. Rechargez la page et recommencez.");
      // 2. L'aperçu vu par la cliente, gardé avec la commande (sans la sélection en cours).
      setOccupe("Préparation de l'aperçu…");
      let previewImage = null;
      try {
        S.sel = null; site.voirCreation(); site.dessiner();
        const img = await capturerApercu(sup);
        if (img) previewImage = await envoyerImage(img, product.slug).catch(() => null);
      } catch { /* la commande passe sans l'image : l'outil de Gestion redessine la création */ }
      const prix = Math.round((variante.price + supSupplement(sup)) * 100) / 100;
      const resume = supResume(sup);
      const fields = { sup };
      addItem({
        productSlug: product.slug,
        variantId: variante.id,
        name: product.name,
        variantTitle: variante.title,
        price: prix,
        image: previewImage || product.images[0],
        personalization: resume,
        fields,
        cleLigne: `sup-${Date.now().toString(36)}`,
        spec: { slug: product.slug, name: product.name, variantTitle: variante.title, variantId: variante.id, fields, personalization: resume, previewImage },
        pickup: false,
        weight: variante.weight || product.weight,
        quantity: 1,
      });
      track("add_to_cart", { slug: product.slug, value: prix });
      trackOnce("panier", "cart_open");
      setAjoute(true); setTimeout(() => setAjoute(false), 2400);
    } catch (e) {
      setErreur(e?.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setOccupe("");
    }
  }

  return (
    <div className="container scf">
      <div className="product-layout sc-layout">
        <Gauche refEl={refG} html={gauche} />
        <div className="product-info">
          <div className="breadcrumb"><Link href="/boutique">Boutique</Link>{" / "}<Link href="/boutique/papeterie">Papeterie & Bureau</Link></div>
          <div className="pd-titrerow">
            <h1>{product.title}</h1>
            <WishlistButton slug={product.slug} name={product.name} image={product.images[0]} price={base} variant="titre" />
          </div>
          <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>{product.tagline}</p>
          <div className="price-lead" id="prixtete">{`dès ${formatEuro(base)}`}</div>

          <Etapes refEl={refE} />
          {panne ? <p className="prc-addhint">Le créateur n&apos;a pas pu se charger. Rechargez la page ; si le souci continue, écrivez-nous depuis la page Contact.</p> : null}

          <div className="pd-totbox"><span className="lab">Total tout compris</span><span className="val" id="total">{`dès ${formatEuro(base)}`}</span></div>
          <p className="prc-hint prc-miss" id="manque" />
          <p className="pd-nfois">
            💳 <strong>Payez en plusieurs fois sans frais</strong> — 4× avec PayPal (dès 30 €) ou 3× avec Klarna (dès 50 €). <PayInfoModal label="En savoir plus" className="pd-nfois-link" />
          </p>
          <VacationNotice compact />
          <div className="qty-row">
            <button className="btn btn-gold" id="ajouter" style={{ flex: 1 }} type="button" onClick={ajouter} aria-busy={occupe ? "true" : undefined}>
              {occupe || (ajoute ? "Ajouté au panier ✓" : pret ? "Ajouter au panier" : "Chargement du créateur…")}
            </button>
          </div>
          {erreur ? <p className="prc-addhint" role="alert">{erreur}</p> : null}
          <WishlistButton slug={product.slug} name={product.name} image={product.images[0]} price={base} variant="ligne" />

          <div className="trust-cards">
            <div className="tcard fr"><span className="ti">🇫🇷</span><span><b>Personnalisé en France</b><small>Dans notre atelier</small></span></div>
            <div className="tcard pay"><span className="ti">🔒</span><span><b>Paiement sécurisé</b><small>Carte &amp; PayPal</small></span></div>
            <div className="tcard hand"><span className="ti">✦</span><span><b>Gravé à la commande</b><small>Pièce unique</small></span></div>
            <div className="tcard ship"><span className="ti">🚚</span><span><b>Livraison suivie</b><small>Colis &amp; point relais</small></span></div>
          </div>
          <div className="pd-perso">
            <b>✦ Pièce personnalisée</b>
            <DelaiFabrication><p>🕒 Personnalisé à la commande : fabrication 3 à 5 jours ouvrés, puis expédiée en colis suivi (le délai de livraison dépend du transporteur).</p></DelaiFabrication>
          </div>
          <div className="product-desc" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
          <div style={{ background: "linear-gradient(135deg,#fbf4e6,#fffdf9)", border: "1px solid #e7d3a1", borderRadius: 14, padding: "16px 18px", margin: "18px 0 4px" }}>
            <strong style={{ color: "var(--gold-dark)", display: "block", marginBottom: 6 }}>✦ Fait main dans notre atelier français</strong>
            <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--ink-soft)", lineHeight: 1.55 }}>
              Chaque pièce est <strong>découpée et finie à la main chez nous</strong> — pas de production de masse, pas de fabrication en chaîne. La découpe laser permet des détails impossibles en grande série. Vous recevez une <strong>création unique</strong>, en matières naturelles, pensée pour durer et pour offrir.
            </p>
          </div>
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
