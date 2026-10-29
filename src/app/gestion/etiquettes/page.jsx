"use client";

// =============================================================================
// ÉTIQUETTES D'ADRESSE — /gestion/etiquettes (13/10/2026, maquette validée par le gérant)
// Imprime l'adresse des envois La Poste sur les planches de 20 étiquettes 45 × 45 mm. Le gérant
// coche les commandes, choisit où mettre l'expéditeur, grise les cases déjà décollées de sa feuille ;
// les étiquettes vont sur les cases libres suivantes. La feuille et l'expéditeur sont retenus sur
// cet ordinateur (localStorage). Impression (14/10/2026, « j'imprime comment là ? ») : JAMAIS de
// nouvelle fenêtre — sur l'iPhone (site posé sur l'écran d'accueil) elle n'avait ni retour ni
// impression. Ordinateur : la feuille A4 part d'un cadre caché de la page. iPhone / iPad : un PDF
// aux mêmes millimètres s'ouvre dans « Partager » → « Imprimer ».
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PageHead from "@/components/admin/PageHead";
import { chargerAvecCache } from "@/components/admin/adminCache";
import { FEUILLE, NB_CASES, positions, modeEnvoi, adresseCollee, travaux, placer, contenuEtiquette, feuilleHtml, feuillePdf, EXPEDITEUR_DEFAUT, MODELES, modeleValide, cssModeles, resserrerEtiquettes } from "@/lib/etiquettes";

const CLE = "niv-etiquettes";
const A_EXPEDIER = ["a_preparer", "en_gravure"];
function lire() { try { return JSON.parse(localStorage.getItem(CLE) || "{}") || {}; } catch { return {}; } }
function ecrire(v) { try { localStorage.setItem(CLE, JSON.stringify(v)); } catch { /* navigateur sans stockage : rien de grave */ } }
// iPhone / iPad (un iPad récent se présente comme un Mac, mais tactile).
const estApple = () => { try { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); } catch { return false; } };
const NOM_PDF = "etiquettes-niv-creation.pdf";
const dateFr = (iso) => { try { return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); } catch { return ""; } };

