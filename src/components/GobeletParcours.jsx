"use client";

// Gobelet isotherme 40 oz — parcours guidé en 4 étapes. Reproduit la maquette validée
// `docs/maquettes/gobelet-parcours-guide.html` (03/10/2026, exemples du 05/11/2026) avec les classes
// .prc-* du site (les mêmes que la carafe, le vin, la flûte) :
//   ① Que voulez-vous graver au centre ? — un dessin (1–74) / mon propre texte / ma photo ou mon logo
//   ② le détail : planches + n° du dessin, ou le texte + l'écriture, ou la photo (+ texte dessous)
//   ③ Autour de votre gravure (facultatif, +3 € par élément) : cadre ou banderole + nom (75–102),
//      lettre fleurie + nom, autre dessin, texte — sur la face, un côté ou tout autour
//   ④ résumé + total ; « Ajouter au panier » reste grisé tant que le centre n'est pas choisi
//      (gobeletEtat, vérifié aussi dans handleAdd).
// Le prix vient de gobeletSupplement (src/lib/gobeletParcours.js), le MÊME calcul qu'au paiement.
import { useEffect, useMemo, useRef, useState } from "react";
import { FONTS, getFontClass, getFontLabel } from "@/lib/fonts";
import { formatEuro } from "@/lib/format";
import {
  gobeletEtat, gobeletSupplement, lignesAutour, dessinValide, cadreValide,
  GOB_DESSINS_MAX, GOB_CADRE_MIN, GOB_CADRE_MAX,
} from "@/lib/gobeletParcours";
import PhotoUpload, { GUIDE_PHOTO_GRAVURE } from "./PhotoUpload";

const LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SIDES = [
  { key: "face", label: "Face" },
  { key: "gauche", label: "Côté gauche" },
  { key: "droite", label: "Côté droit" },
  { key: "tour", label: "Tout autour" },
];
const ZONES = { principal: "Au centre du côté", haut: "En haut", bas: "En bas", gauche: "À gauche", droite: "À droite" };
const ZONES_MIN = { principal: "au centre", haut: "en haut", bas: "en bas", gauche: "à gauche", droite: "à droite" };
const zonesDuCote = (s) => (s === "face" ? ["haut", "bas", "gauche", "droite"] : s === "tour" ? ["haut", "bas"] : ["principal", "haut", "bas"]);
const KINDS = [
  { key: "cadre", label: "Un cadre ou une banderole + nom" },
  { key: "lettre", label: "Une lettre fleurie + nom" },
  { key: "dessin", label: "Un autre dessin" },
  { key: "texte", label: "Un texte" },
];

function Polices({ value, onChange }) {
  return (
    <div className="prc-pols">
      {FONTS.map((f) => (
        <button type="button" key={f.key} className={`prc-pol ${f.cls}${value === f.key ? " on" : ""}`} onClick={() => onChange(f.key)} title={getFontLabel(f.key)}>
          {getFontLabel(f.key).split(" — ")[0]}
        </button>
      ))}
    </div>
  );
}

function Grille({ items, choisi, onPick }) {
  return (
    <div className="prc-grid gbp-grid">
      {items.map((p, i) => (
        <button type="button" key={p.src} className={`prc-model${choisi === i ? " on" : ""}`} onClick={() => onPick(i, p.src)} aria-label={`Planche ${p.nums} — ${p.legende}`}>
          <span className="prc-mn">{p.nums}</span>
          <span className="prc-mimg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt="" loading="lazy" />
          </span>
          <span className="prc-ml">{p.legende}<br /><em>n° {p.nums}</em></span>
        </button>
      ))}
    </div>
  );
}

