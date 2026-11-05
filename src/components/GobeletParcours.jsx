"use client";

// Gobelet isotherme 40 oz — parcours guidé (maquette validée du 03/10/2026, exemples du 05/11/2026), classes .prc-* du site.
//   ① Que voulez-vous graver ? — un dessin (1–74) / mon propre texte / ma photo ou mon logo  (= la gravure principale, comprise)
//   ② Où ? (face, côté gauche, côté droit) puis le détail : chaque dessin en tuile avec son numéro, grande fenêtre pour le voir
//      (Choisir / Fermer / ‹ ›) ; texte + écriture ; photo (+ texte dessous). « + Ajouter un autre dessin (+3 €) ».
//   ③ En plus (facultatif, +3 € par élément) : Quoi → Où → le détail ; cadres et banderoles = planches qu'on agrandit.
//   ④ résumé + total ; « Ajouter au panier » grisé tant que la gravure principale manque (gobeletEtat, vérifié aussi dans handleAdd).
// Retours du gérant du 05/11/2026 : « on voit pas trop les chiffres », « si je veux plus de dessins ? chaque numéro +3 € »,
// « quand j'ouvre cette case je peux plus refermer », « c'est où que je décide où graver, en face, à gauche, à droite ? ».
// Prix = gobeletSupplement (src/lib/gobeletParcours.js), le MÊME calcul qu'au paiement.
import { useEffect, useMemo, useRef, useState } from "react";
import { FONTS, getFontClass, getFontLabel } from "@/lib/fonts";
import { formatEuro } from "@/lib/format";
import {
  gobeletEtat, gobeletSupplement, lignesAutour, dessinValide, cadreValide, coteCentre,
  GOB_DESSINS_MAX, GOB_CADRE_MIN, GOB_CADRE_MAX,
} from "@/lib/gobeletParcours";
import PhotoUpload, { GUIDE_PHOTO_GRAVURE } from "./PhotoUpload";

const LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SIDE_COURT = { face: "Face", gauche: "Côté gauche", droite: "Côté droit", tour: "Tout autour" };
const ZONES = { principal: "Au milieu", haut: "En haut", bas: "En bas", gauche: "À gauche", droite: "À droite" };
const ZONES_MIN = { principal: "au milieu", haut: "en haut", bas: "en bas", gauche: "à gauche", droite: "à droite" };
const zonesDuCote = (s) => (s === "tour" ? ["haut", "bas"] : s === "face" ? ["principal", "haut", "bas", "gauche", "droite"] : ["principal", "haut", "bas"]);
const KINDS = [
  { key: "dessin", label: "Un autre dessin" },
  { key: "cadre", label: "Un cadre ou une banderole + nom" },
  { key: "lettre", label: "Une lettre fleurie + nom" },
  { key: "texte", label: "Un texte (prénom, date…)" },
];
const prix = (n) => String(n).replace(".", ",");

// Familles de dessins lues dans la légende des planches (« 1–10 » → 1 à 10).
function familles(cfg) {
  return (cfg.dessins || []).map((p) => {
    const m = /(\d+)\D+(\d+)/.exec(p.nums || "");
    return m ? { nom: p.legende, de: +m[1], a: +m[2] } : null;
  }).filter(Boolean);
}
const srcDessin = (cfg, n) => `${cfg.dessinUnite}${String(n).padStart(2, "0")}.webp`;

// Petit gobelet dessiné : montre où se trouve la face, le côté gauche, le côté droit, le tour.
function MiniGobelet({ cote }) {
  const c = "var(--gold-dark)";
  return (
    <svg className="gbp-mini" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M18 10h28l-3 46H21z" fill="#fbf7ee" stroke="#8a7a5c" strokeWidth="2" strokeLinejoin="round" />
      <path d="M46 20c9 0 9 18 0 18" fill="none" stroke="#8a7a5c" strokeWidth="3" />
      {cote === "face" && <circle cx="32" cy="32" r="7" fill={c} />}
      {cote === "gauche" && <rect x="19" y="24" width="5" height="16" rx="2" fill={c} />}
      {cote === "droite" && <rect x="40" y="24" width="5" height="16" rx="2" fill={c} />}
      {cote === "tour" && <rect x="19" y="44" width="26" height="5" rx="2" fill={c} />}
    </svg>
  );
}

