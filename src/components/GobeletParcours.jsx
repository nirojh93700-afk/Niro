"use client";

// Gobelet isotherme 40 oz — parcours guidé (maquette validée du 03/10/2026, retours du gérant du 05/11/2026), classes .prc-*.
//   ① « Que voulez-vous graver ? » — UNE seule étape : la cliente compose « Votre gravure », élément par élément.
//      Choix : un dessin (1–74) · un cadre ou une banderole + nom (75–102) · une lettre fleurie + nom · mon texte ·
//      ma photo ou mon logo (1er élément seulement). Pour chacun : le détail, l'écriture si texte, et OÙ (face / côté
//      gauche / côté droit / tout autour, puis au milieu / en haut / en bas…). Le 1er élément est compris, chaque élément
//      en plus +3 €. Les planches numérotées s'ouvrent en GRAND (Fermer en haut, fond, glisser, bouton retour).
//      Si `cfg.dessinUnite` existe (un fichier par dessin, propre), les dessins s'affichent en tuiles au lieu des planches.
//   ② résumé + total ; « Ajouter au panier » grisé tant que le 1er élément manque (gobeletEtat, vérifié aussi dans handleAdd).
// Données et prix : src/lib/gobeletParcours.js (même calcul au paiement, même lecture à l'atelier).
import { useEffect, useMemo, useRef, useState } from "react";
import { FONTS, getFontClass, getFontLabel } from "@/lib/fonts";
import { formatEuro } from "@/lib/format";
import {
  gobeletEtat, gobeletSupplement, gobeletElements, lignesAutour, lireLigne, ligneElement, champsPremier,
  premierElement, manqueElement, quoiElement, ouElement, placesDuCote, GOB_COTES, GOB_PLACES,
  GOB_DESSINS_MAX, GOB_CADRE_MIN, GOB_CADRE_MAX,
} from "@/lib/gobeletParcours";
import PhotoUpload, { GUIDE_PHOTO_GRAVURE } from "./PhotoUpload";

const LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const prix = (n) => String(n).replace(".", ",");
const CHOIX = [
  { k: "dessin", titre: "Un dessin", sous: `Fleurs, papillons, fées, animaux… ${GOB_DESSINS_MAX} dessins numérotés.` },
  { k: "cadre", titre: "Un cadre ou une banderole + nom", sous: "Le nom est gravé au milieu du cadre." },
  { k: "lettre", titre: "Une lettre fleurie + nom", sous: "Une initiale décorée, le nom dedans." },
  { k: "texte", titre: "Mon texte", sous: "Un prénom, une date, un mot — dans l'écriture de votre choix." },
  { k: "photo", titre: "Ma photo ou mon logo", sous: "Un portrait, un dessin d'enfant, un logo : transformé en gravure." },
];
const AVEC_ECRITURE = ["cadre", "lettre", "texte"];

function familles(cfg) {
  return (cfg.dessins || []).map((p) => {
    const m = /(\d+)\D+(\d+)/.exec(p.nums || "");
    return m ? { nom: p.legende, de: +m[1], a: +m[2] } : null;
  }).filter(Boolean);
}
const srcDessin = (cfg, n) => `${cfg.dessinUnite}${String(n).padStart(2, "0")}.webp`;

// Petit gobelet dessiné : montre la face, le côté gauche, le côté droit, le tour.
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

// Planches numérotées : touchées = grande fenêtre pour lire les numéros.
function Planches({ items, onOpen }) {
  return (
    <div className="gbp-planches">
      {items.map((p) => (
        <button type="button" key={p.src} className="gbp-planche" onClick={() => onOpen(p)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.src} alt="" loading="lazy" />
          <span><b>{p.legende}</b> · n° {p.nums} <em>🔍 agrandir</em></span>
        </button>
      ))}
    </div>
  );
}

// Tuiles (un fichier par dessin), utilisées seulement si cfg.dessinUnite existe.
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
        {fam.map((x, i) => <button type="button" key={x.nom} className={`prc-chip${f === i ? " on" : ""}`} onClick={() => setF(i)}>{x.nom}</button>)}
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