export default function GobeletParcours({ product, fieldValues, setFieldValues, unitPrice, couleur, onComposition }) {
  const cfg = product.gobeletParcours;
  const mode = fieldValues.mode || "";
  const police = fieldValues.police || "great-vibes";
  const etat = gobeletEtat(fieldValues);
  const sup = gobeletSupplement(fieldValues, cfg);
  const [zoom, setZoom] = useState(null);
  const [planche, setPlanche] = useState(-1);
  const [plie, setPlie] = useState(false);
  const s2Ref = useRef(null);

  // ③ éléments autour : liste détaillée (côté, zone) gardée ici, écrite en lignes dans fields.autour.
  const [extras, setExtras] = useState(() => lignesAutour(fieldValues).map((label) => ({ label, side: "", zone: "" })));
  const [xform, setXform] = useState(false);
  const [xs, setXs] = useState({ k: "cadre", s: "face", z: "", l: "", p: "great-vibes", n: "", d: "", nom: "" });
  const [xmsg, setXmsg] = useState("");

  const set = (patch) => setFieldValues((prev) => ({ ...prev, ...patch }));

  // Prix + repères de l'aperçu du gobelet (numéros / textes posés sur la photo de la couleur).
  useEffect(() => {
    const motifs = [];
    if (etat.ok) {
      if (mode === "dessin") motifs.push({ zone: "principal", num: parseInt(fieldValues.dessin, 10) });
      else if (mode === "texte") motifs.push({ zone: "principal", text: fieldValues.texte.trim() });
      else motifs.push({ zone: "principal", text: "Votre photo" });
    }
    for (const e of extras) if (e.zone && e.side === "face") motifs.push({ zone: e.zone, ...(e.num ? { num: e.num } : { text: e.court || "T" }) });
    onComposition && onComposition({ side: "face", motifs, count: sup.n, extraAmount: sup.montant, summary: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldValues.mode, fieldValues.dessin, fieldValues.texte, fieldValues.photo, fieldValues.texteSousPhoto, fieldValues.autour, etat.ok]);

  function ecrireExtras(liste) {
    setExtras(liste);
    set({ autour: liste.map((e) => e.label).join("\n") });
  }

  function choisirMode(m) {
    if (m === mode) return;
    setPlanche(-1); setPlie(false);
    set({ mode: m, dessin: "", texte: "", photo: "", texteSousPhoto: "", police: m === "texte" ? (fieldValues.police || "great-vibes") : "" });
    setTimeout(() => s2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  const numDessin = parseInt(fieldValues.dessin, 10);
  const dessinOk = dessinValide(numDessin);

  const libres = useMemo(() => zonesDuCote(xs.s).filter((z) => !extras.some((e) => e.side === xs.s && e.zone === z)), [xs.s, extras]);
  const zoneX = libres.includes(xs.z) ? xs.z : (libres[0] || "");

  function ajouter() {
    setXmsg("");
    const nom = xs.nom.trim();
    if (!zoneX) { setXmsg("Toutes les places de ce côté sont prises : choisissez un autre côté."); return; }
    const ou = `${SIDES.find((s) => s.key === xs.s).label}, ${ZONES_MIN[zoneX]}`;
    const ecr = `écriture ${getFontLabel(xs.p).split(" — ")[0]}`;
    let e;
    if (xs.k === "cadre") {
      const n = parseInt(xs.n, 10);
      if (!cadreValide(n)) { setXmsg(`Numéro du cadre : de ${GOB_CADRE_MIN} à ${GOB_CADRE_MAX} (les n° 97 et 99 n'existent pas : 96, 98 et 102 sont des cadres complets).`); return; }
      if (!nom) { setXmsg("Écrivez le nom à graver au milieu du cadre."); return; }
      e = { label: `Cadre n° ${n} avec « ${nom} » — ${ou}, ${ecr}`, num: n, court: nom };
    } else if (xs.k === "lettre") {
      if (!xs.l) { setXmsg("Choisissez la lettre."); return; }
      if (!nom) { setXmsg("Écrivez le nom à graver dans la lettre."); return; }
      e = { label: `Lettre fleurie ${xs.l} avec « ${nom} » — ${ou}, ${ecr}`, court: xs.l };
    } else if (xs.k === "dessin") {
      const d = parseInt(xs.d, 10);
      if (!dessinValide(d)) { setXmsg(`Numéro du dessin : de 1 à ${GOB_DESSINS_MAX}.`); return; }
      e = { label: `Dessin n° ${d} — ${ou}`, num: d };
    } else {
      if (!nom) { setXmsg("Écrivez le texte."); return; }
      e = { label: `Texte « ${nom} » — ${ou}, ${ecr}`, court: nom };
    }
    ecrireExtras([...extras, { ...e, side: xs.s, zone: zoneX }]);
    setXs((p) => ({ ...p, n: "", d: "", nom: "", l: "" }));
    setXform(false);
  }

  const apercuTexte = (mode === "photo" ? fieldValues.texteSousPhoto : fieldValues.texte) || "Léna & Noah";

  return (
    <div className="prc gbp" id="gobelet-parcours">
      <div className="prc-head"><p className="prc-title">Personnalisez votre gobelet</p><p className="prc-sub">D&apos;abord ce qui sera gravé au centre, puis — si vous voulez — des éléments autour.</p></div>

      <section className="prc-step">
        <div className="prc-sh"><span className={`prc-num${mode ? " done" : ""}`}>1</span><h3>Que voulez-vous graver au centre ?</h3></div>
        <div className="prc-cards gbp-trois">
          <button type="button" className={`prc-card${mode === "dessin" ? " on" : ""}`} onClick={() => choisirMode("dessin")}>
            <span className="prc-cimg gbp-cimg-planche">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={cfg.dessins[0].src} alt="" /></span>
            <span className="prc-ctxt"><b>Un dessin</b><small>Fleurs, papillons, fées, animaux… {GOB_DESSINS_MAX} dessins numérotés, au choix sur les planches.</small></span>
          </button>
          <button type="button" className={`prc-card${mode === "texte" ? " on" : ""}`} onClick={() => choisirMode("texte")}>
            <span className="prc-cimg prc-cimg-aa"><span className={getFontClass("great-vibes")}>Aa</span></span>
            <span className="prc-ctxt"><b>Mon propre texte</b><small>Un prénom, une date, un mot — dans l&apos;écriture de votre choix.</small></span>
          </button>
          <button type="button" className={`prc-card${mode === "photo" ? " on" : ""}`} onClick={() => choisirMode("photo")}>
            <span className="prc-cimg prc-cimg-photo">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={cfg.imagePhoto} alt="" /></span>
            <span className="prc-ctxt"><b>Ma photo ou mon logo</b><small>Un portrait, un dessin d&apos;enfant, un logo : transformé en gravure.</small></span>
          </button>
        </div>
        <p className="prc-hint">C&apos;est votre gravure principale, au centre de la face — comprise dans le prix. Vous pouvez changer d&apos;avis à tout moment.</p>
      </section>

      {mode && (
        <section className="prc-step" ref={s2Ref}>
          <div className="prc-sh"><span className={`prc-num${etat.ok ? " done" : ""}`}>2</span>
            <h3>{mode === "dessin" ? "Choisissez votre dessin" : mode === "texte" ? "Écrivez votre texte" : "Ajoutez votre photo ou votre logo"}</h3></div>

          {mode === "dessin" && (
            <div>
              {!plie && (
                <>
                  <p className="prc-legend">Touchez une planche pour l&apos;agrandir et lire les numéros, puis indiquez le numéro du dessin.</p>
                  <Grille items={cfg.dessins} choisi={planche} onPick={(i, src) => { setPlanche(i); setZoom(src); }} />
                </>
              )}
              <div className="prc-fields">
                <div className="field"><label htmlFor="gbp-num">Numéro du dessin (1 à {GOB_DESSINS_MAX})</label>
                  <input id="gbp-num" type="number" min="1" max={GOB_DESSINS_MAX} inputMode="numeric" placeholder="Ex : 12" value={fieldValues.dessin || ""}
                    onChange={(e) => set({ dessin: e.target.value })}
                    onBlur={() => { if (dessinOk) setPlie(true); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && dessinOk) { e.preventDefault(); setPlie(true); } }} />
                </div>
              </div>
              {fieldValues.dessin && (
                <p className={`prc-choisi${dessinOk ? "" : " prc-miss"}`}>{dessinOk ? `Dessin n° ${numDessin} choisi ✓ — gravé au centre de la face.` : `Numéro de dessin : de 1 à ${GOB_DESSINS_MAX}.`}</p>
              )}
              {plie && <button type="button" className="prc-change" onClick={() => setPlie(false)}>Changer de dessin</button>}
            </div>
          )}

          {mode === "texte" && (
            <div className="prc-fields">
              <div className="field"><label htmlFor="gbp-txt">Votre texte à graver</label>
                <input id="gbp-txt" type="text" maxLength={30} placeholder="Prénom, date, message…" value={fieldValues.texte || ""} onChange={(e) => set({ texte: e.target.value })} />
                <span className="prc-count">{(fieldValues.texte || "").length}/30</span></div>
            </div>
          )}

          {mode === "photo" && (
            <div>
              <p className="prc-legend">Téléversez le fichier (JPG, PNG). L&apos;atelier vérifie la qualité avant de graver. <span className="gbp-rouge">Vous avez plusieurs photos ou logos ? Nous préparons la mise en page et vous envoyons un aperçu à valider.</span></p>
              <div className="prc-fields">
                <div className="field"><label>Votre photo ou logo</label>
                  <PhotoUpload value={fieldValues.photo || ""} onChange={(url) => set({ photo: url })} productSlug={product.slug} guide={GUIDE_PHOTO_GRAVURE} /></div>
                <div className="field"><label htmlFor="gbp-ptxt">Texte sous la photo <span className="prc-opt">(facultatif, +{String(cfg.extra).replace(".", ",")} €)</span></label>
                  <input id="gbp-ptxt" type="text" maxLength={30} placeholder="Prénom, message…" value={fieldValues.texteSousPhoto || ""} onChange={(e) => set({ texteSousPhoto: e.target.value, police: e.target.value ? (fieldValues.police || "great-vibes") : "" })} /></div>
              </div>
            </div>
          )}

          {(mode === "texte" || (mode === "photo" && fieldValues.texteSousPhoto)) && (
            <div className="prc-fields">
              <div className="field"><label>Écriture</label>
                <Polices value={police} onChange={(p) => set({ police: p })} />
                <p className={`gbp-apercu ${getFontClass(police)}`}>{apercuTexte}</p></div>
            </div>
          )}
        </section>
      )}

      <section className="prc-step">
        <div className="prc-sh"><span className={`prc-num${extras.length ? " done" : ""}`}>{mode ? 3 : 2}</span><h3>Autour de votre gravure <span className="prc-opt">— facultatif, +{String(cfg.extra).replace(".", ",")} € par élément</span></h3></div>
        <p className="prc-legend">Un cadre avec un prénom, une lettre fleurie, un 2ᵉ dessin, une date… sur la face, les côtés ou tout autour du gobelet.</p>
        <p className="prc-hint gbp-miseenpage">✦ Plusieurs images, photos ou logos ? Nous préparons la mise en page et vous envoyons un aperçu à valider avant la gravure.</p>

        {extras.length > 0 && (
          <ul className="gbp-xlist">
            {extras.map((e, i) => (
              <li key={i}><span>{e.label}</span><b className="p">+{String(cfg.extra).replace(".", ",")} €</b>
                <button type="button" aria-label="Retirer" onClick={() => ecrireExtras(extras.filter((_, k) => k !== i))}>×</button></li>
            ))}
          </ul>
        )}

        {!xform ? (
          <button type="button" className="prc-change" onClick={() => { setXform(true); setXmsg(""); }}>{extras.length ? "＋ Ajouter un autre élément" : "＋ Ajouter un élément autour"}</button>
        ) : (
          <div className="prc-fields gbp-extra">
            <div className="field"><label>Quoi ?</label>
              <div className="prc-chips">{KINDS.map((k) => (
                <button type="button" key={k.key} className={`prc-chip${xs.k === k.key ? " on" : ""}`} onClick={() => { setXs((p) => ({ ...p, k: k.key })); setXmsg(""); }}>{k.label}</button>
              ))}</div></div>

            {xs.k === "cadre" && (
              <>
                <Grille items={cfg.cadres} choisi={-1} onPick={(i, src) => setZoom(src)} />
                <div className="field"><label htmlFor="gbp-xcn">Numéro du cadre ({GOB_CADRE_MIN} à {GOB_CADRE_MAX})</label>
                  <input id="gbp-xcn" type="number" min={GOB_CADRE_MIN} max={GOB_CADRE_MAX} inputMode="numeric" placeholder="Ex : 82" value={xs.n} onChange={(e) => setXs((p) => ({ ...p, n: e.target.value }))} /></div>
              </>
            )}
            {xs.k === "lettre" && (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="prc-alpha" src={cfg.alphabet} alt="Alphabet fleuri A à Z" />
                <div className="prc-letters">{LETTRES.map((L) => (
                  <button type="button" key={L} className={`prc-let${xs.l === L ? " on" : ""}`} onClick={() => setXs((p) => ({ ...p, l: L }))}>{L}</button>
                ))}</div>
              </div>
            )}
            {xs.k === "dessin" && (
              <div className="field"><label htmlFor="gbp-xdn">Numéro du dessin (1 à {GOB_DESSINS_MAX}, sur les planches de l&apos;étape 2)</label>
                <input id="gbp-xdn" type="number" min="1" max={GOB_DESSINS_MAX} inputMode="numeric" placeholder="Ex : 7" value={xs.d} onChange={(e) => setXs((p) => ({ ...p, d: e.target.value }))} /></div>
            )}
            {xs.k !== "dessin" && (
              <>
                <div className="field"><label htmlFor="gbp-xnom">{xs.k === "cadre" ? "Nom / texte au milieu du cadre" : xs.k === "lettre" ? "Nom gravé dans la lettre" : "Votre texte"}</label>
                  <input id="gbp-xnom" type="text" maxLength={30} placeholder="Ex : Léna" value={xs.nom} onChange={(e) => setXs((p) => ({ ...p, nom: e.target.value }))} /></div>
                <div className="field"><label>Écriture</label><Polices value={xs.p} onChange={(p) => setXs((s) => ({ ...s, p }))} /></div>
              </>
            )}
            <div className="field"><label>Où ?</label>
              <div className="prc-chips">{SIDES.map((s) => (
                <button type="button" key={s.key} className={`prc-chip${xs.s === s.key ? " on" : ""}`} onClick={() => setXs((p) => ({ ...p, s: s.key, z: "" }))}>{s.label}</button>
              ))}</div>
              <div className="prc-chips gbp-zones">{libres.length ? libres.map((z) => (
                <button type="button" key={z} className={`prc-chip${zoneX === z ? " on" : ""}`} onClick={() => setXs((p) => ({ ...p, z }))}>{ZONES[z]}</button>
              )) : <span className="prc-opt">Toutes les places de ce côté sont prises.</span>}</div>
            </div>
            {xmsg && <p className="gbp-xmsg">{xmsg}</p>}
            <div className="gbp-xbtns">
              <button type="button" className="gbp-xadd" onClick={ajouter}>Ajouter cet élément (+{String(cfg.extra).replace(".", ",")} €)</button>
              <button type="button" className="prc-change" onClick={() => setXform(false)}>Annuler</button>
            </div>
          </div>
        )}
      </section>

      <section className="prc-step">
        <div className="prc-sh"><span className={`prc-num${etat.ok ? " done" : ""}`}>{mode ? 4 : 3}</span><h3>Résumé de votre gravure</h3></div>
        <div className="prc-sum">
          <div className="prc-sumrow"><span>Couleur</span><b>{couleur}</b></div>
          <div className="prc-sumrow"><span>Au centre</span><b className={etat.ok ? "" : "prc-miss"}>{etat.centre || "à choisir (étape 1)"}</b></div>
          {sup.enPlus > 0 && <div className="prc-sumrow"><span>En plus</span><b>{sup.enPlus} élément{sup.enPlus > 1 ? "s" : ""} (+{formatEuro(sup.montant)})</b></div>}
          <div className="prc-sumrow prc-sumtot"><span>Total (hors livraison)</span><b>{formatEuro(unitPrice)}</b></div>
        </div>
      </section>

      {zoom && (
        <div className="gc-zoom" onClick={() => setZoom(null)} role="dialog" aria-modal="true">
          <div className="gc-zoom-in" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="gc-zoom-x" onClick={() => setZoom(null)} aria-label="Fermer">×</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoom} alt="Planche agrandie" />
          </div>
        </div>
      )}
    </div>
  );
}
