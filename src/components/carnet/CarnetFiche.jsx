"use client";
// Fiche du carnet A5 gravé (mise en vente du 07/11/2026, gérant : « Papeterie avec le carnet »).
// Reproduit la maquette enregistrée v9 (artifact QSD8HCrAzEqrSEYA7viFMh) : couleur, quatre emplacements sur la
// couverture et quatre au dos (rien / un texte / un de nos dessins ou cadres / mon logo), écriture parmi les huit du
// site, gravure posée en direct sur la grande photo (couverture ou dos de la couleur choisie), +7 € par face gravée.
// Prix : src/lib/carnet.js (le même calcul au paiement). Planches, envoi de photo : repris de la fiche des marque-pages.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { Planches, envoyerPhoto, ajuster } from "@/components/marquePages/MarquePagesFiche";
import { CN_FACES, CN_ZONES, CN_ZONES_POS, CN_ENCRE, CN_GRAVURE, cnVide, cnPlein, cnFaceGravee, cnPrixGravure, cnNormaliser, cnResume, cnTextes } from "@/lib/carnet";
import LangueFiche from "@/components/LangueFiche";
import { langueDe, langueActive, texteMontre, texteFrappe, champsLangueAPlat, manqueLangue, resumeLangue } from "@/lib/traductionGravure";
import { classeLangue } from "@/lib/policeLangueClient";

const cle = (t) => t.toLowerCase(); // « Marron » → « marron »

// --- La gravure posée sur la grande photo ----------------------------------------------------------------------------
// langue (facultatif) = code de la langue de la gravure : son écriture (tamoul, arabe, hébreu, chinois) et son sens.
export function Gravure({ v, side, couleur, police, langue = "" }) {
  const ref = useRef(null);
  const [W, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current?.parentNode; if (!el) return;
    const m = () => setW(el.clientWidth || 0);
    m(); const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(m) : null; ro?.observe(el);
    return () => ro?.disconnect();
  }, []);
  const col = CN_ENCRE[couleur] || "#2c160a";
  const fnt = classeLangue(langue) || `fnt-${police || "playfair"}`;
  const dir = langueDe(langue)?.dir === "rtl" ? "rtl" : undefined;
  const Z = CN_ZONES_POS[side];
  const sig = JSON.stringify([v?.[side], W, couleur, police, langue]);
  useLayoutEffect(() => {
    const run = () => ref.current?.querySelectorAll(".t").forEach((t) => {
      ajuster(t, +t.dataset.mw, +t.dataset.mh);
      const l2 = t.parentNode.querySelector(".l2");
      if (l2) l2.style.fontSize = `${parseFloat(t.style.fontSize) * 0.55}px`;
    });
    run();
    let vivant = true;
    document.fonts?.ready?.then(() => { if (vivant) run(); });
    // L'écriture d'une langue arrive après la mesure : on remesure.
    const police2 = () => { if (vivant) run(); };
    window.addEventListener("niv-police-langue", police2);
    return () => { vivant = false; window.removeEventListener("niv-police-langue", police2); };
  }, [sig]);
  const els = [];
  if (W) for (const [z] of CN_ZONES) {
    const e = v?.[side]?.[z];
    if (!cnPlein(e)) continue;
    const [fx, fy, fw, fh, al] = Z[z];
    const x = fx * W, y = fy * W, w = fw * W, h = fh * W;
    const pos = { left: x, top: y, width: w, height: h };
    if (e.k === "texte") {
      const deux = Boolean(String(e.t2 || "").trim());
      els.push(
        <div key={z} className={`cn-el ${al}`} style={pos}>
          <span className={`t l1 ${fnt}`} dir={dir} data-mw={w * 0.96} data-mh={h * (deux ? 0.58 : 0.85)} style={{ color: col }}>{String(e.t || "").trim()}</span>
          {deux && <span className={`l2 ${fnt}`} dir={dir} style={{ color: col }}>{e.t2.trim()}</span>}
        </div>
      );
    } else if (e.k === "dessin") {
      const asp = MP_DATA.dessins.aspect[e.n] || 1;
      const dw = Math.min(w, h * asp), dh = Math.min(h, w / asp);
      const ox = al === "g" ? 0 : al === "d" ? w - dw : (w - dw) / 2;
      const cadre = e.n >= 75 && String(e.t || "").trim();
      const cc = MP_DATA.dessins.centre[e.n] || [0.5, 0.5, 0.5];
      els.push(
        <div key={z} className="cn-el cadre" style={pos}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="d" src={`/marque-pages/dessins/${String(e.n).padStart(3, "0")}.png`} alt="" style={{ left: ox, top: (h - dh) / 2, width: dw, height: dh }} />
          {cadre && <span className={`t c ${fnt}`} dir={dir} data-mw={dw * 0.6} data-mh={dh * (cc[2] || 0.5)} style={{ left: ox + cc[0] * dw, top: (h - dh) / 2 + cc[1] * dh, color: col }}>{e.t.trim()}</span>}
        </div>
      );
    } else if (e.k === "logo") {
      els.push(
        <div key={z} className="cn-el" style={pos}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={`g${al === "g" ? " pos" : al === "d" ? " posd" : ""}`} src={e.src} alt="" />
        </div>
      );
    }
  }
  return <div ref={ref} className={`cn-ov${couleur === "noir" ? " clair" : ""}`}>{els}</div>;
}