// Grande fenêtre (planche à agrandir, ou dessin seul à choisir). Fermer : bouton en haut, fond, glisser vers le bas,
// Échap, bouton retour du téléphone.
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
    if (n && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) aller(dx < 0 ? 1 : -1);
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
              <button type="button" className="gbp-fen-ok gbp-fen-ok2" onClick={() => setGros((g) => !g)}>{gros ? "Réduire" : "🔍 Agrandir encore"}</button>
              <p className="gbp-fen-aide">Notez le numéro, puis fermez la fenêtre et écrivez-le dans la case.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const VIDE = { kind: "", num: "", lettre: "", nom: "", texte: "", photo: "", sous: "", police: "great-vibes", side: "face", zone: "" };

export default function GobeletParcours({ product, fieldValues, setFieldValues, unitPrice, couleur, onComposition }) {
  const cfg = product.gobeletParcours;
  const etat = gobeletEtat(fieldValues);
  const sup = gobeletSupplement(fieldValues, cfg);
  const elements = gobeletElements(fieldValues);
  const premier = premierElement(fieldValues);
  const aPremier = Boolean(premier) && !manqueElement(premier);
  const [ed, setEd] = useState(null); // élément en cours de création (null = fermé)
  const [msg, setMsg] = useState("");
  const [fen, setFen] = useState(null);
  const edRef = useRef(null);

  const set = (patch) => setFieldValues((prev) => ({ ...prev, ...patch }));

  // Un 1er élément commencé mais pas fini (ancien panier, retour arrière) : on le rouvre dans l'éditeur.
  useEffect(() => {
    if (premier && manqueElement(premier) && !ed) {
      setEd({ ...VIDE, ...premier, num: premier.num ? String(premier.num) : "", police: premier.police || "great-vibes" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prix + repères de l'aperçu (photo de la FACE du gobelet) : seuls les éléments posés sur la face y sont montrés.
  useEffect(() => {
    const zoneAp = { milieu: "principal", haut: "haut", bas: "bas", gauche: "gauche", droite: "droite" };
    const motifs = [];
    for (const e of elements) {
      if (e.side !== "face" || e.kind === "sous") continue;
      if (e.kind === "dessin" || e.kind === "cadre") motifs.push({ zone: zoneAp[e.zone], num: e.num });
      else motifs.push({ zone: zoneAp[e.zone], text: e.kind === "photo" ? "Photo" : e.kind === "lettre" ? e.lettre : (e.texte || "T") });
    }
    onComposition && onComposition({ side: "face", motifs, count: sup.n, extraAmount: sup.montant, summary: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldValues.mode, fieldValues.dessin, fieldValues.cadre, fieldValues.lettre, fieldValues.texte, fieldValues.photo, fieldValues.texteSousPhoto, fieldValues.autour, fieldValues.cote, fieldValues.place]);

  const extras = lignesAutour(fieldValues).map(lireLigne);
  const estPremier = !aPremier; // l'élément en cours sera le 1er (compris) tant qu'il n'y en a pas

  // Places déjà prises (côté + place), hors l'élément en cours.
  const prises = useMemo(() => {
    const s = new Set();
    if (aPremier) s.add(`${premier.side}|${premier.zone}`);
    for (const e of extras) s.add(`${e.side}|${e.zone}`);
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldValues.autour, fieldValues.cote, fieldValues.place, aPremier]);
  const libres = ed ? placesDuCote(ed.side).filter((z) => !prises.has(`${ed.side}|${z}`)) : [];
  const zoneEd = ed && libres.includes(ed.zone) ? ed.zone : (libres[0] || "");

  function ouvrir(kind) {
    setMsg("");
    setEd({ ...VIDE, kind, police: (ed && ed.police) || "great-vibes" });
    setTimeout(() => edRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }
  const maj = (patch) => setEd((p) => ({ ...p, ...patch }));

  function enregistrer() {
    if (!ed) return;
    const e = {
      kind: ed.kind, side: ed.side, zone: zoneEd, police: AVEC_ECRITURE.includes(ed.kind) || (ed.kind === "photo" && ed.sous.trim()) ? ed.police : "",
      num: parseInt(ed.num, 10), lettre: ed.lettre, nom: ed.nom.trim(), texte: ed.texte.trim(), photo: ed.photo, sous: ed.sous.trim(),
    };
    if (!zoneEd) { setMsg("Toutes les places de ce côté sont prises : choisissez un autre endroit."); return; }
    const manque = manqueElement(e);
    if (manque) { setMsg(manque); return; }
    if (estPremier) set(champsPremier(e));
    else set({ autour: [...lignesAutour(fieldValues), ligneElement(e)].join("\n") });
    setEd(null);
    setMsg("");
  }

  function retirer(i) {
    // i = index dans `elements`. Le 1er (compris) retiré : l'élément suivant devient le 1er.
    const el = elements[i];
    if (el.compris) {
      const reste = extras;
      if (reste.length) {
        const [nouveau, ...autres] = reste;
        set({ ...champsPremier(nouveau), autour: autres.map((x) => x.ligne).join("\n") });
      } else set(champsPremier(null));
    } else if (el.kind === "sous") {
      set({ texteSousPhoto: "" });
    } else {
      const idx = i - elements.findIndex((x) => !x.compris && x.kind !== "sous");
      set({ autour: lignesAutour(fieldValues).filter((_, k) => k !== idx).join("\n") });
    }
  }

  const choix = CHOIX.filter((c) => estPremier || c.k !== "photo");
  const ecr = (p) => getFontLabel(p).split(" — ")[0];

  return (
    <div className="prc gbp" id="gobelet-parcours">
      <div className="prc-head"><p className="prc-title">Personnalisez votre gobelet</p><p className="prc-sub">Le 1er élément gravé est compris dans le prix, chaque élément en plus : +{prix(cfg.extra)} €.</p></div>

      <section className="prc-step">
        <div className="prc-sh"><span className={`prc-num${etat.ok ? " done" : ""}`}>1</span><h3>Que voulez-vous graver ?</h3></div>

        {elements.length > 0 && (
          <div className="gbp-liste">
            <p className="gbp-liste-t">Votre gravure</p>
            <ul className="gbp-xlist">
              {elements.map((e, i) => (
                <li key={i}>
                  <span><b>{i + 1}.</b> {quoiElement(e)}{["cadre", "lettre", "texte", "sous"].includes(e.kind) && e.police ? ` (écriture ${ecr(e.police)})` : ""}<br /><small>📍 {ouElement(e)}</small></span>
                  <b className="p">{e.compris ? "compris" : `+${prix(cfg.extra)} €`}</b>
                  <button type="button" aria-label="Retirer" onClick={() => retirer(i)}>×</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!ed && (
          <>
            {aPremier && <p className="prc-legend">Vous voulez graver autre chose en plus (un 2ᵉ dessin, un prénom, une date…) ? Chaque élément en plus : +{prix(cfg.extra)} €.</p>}
            <div className="prc-cards gbp-choix">
              {choix.map((c) => (
                <button type="button" key={c.k} className="prc-card" onClick={() => ouvrir(c.k)}>
                  <span className={`prc-cimg${c.k === "texte" ? " prc-cimg-aa" : c.k === "photo" ? " prc-cimg-photo" : " gbp-cimg-planche"}`}>
                    {c.k === "texte" ? <span className={getFontClass("great-vibes")}>Aa</span>
                      : c.k === "lettre" ? <span className="gbp-lettre-ic">A</span>
                      : /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={c.k === "photo" ? cfg.imagePhoto : c.k === "cadre" ? cfg.cadres[2].src : cfg.dessins[0].src} alt="" />}
                  </span>
                  <span className="prc-ctxt"><b>{aPremier ? "＋ " : ""}{c.titre}</b><small>{c.sous}</small></span>
                  {aPremier && <span className="gbp-prix">+{prix(cfg.extra)} €</span>}
                </button>
              ))}
            </div>
            {!aPremier && <p className="prc-hint">Votre 1er élément est compris dans le prix. Ensuite, vous pourrez en ajouter d&apos;autres (+{prix(cfg.extra)} € chacun).</p>}
            <p className="prc-hint gbp-miseenpage">✦ Plusieurs images, photos ou logos ? Nous préparons la mise en page et vous envoyons un aperçu à valider avant la gravure.</p>
          </>
        )}

        {ed && (
          <div className="gbp-extra" ref={edRef}>
            <div className="gbp-extra-top">
              <b>{CHOIX.find((c) => c.k === ed.kind)?.titre} — {estPremier ? "compris" : `+${prix(cfg.extra)} €`}</b>
              <button type="button" className="gbp-fermer" onClick={() => { setEd(null); setMsg(""); }}>✕ Fermer</button>
            </div>

            {ed.kind === "dessin" && (
              <div className="field"><label>1. Choisissez le dessin</label>
                {cfg.dessinUnite ? (
                  <TuilesDessins cfg={cfg} choisi={parseInt(ed.num, 10)} onView={(n, list) => setFen({ n, list })} />
                ) : (
                  <>
                    <p className="prc-opt">Touchez une planche pour l&apos;ouvrir en grand et lire les numéros.</p>
                    <Planches items={cfg.dessins} onOpen={(p) => setFen({ src: p.src, titre: `${p.legende} — n° ${p.nums}` })} />
                  </>
                )}
                <label htmlFor="gbp-num" className="gbp-sous-label">Numéro du dessin (1 à {GOB_DESSINS_MAX})</label>
                <input id="gbp-num" type="number" min="1" max={GOB_DESSINS_MAX} inputMode="numeric" placeholder="Ex : 12" value={ed.num} onChange={(e) => maj({ num: e.target.value })} />
              </div>
            )}

            {ed.kind === "cadre" && (
              <div className="field"><label>1. Choisissez le cadre ou la banderole</label>
                <p className="prc-opt">Touchez une planche pour l&apos;ouvrir en grand et lire les numéros.</p>
                <Planches items={cfg.cadres} onOpen={(p) => setFen({ src: p.src, titre: `${p.legende} — n° ${p.nums}` })} />
                <label htmlFor="gbp-cn" className="gbp-sous-label">Numéro du cadre ({GOB_CADRE_MIN} à {GOB_CADRE_MAX})</label>
                <input id="gbp-cn" type="number" min={GOB_CADRE_MIN} max={GOB_CADRE_MAX} inputMode="numeric" placeholder="Ex : 82" value={ed.num} onChange={(e) => maj({ num: e.target.value })} />
              </div>
            )}

            {ed.kind === "lettre" && (
              <div className="field"><label>1. Choisissez la lettre</label>
                <button type="button" className="gbp-planche gbp-alpha" onClick={() => setFen({ src: cfg.alphabet, titre: "Lettres fleuries A à Z" })}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cfg.alphabet} alt="Alphabet fleuri A à Z" />
                  <span><em>🔍 voir les lettres en grand</em></span>
                </button>
                <div className="prc-letters">{LETTRES.map((L) => (
                  <button type="button" key={L} className={`prc-let${ed.lettre === L ? " on" : ""}`} onClick={() => maj({ lettre: L })}>{L}</button>
                ))}</div>
              </div>
            )}

            {(ed.kind === "cadre" || ed.kind === "lettre") && (
              <div className="field"><label htmlFor="gbp-nom">2. Le nom à graver {ed.kind === "cadre" ? "au milieu du cadre" : "dans la lettre"}</label>
                <input id="gbp-nom" type="text" maxLength={30} placeholder="Ex : Léna" value={ed.nom} onChange={(e) => maj({ nom: e.target.value })} /></div>
            )}

            {ed.kind === "texte" && (
              <div className="field"><label htmlFor="gbp-txt">1. Votre texte</label>
                <input id="gbp-txt" type="text" maxLength={30} placeholder="Prénom, date, message…" value={ed.texte} onChange={(e) => maj({ texte: e.target.value })} />
                <span className="prc-count">{ed.texte.length}/30</span></div>
            )}

            {ed.kind === "photo" && (
              <>
                <div className="field"><label>1. Votre photo ou logo</label>
                  <p className="prc-opt">JPG ou PNG. L&apos;atelier vérifie la qualité avant de graver.</p>
                  <PhotoUpload value={ed.photo} onChange={(url) => maj({ photo: url })} productSlug={product.slug} guide={GUIDE_PHOTO_GRAVURE} /></div>
                <div className="field"><label htmlFor="gbp-ptxt">Texte sous la photo <span className="prc-opt">(facultatif, +{prix(cfg.extra)} €)</span></label>
                  <input id="gbp-ptxt" type="text" maxLength={30} placeholder="Prénom, message…" value={ed.sous} onChange={(e) => maj({ sous: e.target.value })} /></div>
              </>
            )}

            {(AVEC_ECRITURE.includes(ed.kind) || (ed.kind === "photo" && ed.sous.trim())) && (
              <div className="field"><label>Écriture</label>
                <Polices value={ed.police} onChange={(p) => maj({ police: p })} />
                <p className={`gbp-apercu ${getFontClass(ed.police)}`}>{(ed.kind === "texte" ? ed.texte : ed.kind === "photo" ? ed.sous : ed.nom) || "Léna"}</p></div>
            )}

            <div className="field"><label>Où le graver sur le gobelet ?</label>
              <div className="gbp-cotes">
                {Object.keys(GOB_COTES).map((c) => (
                  <button type="button" key={c} className={`gbp-cote${ed.side === c ? " on" : ""}`} onClick={() => maj({ side: c, zone: "" })}>
                    <MiniGobelet cote={c} /><span>{GOB_COTES[c]}</span>
                  </button>
                ))}
              </div>
              <div className="prc-chips gbp-zones">{libres.length ? libres.map((z) => (
                <button type="button" key={z} className={`prc-chip${zoneEd === z ? " on" : ""}`} onClick={() => maj({ zone: z })}>{GOB_PLACES[z].charAt(0).toUpperCase() + GOB_PLACES[z].slice(1)}</button>
              )) : <span className="prc-opt">Toutes les places de ce côté sont prises.</span>}</div>
              <p className="prc-opt">La face est le côté opposé à l&apos;anse : celui qu&apos;on voit quand on tient le gobelet de la main droite.</p>
            </div>

            {msg && <p className="gbp-xmsg">{msg}</p>}
            <div className="gbp-xbtns">
              <button type="button" className="gbp-xadd" onClick={enregistrer}>{estPremier ? "Valider ce choix (compris)" : `Ajouter à ma gravure (+${prix(cfg.extra)} €)`}</button>
              <button type="button" className="gbp-fermer" onClick={() => { setEd(null); setMsg(""); }}>Fermer</button>
            </div>
          </div>
        )}
      </section>

      <section className="prc-step">
        <div className="prc-sh"><span className={`prc-num${etat.ok ? " done" : ""}`}>2</span><h3>Résumé de votre gravure</h3></div>
        <div className="prc-sum">
          <div className="prc-sumrow"><span>Couleur</span><b>{couleur}</b></div>
          {elements.length ? elements.map((e, i) => (
            <div className="prc-sumrow" key={i}><span>{i + 1}. {e.compris ? "compris" : `+${prix(cfg.extra)} €`}</span><b>{quoiElement(e)} — {ouElement(e)}</b></div>
          )) : <div className="prc-sumrow"><span>Gravure</span><b className="prc-miss">à choisir (étape 1)</b></div>}
          {sup.enPlus > 0 && <div className="prc-sumrow"><span>Éléments en plus</span><b>{sup.enPlus} × {prix(cfg.extra)} € = {formatEuro(sup.montant)}</b></div>}
          <div className="prc-sumrow prc-sumtot"><span>Total (hors livraison)</span><b>{formatEuro(unitPrice)}</b></div>
        </div>
      </section>

      {fen && (
        <Fenetre v={fen} cfg={cfg} onClose={() => setFen(null)} onPick={(n) => { maj({ num: String(n) }); setFen(null); }} />
      )}
    </div>
  );
}
