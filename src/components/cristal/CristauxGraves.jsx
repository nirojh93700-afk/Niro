"use client";
// Page « Cristaux déjà gravés » (/cristaux-graves) — reproduction de la maquette validée
// docs/maquettes/cristaux-graves.html (version 14), mise en ligne le 10/10/2026 (« les trois » du gérant).
// Trois pavés (modèles gravés / dessins / zodiaque), 8 cartes puis « Afficher les N autres », panneau
// « Votre cristal » : format (rien de présélectionné), taille, texte +5 € (zodiaque : prénom, date, ville
// +2 € chacun), socle LED, total, quantité, bouton grisé tant qu'il manque quelque chose. Le panier reçoit le
// produit « cristal-deja-grave » : les prix sont recalculés côté serveur au paiement (products.js).
// Styles : src/app/cristaux-graves.css (généré depuis la maquette, racine .cgg).
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/CartContext";
import { track } from "@/lib/track";
import IcCg from "./IcCg";
import {
  CG_DOSSIER, CG_MODELES, CG_DESSINS, CG_ZODIAQUE, CG_FAMILLES, CG_TAILLES,
  CG_TEXTE_PRIX, CG_ZOD_PRIX, CG_SLUG, cgVariantId,
} from "@/lib/cristauxGraves";

const PAGE = 8;
const eur = (n) => n.toFixed(2).replace(".", ",") + " €";
const FONTS = [["playfair", "Playfair"], ["cinzel", "Cinzel"], ["cinzel-deco", "Cinzel Deco"], ["montserrat", "Montserrat"],
  ["inter", "Inter"], ["great-vibes", "Great Vibes"], ["allura", "Allura"], ["pacifico", "Pacifico"]];
const PLACES = [["bas", "En bas"], ["haut", "En haut"], ["gauche", "À gauche"], ["droite", "À droite"]];
const FAM_LABEL = Object.fromEntries(CG_FAMILLES.map((f) => [f.k, f.nom]));
const INTRO = {
  dessins: "Un dessin gravé en 3D au cœur du cristal, au format et à la taille de votre choix. Rien n'est choisi d'avance.",
  zodiaque: "Votre signe, sa constellation et sa figure gravés dans le cristal. En option : un prénom, la date et l'heure de naissance, la ville.",
};

// Toutes les gravures dans l'ordre de la maquette : modèles, dessins, zodiaque.
const ITEMS = [
  ...CG_MODELES.map((m) => ({ ...m, grp: "modeles", img: `${CG_DOSSIER}/${m.k}.jpg` })),
  ...CG_DESSINS.map((d) => ({ ...d, grp: "dessins", d: true, img: `${CG_DOSSIER}/dessin-${d.k}.webp`,
    phrase: "Dessin gravé en 3D au cœur du cristal, au format de votre choix." })),
  ...CG_ZODIAQUE.map((z) => ({ ...z, grp: "zodiaque", d: true, z: true, img: `${CG_DOSSIER}/zodiaque-${z.k}.webp`,
    phrase: `Signe du ${z.nom} (${z.dates}) : la constellation et sa figure, gravées en 3D. Ajoutez un prénom, la date de naissance et la ville.` })),
];
const GROUPES = [["modeles", "Modèles gravés", CG_MODELES.length], ["dessins", "Dessins", CG_DESSINS.length], ["zodiaque", "Zodiaque", CG_ZODIAQUE.length]];

// Contenu du bloc de cristal dessiné (cartes et panneau) : dessin, ou figure du signe + nom + textes d'exemple.
function BlocContenu({ it, exemple = true }) {
  if (it.z) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cg-zfig" src={it.img} alt="" />
        <span className="cg-zname">{it.nom}</span>
        {exemple ? (
          <span className="cg-zperso cg-zex" aria-hidden="true"><b className="fnt-great-vibes">Luna Vance</b><small>24 nov. 2022 · 19:27</small><small>Paris</small></span>
        ) : null}
      </>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={it.img} alt={`Dessin à graver : ${it.nom}`} loading="lazy" />;
}