export default function EtiquettesPage() {
  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState("");
  const [orders, setOrders] = useState([]);
  const [coches, setCoches] = useState([]);
  const [manuelles, setManuelles] = useState([]); // adresses collées à la main (Etsy ou autre), 29/10/2026
  const [colle, setColle] = useState("");
  const [toutes, setToutes] = useState(false);
  const [used, setUsed] = useState(() => new Array(NB_CASES).fill(false));
  const [mode, setMode] = useState("meme");
  const [expTxt, setExpTxt] = useState(EXPEDITEUR_DEFAUT);
  const [avecRef, setAvecRef] = useState(false); // n° de commande sur l'étiquette : seulement si demandé
  const [modele, setModele] = useState("actuel"); // style de l'étiquette (14/10/2026), retenu sur l'appareil
  const papier = useRef(null);
  const [attente, setAttente] = useState(null); // cases imprimées, en attente du « oui, c'est sorti »
  const [pret, setPret] = useState(false);
  const [apple, setApple] = useState(false);
  const [pdf, setPdf] = useState(null); // PDF préparé d'avance : « Partager » doit partir dans le geste du doigt
  const cadre = useRef(null);
  const [logo, setLogo] = useState(null); // { data, w, h } : le logo du site, lu une fois

  // Feuille, mode et expéditeur retenus sur cet ordinateur ; commande pré-cochée par ?id= ou ?ref=.
  useEffect(() => {
    const s = lire();
    if (Array.isArray(s.used) && s.used.length === NB_CASES) setUsed(s.used.map(Boolean));
    if (["meme", "apart", "non"].includes(s.mode)) setMode(s.mode);
    if (typeof s.exp === "string" && s.exp.trim()) setExpTxt(s.exp);
    if (typeof s.ref === "boolean") setAvecRef(s.ref);
    if (s.modele) setModele(modeleValide(s.modele));
    setPret(true);
    setApple(estApple());
  }, []);
  useEffect(() => { if (pret) ecrire({ used, mode, exp: expTxt, ref: avecRef, modele }); }, [pret, used, mode, expTxt, avecRef, modele]);

  const load = useCallback(async (k) => {
    setErr("");
    try {
      const r = await chargerAvecCache("/api/admin/orders", k, (d) => { setOrders(d.orders || []); setKey(k); setAuthed(true); });
      if (r.status === 401) { setAuthed(false); setErr("Mot de passe incorrect."); return; }
      if (!r.ok && !r.data) { setErr("Les commandes n'ont pas pu être chargées. Réessayez."); return; }
      try { sessionStorage.setItem("niv-admin-key", k); } catch { /* ignore */ }
      try {
        const p = new URLSearchParams(window.location.search), id = p.get("id"), ref = p.get("ref");
        const liste = r.data?.orders || [];
        const o = liste.find((x) => (id && x.id === id) || (ref && String(x.ref).toUpperCase() === ref.toUpperCase()));
        if (o) { setCoches([o.id]); if (!A_EXPEDIER.includes(o.status || "a_preparer")) setToutes(true); }
      } catch { /* ignore */ }
    } catch { setErr("Les commandes n'ont pas pu être chargées. Réessayez."); }
  }, []);
  useEffect(() => { try { const k = sessionStorage.getItem("niv-admin-key"); if (k) load(k); } catch { /* ignore */ } }, [load]);

  const liste = useMemo(() => {
    const limite = Date.now() - 30 * 86400000;
    return (orders || [])
      .filter((o) => !o.test && !["annulee", "remboursee"].includes(o.status))
      .filter((o) => toutes ? +new Date(o.createdAt || 0) >= limite || coches.includes(o.id) : A_EXPEDIER.includes(o.status || "a_preparer") || coches.includes(o.id))
      .sort((a, b) => +new Date(a.createdAt || 0) - +new Date(b.createdAt || 0));
  }, [orders, toutes, coches]);

  const choisies = [...liste.filter((o) => coches.includes(o.id)), ...manuelles];
  const jobs = useMemo(() => travaux(choisies, mode, avecRef), [choisies, mode, avecRef]);
  const { places, manque, libresApres } = useMemo(() => placer(jobs, used), [jobs, used]);
  const parCase = useMemo(() => Object.fromEntries(places.map((p) => [p.case, p])), [places]);
  const pos = useMemo(() => positions(), []);

  function basculer(id) { setCoches((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]); }
  function caseUtilisee(i) { setAttente(null); setUsed((u) => u.map((v, k) => k === i ? !v : v)); }

  // Le logo du site (fichier d'origine, servi par /api/logo), mis en petit sur chaque étiquette.
  useEffect(() => {
    let fini = false;
    (async () => {
      try {
        const r = await fetch("/api/logo");
        if (!r.ok) return;
        const b = await r.blob();
        const data = await new Promise((ok, ko) => { const f = new FileReader(); f.onload = () => ok(f.result); f.onerror = ko; f.readAsDataURL(b); });
        const img = new Image();
        img.onload = () => { if (!fini) setLogo({ data, w: img.naturalWidth, h: img.naturalHeight }); };
        img.src = data;
      } catch { /* étiquettes sans logo */ }
    })();
    return () => { fini = true; };
  }, []);

  // Le PDF est refait dès que la feuille change, pour être prêt au moment du clic.
  useEffect(() => {
    let fini = false;
    setPdf(null);
    if (!places.length) return undefined;
    (async () => {
      try {
        const { jsPDF } = await import("jspdf");
        const blob = feuillePdf(jsPDF, places, expTxt, logo, modele).output("blob");
        if (!fini) setPdf(new File([blob], NOM_PDF, { type: "application/pdf" }));
      } catch { /* l'impression par le navigateur reste possible */ }
    })();
    return () => { fini = true; };
  }, [places, expTxt, logo, modele]);

  // Aperçu : une adresse trop longue se resserre comme à l'impression.
  useEffect(() => { try { if (papier.current) resserrerEtiquettes(papier.current); } catch { /* ignore */ } });

  // Ordinateur : la feuille est écrite dans un cadre invisible de CETTE page, puis imprimée.
  function imprimerCadre() {
    try { cadre.current?.remove(); } catch { /* ignore */ }
    const f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(f);
    cadre.current = f;
    const d = f.contentWindow.document;
    d.open(); d.write(feuilleHtml(places, expTxt, logo?.data, modele)); d.close();
    // On attend que le logo soit dessiné avant d'imprimer (sinon il sort en blanc).
    const imgs = [...d.images].map((i) => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()));
    Promise.race([Promise.all(imgs), new Promise((ok) => setTimeout(ok, 2000))]).then(() => setTimeout(() => {
      try { f.contentWindow.focus(); f.contentWindow.print(); }
      catch { setErr("L'impression n'a pas pu s'ouvrir. Utilisez « Enregistrer le PDF », puis imprimez le fichier."); }
    }, 150));
  }

  function telecharger() {
    if (!pdf) return;
    const url = URL.createObjectURL(pdf);
    const a = document.createElement("a");
    a.href = url; a.download = NOM_PDF; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async function imprimer() {
    if (!places.length) return;
    setErr("");
    const cases = places.map((p) => p.case);
    if (apple) {
      if (!pdf) { setErr("La feuille se prépare… réessayez dans une seconde."); return; }
      if (navigator.canShare?.({ files: [pdf] })) {
        try { await navigator.share({ files: [pdf], title: "Étiquettes d'adresse" }); setAttente(cases); }
        catch (e) { if (e?.name !== "AbortError") setErr("Le menu Partager n'a pas pu s'ouvrir. Réessayez ; si ça recommence, imprimez depuis un ordinateur."); }
        return;
      }
    }
    imprimerCadre();
    setAttente(cases);
  }
  function confirmerSortie() { const cs = attente || []; setUsed((u) => u.map((v, k) => v || cs.includes(k))); setAttente(null); }

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "60px 16px" }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)" }}>Étiquettes d&apos;adresse</h1>
        <p style={{ color: "var(--ink-soft)" }}>Espace réservé. Entrez le mot de passe de gestion.</p>
        <form onSubmit={(e) => { e.preventDefault(); load(keyInput.trim()); }} style={{ display: "grid", gap: 10 }}>
          <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="Mot de passe" style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
          <button className="btn btn-gold" type="submit">Entrer</button>
          {err ? <div className="notice">{err}</div> : null}
        </form>
      </div>
    );
  }

  const libresAvant = used.filter((u) => !u).length;
  return (
    <div className="etq-page">
      <PageHead eyebrow="Commandes" title="Étiquettes d'adresse"
        actions={<Link href="/gestion/commandes" className="btn btn-outline etq-retour">‹ Retour aux commandes</Link>}
        subtitle="Pour les envois par La Poste : l'adresse s'imprime sur vos planches de 20 étiquettes carrées (45 × 45 mm, 4 colonnes × 5 lignes). Touchez les cases déjà décollées sur votre feuille : l'impression ira sur les cases libres."
        kpis={[
          { label: "Cochées", value: String(choisies.length) },
          { label: "Étiquettes à imprimer", value: String(jobs.length) },
          { label: "Cases libres sur la feuille", value: String(libresAvant), tone: libresAvant < jobs.length ? "warn" : undefined },
        ]} />
      {err ? <div className="notice" style={{ marginBottom: 12 }}>{err}</div> : null}

      <style dangerouslySetInnerHTML={{ __html: `.etq-cell,.etq-modele .vue{--u:var(--mm)}${cssModeles()}` }} />
      <div className="etq-grid">
        <div>
          <section className="etq-card" aria-labelledby="etq-t1">
            <h2 id="etq-t1"><span className="n">1</span>Les commandes à étiqueter</h2>
            <p className="sub">Toutes les commandes avec une adresse (points relais et express compris : c&apos;est l&apos;adresse de la cliente qui s&apos;imprime).</p>
            <label className="etq-toggle"><input type="checkbox" checked={toutes} onChange={(e) => setToutes(e.target.checked)} /> Montrer aussi les commandes déjà expédiées (30 derniers jours)</label>
            {liste.length ? liste.map((o) => {
              const m = modeEnvoi(o), on = coches.includes(o.id) && m.ok, a = o.shippingAddress || {};
              return (
                <label key={o.id} className={`etq-ord${on ? " on" : ""}${m.ok ? "" : " off"}`}>
                  <input type="checkbox" checked={on} disabled={!m.ok} onChange={() => basculer(o.id)} />
                  <span><span className="nm">#{o.ref} · {o.shippingName || o.customerName || "—"}</span><br />
                    <span className="ad">{[a.line1, [a.postal_code, a.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "Adresse non renseignée"} · {dateFr(o.createdAt)}</span></span>
                  <span className={`chip ${m.ok ? "poste" : "relais"}`}>{m.chip}</span>
                </label>
              );
            }) : <p className="sub">Aucune commande à expédier pour le moment.</p>}
          </section>

          <section className="etq-card" aria-labelledby="etq-tmain">
            <h2 id="etq-tmain"><span className="n">+</span>Une adresse à la main (Etsy ou autre)</h2>
            <p className="sub">Collez l&apos;adresse telle qu&apos;elle est : le nom sur la 1re ligne, puis la rue, puis le code postal et la ville. Elle s&apos;imprime comme les autres.</p>
            <textarea className="etq-colle" rows={4} value={colle} onChange={(e) => setColle(e.target.value)} placeholder={"LOUVAT Laure\n610 route des Sablons\n26740 MARSANNE\nFrance"} style={{ width: "100%", boxSizing: "border-box", font: "inherit", padding: "8px 10px", borderRadius: 10, border: "1px solid var(--line)" }} />
            <button type="button" className="btn btn-gold" style={{ marginTop: 8 }} disabled={!adresseCollee(colle)} onClick={() => { const a = adresseCollee(colle, `m${Date.now()}`); if (a) { setManuelles((m) => [...m, a]); setColle(""); } }}>Ajouter à la feuille</button>
            {manuelles.map((o) => {
              const a = o.shippingAddress;
              return (
                <div key={o.id} className="etq-ord on" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <span style={{ minWidth: 0, flex: 1 }}><span className="nm">{o.shippingName}</span><br />
                    <span className="ad">{[a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</span></span>
                  <button type="button" className="btn btn-outline" style={{ padding: "4px 10px" }} onClick={() => setManuelles((m) => m.filter((x) => x.id !== o.id))}>Retirer</button>
                </div>
              );
            })}
          </section>

          <section className="etq-card" aria-labelledby="etq-t2">
            <h2 id="etq-t2"><span className="n">2</span>L&apos;expéditeur</h2>
            <p className="sub">Votre adresse de retour, si La Poste doit renvoyer le colis.</p>
            <div className="etq-opts">
              {[["meme", "En bas de chaque étiquette", "En petit, sous l'adresse : une seule case par envoi."],
                ["apart", "Sur une étiquette à part", "Une case pour le destinataire, une case pour vous, à coller au dos."],
                ["non", "Pas d'expéditeur", "Seulement l'adresse de la cliente."]].map(([v, t, s]) => (
                <label key={v} className={`etq-opt${mode === v ? " on" : ""}`}>
                  <input type="radio" name="etq-exp" value={v} checked={mode === v} onChange={() => setMode(v)} />
                  <span><b>{t}</b><small>{s}</small></span>
                </label>
              ))}
            </div>
            <label className="etq-toggle" style={{ marginTop: 12 }}><input type="checkbox" checked={avecRef} onChange={(e) => setAvecRef(e.target.checked)} /> Ajouter le numéro de commande (en petit, en bas de l&apos;étiquette)</label>
            <label className="etq-f" htmlFor="etq-exp-txt">Adresse de l&apos;expéditeur (gardée pour la prochaine fois)</label>
            <textarea id="etq-exp-txt" value={expTxt} onChange={(e) => setExpTxt(e.target.value)} rows={4} />
          </section>

          <section className="etq-card" aria-labelledby="etq-tm">
            <h2 id="etq-tm"><span className="n">✦</span>Le style de l&apos;étiquette</h2>
            <p className="sub">Changez quand vous voulez : le choix est gardé pour la prochaine fois. L&apos;adresse reste toujours en noir.</p>
            <div className="etq-modeles">
              {MODELES.map((md) => (
                <label key={md.id} className={`etq-modele${modele === md.id ? " on" : ""}`}>
                  <input type="radio" name="etq-modele" value={md.id} checked={modele === md.id} onChange={() => setModele(md.id)} />
                  <span className="vue" aria-hidden="true" dangerouslySetInnerHTML={{ __html: contenuEtiquette({ type: "dest", ad: { nom: "Camille Moreau", lignes: ["12 rue des Lilas"], cpVille: "69003 LYON", pays: "", ref: "" }, exp: false, ref: false }, expTxt, logo?.data, md.id) }} />
                  <span className="txt"><b>{md.nom}</b><small>{md.desc}</small></span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <section className="etq-card etq-sheetbox" aria-labelledby="etq-t3">
          <h2 id="etq-t3"><span className="n">3</span>Où imprimer sur la feuille</h2>
          <div className="etq-tools">
            <button type="button" className="btn btn-outline" onClick={() => { setAttente(null); setUsed(new Array(NB_CASES).fill(false)); }}>Feuille neuve</button>
            <button type="button" className="btn btn-outline" onClick={() => { const k = used.indexOf(false); if (k >= 0) caseUtilisee(k); }}>Décaler d&apos;une case</button>
          </div>
          <div className="etq-print">
            <button type="button" className="btn btn-gold" disabled={!places.length} onClick={imprimer}>🖨️ Imprimer {places.length ? `(${places.length})` : ""}</button>
            {apple ? null : <button type="button" className="btn btn-outline" disabled={!pdf} onClick={telecharger}>Enregistrer le PDF</button>}
            <p className="sub">{apple
              ? <>Sur iPhone : touchez <b>Imprimer</b>, le menu Partager s&apos;ouvre → choisissez <b>Imprimer</b> → votre imprimante → <b>Imprimer</b>. Vous revenez ici ensuite.</>
              : <>La fenêtre d&apos;impression s&apos;ouvre : choisissez votre imprimante, échelle <b>100 %</b> (taille réelle), puis Imprimer.</>}</p>
          </div>
          <div className="etq-legend"><span><i className="l-free" />Libre</span><span><i className="l-used" />Déjà utilisée (touchez pour changer)</span><span><i className="l-print" />Sera imprimée</span></div>
          {attente ? (
            <div className="etq-status ok" role="status">
              Les étiquettes sont bien sorties ? <button type="button" className="btn btn-gold" onClick={confirmerSortie}>Oui, griser ces cases</button>{" "}
              <button type="button" className="btn btn-outline" onClick={() => setAttente(null)}>Non</button>{" "}
              <Link href="/gestion/commandes" className="btn btn-outline">Retour aux commandes</Link>
            </div>
          ) : (
            <div className={`etq-status${manque ? " warn" : ""}`} role="status">
              {!jobs.length ? "Cochez au moins une commande à gauche."
                : manque ? `Il manque ${manque} case${manque > 1 ? "s" : ""} libre${manque > 1 ? "s" : ""} sur cette feuille : imprimez ces étiquettes, puis les suivantes sur une feuille neuve.`
                : <><b>{jobs.length} étiquette{jobs.length > 1 ? "s" : ""}</b> à imprimer, à partir de la case <b>{places[0].case + 1}</b>. Il restera {libresApres} case{libresApres > 1 ? "s" : ""} libre{libresApres > 1 ? "s" : ""} après.</>}
            </div>
          )}
          <div className="etq-paper" ref={papier} aria-label="Feuille A4, 20 étiquettes">
            {pos.map((p, i) => {
              const pl = parCase[i];
              return (
                <button key={i} type="button" className={`etq-cell${used[i] ? " used" : ""}${pl ? " print" : ""}`}
                  style={{ left: `calc(${p.x} * var(--mm))`, top: `calc(${p.y} * var(--mm))` }}
                  aria-label={`Case ${i + 1}${used[i] ? ", déjà utilisée" : pl ? ", sera imprimée" : ", libre"}`}
                  onClick={() => caseUtilisee(i)}>
                  {pl ? <span className="lab" dangerouslySetInnerHTML={{ __html: contenuEtiquette(pl, expTxt, logo?.data, modele) }} /> : null}
                  <span className="pos">{i + 1}</span>
                </button>
              );
            })}
          </div>
          <p className="sub" style={{ textAlign: "center", margin: 0 }}>A4 210 × 297 mm · marges haut {FEUILLE.mt}, bas {FEUILLE.mb}, gauche {FEUILLE.ml}, droite {FEUILLE.mr} mm · étiquettes {FEUILLE.w} × {FEUILLE.h} mm · {FEUILLE.gx} mm entre les cases</p>
          <p className="sub" style={{ margin: 0 }}>À l&apos;impression : <b>taille réelle (100 %)</b>, pas « ajuster à la page », sans marges. Faites un premier essai sur une feuille blanche posée contre la planche pour vérifier l&apos;alignement.</p>
        </section>
      </div>
    </div>
  );
}