// --- L'éditeur d'une face : quatre emplacements -------------------------------------------------------------------------
function Face({ side, v, onChange, grille, setGrille, productSlug, lg, onFrappe }) {
  const [envoi, setEnvoi] = useState({});
  const maj = (z, patch) => onChange({ ...v, [side]: { ...v[side], [z]: { ...v[side][z], ...patch } } });
  return (
    <div className="mq-ed">
      {CN_ZONES.map(([z, lab, sub]) => {
        const e = v[side][z];
        const gk = `${side}|${z}`;
        const ouverte = grille === gk;
        return (
          <div key={z} className={`mq-emp${e.k ? " on" : ""}`}>
            <div className="mq-emph">
              <span className="mq-empl"><b>{lab}</b><small>{sub}</small></span>
              <select className="mq-empk" value={e.k} aria-label={`${side === "face" ? "Couverture" : "Dos"} · ${lab}`}
                onChange={(ev) => {
                  const k = ev.target.value;
                  maj(z, { k, n: k === "dessin" ? e.n : 0, src: k === "logo" ? e.src : null, t: k === "texte" ? e.t : "", t2: k === "texte" ? e.t2 : "", ts: k === "texte" ? e.ts || "" : "", ts2: k === "texte" ? e.ts2 || "" : "" });
                  setGrille(k === "dessin" && !e.n ? gk : (ouverte ? null : grille));
                }}>
                <option value="">Rien</option>
                <option value="texte">Un texte</option>
                <option value="dessin">Un de nos dessins ou cadres (n°)</option>
                <option value="logo">Mon logo ou mon propre dessin</option>
              </select>
            </div>
            {e.k ? (
              <div className="mq-empb">
                {e.k === "texte" && (
                  <>
                    <input type="text" className="mq-empt" maxLength={30} placeholder="Ex : Camille, Carnet de voyage…" value={texteMontre(lg, e.t, e.ts)} onChange={(ev) => { maj(z, texteFrappe(lg, ev.target.value)); onFrappe(); }} />
                    <input type="text" className="mq-empt cn-empt2" maxLength={40} placeholder="Deuxième ligne (facultatif) : une date, une citation courte" value={texteMontre(lg, e.t2, e.ts2)} onChange={(ev) => { const f = texteFrappe(lg, ev.target.value); maj(z, { t2: f.t, ts2: f.ts }); onFrappe(); }} />
                  </>
                )}
                {e.k === "dessin" && (
                  <div className="mq-empd">
                    {!ouverte && e.n ? <p className="mq-empok">{e.n >= 75 ? `Cadre n° ${e.n} choisi ✓` : `Dessin n° ${e.n} choisi ✓`}</p> : null}
                    {!ouverte && <button type="button" className="prc-change mq-empgo" onClick={() => setGrille(gk)}>{e.n ? "Changer de dessin" : "Choisir dans les planches"}</button>}
                    {ouverte && <Planches valeur={e.n} onChoix={(n) => maj(z, { n, t: n >= 75 ? e.t : "", ts: n >= 75 ? e.ts || "" : "" })} onFermer={() => setGrille(null)} />}
                    {e.n >= 75 && (
                      <label className="mq-empcl">Votre texte au milieu du cadre, facultatif
                        <input type="text" className="mq-empct" maxLength={24} placeholder="Ex : Camille" value={texteMontre(lg, e.t, e.ts)} onChange={(ev) => { maj(z, texteFrappe(lg, ev.target.value)); onFrappe(); }} />
                      </label>
                    )}
                  </div>
                )}
                {e.k === "logo" && (
                  <div className="mq-empp">
                    <label className="mq-pbtn">📷 {e.src ? "Changer mon logo ou mon dessin" : "Choisir mon logo ou mon dessin"}
                      <input type="file" accept="image/*" hidden onChange={async (ev) => {
                        const f = ev.target.files?.[0]; ev.target.value = ""; if (!f) return;
                        setEnvoi((x) => ({ ...x, [z]: "Envoi de l'image…" }));
                        try { const src = await envoyerPhoto(f, productSlug); maj(z, { src }); setEnvoi((x) => ({ ...x, [z]: "" })); }
                        catch (err) { setEnvoi((x) => ({ ...x, [z]: err.message || "L'envoi a échoué, réessayez." })); }
                      }} />
                    </label>
                    {envoi[z] ? <span className="mq-photo-ok">{envoi[z]}</span> : e.src ? <span className="mq-photo-ok">Image envoyée ✓</span> : null}
                    <p className="mq-sinfo">Un logo net, en noir et blanc, donne le meilleur résultat ; il est gravé dans la teinte du cuir.</p>
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

// --- La fiche -----------------------------------------------------------------------------------------------------------
export default function CarnetFiche({ product, realisations = [] }) {
  const { addItem } = useCart();
  useEffect(() => {
    trackOnce("vi-" + product.slug, "view_item", { slug: product.slug });
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "view_item", { currency: "EUR", value: product.variants?.[0]?.price || 0, items: [{ item_id: product.slug, item_name: product.name, item_category: product.category }] });
    }
  }, [product.slug]);
  const V = product.variants;
  const info = getProductInfo(product.slug);
  const [stock, setStock] = useState({});
  useEffect(() => { fetch("/api/stock").then((r) => r.json()).then((d) => setStock(d.stock || {})).catch(() => {}); }, []);
  const epuise = (sid, besoin = 1) => typeof stock[sid] === "number" && stock[sid] < besoin;

  const [ci, setCi] = useState(0);
  const couleur = cle(V[ci].title);
  const [v, setV] = useState(cnVide);
  const [police, setPolice] = useState("playfair");
  // Langue de la gravure (09/11/2026) : une langue pour tout le carnet ; chaque emplacement garde t (gravé) et ts (français tapé).
  const [lg, setLg] = useState({ langue: "", direct: "", tradOk: "" });
  const textes = cnTextes(v);
  const ecrireTexte = (key, { t, ts }) => setV((p) => {
    const x = cnTextes(p).find((y) => y.key === key);
    if (!x) return p;
    const patch = x.champ === "t2" ? { t2: t, ts2: ts } : { t, ts };
    return { ...p, [x.side]: { ...p[x.side], [x.zone]: { ...p[x.side][x.zone], ...patch } } };
  });
  const onFrappe = () => setLg((p) => (p.tradOk ? { ...p, tradOk: "" } : p));
  const [grille, setGrille] = useState(null);
  const [qty, setQty] = useState(1);
  const [ajoute, setAjoute] = useState(false);
  // Galerie : les 3 couvertures, les exemples, puis le DOS de la couleur choisie (vignette « Dos »), puis les photos.
  const galerie = useMemo(() => {
    const couv = V.map((x) => x.image);
    const autres = product.images.filter((s) => !couv.includes(s));
    return [...couv, ...autres.filter((s) => /exemple-/.test(s)), "DOS", ...autres.filter((s) => !/exemple-/.test(s))];
  }, [product.images]); // eslint-disable-line react-hooks/exhaustive-deps
  const [vue, setVue] = useState(0);
  const src = (s) => (s === "DOS" ? `/carnet/dos-${couleur}.jpg` : s);
  const actuelle = galerie[vue];
  const sideVue = actuelle === "DOS" ? "dos" : V.some((x) => x.image === actuelle) ? "face" : null;

  // Dès qu'on remplit une face, la grande photo montre cette face (comme la maquette).
  const sig = JSON.stringify(v);
  const avant = useRef(sig);
  useEffect(() => {
    if (avant.current === sig) return;
    const a = JSON.parse(avant.current); avant.current = sig;
    const change = JSON.stringify(a.dos) !== JSON.stringify(v.dos) ? "dos" : "face";
    setVue(change === "dos" ? galerie.indexOf("DOS") : ci);
  }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps

  function choisirCouleur(k) {
    setCi(k);
    setVue(sideVue === "dos" ? galerie.indexOf("DOS") : k);
  }

  const cn = { police, v };
  const norme = cnNormaliser(product, cn);
  const unite = V[ci].price + cnPrixGravure(v);
  const total = unite * qty;
  const sid = V[ci].stockId || V[ci].id;
  const manque = epuise(sid, qty);
  const enCours = Object.values(v).some((f) => Object.values(f).some((e) => (e.k === "logo" && !e.src) || (e.k === "dessin" && !e.n)));
  // Autre langue : les textes à plat (panier, paiement, atelier) ; jamais gravé traduit sans la case « J'ai relu… ».
  const champsLangue = champsLangueAPlat(lg, textes);
  const langueManque = manqueLangue(champsLangue);
  const bloque = !norme || manque || enCours || Boolean(langueManque);
  const raison = manque ? "Cette couleur est épuisée (ou il n'en reste pas assez) : choisissez-en une autre."
    : enCours ? "Il manque une image ou le numéro d'un dessin : complétez-le, ou choisissez « Rien » à cet emplacement." : langueManque || "";

  function ajouter() {
    if (bloque) return;
    const resume = cnResume(product, norme, V[ci].title) + (champsLangue.langue ? ` · Langue : ${resumeLangue(champsLangue)}` : "");
    const fields = { cn: norme, ...champsLangue };
    const cleL = Object.values(norme.v).map((f) => Object.values(f).map((e) => e.src || "").join(",")).join(";");
    addItem({
      productSlug: product.slug,
      variantId: V[ci].id,
      name: product.name,
      variantTitle: V[ci].title,
      price: unite,
      image: V[ci].image,
      personalization: resume,
      fields,
      cleLigne: cleL.replace(/[;,]/g, "") ? cleL : undefined,
      spec: { slug: product.slug, name: product.name, variantTitle: V[ci].title, variantId: V[ci].id, fields, personalization: resume },
      pickup: false,
      weight: product.weight,
      quantity: qty,
    });
    track("add_to_cart", { slug: product.slug, value: Number(total.toFixed(2)) });
    trackOnce("panier", "cart_open");
    setAjoute(true); setTimeout(() => setAjoute(false), 2200);
  }

  return (
    <div className="container mp-fiche cn-fiche">
      <div className="product-layout">
        <div>
          <div className="gallery-main">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="gallery-bg" src={src(actuelle)} alt={product.name} />
            {sideVue && <Gravure v={v} side={sideVue} couleur={couleur} police={police} langue={langueActive(lg) ? lg.langue : ""} />}
            <button type="button" className="gallery-arrow gallery-arrow-prev" aria-label="Photo précédente" onClick={() => setVue((x) => (x - 1 + galerie.length) % galerie.length)}>‹</button>
            <button type="button" className="gallery-arrow gallery-arrow-next" aria-label="Photo suivante" onClick={() => setVue((x) => (x + 1) % galerie.length)}>›</button>
          </div>
          <div className="gallery-thumbs">
            {galerie.map((s, i) => (
              <button key={s} type="button" className={`${vue === i ? "active" : ""}${/exemple-/.test(s) || s === "DOS" ? " mq-thex" : ""}`} aria-label={s === "DOS" ? "Le dos du carnet" : `Voir le visuel ${i + 1}`} onClick={() => setVue(i)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src(s)} alt="" loading="lazy" />{/exemple-/.test(s) ? <span>Exemple</span> : s === "DOS" ? <span>Dos</span> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="product-info">
          <div className="breadcrumb"><Link href="/boutique">Boutique</Link>{" / "}<Link href="/boutique/papeterie">Papeterie</Link></div>
          <div className="pd-titrerow">
            <h1>{product.title}</h1>
            <WishlistButton slug={product.slug} name={product.name} image={product.images[0]} price={V[0].price} variant="titre" />
          </div>
          <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>{product.tagline}</p>
          <div className="price-lead">{formatEuro(V[ci].price)}</div>

          <div className="field">
            <label>Choisissez votre couleur</label>
            <div className="variant-swatches">
              {V.map((x, k) => {
                const off = epuise(x.stockId || x.id);
                return (
                  <button key={x.id} type="button" className={`variant-swatch has-img${k === ci ? " active" : ""}${off ? " sold-out" : ""}`} aria-pressed={k === ci} onClick={() => choisirCouleur(k)}>
                    {off && <span className="vs-out">Épuisé</span>}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={x.image} alt={`${product.name} — ${x.title}`} />
                    <span className="vs-title">{x.title}</span>
                    <span className="vs-price"><span className="vs-now">{formatEuro(x.price)}</span></span>
                  </button>
                );
              })}
            </div>
          </div>

          <p style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 8 }}>Personnalisation — gravure</p>
          <p className="mq-edi">Quatre emplacements sur la couverture, quatre au dos, chacun avec son menu : gravez-en un seul ou plusieurs. Par exemple un titre en haut, un dessin au milieu et votre prénom en bas à gauche. La gravure de la couverture coûte {CN_GRAVURE} €, celle du dos {CN_GRAVURE} €, quel que soit le nombre d&apos;emplacements remplis.</p>
          {CN_FACES.map(([side]) => (
            <div key={side}>
              <p className="mq-sub cn-sub">{side === "face" ? "Sur la couverture" : "Au dos"} <small>(+{CN_GRAVURE} €){cnFaceGravee(v, side) ? " · gravée ✓" : ""}</small></p>
              <Face side={side} v={v} onChange={setV} grille={grille} setGrille={setGrille} productSlug={product.slug} lg={lg} onFrappe={onFrappe} />
            </div>
          ))}
          {(textes.length > 0 || langueActive(lg)) && <LangueFiche lg={lg} setLg={setLg} textes={textes} ecrire={ecrireTexte} />}
          <div className="field">
            <label htmlFor="cn-police">Écriture du texte</label>
            <select id="cn-police" value={police} onChange={(e) => setPolice(e.target.value)}>
              {FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <p className={`mp-polaff ${FONTS.find((f) => f.key === police)?.cls || ""}`}>Camille · Carnet de voyage · 2026</p>
            <p className="field-note">Laissez « Rien » partout pour un carnet sans gravure.</p>
          </div>

          <div className="pd-totbox">
            <span className="lab">Total tout compris</span>
            <span className="val">{formatEuro(total)}</span>
          </div>
          <p className="pd-nfois">
            💳 <strong>Payez en plusieurs fois sans frais</strong> — 4× avec PayPal (dès 30 €) ou 3× avec Klarna (dès 50 €). <PayInfoModal label="En savoir plus" className="pd-nfois-link" />
          </p>
          <VacationNotice compact />
          <div className="qty-row">
            <div className="qty-stepper">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Un carnet de moins" disabled={qty <= 1}>−</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Un carnet de plus" disabled={qty >= 20}>+</button>
            </div>
            <button className={`btn btn-gold${bloque ? " prc-off" : ""}`} style={{ flex: 1 }} onClick={ajouter} disabled={bloque}>
              {manque ? "Épuisé" : ajoute ? "Ajouté au panier ✓" : "Ajouter au panier"}
            </button>
          </div>
          {bloque && raison ? <p className="prc-addhint">{raison}</p> : null}
          <WishlistButton slug={product.slug} name={product.name} image={product.images[0]} price={V[0].price} variant="ligne" />
          {manque ? <RestockAlerte slug={product.slug} /> : null}

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