function ChoixCote({ value, onChange, cotes, pris = () => false }) {
  return (
    <div className="gbp-cotes">
      {cotes.map((c) => (
        <button type="button" key={c} disabled={pris(c)} className={`gbp-cote${value === c ? " on" : ""}`} onClick={() => onChange(c)}>
          <MiniGobelet cote={c} />
          <span>{SIDE_COURT[c]}</span>
        </button>
      ))}
    </div>
  );
}

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

// Les 74 dessins en tuiles, filtrés par famille. Toucher une tuile = la grande fenêtre (on y choisit).
function TuilesDessins({ cfg, choisi, onView }) {
  const fam = useMemo(() => familles(cfg), [cfg]);
  const [f, setF] = useState(-1);
  const nums = [];
  const de = f < 0 ? 1 : fam[f].de, a = f < 0 ? GOB_DESSINS_MAX : fam[f].a;
  for (let n = de; n <= a; n++) nums.push(n);
  return (
    <div className="gbp-tuiles-wrap">
      <div className="gbp-fams">
        <button type="button" className={`prc-chip${f < 0 ? " on" : ""}`} onClick={() => setF(-1)}>Tous ({GOB_DESSINS_MAX})</button>
        {fam.map((x, i) => (
          <button type="button" key={x.nom} className={`prc-chip${f === i ? " on" : ""}`} onClick={() => setF(i)}>{x.nom}</button>
        ))}
      </div>
      <div className="gbp-tuiles">
        {nums.map((n) => (
          <button type="button" key={n} className={`gbp-tuile${choisi === n ? " on" : ""}`} onClick={() => onView(n, nums)} aria-label={`Voir le dessin n° ${n}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={srcDessin(cfg, n)} alt="" loading="lazy" />
            <span className="gbp-tnum">n° {n}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Grande fenêtre : un dessin en grand (Choisir / ‹ ›) ou une planche qu'on agrandit pour lire les numéros.
// Se ferme par « Fermer » (en haut), en touchant le fond, en glissant vers le bas, par Échap ou par le bouton retour du téléphone.
function Fenetre({ v, cfg, onClose, onPick }) {
  const [i, setI] = useState(v.list ? Math.max(0, v.list.indexOf(v.n)) : 0);
  const [gros, setGros] = useState(false);
  const touch = useRef(null);
  const n = v.list ? v.list[i] : null;
  const aller = (d) => { if (v.list) setI((k) => (k + d + v.list.length) % v.list.length); };
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e) => {
      if (e.key === "Escape") closeRef.current();
      else if (e.key === "ArrowLeft") setI((k) => (v.list ? (k - 1 + v.list.length) % v.list.length : k));
      else if (e.key === "ArrowRight") setI((k) => (v.list ? (k + 1) % v.list.length : k));
    };
    window.addEventListener("keydown", esc);
    // Bouton « retour » du téléphone : ferme la fenêtre au lieu de quitter la page.
    let pushed = false;
    try { history.pushState({ ...(history.state || {}), gbpFenetre: 1 }, ""); pushed = true; } catch { /* ignore */ }
    const pop = () => { pushed = false; closeRef.current(); };
    window.addEventListener("popstate", pop);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", esc);
      window.removeEventListener("popstate", pop);
      if (pushed) { try { history.back(); } catch { /* ignore */ } }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function debut(e) { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; }
  function fin(e) {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x, dy = t.clientY - touch.current.y;
    touch.current = null;
    if (gros) return;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) aller(dx < 0 ? 1 : -1);
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) onClose();
  }

  return (
    <div className="gbp-fen" role="dialog" aria-modal="true" aria-label={n ? `Dessin n° ${n}` : v.titre} onClick={() => onClose()}>
      <div className="gbp-fen-in" onClick={(e) => e.stopPropagation()} onTouchStart={debut} onTouchEnd={fin}>
        <div className="gbp-fen-top">
          <b>{n ? `Dessin n° ${n}` : v.titre}</b>
          <button type="button" className="gbp-fen-x" onClick={() => onClose()}>✕ Fermer</button>
        </div>
        {n ? (
          <div className="gbp-fen-img">
            {v.list.length > 1 && <button type="button" className="gbp-fen-fl g" onClick={() => aller(-1)} aria-label="Dessin précédent">‹</button>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={n} src={srcDessin(cfg, n)} alt={`Dessin n° ${n}`}
              onLoad={(e) => { const im = e.currentTarget; im.style.maxWidth = `${im.naturalWidth * 2.4}px`; im.style.maxHeight = `${im.naturalHeight * 2.4}px`; }} />
            {v.list.length > 1 && <button type="button" className="gbp-fen-fl d" onClick={() => aller(1)} aria-label="Dessin suivant">›</button>}
          </div>
        ) : (
          <div className={`gbp-fen-planche${gros ? " gros" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.src} alt={v.titre} onClick={() => setGros((g) => !g)} />
          </div>
        )}
        <div className="gbp-fen-bas">
          {n ? (
            <>
              <button type="button" className="gbp-fen-ok" onClick={() => onPick(n)}>Choisir le dessin n° {n}</button>
              <p className="gbp-fen-aide">Glissez ou touchez ‹ › pour voir les autres dessins.</p>
            </>
          ) : (
            <>
              <button type="button" className="gbp-fen-ok gbp-fen-ok2" onClick={() => setGros((g) => !g)}>{gros ? "Réduire" : "🔍 Agrandir pour lire les numéros"}</button>
              <p className="gbp-fen-aide">Notez le numéro, puis fermez la fenêtre pour l&apos;indiquer.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GobeletParcours({ product, fieldValues, setFieldValues, unitPrice, couleur, onComposition }) {
  const cfg = product.gobeletParcours;
  const mode = fieldValues.mode || "";
  const cote = coteCentre(fieldValues);
  const police = fieldValues.police || "great-vibes";
  const etat = gobeletEtat(fieldValues);
  const sup = gobeletSupplement(fieldValues, cfg);
  const [fen, setFen] = useState(null); // grande fenêtre ouverte
  const [plie, setPlie] = useState(false); // tuiles des dessins repliées une fois le dessin choisi
  const s2Ref = useRef(null);
  const formRef = useRef(null);

  // Éléments en plus : liste détaillée (côté, place) gardée ici, écrite en lignes dans fields.autour.
  const [extras, setExtras] = useState(() => lignesAutour(fieldValues).map((label) => ({ label, side: "", zone: "" })));
  const [xform, setXform] = useState(false);
  const [xs, setXs] = useState({ k: "dessin", s: "face", z: "", l: "", p: "great-vibes", n: "", d: "", nom: "" });
  const [xmsg, setXmsg] = useState("");

  const set = (patch) => setFieldValues((prev) => ({ ...prev, ...patch }));

  // Prix + repères de l'aperçu (photo de la FACE du gobelet) : seuls les éléments posés sur la face y sont montrés.
  useEffect(() => {
    const motifs = [];
    if (etat.ok && cote === "face") {
      if (mode === "dessin") motifs.push({ zone: "principal", num: parseInt(fieldValues.dessin, 10) });
      else if (mode === "texte") motifs.push({ zone: "principal", text: fieldValues.texte.trim() });
      else motifs.push({ zone: "principal", text: "Votre photo" });
    }
    for (const e of extras) if (e.zone && e.side === "face") motifs.push({ zone: e.zone, ...(e.num ? { num: e.num } : { text: e.court || "T" }) });
    onComposition && onComposition({ side: "face", motifs, count: sup.n, extraAmount: sup.montant, summary: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldValues.mode, fieldValues.dessin, fieldValues.texte, fieldValues.photo, fieldValues.texteSousPhoto, fieldValues.autour, fieldValues.cote, etat.ok]);

  function ecrireExtras(liste) {
    setExtras(liste);
    set({ autour: liste.map((e) => e.label).join("\n") });
  }

  function choisirMode(m) {
    if (m === mode) return;
    setPlie(false);
    set({ mode: m, dessin: "", texte: "", photo: "", texteSousPhoto: "", police: m === "texte" ? (fieldValues.police || "great-vibes") : "" });
    setTimeout(() => s2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  // Places déjà prises : la gravure principale (au milieu de son côté) + chaque élément en plus.
  const pris = (s, z) => Boolean((s === cote && z === "principal" && mode) || extras.some((e) => e.side === s && e.zone === z));
  const milieuPrisParExtra = (c) => extras.some((e) => e.side === c && e.zone === "principal");

  const numDessin = parseInt(fieldValues.dessin, 10);
  const dessinOk = dessinValide(numDessin);

  const libres = zonesDuCote(xs.s).filter((z) => !pris(xs.s, z));
  const zoneX = libres.includes(xs.z) ? xs.z : (libres[0] || "");

  function ouvrirAjout(k) {
    setXmsg("");
    setXs((p) => ({ ...p, k: k || p.k, n: "", d: "", nom: "", l: "" }));
    setXform(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function ajouter() {
    setXmsg("");
    const nom = xs.nom.trim();
    if (!zoneX) { setXmsg("Toutes les places de ce côté sont prises : choisissez un autre endroit."); return; }
    const ou = `${SIDE_COURT[xs.s]}, ${ZONES_MIN[zoneX]}`;
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
      if (!dessinValide(d)) { setXmsg("Choisissez un dessin : touchez-le, puis « Choisir »."); return; }
      e = { label: `Dessin n° ${d} — ${ou}`, num: d };
    } else {
      if (!nom) { setXmsg("Écrivez le texte."); return; }
      e = { label: `Texte « ${nom} » — ${ou}, ${ecr}`, court: nom };
    }
    ecrireExtras([...extras, { ...e, side: xs.s, zone: zoneX }]);
    setXs((p) => ({ ...p, n: "", d: "", nom: "", l: "", z: "" }));
    setXform(false);
  }

  const apercuTexte = (mode === "photo" ? fieldValues.texteSousPhoto : fieldValues.texte) || "Léna & Noah";
  const dessinsEnPlus = extras.filter((e) => /^Dessin n°/.test(e.label));
  const xd = parseInt(xs.d, 10);

  return (
    <div className="prc gbp" id="gobelet-parcours">
      <div className="prc-head"><p className="prc-title">Personnalisez votre gobelet</p><p className="prc-sub">D&apos;abord votre gravure principale (comprise dans le prix), puis — si vous voulez — d&apos;autres éléments à +{prix(cfg.extra)} € chacun.</p></div>

      <section className="prc-step">
        <div className="prc-sh"><span className={`prc-num${mode ? " done" : ""}`}>1</span><h3>Que voulez-vous graver ?</h3></div>
        <div className="prc-cards gbp-trois">
          <button type="button" className={`prc-card${mode === "dessin" ? " on" : ""}`} onClick={() => choisirMode("dessin")}>
            <span className="prc-cimg gbp-cimg-planche">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={srcDessin(cfg, 48)} alt="" /></span>
            <span className="prc-ctxt"><b>Un dessin</b><small>Fleurs, papillons, fées, animaux… {GOB_DESSINS_MAX} dessins numérotés.</small></span>
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
      </section>

      {mode && (
        <section className="prc-step" ref={s2Ref}>
          <div className="prc-sh"><span className={`prc-num${etat.ok ? " done" : ""}`}>2</span>
            <h3>{mode === "dessin" ? "Où et quel dessin ?" : mode === "texte" ? "Où et quel texte ?" : "Où et quelle photo ?"}</h3></div>

          <div className="field"><label>Où graver votre gravure principale ?</label>
            <ChoixCote value={cote} onChange={(c) => set({ cote: c })} cotes={["face", "gauche", "droite"]} pris={milieuPrisParExtra} />
            <p className="prc-opt">La face est le côté opposé à l&apos;anse : celui qu&apos;on voit quand on tient le gobelet de la main droite.</p>
          </div>

          {mode === "dessin" && (
            <div>
              {(!plie || !dessinOk) && (
                <>
                  <p className="prc-legend">Touchez un dessin pour le voir en grand, puis « Choisir ».</p>
                  <TuilesDessins cfg={cfg} choisi={dessinOk ? numDessin : null} onView={(n, list) => setFen({ n, list, but: "centre" })} />
                  <div className="prc-fields gbp-numdirect">
                    <div className="field"><label htmlFor="gbp-num">Vous connaissez déjà le numéro ?</label>
                      <input id="gbp-num" type="number" min="1" max={GOB_DESSINS_MAX} inputMode="numeric" placeholder={`1 à ${GOB_DESSINS_MAX}`} value={fieldValues.dessin || ""}
                        onChange={(e) => set({ dessin: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter" && dessinOk) { e.preventDefault(); setPlie(true); } }} />
                    </div>
                  </div>
                </>
              )}
              {dessinOk && (
                <div className="gbp-choisi">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={srcDessin(cfg, numDessin)} alt="" />
                  <div>
                    <p>Dessin n° {numDessin} choisi ✓ <span>— {cote === "face" ? "au milieu de la face" : `au milieu du ${SIDE_COURT[cote].toLowerCase()}`}, compris dans le prix.</span></p>
                    <div className="gbp-choisi-btns">
                      <button type="button" className="prc-change" onClick={() => setPlie((p) => !p)}>{plie ? "Changer de dessin" : "Masquer les dessins"}</button>
                      <button type="button" className="gbp-xadd" onClick={() => { setPlie(true); ouvrirAjout("dessin"); }}>＋ Ajouter un autre dessin (+{prix(cfg.extra)} €)</button>
                    </div>
                  </div>
                </div>
              )}
              {fieldValues.dessin && !dessinOk && <p className="prc-choisi prc-miss">Numéro de dessin : de 1 à {GOB_DESSINS_MAX}.</p>}
              {dessinsEnPlus.length > 0 && (
                <p className="prc-opt">En plus : {dessinsEnPlus.map((e) => e.label).join(" · ")} (voir l&apos;étape 3).</p>
              )}
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
                <div className="field"><label htmlFor="gbp-ptxt">Texte sous la photo <span className="prc-opt">(facultatif, +{prix(cfg.extra)} €)</span></label>
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

      <section className="prc-step" ref={formRef}>
        <div className="prc-sh"><span className={`prc-num${extras.length ? " done" : ""}`}>{mode ? 3 : 2}</span><h3>En plus <span className="prc-opt">— facultatif, +{prix(cfg.extra)} € par élément</span></h3></div>
        <p className="prc-legend">Un 2ᵉ dessin, un cadre avec un prénom, une lettre fleurie, une date… sur la face, un côté ou tout autour du gobelet.</p>
        <p className="prc-hint gbp-miseenpage">✦ Plusieurs images, photos ou logos ? Nous préparons la mise en page et vous envoyons un aperçu à valider avant la gravure.</p>

        {extras.length > 0 && (
          <ul className="gbp-xlist">
            {extras.map((e, i) => (
              <li key={i}><span>{e.label}</span><b className="p">+{prix(cfg.extra)} €</b>
                <button type="button" aria-label="Retirer" onClick={() => ecrireExtras(extras.filter((_, k) => k !== i))}>×</button></li>
            ))}
          </ul>
        )}

        {!xform ? (
          <button type="button" className="gbp-xadd" onClick={() => ouvrirAjout()}>{extras.length ? "＋ Ajouter un autre élément" : "＋ Ajouter un élément"} (+{prix(cfg.extra)} €)</button>
        ) : (
          <div className="gbp-extra">
            <div className="gbp-extra-top">
              <b>Ajouter un élément (+{prix(cfg.extra)} €)</b>
              <button type="button" className="gbp-fermer" onClick={() => setXform(false)}>✕ Fermer</button>
            </div>

            <div className="field"><label>1. Quoi ?</label>
              <div className="prc-chips">{KINDS.map((k) => (
                <button type="button" key={k.key} className={`prc-chip${xs.k === k.key ? " on" : ""}`} onClick={() => { setXs((p) => ({ ...p, k: k.key })); setXmsg(""); }}>{k.label}</button>
              ))}</div></div>

            <div className="field"><label>2. Où sur le gobelet ?</label>
              <ChoixCote value={xs.s} onChange={(s) => setXs((p) => ({ ...p, s, z: "" }))} cotes={["face", "gauche", "droite", "tour"]} />
              <div className="prc-chips gbp-zones">{libres.length ? libres.map((z) => (
                <button type="button" key={z} className={`prc-chip${zoneX === z ? " on" : ""}`} onClick={() => setXs((p) => ({ ...p, z }))}>{ZONES[z]}</button>
              )) : <span className="prc-opt">Toutes les places de ce côté sont prises.</span>}</div>
            </div>

            <div className="field"><label>3. {xs.k === "dessin" ? "Quel dessin ?" : xs.k === "cadre" ? "Quel cadre ?" : xs.k === "lettre" ? "Quelle lettre ?" : "Quel texte ?"}</label>
              {xs.k === "dessin" && (
                dessinValide(xd) ? (
                  <div className="gbp-choisi">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={srcDessin(cfg, xd)} alt="" />
                    <div><p>Dessin n° {xd} ✓</p><button type="button" className="prc-change" onClick={() => setXs((p) => ({ ...p, d: "" }))}>Changer de dessin</button></div>
                  </div>
                ) : (
                  <>
                    <p className="prc-opt">Touchez un dessin pour le voir en grand, puis « Choisir ».</p>
                    <TuilesDessins cfg={cfg} choisi={null} onView={(n, list) => setFen({ n, list, but: "extra" })} />
                  </>
                )
              )}
              {xs.k === "cadre" && (
                <>
                  <p className="prc-opt">Touchez une planche pour l&apos;ouvrir en grand et lire les numéros.</p>
                  <div className="gbp-planches">{cfg.cadres.map((p) => (
                    <button type="button" key={p.src} className="gbp-planche" onClick={() => setFen({ src: p.src, titre: `${p.legende} — n° ${p.nums}` })}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.src} alt="" loading="lazy" />
                      <span><b>{p.legende}</b> n° {p.nums} · 🔍</span>
                    </button>
                  ))}</div>
                  <div className="prc-fields"><div className="field"><label htmlFor="gbp-xcn">Numéro du cadre ({GOB_CADRE_MIN} à {GOB_CADRE_MAX})</label>
                    <input id="gbp-xcn" type="number" min={GOB_CADRE_MIN} max={GOB_CADRE_MAX} inputMode="numeric" placeholder="Ex : 82" value={xs.n} onChange={(e) => setXs((p) => ({ ...p, n: e.target.value }))} /></div></div>
                </>
              )}
              {xs.k === "lettre" && (
                <div>
                  <button type="button" className="gbp-planche gbp-alpha" onClick={() => setFen({ src: cfg.alphabet, titre: "Lettres fleuries A à Z" })}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cfg.alphabet} alt="Alphabet fleuri A à Z" />
                    <span>🔍 Voir les lettres en grand</span>
                  </button>
                  <div className="prc-letters">{LETTRES.map((L) => (
                    <button type="button" key={L} className={`prc-let${xs.l === L ? " on" : ""}`} onClick={() => setXs((p) => ({ ...p, l: L }))}>{L}</button>
                  ))}</div>
                </div>
              )}
              {xs.k !== "dessin" && (
                <div className="prc-fields">
                  <div className="field"><label htmlFor="gbp-xnom">{xs.k === "cadre" ? "Nom / texte au milieu du cadre" : xs.k === "lettre" ? "Nom gravé dans la lettre" : "Votre texte"}</label>
                    <input id="gbp-xnom" type="text" maxLength={30} placeholder="Ex : Léna" value={xs.nom} onChange={(e) => setXs((p) => ({ ...p, nom: e.target.value }))} /></div>
                  <div className="field"><label>Écriture</label><Polices value={xs.p} onChange={(p) => setXs((s) => ({ ...s, p }))} /></div>
                </div>
              )}
            </div>

            {xmsg && <p className="gbp-xmsg">{xmsg}</p>}
            <div className="gbp-xbtns">
              <button type="button" className="gbp-xadd" onClick={ajouter}>Ajouter cet élément (+{prix(cfg.extra)} €)</button>
              <button type="button" className="gbp-fermer" onClick={() => setXform(false)}>Fermer</button>
            </div>
          </div>
        )}
      </section>

      <section className="prc-step">
        <div className="prc-sh"><span className={`prc-num${etat.ok ? " done" : ""}`}>{mode ? 4 : 3}</span><h3>Résumé de votre gravure</h3></div>
        <div className="prc-sum">
          <div className="prc-sumrow"><span>Couleur</span><b>{couleur}</b></div>
          <div className="prc-sumrow"><span>Gravure principale</span><b className={etat.ok ? "" : "prc-miss"}>{etat.centre || "à choisir (étape 1)"}</b></div>
          {extras.map((e, i) => <div className="prc-sumrow" key={i}><span>En plus</span><b>{e.label}</b></div>)}
          {sup.enPlus > 0 && <div className="prc-sumrow"><span>Éléments en plus</span><b>{sup.enPlus} × {prix(cfg.extra)} € = {formatEuro(sup.montant)}</b></div>}
          <div className="prc-sumrow prc-sumtot"><span>Total (hors livraison)</span><b>{formatEuro(unitPrice)}</b></div>
        </div>
      </section>

      {fen && (
        <Fenetre
          v={fen}
          cfg={cfg}
          onClose={() => setFen(null)}
          onPick={(n) => {
            if (fen.but === "extra") setXs((p) => ({ ...p, d: String(n) }));
            else { set({ dessin: String(n) }); setPlie(true); }
            setFen(null);
          }}
        />
      )}
    </div>
  );
}
