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
  gobeletEtat, gobeletSupplement, gobeletElements, champsDepuisListe, premiereLibre, ORDRE_PLACES, prixElement,
  manqueElement, quoiElement, ouElement, placesDuCote, GOB_COTES, GOB_PLACES,
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

// Tuiles (un fichier par dessin), utilisées seulement si cfg.dessinUnite existe. Toucher la case = le dessin est choisi ;
// la loupe 🔍 l'ouvre en grand (on peut aussi y choisir).
function TuilesDessins({ cfg, choisis = [], onPick, onView }) {
  const choisi = choisis[0];
  const fam = useMemo(() => familles(cfg), [cfg]);
  // Une famille à la fois (celle du dessin choisi, sinon la 1re) : moins d'images chargées d'un coup.
  const [f, setF] = useState(() => {
    const i = choisi ? fam.findIndex((x) => choisi >= x.de && choisi <= x.a) : -1;
    return i >= 0 ? i : 0;
  });
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
          <div key={n} className={`gbp-tuile${choisis.includes(n) ? " on" : ""}`}>
            <button type="button" className="gbp-tuile-btn" onClick={() => onPick(n)} aria-pressed={choisis.includes(n)} aria-label={`${choisis.includes(n) ? "Retirer" : "Choisir"} le dessin n° ${n}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={srcDessin(cfg, n)} alt="" loading="lazy" decoding="async" width="120" height="104" />
              <span className="gbp-tnum">{choisis.includes(n) ? "✓ " : ""}n° {n}</span>
            </button>
            <button type="button" className="gbp-loupe" onClick={() => onView(n, nums)} aria-label={`Voir le dessin n° ${n} en grand`}>🔍</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Grande fenêtre (planche à agrandir, ou dessin seul à choisir). Fermer : bouton en haut, fond, glisser vers le bas, Échap.
// (Pas de manipulation de l'historique : risque de conflit avec le routeur du site sur iPhone, 05/11 soir.)
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
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", esc);
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

const VIDE = { kind: "", num: "", lettre: "", nom: "", texte: "", photo: "", sous: "", police: "great-vibes", side: "", zone: "" };
const LIBELLE_PLACE = (c, z) => `${GOB_COTES[c]} — ${GOB_PLACES[z]}`;

export default function GobeletParcours({ product, fieldValues, setFieldValues, unitPrice, couleur, onComposition }) {
  const cfg = product.gobeletParcours;
  const etat = gobeletEtat(fieldValues);
  const sup = gobeletSupplement(fieldValues, cfg);
  // La gravure = une liste d'éléments (le texte sous une photo fait partie de la photo).
  const liste = gobeletElements(fieldValues).filter((e) => e.kind !== "sous");
  const [ouvert, setOuvert] = useState(""); // catégorie ouverte : dessin | cadre | lettre | texte | photo | ""
  const [ed, setEd] = useState(VIDE);
  const [msg, setMsg] = useState("");
  const [fen, setFen] = useState(null);
  const edRef = useRef(null);
  const recapRef = useRef(null);

  const ecrire = (nouvelle) => setFieldValues((prev) => ({ ...prev, ...champsDepuisListe(nouvelle) }));

  // Prix + repères de l'aperçu (photo de la FACE du gobelet).
  useEffect(() => {
    const zoneAp = { milieu: "principal", haut: "haut", bas: "bas", gauche: "gauche", droite: "droite" };
    const motifs = [];
    for (const e of liste) {
      if (e.side !== "face") continue;
      if (e.kind === "dessin" || e.kind === "cadre") motifs.push({ zone: zoneAp[e.zone], num: e.num });
      else motifs.push({ zone: zoneAp[e.zone], text: e.kind === "photo" ? "Photo" : e.kind === "lettre" ? e.lettre : (e.texte || "T") });
    }
    onComposition && onComposition({ side: "face", motifs, count: sup.n, extraAmount: sup.montant, summary: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldValues.mode, fieldValues.dessin, fieldValues.cadre, fieldValues.lettre, fieldValues.texte, fieldValues.photo, fieldValues.texteSousPhoto, fieldValues.autour, fieldValues.cote, fieldValues.place]);

  function ouvrir(kind) {
    setMsg("");
    setOuvert(kind);
    setEd({ ...VIDE, kind, police: ed.police || "great-vibes" });
    setTimeout(() => edRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }
  const maj = (patch) => setEd((p) => ({ ...p, ...patch }));

  // Dessins : un toucher ajoute le dessin à la gravure (à la 1re place libre), un 2e toucher le retire.
  const dessinsChoisis = liste.filter((e) => e.kind === "dessin").map((e) => e.num);
  function basculerDessin(n) {
    setMsg("");
    const i = liste.findIndex((e) => e.kind === "dessin" && e.num === n);
    if (i >= 0) { ecrire(liste.filter((_, k) => k !== i)); return; }
    const place = premiereLibre(liste);
    if (!place) { setMsg("Toutes les places du gobelet sont prises : retirez un élément avant d'en ajouter un autre."); return; }
    ecrire([...liste, { kind: "dessin", num: n, ...place }]);
  }

  // Cadre, lettre, texte, photo : on remplit puis « Ajouter à ma gravure ».
  const place = (ed.side && ed.zone && !liste.some((e) => e.side === ed.side && e.zone === ed.zone)) ? { side: ed.side, zone: ed.zone } : premiereLibre(liste);
  function ajouter() {
    const e = {
      kind: ed.kind, police: AVEC_ECRITURE.includes(ed.kind) || (ed.kind === "photo" && ed.sous.trim()) ? ed.police : "",
      num: parseInt(ed.num, 10), lettre: ed.lettre, nom: ed.nom.trim(), texte: ed.texte.trim(), photo: ed.photo,
      sous: liste.length === 0 && ed.kind === "photo" ? ed.sous.trim() : "", ...(place || {}),
    };
    if (!place) { setMsg("Toutes les places du gobelet sont prises : retirez un élément avant d'en ajouter un autre."); return; }
    const manque = manqueElement(e);
    if (manque) { setMsg(manque); return; }
    ecrire([...liste, e]);
    setEd({ ...VIDE, kind: ed.kind, police: ed.police });
    setMsg("");
    setTimeout(() => recapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  }

  function retirer(i) { ecrire(liste.filter((_, k) => k !== i)); }
  function deplacer(i, valeur) {
    const [side, zone] = valeur.split("|");
    ecrire(liste.map((e, k) => (k === i ? { ...e, side, zone } : e)));
  }

  const ecr = (p) => getFontLabel(p).split(" — ")[0];
  const extra = prix(cfg.extra);
  const extraPhoto = prix(cfg.extraPhoto || 6);
  const prochain = liste.length === 0 ? "compris" : `+${ed.kind === "photo" ? extraPhoto : extra} €`;
  const placesDispo = (i) => ORDRE_PLACES.filter(([c, z]) => !liste.some((e, k) => k !== i && e.side === c && e.zone === z));

  return (
    <div className="prc gbp" id="gobelet-parcours">
      <div className="prc-head"><p className="prc-title">Personnalisez votre gobelet</p><p className="prc-sub">Choisissez tout ce que vous voulez : dessins, cadres avec un prénom, lettres, textes, photos. Le 1er élément est compris ; chaque élément en plus : +{extra} €, une photo en plus : +{extraPhoto} €.</p></div>

      <section className="prc-step">
        <div className="prc-sh"><span className={`prc-num${etat.ok ? " done" : ""}`}>1</span><h3>Que voulez-vous graver ?</h3></div>
        <div className="prc-cards gbp-choix">
          {CHOIX.map((c) => (
            <button type="button" key={c.k} className={`prc-card${ouvert === c.k ? " on" : ""}`} onClick={() => (ouvert === c.k ? setOuvert("") : ouvrir(c.k))}>
              <span className={`prc-cimg${c.k === "texte" ? " prc-cimg-aa" : c.k === "photo" ? " prc-cimg-photo" : " gbp-cimg-planche"}`}>
                {c.k === "texte" ? <span className={getFontClass("great-vibes")}>Aa</span>
                  : c.k === "lettre" ? <span className="gbp-lettre-ic">A</span>
                  : /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={c.k === "photo" ? cfg.imagePhoto : c.k === "cadre" ? cfg.cadres[2].src : (cfg.dessinUnite ? srcDessin(cfg, 48) : cfg.dessins[0].src)} alt="" />}
              </span>
              <span className="prc-ctxt"><b>{c.titre}</b><small>{c.sous}</small></span>
            </button>
          ))}
        </div>
        <p className="prc-hint gbp-miseenpage">✦ Plusieurs images, photos ou logos ? Nous préparons la mise en page et vous envoyons un aperçu à valider avant la gravure.</p>

        {ouvert && (
          <div className="gbp-extra" ref={edRef}>
            <div className="gbp-extra-top">
              <b>{CHOIX.find((c) => c.k === ouvert)?.titre}</b>
              <button type="button" className="gbp-fermer" onClick={() => { setOuvert(""); setMsg(""); }}>✕ Fermer</button>
            </div>

            {ouvert === "dessin" && (
              <div className="field">
                <label>Touchez les dessins que vous voulez — vous pouvez en choisir plusieurs (un 2ᵉ toucher le retire).</label>
                {cfg.dessinUnite ? (
                  <TuilesDessins cfg={cfg} choisis={dessinsChoisis} onPick={basculerDessin} onView={(n, list) => setFen({ n, list })} />
                ) : (
                  <Planches items={cfg.dessins} onOpen={(p) => setFen({ src: p.src, titre: `${p.legende} — n° ${p.nums}` })} />
                )}
                <div className="gbp-numdirect">
                  <label htmlFor="gbp-num" className="gbp-sous-label">Ou tapez un numéro</label>
                  <div className="gbp-numrow">
                    <input id="gbp-num" type="number" min="1" max={GOB_DESSINS_MAX} inputMode="numeric" placeholder="Ex : 12" value={ed.num} onChange={(e) => maj({ num: e.target.value })} />
                    <button type="button" className="gbp-xadd" onClick={() => { const n = parseInt(ed.num, 10); if (n >= 1 && n <= GOB_DESSINS_MAX) { if (!dessinsChoisis.includes(n)) basculerDessin(n); maj({ num: "" }); } else setMsg(`Numéro de dessin : de 1 à ${GOB_DESSINS_MAX}.`); }}>Ajouter</button>
                  </div>
                </div>
              </div>
            )}

            {ouvert === "cadre" && (
              <div className="field"><label>Choisissez le cadre ou la banderole</label>
                <p className="prc-opt">Touchez une planche pour l&apos;ouvrir en grand et lire les numéros.</p>
                <Planches items={cfg.cadres} onOpen={(p) => setFen({ src: p.src, titre: `${p.legende} — n° ${p.nums}` })} />
                <label htmlFor="gbp-cn" className="gbp-sous-label">Numéro du cadre ({GOB_CADRE_MIN} à {GOB_CADRE_MAX})</label>
                <input id="gbp-cn" type="number" min={GOB_CADRE_MIN} max={GOB_CADRE_MAX} inputMode="numeric" placeholder="Ex : 82" value={ed.num} onChange={(e) => maj({ num: e.target.value })} />
              </div>
            )}

            {ouvert === "lettre" && (
              <div className="field"><label>Choisissez la lettre</label>
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

            {(ouvert === "cadre" || ouvert === "lettre") && (
              <div className="field"><label htmlFor="gbp-nom">Le nom à graver {ouvert === "cadre" ? "au milieu du cadre" : "dans la lettre"}</label>
                <input id="gbp-nom" type="text" maxLength={30} placeholder="Ex : Léna" value={ed.nom} onChange={(e) => maj({ nom: e.target.value })} /></div>
            )}

            {ouvert === "texte" && (
              <div className="field"><label htmlFor="gbp-txt">Votre texte</label>
                <input id="gbp-txt" type="text" maxLength={30} placeholder="Prénom, date, message…" value={ed.texte} onChange={(e) => maj({ texte: e.target.value })} />
                <span className="prc-count">{ed.texte.length}/30</span></div>
            )}

            {ouvert === "photo" && (
              <>
                <div className="field"><label>Votre photo ou logo</label>
                  <p className="prc-opt">JPG ou PNG. L&apos;atelier vérifie la qualité avant de graver. Vous pouvez en ajouter plusieurs, une par une : la 1re gravure est comprise, chaque photo en plus : +{extraPhoto} €.</p>
                  <PhotoUpload key={liste.length} value={ed.photo} onChange={(url) => maj({ photo: url })} productSlug={product.slug} guide={GUIDE_PHOTO_GRAVURE} /></div>
                {liste.length === 0 && (
                  <div className="field"><label htmlFor="gbp-ptxt">Texte sous la photo <span className="prc-opt">(facultatif, +{extra} €)</span></label>
                    <input id="gbp-ptxt" type="text" maxLength={30} placeholder="Prénom, message…" value={ed.sous} onChange={(e) => maj({ sous: e.target.value })} /></div>
                )}
              </>
            )}

            {(AVEC_ECRITURE.includes(ouvert) || (ouvert === "photo" && ed.sous.trim())) && (
              <div className="field"><label>Écriture</label>
                <Polices value={ed.police} onChange={(p) => maj({ police: p })} />
                <p className={`gbp-apercu ${getFontClass(ed.police)}`}>{(ouvert === "texte" ? ed.texte : ouvert === "photo" ? ed.sous : ed.nom) || "Léna"}</p></div>
            )}

            {ouvert !== "dessin" && (
              <>
                <div className="field"><label>Où le graver sur le gobelet ?</label>
                  <div className="gbp-cotes">
                    {Object.keys(GOB_COTES).map((c) => (
                      <button type="button" key={c} className={`gbp-cote${(place?.side || "face") === c ? " on" : ""}`} onClick={() => maj({ side: c, zone: placesDuCote(c).find((z) => !liste.some((e) => e.side === c && e.zone === z)) || "" })}>
                        <MiniGobelet cote={c} /><span>{GOB_COTES[c]}</span>
                      </button>
                    ))}
                  </div>
                  <div className="prc-chips gbp-zones">{placesDuCote(place?.side || "face").map((z) => {
                    const prise = liste.some((e) => e.side === (place?.side || "face") && e.zone === z);
                    return <button type="button" key={z} disabled={prise} className={`prc-chip${place?.zone === z ? " on" : ""}`} onClick={() => maj({ side: place?.side || "face", zone: z })}>{GOB_PLACES[z].charAt(0).toUpperCase() + GOB_PLACES[z].slice(1)}{prise ? " (pris)" : ""}</button>;
                  })}</div>
                  <p className="prc-opt">La face est le côté opposé à l&apos;anse : celui qu&apos;on voit quand on tient le gobelet de la main droite.</p>
                </div>
                <div className="gbp-xbtns">
                  <button type="button" className="gbp-xadd" onClick={ajouter}>Ajouter à ma gravure ({prochain})</button>
                </div>
              </>
            )}
            {msg && <p className="gbp-xmsg">{msg}</p>}
          </div>
        )}

        <div className="gbp-liste" ref={recapRef}>
          <p className="gbp-liste-t">Votre gravure {liste.length ? `· ${liste.length} élément${liste.length > 1 ? "s" : ""}` : ""}</p>
          {liste.length === 0 ? (
            <p className="prc-opt">Rien de choisi pour l&apos;instant : touchez « Un dessin », « Mon texte », « Ma photo »… au-dessus.</p>
          ) : (
            <ul className="gbp-xlist">
              {liste.map((e, i) => (
                <li key={i}>
                  {(e.kind === "dessin" && cfg.dessinUnite) || e.kind === "photo" ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img className="gbp-xvig" src={e.kind === "photo" ? e.photo : srcDessin(cfg, e.num)} alt="" />
                  ) : null}
                  <span>
                    <b>{i + 1}.</b> {quoiElement(e)}{e.kind === "photo" && e.sous ? ` + « ${e.sous} » (+${extra} €)` : ""}{["cadre", "lettre", "texte"].includes(e.kind) && e.police ? ` (écriture ${ecr(e.police)})` : ""}
                  </span>
                  <b className="p">{i === 0 ? "compris" : `+${prix(prixElement(e, cfg))} €`}</b>
                  <button type="button" aria-label="Retirer" onClick={() => retirer(i)}>×</button>
                  <select className="gbp-ou" aria-label="Où le graver" value={`${e.side}|${e.zone}`} onChange={(ev) => deplacer(i, ev.target.value)}>
                    {placesDispo(i).map(([c, z]) => <option key={`${c}|${z}`} value={`${c}|${z}`}>📍 {LIBELLE_PLACE(c, z)}</option>)}
                  </select>
                </li>
              ))}
            </ul>
          )}
          {liste.length > 0 && <p className="gbp-total-ligne">Gravure : {sup.enPlus ? `1 compris + ${sup.enPlus} en plus${sup.photosEnPlus ? ` (dont ${sup.photosEnPlus} photo${sup.photosEnPlus > 1 ? "s" : ""} à ${extraPhoto} €)` : ""} = ${formatEuro(sup.montant)}` : "comprise"} · <b>Total {formatEuro(unitPrice)}</b> (hors livraison)</p>}
        </div>
      </section>

      <section className="prc-step">
        <div className="prc-sh"><span className={`prc-num${etat.ok ? " done" : ""}`}>2</span><h3>Résumé</h3></div>
        <div className="prc-sum">
          <div className="prc-sumrow"><span>Couleur</span><b>{couleur}</b></div>
          <div className="prc-sumrow"><span>Éléments gravés</span><b className={liste.length ? "" : "prc-miss"}>{liste.length || "à choisir (étape 1)"}</b></div>
          {sup.enPlus > 0 && <div className="prc-sumrow"><span>Éléments en plus</span><b>{sup.enPlus} = {formatEuro(sup.montant)}</b></div>}
          <div className="prc-sumrow prc-sumtot"><span>Total (hors livraison)</span><b>{formatEuro(unitPrice)}</b></div>
        </div>
      </section>

      {fen && (
        <Fenetre v={fen} cfg={cfg} onClose={() => setFen(null)} onPick={(n) => { if (!dessinsChoisis.includes(n)) basculerDessin(n); setFen(null); }} />
      )}
    </div>
  );
}
