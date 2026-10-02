"use client";

// Parcours de personnalisation GUIDÉ en 4 étapes (carafe, puis verres si validé).
// Reproduit la maquette validée `docs/maquettes/carafe-parcours-guide.html` :
//   ① Que voulez-vous graver ? — 3 cartes EXCLUSIVES (choisir l'une vide les autres)
//   ② selon le choix : grille des modèles (légende = ce que la cliente indique) +
//      aperçu de la carafe juste à côté + SEULS les champs que le modèle utilise ;
//      lettre fleurie (+ prénom facultatif) ; texte seul (+ date, écriture)
//   ③ coffret (3 cartes, « Carafe seule » cochée d'office)
//   ④ résumé de la gravure — et le bouton « Ajouter au panier » reste grisé
//      tant que la gravure n'est pas complète (onValidity).
// Les valeurs sont écrites dans les MÊMES clés de champs qu'avant (numstyle,
// lettreFleurie, initiale, prenom, role, date, police, coffret, texte) : panier,
// commande, fiche atelier et aperçu du haut de page ne changent pas.
import { useEffect, useMemo, useRef, useState } from "react";
import { FONTS, getFontClass, getFontLabel } from "@/lib/fonts";
import { formatEuro } from "@/lib/format";
import { parcoursEtat, modeleChoisi, PARCOURS_CHAMPS } from "@/lib/parcoursGuide";
import PhotoUpload from "./PhotoUpload";

const LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MODES = (cfg, nbModeles) => [
  { key: "modele", titre: "Un modèle décoré", sous: cfg.sousModele || `${nbModeles} modèles numérotés, avec vos prénoms si vous voulez.` },
  { key: "lettre", titre: "Une lettre fleurie", sous: "Votre initiale dans un style fleuri, avec un prénom au milieu si vous le souhaitez." },
  { key: "texte", titre: "Mon propre texte", sous: "Un prénom, une date, un petit message — dans l'écriture de votre choix. Sans dessin, juste le texte." },
  { key: "photo", titre: "Ma photo ou mon logo", sous: `Envoyez votre photo, un dessin ou le logo de votre entreprise : nous le gravons sur ${cfg.objetArticle || "la carafe"}.` },
]
  // Fiche sans modèles ni lettre (verre à whisky perso) : `cfg.modes` garde un sous-ensemble,
  // `cfg.modesTextes` donne ses propres phrases. Carafe / vin / flûte : rien ne change.
  .filter((m) => !cfg.modes || cfg.modes.includes(m.key))
  .sort((a, b) => (cfg.modes ? cfg.modes.indexOf(a.key) - cfg.modes.indexOf(b.key) : 0))
  .map((m) => ({ ...m, ...(cfg.modesTextes?.[m.key] || {}) }));