export default function CristauxGraves({ prix = {} }) {
  const { addItem } = useCart();
  const [grp, setGrp] = useState("modeles");
  const [fam, setFam] = useState("tous");
  const [plus, setPlus] = useState(false);
  const [i, setI] = useState(-1);
  const [fmt, setFmt] = useState(null);
  const [taille, setTaille] = useState("moyen");
  const [socle, setSocle] = useState(false);
  const [txt, setTxt] = useState(false);
  const [texte, setTexte] = useState("");
  const [font, setFont] = useState("playfair");
  const [pos, setPos] = useState("bas");
  const [zp, setZp] = useState(""); const [zd, setZd] = useState(""); const [zh, setZh] = useState(""); const [zv, setZv] = useState("");
  const [q, setQ] = useState(1);
  const [ajoute, setAjoute] = useState(false);
  const [barOff, setBarOff] = useState(false);
  const panneau = useRef(null);
  const champTexte = useRef(null);
  const champZod = useRef(null);
  const [anim, setAnim] = useState(0);

  // Prix des tailles lus dans le catalogue (un prix changé dans Gestion se voit ici) ; repli : la maquette.
  const T = useMemo(() => Object.fromEntries(CG_TAILLES.map((t) => {
    const p = prix[cgVariantId(fmt || "v", t.id)];
    return [t.id, { ...t, prix: typeof p === "number" ? p : t.prix }];
  })), [prix, fmt]);

  const m = i >= 0 ? ITEMS[i] : null;
  const zod = Boolean(m && m.z);
  const zDate = [zd, zh].filter(Boolean).join(" · ");
  const nz = zod ? [zp, zDate, zv].filter(Boolean).length : 0;
  const avecTxt = txt && (zod ? nz > 0 : Boolean(texte.trim()));
  const t = T[taille];
  const unit = t.prix + (socle ? t.socle : 0) + (avecTxt ? (zod ? CG_ZOD_PRIX * nz : CG_TEXTE_PRIX) : 0);
  const ok = i >= 0 && Boolean(fmt) && (!txt || avecTxt);
  const manque = i < 0 ? "Choisissez d'abord un modèle, un dessin ou votre signe."
    : !fmt ? "Il manque le format : vertical ou horizontal."
    : zod ? "Écrivez au moins le prénom, la date ou la ville (+2 € chacun), ou retirez l'option."
    : "Écrivez le texte à graver, ou retirez l'option texte.";

  // Cartes visibles : groupe, famille (modèles seulement), 8 puis « Afficher les N autres ».
  const { visibles, reste } = useMemo(() => {
    const list = ITEMS.map((it, idx) => ({ it, idx })).filter(({ it }) => it.grp === grp && (grp !== "modeles" || fam === "tous" || it.fam === fam));
    const v = plus ? list : list.slice(0, PAGE);
    return { visibles: new Set(v.map((x) => x.idx)), reste: list.length - v.length };
  }, [grp, fam, plus]);

  useEffect(() => {
    if (!("IntersectionObserver" in window) || !panneau.current) return undefined;
    const io = new IntersectionObserver((e) => setBarOff(e[0].isIntersecting), { threshold: 0.15 });
    io.observe(panneau.current);
    return () => io.disconnect();
  }, []);

  function choisir(idx) {
    setI(idx); setAnim((n) => n + 1);
    if (typeof window !== "undefined" && window.innerWidth <= 860 && panneau.current) {
      panneau.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function basculerTexte() {
    const v = !txt; setTxt(v);
    if (v) setTimeout(() => { (zod ? champZod.current : champTexte.current)?.focus(); }, 0);
  }

  function ajouter() {
    if (!ok || !m) return;
    const variantId = cgVariantId(fmt, taille);
    const format = fmt === "h" ? "Horizontal" : "Vertical";
    const genre = m.z ? "Signe du zodiaque" : m.d ? "Dessin" : "Modèle gravé";
    const fields = { modele: `${genre} : ${m.nom}`, format, socle: socle ? "oui" : "" };
    const police = FONTS.find(([k]) => k === font)?.[1] || font;
    const place = PLACES.find(([k]) => k === pos)?.[1] || pos;
    if (avecTxt) {
      if (zod) { if (zp) fields.zPrenom = zp; if (zDate) fields.zDate = zDate; if (zv) fields.zVille = zv; }
      else fields.texte = texte.trim();
      fields.police = font; fields.textePos = pos;
    }
    const resume = [
      `${genre} : ${m.nom}`, format,
      avecTxt && !zod ? `Texte : « ${texte.trim()} » (${police}, ${place.toLowerCase()})` : "",
      avecTxt && zod ? [zp && `Prénom : ${zp}`, zDate && `Né(e) le : ${zDate}`, zv && `Ville : ${zv}`].filter(Boolean).join(" · ") + ` (${police})` : "",
      socle ? "Socle lumineux LED" : "",
    ].filter(Boolean).join(" · ");
    const variantTitle = `${format} · ${t.nom} — ${fmt === "h" ? t.h : t.v}`;
    const poids = ({ petit: 750, moyen: 1100, grand: 1800, xl: 2800 }[taille] || 900) + (socle ? (taille === "petit" ? 300 : 550) : 0);
    addItem({
      productSlug: CG_SLUG,
      variantId,
      name: "Cristal déjà gravé",
      variantTitle,
      price: Math.round(unit * 100) / 100,
      image: m.img,
      personalization: resume,
      fields,
      spec: {
        slug: CG_SLUG, name: "Cristal déjà gravé", variantTitle,
        previewImage: m.img, artworkImage: m.img, photoSrc: null,
        fields, personalization: resume, packaging: null,
      },
      pickup: false,
      weight: poids,
      quantity: q,
    });
    track("add_to_cart", { slug: CG_SLUG, value: Number((unit * q).toFixed(2)) });
    setAjoute(true);
    setTimeout(() => setAjoute(false), 2200);
  }

  return (
    <div className="cgg">
      <section className="cg-intro cg-ecrin">
        <div className="container cg-ecrin-grid">
          <div className="cg-ecrin-txt">
            <h1>Des cristaux déjà gravés, <em>prêts à offrir</em></h1>
            <p className="cg-lede">Choisissez un modèle parmi nos créations : il est gravé en 3D au cœur d&apos;un cristal optique K9,
              dans notre atelier en France. Vous choisissez simplement la taille, et le socle lumineux si vous le souhaitez.</p>
            <ul className="cg-trust">
              <li><IcCg n="gem" /><span><b>Cristal optique K9</b>pureté et éclat</span></li>
              <li><IcCg n="pin" /><span><b>Gravé en France</b>dans notre atelier</span></li>
              <li><IcCg n="truck" /><span><b>Livraison suivie</b>colis &amp; point relais</span></li>
            </ul>
          </div>
          <div className="cg-ecrin-pics" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <figure className="cg-epic"><img src={`${CG_DOSSIER}/hero-gemeaux.webp`} alt="" /><figcaption>Votre signe du zodiaque</figcaption></figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <figure className="cg-epic"><img src={`${CG_DOSSIER}/hero-bouddha.webp`} alt="" /><figcaption>Un modèle déjà gravé</figcaption></figure>
          </div>
        </div>
      </section>

      <section className="cg-shop" id="modeles" aria-labelledby="t-mod">
        <div className="container cg-layout">
          <div className="cg-col">
            <div className="cg-head">
              <h2 id="t-mod">Choisissez votre gravure</h2>
              <p>Un modèle déjà gravé, un dessin, ou votre signe du zodiaque. Touchez-le pour le voir en grand et choisir sa taille.</p>
            </div>
            <div className="cg-grps" role="tablist" aria-label="Type de gravure">
              {GROUPES.map(([g, lab, n]) => (
                <button key={g} type="button" className={`cg-grp${grp === g ? " on" : ""}`} aria-pressed={grp === g}
                  onClick={() => { setGrp(g); setPlus(false); }}>{lab}<span className="cg-n">{n}</span></button>
              ))}
            </div>
            <div className="cg-chips" role="group" aria-label="Filtrer les modèles" hidden={grp !== "modeles"}>
              {CG_FAMILLES.map((f) => (
                <button key={f.k} type="button" className={`cg-chip${fam === f.k ? " on" : ""}`} aria-pressed={fam === f.k}
                  onClick={() => { setFam(f.k); setPlus(false); }}>
                  {f.nom}<span className="cg-n">{f.k === "tous" ? CG_MODELES.length : CG_MODELES.filter((x) => x.fam === f.k).length}</span>
                </button>
              ))}
            </div>
            <p className="cg-gintro" hidden={grp === "modeles"}>{INTRO[grp] || ""}</p>
            <div className="cg-grid">
              {ITEMS.map((it, idx) => {
                const on = idx === i;
                const cls = `cg-tile${it.d ? " cg-dtile" : ""}${it.z ? " cg-ztile" : ""}${on ? " on" : ""}`;
                return (
                  <button key={`${it.grp}-${it.k}`} type="button" className={cls} aria-pressed={on} hidden={!visibles.has(idx)} onClick={() => choisir(idx)}>
                    {it.d ? (
                      <span className="cg-img cg-xtal">
                        <span className={`cg-bloc${it.z ? " cg-zbloc" : ""}`}><BlocContenu it={it} /></span>
                        <span className="cg-ok" aria-hidden="true"><IcCg n="check" /></span>
                      </span>
                    ) : (
                      <span className="cg-img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.img} alt={`Cristal gravé : ${it.nom}`} loading="lazy" />
                        <span className="cg-ok" aria-hidden="true"><IcCg n="check" /></span>
                      </span>
                    )}
                    <span className="cg-meta">
                      <span className="cg-tag">{it.z ? "Signe du zodiaque" : it.d ? "Dessin gravé en 3D" : FAM_LABEL[it.fam] || "Modèle gravé"}</span>
                      <b className="cg-nom">{it.nom}</b>
                      <span className="cg-price">dès 39,90 €</span>
                      {it.z ? <span className="cg-ph">{it.dates}</span> : !it.d ? <span className="cg-ph">{it.phrase}</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <button type="button" className="cg-more" hidden={reste <= 0} onClick={() => setPlus(true)}>
              Afficher les <span>{reste}</span> autres <IcCg n="down" />
            </button>
          </div>

          <aside className="cg-panel" id="panneau" ref={panneau} aria-labelledby="t-pan" aria-live="polite">
            <div className={`cg-stage${m && m.d ? " is-d" : ""}`}>
              {!m ? (
                <div className="cg-empty"><IcCg n="gem" cls="cg-ic cg-ic-xl" /><p><b>Votre cristal apparaîtra ici</b>Choisissez un modèle dans la galerie.</p></div>
              ) : null}
              {m && !m.d ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={`g-${anim}`} src={m.img} alt={`Cristal gravé : ${m.nom}`} />
              ) : null}
              {m && m.d ? (
                <span className={`cg-bloc cg-bloc-xl${m.z ? " cg-zbloc" : ""}${fmt === "h" ? " fmt-h" : ""}`}>
                  <span className="cg-bloc-in"><BlocContenu it={m} exemple={!(zod && txt)} /></span>
                  {zod && txt ? (
                    <span className="cg-zperso"><b className="fnt-great-vibes">{zp}</b><small>{zDate}</small><small>{zv}</small></span>
                  ) : null}
                </span>
              ) : null}
              {avecTxt && m && !zod ? <span className={`cg-txtpv fnt-${font} pos-${pos}`}>{texte.trim()}</span> : null}
            </div>
            <h3 id="t-pan" className="cg-pname">{m ? (m.z ? `Signe du ${m.nom}` : m.nom) : "Votre cristal"}</h3>
            <p className="cg-pdesc">{m ? m.phrase : "Aucun modèle choisi pour l'instant."}</p>

            <div className="field">
              <label>Format du cristal</label>
              <div className="variant-swatches cg-fmts">
                {[["v", "Vertical", "/produits/cristal-bloc-v-creme.jpg"], ["h", "Horizontal", "/produits/cristal-bloc-h-creme.jpg"]].map(([f, lab, src]) => (
                  <button key={f} type="button" className={`variant-swatch has-img${fmt === f ? " active" : ""}`} aria-pressed={fmt === f} onClick={() => setFmt(f)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" /><span className="vs-title">{lab}</span>
                  </button>
                ))}
              </div>
              <p className="cg-hint">Vertical ou horizontal : c&apos;est vous qui choisissez, chaque modèle se grave dans les deux formats.</p>
            </div>

            <div className="field">
              <label>Choisissez la taille</label>
              <div className="variant-swatches crystal-sizes">
                {CG_TAILLES.map((x) => (
                  <button key={x.id} type="button" className={`variant-swatch${taille === x.id ? " active" : ""}`} aria-pressed={taille === x.id} onClick={() => setTaille(x.id)}>
                    <span className="vs-title">{x.nom}</span><span className="vs-sub">{fmt === "h" ? x.h : x.v}</span>
                    <span className="vs-price"><span className="vs-now">{eur(T[x.id].prix)}</span></span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Texte gravé en plus (en option)</label>
              <button type="button" className={`cg-socle${txt ? " on" : ""}`} aria-pressed={txt} aria-controls="txtzone" onClick={basculerTexte}>
                <span className="cg-txt-ic"><IcCg n="pen" /></span>
                <span>
                  <b>{zod ? "Ajouter prénom, date de naissance et ville" : "Ajouter un texte"}</b>
                  <small>{zod ? "Gravés sous la constellation : +2 € par mention (prénom, date, ville)" : "Un prénom, une date, un petit mot, gravé avec le modèle"}</small>
                </span>
                <span className="cg-socle-p">{zod ? (txt && nz > 0 ? "+" + eur(CG_ZOD_PRIX * nz) : "+2 € chacun") : "+" + eur(CG_TEXTE_PRIX)}</span>
                <span className="cg-box" aria-hidden="true"><IcCg n="check" /></span>
              </button>
              <div className="cg-txt" id="txtzone" hidden={!txt}>
                <div hidden={zod}>
                  <label className="cg-sub" htmlFor="cg-txt">Votre texte</label>
                  <div className="cg-inp"><input id="cg-txt" ref={champTexte} type="text" maxLength={40} placeholder="Prénom, date, petit mot…" autoComplete="off" value={texte} onChange={(e) => setTexte(e.target.value)} /><span>{texte.length}/40</span></div>
                </div>
                <div hidden={!zod}>
                  <label className="cg-sub" htmlFor="cg-zp">Prénom ou nom</label>
                  <div className="cg-inp"><input id="cg-zp" ref={champZod} type="text" maxLength={24} placeholder="Luna Vance" autoComplete="off" value={zp} onChange={(e) => setZp(e.target.value.trim() ? e.target.value : "")} /></div>
                  <div className="cg-2col">
                    <div><label className="cg-sub" htmlFor="cg-zd">Date de naissance</label><div className="cg-inp"><input id="cg-zd" type="text" maxLength={16} placeholder="24 nov. 2022" autoComplete="off" value={zd} onChange={(e) => setZd(e.target.value.trim() ? e.target.value : "")} /></div></div>
                    <div><label className="cg-sub" htmlFor="cg-zh">Heure</label><div className="cg-inp"><input id="cg-zh" type="text" maxLength={5} placeholder="19:27" autoComplete="off" value={zh} onChange={(e) => setZh(e.target.value.trim() ? e.target.value : "")} /></div></div>
                  </div>
                  <label className="cg-sub" htmlFor="cg-zv">Ville</label>
                  <div className="cg-inp"><input id="cg-zv" type="text" maxLength={24} placeholder="Paris" autoComplete="off" value={zv} onChange={(e) => setZv(e.target.value.trim() ? e.target.value : "")} /></div>
                </div>
                <span className="cg-sub">Écriture</span>
                <div className="cg-fonts" role="group" aria-label="Écriture du texte">
                  {FONTS.map(([k, lab]) => (
                    <button key={k} type="button" className={`cg-font fnt-${k}${font === k ? " on" : ""}`} aria-pressed={font === k} onClick={() => setFont(k)}>{lab}</button>
                  ))}
                </div>
                <span className="cg-sub">Où placer le texte ?</span>
                <div className="cg-pos" role="group" aria-label="Place du texte">
                  {PLACES.map(([k, lab]) => (
                    <button key={k} type="button" className={`cg-chip${pos === k ? " on" : ""}`} aria-pressed={pos === k} onClick={() => setPos(k)}>{lab}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="field">
              <label>Socle lumineux LED (en option)</label>
              <button type="button" className={`cg-socle${socle ? " on" : ""}`} aria-pressed={socle} onClick={() => setSocle(!socle)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/produits/socle-led-rectangle.jpg" alt="" />
                <span><b>Ajouter le socle lumineux</b><small>LED multicolores, couleurs au toucher, sur prise secteur</small></span>
                <span className="cg-socle-p">+{eur(t.socle)}</span>
                <span className="cg-box" aria-hidden="true"><IcCg n="check" /></span>
              </button>
            </div>

            <div className="pd-totbox"><span className="lab">Total tout compris</span><span className="val">{ok ? eur(unit * q) : "—"}</span></div>
            <div className="qty-row">
              <div className="qty-stepper">
                <button type="button" aria-label="Moins" onClick={() => setQ(Math.max(1, q - 1))}>−</button>
                <span>{q}</span>
                <button type="button" aria-label="Plus" onClick={() => setQ(Math.min(9, q + 1))}>+</button>
              </div>
              <button type="button" className={`btn btn-gold${ok ? "" : " prc-off"}`} style={{ flex: 1 }} disabled={!ok} onClick={ajouter}>
                {ajoute ? "Ajouté au panier ✓" : "Ajouter au panier"}
              </button>
            </div>
            <p className="prc-addhint" hidden={ok}>{manque}</p>
            <div className="pd-perso"><b>✦ Gravé à la commande</b><p>Chaque cristal est gravé pour vous dans notre atelier, puis emballé avec soin.</p></div>
          </aside>
        </div>
      </section>

      <div className={`cg-bar${barOff ? " cg-bar-off" : ""}`} hidden={!m}>
        {m ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.img} alt="" />
        ) : null}
        <span className="cg-bar-t"><b>{m ? m.nom : ""}</b><small>{t.nom} · {eur(unit)}</small></span>
        <a className="btn btn-gold" href="#panneau">Choisir la taille</a>
      </div>
    </div>
  );
}