export default function ParcoursGuide({ product, fieldValues, setFieldValues, unitPrice, onValidity }) {
  const cfg = product.parcoursGuide;
  const modeles = cfg.modeles || {};
  const modelesPhoto = cfg.modelesPhoto || []; // gravures en photo = des modèles comme les autres (n° à la suite)
  const groupes = cfg.groupes || [];
  const objet = cfg.objet || "carafe";
  const mode = fieldValues.mode || "";
  const modele = modeleChoisi(product, fieldValues); // { n, legende, champs, exemple, value? } ou null
  const styleNum = modele ? modele.n : "";
  const nbModeles = Object.keys(modeles).length + modelesPhoto.length;
  const coffrets = cfg.coffrets || [];
  const police = fieldValues.police || "playfair";
  const s2Ref = useRef(null);
  // Fiche « verre à whisky » : étape « Où sur le verre ? » (face / fond / les deux) + date,
  // décor et 2ᵉ gravure. Clés INCHANGÉES (emplacement, texte, texte2, decor, photoFond, texteFond).
  const E = cfg.emplacement || null;
  const empl = fieldValues.emplacement || "face";
  const dateKey = cfg.dateKey || "date";
  const dateMax = cfg.dateMax || 20;
  const texteMax = cfg.texteMax || 40;
  // État d'écran seulement (jamais dans les champs, donc jamais dans le panier).
  const [filtre, setFiltre] = useState("all");
  const [grilleOuverte, setGrilleOuverte] = useState(false);

  const etat = useMemo(() => parcoursEtat(product, fieldValues), [product, fieldValues]);
  useEffect(() => { onValidity && onValidity(etat); }, [etat, onValidity]);

  const set = (patch) => setFieldValues((prev) => ({ ...prev, ...patch }));


  // ① Choix EXCLUSIF : on repart de zéro (seul le coffret est conservé).
  function choisirMode(m) {
    if (m === mode) return;
    // La police ne sert qu'au texte libre (lettre / texte / photo) : pour un modèle, le
    // nom est gravé dans l'écriture du modèle, on n'écrit donc pas de police (atelier clair).
    setFieldValues((prev) => ({
      mode: m,
      ...(coffrets.length ? { coffret: prev.coffret || "" } : {}),
      // L'emplacement et la gravure du fond ne dépendent pas du choix photo / texte : on les garde.
      ...(E ? { emplacement: prev.emplacement || "face", ...(prev.photoFond ? { photoFond: prev.photoFond } : {}), ...(prev.texteFond ? { texteFond: prev.texteFond } : {}) } : {}),
      ...(m === "modele" ? {} : { police: "playfair" }),
    }));
    setTimeout(() => s2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }
  function choisirModele(n, photoValue) {
    // Les champs de l'ancien modèle sont vidés : seuls ceux du nouveau comptent.
    // Un modèle « en photo » écrit gravureExemple (comme avant), un numéroté écrit numstyle.
    setFieldValues((prev) => ({ mode: "modele", ...(coffrets.length ? { coffret: prev.coffret || "" } : {}), ...(photoValue ? { gravureExemple: photoValue } : { numstyle: String(n) }) }));
    setGrilleOuverte(false);
  }

  const grille = Object.keys(modeles).map(Number).sort((a, b) => a - b);
  // Numéros d'étapes : ① gravure · [② emplacement] · détail · [coffret] · résumé.
  const nEmpl = E ? 2 : 0;
  const nDetail = E ? 3 : 2;
  const nCof = coffrets.length ? nDetail + 1 : 0;
  const numSteps = (nCof || nDetail) + 1;
  const replie = Boolean(styleNum) && !grilleOuverte;

  // Date, décor et écriture (verre à whisky) — un élément JSX, jamais un composant imbriqué
  // (sinon le champ perdrait le focus à chaque frappe).
  const commun = E ? (
    <>
      <div className="field"><label>Date <span className="prc-opt">(facultatif, +3 €)</span></label>
        <input type="text" maxLength={dateMax} placeholder="Ex : 12.06.2024" value={fieldValues[dateKey] || ""} onChange={(e) => set({ [dateKey]: e.target.value })} /></div>
      {cfg.decors?.length > 0 && (
        <div className="field"><label>Décor autour du texte <span className="prc-opt">(facultatif)</span></label>
          <div className="prc-chips prc-decors">
            {cfg.decors.map((d) => (
              <button type="button" key={d.value} className={`prc-chip${(fieldValues.decor || "") === d.value ? " on" : ""}`} onClick={() => set({ decor: d.value })}>{d.label}</button>
            ))}
          </div></div>
      )}
      <div className="field"><label>Écriture</label><Polices value={police} onChange={(p) => set({ police: p })} /></div>
    </>
  ) : null;
  // 2ᵉ gravure : au fond du verre, quand « Les deux » est choisi.
  const fond = E && empl === "deux" ? (
    <div className="prc-fond">
      <p className="prc-ftitle">Et au fond du verre — <em>la 2ᵉ gravure (+ {formatEuro(E.options.find((o) => o.value === "deux")?.prix || 0)})</em></p>
      <p className="prc-legend">Gravée centrée au fond, elle se découvre à travers le verre. Une photo, un texte, ou les deux.</p>
      <div className="prc-fields">
        <div className="field"><label>Photo pour le fond <span className="prc-opt">(facultatif)</span></label>
          <PhotoUpload value={fieldValues.photoFond || ""} onChange={(url) => set({ photoFond: url })} productSlug={product.slug} /></div>
        <div className="field"><label>Texte pour le fond <span className="prc-opt">(facultatif)</span></label>
          <input type="text" maxLength={texteMax} placeholder="Prénom, message…" value={fieldValues.texteFond || ""} onChange={(e) => set({ texteFond: e.target.value })} /></div>
      </div>
    </div>
  ) : null;

  return (
    <div className="prc" id="prc">
      <div className="prc-head"><p className="prc-title">{cfg.titre || "Personnalisez votre carafe"}</p><p className="prc-sub">{numSteps} petites étapes : dites-nous quoi graver{E ? " et où" : ""}, nous faisons le reste.</p></div>

      {/* ① */}
      <section className="prc-step">
        <div className="prc-sh"><span className={`prc-num${mode ? " done" : ""}`}>1</span><h3>Que voulez-vous graver ?</h3></div>
        <div className="prc-cards">
          {MODES(cfg, nbModeles).map((m) => (
            <button type="button" key={m.key} className={`prc-card${mode === m.key ? " on" : ""}`} onClick={() => choisirMode(m.key)}>
              <span className={`prc-cimg${m.key === "lettre" ? " prc-cimg-alpha" : ""}${m.key === "texte" ? " prc-cimg-aa" : ""}${m.key === "photo" && cfg.imagePhoto ? " prc-cimg-photo" : ""}`}>
                {m.key === "modele" && cfg.vignetteModele && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cfg.vignetteModele} alt="" />
                )}
                {m.key === "lettre" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cfg.alphabet || "/produits/alphabet-fleuri.jpg"} alt="" />
                )}
                {m.key === "texte" && <span className={getFontClass("great-vibes")}>Aa</span>}
                {m.key === "photo" && (cfg.imagePhoto
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={cfg.imagePhoto} alt="" />
                  : <span className="prc-cimg-ph" aria-hidden="true">📷</span>)}
              </span>
              <span className="prc-ctxt"><b>{m.titre}</b><small>{m.sous}</small></span>
            </button>
          ))}
        </div>
        <p className="prc-hint">Un seul choix par {objet}. Vous pouvez changer d&apos;avis à tout moment.</p>
      </section>

      {/* ② (verre à whisky) Où sur le verre ? — face, fond ou les deux */}
      {E && (
        <section className="prc-step">
          <div className="prc-sh"><span className="prc-num done">{nEmpl}</span><h3>{E.titre || "Où sur le verre ?"}</h3></div>
          <div className="prc-cofs prc-empl">
            {E.options.map((o) => (
              <button type="button" key={o.value} className={`prc-cof${empl === o.value ? " on" : ""}`} onClick={() => set({ emplacement: o.value })}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {o.image && <img src={o.image} alt="" loading="lazy" />}
                <b>{o.titre}</b>{o.prix ? <span className="prc-cp">+ {formatEuro(o.prix)}</span> : null}<small>{o.sous}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ② / ③ */}
      {mode && (
        <section className="prc-step" ref={s2Ref}>
          <div className="prc-sh"><span className={`prc-num${etat.ok ? " done" : ""}`}>{nDetail}</span>
            <h3>{mode === "modele" ? "Choisissez votre modèle" : mode === "lettre" ? "Choisissez votre lettre" : mode === "photo" ? "Ajoutez votre photo ou votre logo" : "Écrivez votre texte"}</h3></div>

          {mode === "modele" && (
            <div className="prc-mode">
              <div className="prc-chips">
                <button type="button" className={`prc-chip${filtre === "all" ? " on" : ""}`} onClick={() => setFiltre("all")}>Tous (1–{nbModeles})</button>
                {groupes.map((g) => (
                  <button type="button" key={g.key} className={`prc-chip${filtre === g.key ? " on" : ""}`} onClick={() => setFiltre(g.key)}>{g.label}</button>
                ))}
              </div>
              <p className="prc-legend">Sous chaque modèle : ce que vous pouvez nous indiquer (rien n&apos;est obligatoire). Les prénoms et dates que vous voyez sont des exemples : vous mettez les vôtres, dans la même écriture.</p>
              <div className="prc-one">
                <div>
                  <div className={`prc-grid${replie ? " picked" : ""}`}>
                    {grille.map((n) => {
                      const M = modeles[n];
                      const g = groupes.find((x) => x.nums.includes(n))?.key;
                      const cache = filtre !== "all" && g !== filtre;
                      return (
                        <button type="button" key={n} className={`prc-model${styleNum === String(n) ? " on" : ""}${cache ? " hide" : ""}`} onClick={() => choisirModele(n)} aria-label={`Modèle n° ${n} — ${M.legende}`}>
                          <span className="prc-mn">n° {n}</span>
                          <span className="prc-mimg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={product.styleImages?.[n]} alt="" loading="lazy" />
                          </span>
                          <span className="prc-ml">{M.legende}</span>
                        </button>
                      );
                    })}
                    {modelesPhoto.map((M) => {
                      const g = groupes.find((x) => x.nums.includes(M.n))?.key;
                      const cache = filtre !== "all" && g !== filtre;
                      const on = fieldValues.gravureExemple === M.value;
                      return (
                        <button type="button" key={"p" + M.n} className={`prc-model${on ? " on" : ""}${cache ? " hide" : ""}`} onClick={() => choisirModele(M.n, M.value)} aria-label={`Modèle n° ${M.n} — ${M.legende}`}>
                          <span className="prc-mn">n° {M.n}</span>
                          <span className="prc-mimg prc-mimg-photo">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={M.image} alt="" loading="lazy" />
                          </span>
                          <span className="prc-ml">{M.legende}</span>
                        </button>
                      );
                    })}
                  </div>
                  {replie && (
                    <button type="button" className="prc-change" onClick={() => setGrilleOuverte(true)}>← Changer de modèle (voir les {nbModeles})</button>
                  )}
                </div>
              </div>
              {styleNum && (
                <p className="prc-choisi">Modèle n° {styleNum} choisi ✓ — {modele?.champs?.length ? <>{modele.exemple ? <>l&apos;exemple montre « {modele.exemple} » : </> : null}indiquez ce que vous voulez y faire graver (facultatif), dans la même écriture.{modele.value ? null : <> Regardez la grande photo en haut : il s&apos;y pose.</>}</> : <>ce modèle se grave tel quel, sans texte.</>}</p>
              )}
              {modele && modele.champs?.length > 0 && (
                <div className="prc-fields">
                  <p className="prc-ftitle">Modèle n° {styleNum} — <em>{modele.legende}</em>. Indiquez :</p>
                  {modele.champs.map((k) => {
                    const F = PARCOURS_CHAMPS[k];
                    return (
                      <div className="field" key={k}>
                        <label>{F.label}<span className="prc-opt"> (facultatif{F.extra ? `, +${F.extra} €` : ""})</span></label>
                        <input type="text" maxLength={F.max} placeholder={F.ph} value={fieldValues[F.key] || ""} onChange={(e) => set({ [F.key]: e.target.value })} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {mode === "lettre" && (
            <div className="prc-mode">
              <p className="prc-legend">Cliquez la lettre voulue : elle sera gravée dans ce style fleuri. Le prénom (facultatif) se grave dans la bande, au milieu de la lettre.</p>
              <div className="prc-one">
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="prc-alpha" src={cfg.alphabet || "/produits/alphabet-fleuri.jpg"} alt="Alphabet fleuri A à Z" />
                  <div className="prc-letters">
                    {LETTRES.map((L) => (
                      <button type="button" key={L} className={`prc-let${fieldValues.lettreFleurie === L ? " on" : ""}`} onClick={() => set({ lettreFleurie: L })}>{L}</button>
                    ))}
                  </div>
                  <div className="prc-fields">
                    <div className="field"><label>Prénom dans la bande <span className="prc-opt">(facultatif)</span></label>
                      <input type="text" maxLength={20} placeholder="Ex. Stephan" value={fieldValues.prenom || ""} onChange={(e) => set({ prenom: e.target.value })} /></div>
                    <div className="field"><label>Écriture du prénom</label><Polices value={police} onChange={(p) => set({ police: p })} /></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === "texte" && (
            <div className="prc-mode">
              <div className="prc-one">
                <div className="prc-fields">
                  <div className="field"><label>Votre texte à graver{E ? <span className="prc-opt"> (+3 €)</span> : null}</label>
                    <input type="text" maxLength={texteMax} placeholder={E ? "Prénom, message…" : "Ex. Stephan · Pour Papa · Merci"} value={fieldValues.texte || ""} onChange={(e) => set({ texte: e.target.value })} />
                    <span className="prc-count">{(fieldValues.texte || "").length}/{texteMax}</span></div>
                  {commun || (
                    <>
                      <div className="field"><label>Date ou année <span className="prc-opt">(facultatif, +3 €)</span></label>
                        <input type="text" maxLength={20} placeholder="Ex. 1989 · 09.09.25" value={fieldValues.date || ""} onChange={(e) => set({ date: e.target.value })} /></div>
                      <div className="field"><label>Écriture</label><Polices value={police} onChange={(p) => set({ police: p })} /></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {mode === "photo" && (
            <div className="prc-mode">
              <p className="prc-legend">Une photo, un dessin, un logo : téléversez le fichier (JPG, PNG). Photo seule, ou photo + texte, comme vous voulez. Elle se pose sur la grande photo en haut, où vous pouvez la déplacer. L&apos;atelier vérifie la qualité avant de graver.</p>
              {cfg.guidePhoto && (
                <details className="prc-guide"><summary>Réussir sa gravure photo — nos conseils</summary>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cfg.guidePhoto.image} alt="Exemples de bonnes et mauvaises photos pour la gravure" />
                  <p>{cfg.guidePhoto.texte}</p>
                </details>
              )}
              <div className="prc-one">
                <div className="prc-fields">
                  <div className="field"><label>Votre photo ou logo</label>
                    <PhotoUpload value={fieldValues.photo || ""} onChange={(url) => set({ photo: url })} productSlug={product.slug} /></div>
                  <div className="field"><label>Texte sous la photo <span className="prc-opt">(facultatif{E ? ", +3 €" : ""})</span></label>
                    <input type="text" maxLength={texteMax} placeholder={E ? "Prénom, message…" : "Ex. Stephan · 1989"} value={fieldValues.texte || ""} onChange={(e) => set({ texte: e.target.value })} /></div>
                  {commun || (fieldValues.texte && <div className="field"><label>Écriture du texte</label><Polices value={police} onChange={(p) => set({ police: p })} /></div>)}
                </div>
              </div>
            </div>
          )}

          {E && (mode === "photo" || mode === "texte") && fond}
        </section>
      )}

      {/* ③ */}
      {coffrets.length > 0 && (
        <section className="prc-step">
          <div className="prc-sh"><span className={`prc-num${etat.ok ? " done" : ""}`}>{nCof}</span><h3>{cfg.coffretTitre || "Carafe seule ou coffret ?"}</h3></div>
          <div className="prc-cofs">
            {coffrets.map((c) => (
              <button type="button" key={c.value || "seule"} className={`prc-cof${(fieldValues.coffret || "") === c.value ? " on" : ""}`} onClick={() => set({ coffret: c.value })}>
                <b>{c.titre}</b><span className="prc-cp">{c.prix ? "+" + formatEuro(c.prix) : "inclus"}</span><small>{c.sous}</small>
              </button>
            ))}
          </div>
          {cfg.coffretNote && <p className="prc-hint">{cfg.coffretNote}</p>}
        </section>
      )}

      {/* ④ */}
      <section className="prc-step">
        <div className="prc-sh"><span className={`prc-num${etat.ok ? " done" : ""}`}>{numSteps}</span><h3>Résumé de votre gravure</h3></div>
        <div className="prc-sum">
          <div className="prc-sumrow"><span>Gravure</span><b className={etat.ok ? "" : "prc-miss"}>{etat.grav ? etat.grav + (etat.ok ? "" : " — à compléter") : "à choisir (étape 1)"}</b></div>
          {etat.detail && <div className="prc-sumrow"><span>Détail</span><b>{etat.detail}</b></div>}
          {E && <div className="prc-sumrow"><span>Emplacement</span><b>{E.options.find((o) => o.value === empl)?.resume || empl}</b></div>}
          {E && empl === "deux" && <div className="prc-sumrow"><span>Au fond</span><b className={etat.fond ? "" : "prc-miss"}>{etat.fond || "à préciser"}</b></div>}
          {coffrets.length > 0 && (
            <div className="prc-sumrow"><span>Coffret</span><b>{coffrets.find((c) => c.value === (fieldValues.coffret || ""))?.resume || "Carafe seule"}</b></div>
          )}
          <div className="prc-sumrow prc-sumtot"><span>Total</span><b>{formatEuro(unitPrice)}</b></div>
        </div>
      </section>
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

