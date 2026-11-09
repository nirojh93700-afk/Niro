"use client";
// « Langue de la gravure » : sous le champ du texte, comme la maquette v5 enregistrée le 06/11/2026
// (mise en ligne le 07/11/2026). Français par défaut = rien ne change. Une autre langue : la cliente
// écrit en français, le site traduit (phrases de la liste, sinon Claude), elle relit et coche la case
// obligatoire — sans la case, le bouton « Ajouter au panier » reste grisé et le paiement refuse.
import { useEffect, useId, useRef, useState } from "react";
import {
  LANGUES, MENTION_TRAD, langueDe, langueActive, estTraduit, phraseConnue, cleSource,
} from "@/lib/traductionGravure";
import { chargerPoliceLangue, classeLangue } from "@/lib/policeLangueClient";

/** Valeur à montrer dans le champ du texte k (le français tapé quand le texte est traduit). */
export function valeurChampTexte(fv, k = "texte") {
  return estTraduit(fv) ? fv[cleSource(k)] || "" : fv[k] || "";
}
/** Ce que la frappe écrit dans les champs. */
export function patchChampTexte(fv, v, k = "texte") {
  return estTraduit(fv) ? { [cleSource(k)]: v, [k]: "", tradOk: "" } : { [k]: v, tradOk: "" };
}

// Menu de la langue (09/11/2026, gérant : « cherche un peu partout », puis « trop chargé, pas de
// “même alphabet”, les clientes n'ont pas besoin de savoir ») : Français en tête, puis les langues
// par ordre alphabétique, chacune avec son nom écrit dans la langue (Español, Deutsch, العربية…),
// jamais de drapeau (un drapeau = un pays). Clavier : flèches, Entrée, Échap.
const ORDRE_TOUT = [langueDe("fr"), ...LANGUES.filter((l) => l.code !== "fr")];
// Lettres empilées à la verticale (Collier Quatre Mots, pendentif) : seulement l'alphabet latin (09/11/2026).
const ORDRE_LATIN = ORDRE_TOUT.filter((l) => !l.police);

function LigneLangue({ l }) {
  return (
    <>
      <b className="ml-nom">{l.nom}</b>
      {l.natif && l.natif !== l.nom && <small className="ml-natif" lang={l.code} dir={l.dir}>{l.natif}</small>}
    </>
  );
}

function ChoixLangue({ code, onChoix, latin = false }) {
  const ORDRE = latin ? ORDRE_LATIN : ORDRE_TOUT;
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(0);
  const id = useId();
  const boite = useRef(null);
  const liste = useRef(null);
  const L = langueDe(code);
  useEffect(() => {
    if (!ouvert) return;
    setActif(Math.max(0, ORDRE.findIndex((l) => l.code === code)));
    const dehors = (e) => { if (boite.current && !boite.current.contains(e.target)) setOuvert(false); };
    document.addEventListener("pointerdown", dehors);
    return () => document.removeEventListener("pointerdown", dehors);
  }, [ouvert]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ouvert) liste.current?.querySelector(`[data-i="${actif}"]`)?.scrollIntoView({ block: "nearest" }); }, [ouvert, actif]);
  const choisir = (c) => { onChoix(c); setOuvert(false); boite.current?.querySelector("button")?.focus(); };
  function clavier(e) {
    if (!ouvert && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); setOuvert(true); return; }
    if (!ouvert) return;
    if (e.key === "Escape") { e.preventDefault(); setOuvert(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActif((i) => Math.min(ORDRE.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActif((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choisir(ORDRE[actif].code); }
    else if (e.key === "Tab") setOuvert(false);
  }
  const option = (l) => {
    const i = ORDRE.indexOf(l);
    return (
      <li key={l.code} id={`${id}-${l.code}`} role="option" aria-selected={l.code === code} data-i={i}
        className={`ml-opt${l.code === code ? " on" : ""}${i === actif ? " act" : ""}`}
        onMouseEnter={() => setActif(i)} onClick={() => choisir(l.code)}>
        <LigneLangue l={l} />
        <span className="ml-coche" aria-hidden="true">{l.code === code ? "✓" : ""}</span>
      </li>
    );
  };
  return (
    <div className={`ml${ouvert ? " ouvert" : ""}`} ref={boite} onKeyDown={clavier}>
      <button type="button" className={`ml-btn${code !== "fr" ? " on" : ""}`} aria-haspopup="listbox" aria-expanded={ouvert}
        aria-controls={`${id}-liste`} aria-activedescendant={ouvert ? `${id}-${ORDRE[actif].code}` : undefined}
        aria-label={`Langue de la gravure : ${L.nom}`} onClick={() => setOuvert((o) => !o)}>
        <span className="ml-globe" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg></span>
        <span className="ml-val"><b>{L.nom}{code === "fr" ? " (par défaut)" : ""}</b>{code !== "fr" && L.natif && <small lang={L.code} dir={L.dir}>{L.natif}</small>}</span>
        <span className="ml-fleche" aria-hidden="true" />
      </button>
      {ouvert && (
        <div className="ml-panneau">
          <ul className="ml-liste" role="listbox" id={`${id}-liste`} aria-label="Langue de la gravure" ref={liste}>
            {ORDRE.map(option)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function LangueGravure({ fv, setFieldValues, cles = null, latin = false }) {
  // cles = [{ key, label }] : les textes de la pièce (absent = le seul « texte » du parcours des verres).
  const multi = Boolean(cles && cles.length);
  const champs = multi ? cles : [{ key: "texte", label: "" }];
  const liste = champs.map((c) => c.key);
  const cleListe = liste.join(",");
  const code = fv.langue && langueDe(fv.langue) ? fv.langue : "fr";
  const L = langueDe(code);
  const traduit = estTraduit(fv);
  const lignes = champs.map((c) => ({ ...c, source: String(fv[cleSource(c.key)] || "").trim(), grave: String(fv[c.key] || "").trim() }));
  const sig = JSON.stringify(lignes.map((l) => l.source));
  const tousGraves = lignes.map((l) => l.grave).join("");
  const [etat, setEtat] = useState("");
  const tour = useRef(0);
  const set = (patch) => setFieldValues((prev) => ({ ...prev, ...patch }));

  // La langue s'applique à tous les textes de la pièce : on note lesquels (atelier, paiement).
  useEffect(() => {
    if (multi && langueActive(fv) && fv.langueCles !== cleListe) set({ langueCles: cleListe });
  }, [multi, code, cleListe]); // eslint-disable-line react-hooks/exhaustive-deps

  // Écriture de la langue (aperçu) : seulement les lettres des textes.
  useEffect(() => { if (langueActive(fv) && tousGraves) chargerPoliceLangue(code, tousGraves + "0123456789."); }, [code, tousGraves]); // eslint-disable-line react-hooks/exhaustive-deps

  // Traduction : liste d'abord, sinon le site (Claude), 0,5 s après la dernière frappe ; un texte après l'autre.
  useEffect(() => {
    if (!traduit || !lignes.some((l) => l.source)) { setEtat(""); return; }
    const aFaire = lignes.filter((l) => l.source && !l.grave);
    if (!aFaire.length) { setEtat(MENTION_TRAD); return; }
    const connues = {};
    const reste = [];
    for (const l of aFaire) { const c = phraseConnue(l.source, code); if (c) connues[l.key] = c; else reste.push(l); }
    if (Object.keys(connues).length) {
      setFieldValues((p) => {
        if (p.langue !== code) return p;
        const ok = Object.fromEntries(Object.entries(connues).filter(([k]) => String(p[cleSource(k)] || "").trim() === aFaire.find((l) => l.key === k).source));
        return { ...p, ...ok };
      });
    }
    if (!reste.length) { setEtat(MENTION_TRAD); return; }
    const mon = ++tour.current;
    setEtat("Traduction en cours…");
    const t = setTimeout(async () => {
      let rate = false;
      for (const l of reste) {
        try {
          const r = await fetch("/api/traduire", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texte: l.source, langue: code }) }).then((x) => x.json());
          if (mon !== tour.current) return;
          if (r.ok && r.texte) setFieldValues((p) => (String(p[cleSource(l.key)] || "").trim() === l.source && p.langue === code && p.direct !== "oui" ? { ...p, [l.key]: r.texte } : p));
          else rate = true;
        } catch { rate = true; }
      }
      if (mon === tour.current) setEtat(rate ? "La traduction n'a pas répondu, réessayez." : MENTION_TRAD);
    }, 500);
    return () => clearTimeout(t);
  }, [traduit, sig, code]); // eslint-disable-line react-hooks/exhaustive-deps

  function choisirLangue(c) {
    if (c === code) return;
    setFieldValues((p) => {
      const n = { ...p, tradOk: "" };
      for (const k of liste) {
        const tape = estTraduit(p) ? p[cleSource(k)] || "" : p[k] || "";
        if (c === "fr" || p.direct === "oui") { n[k] = tape; n[cleSource(k)] = ""; }
        else { n[cleSource(k)] = tape; n[k] = ""; }
      }
      if (c === "fr") return { ...n, langue: "", direct: "", ...(multi ? { langueCles: "" } : {}) };
      return { ...n, langue: c, ...(multi ? { langueCles: cleListe } : {}) };
    });
  }
  function basculerDirect(on) {
    setFieldValues((p) => {
      const n = { ...p, direct: on ? "oui" : "", tradOk: "" };
      for (const k of liste) {
        if (on) { n[k] = p[cleSource(k)] || p[k] || ""; n[cleSource(k)] = ""; }
        else { n[cleSource(k)] = p[k] || ""; n[k] = ""; }
      }
      return n;
    });
  }

  const nom = L.nom.toLowerCase();
  const Le = /^[aeiouéèh]/.test(nom) ? "L'" : "Le ";
  const plusieurs = multi && liste.length > 1;
  const note = code === "fr"
    ? (plusieurs ? "Vos textes sont gravés tels que vous les écrivez." : "Votre texte est gravé tel que vous l'écrivez.")
    : fv.direct === "oui"
      ? `Écrivez ${plusieurs ? "vos textes" : "votre texte"} en ${nom} : ${plusieurs ? "ils sont gravés tels quels" : "il est gravé tel quel"}.`
      : `Écrivez en français, nous traduisons en ${nom}.${L.police ? ` ${Le}${nom} a son propre alphabet : le choix « Écriture » ne change pas ${plusieurs ? "ces textes" : "ce texte"}.` : ""}`;
  const cls = classeLangue(code);
  const aRelire = lignes.filter((l) => l.source);
  const toutTraduit = aRelire.length > 0 && aRelire.every((l) => l.grave);
  const attente = traduit && toutTraduit && fv.tradOk !== "oui";
  const deux = aRelire.length > 1;

  return (
    <div className="field mqt-langue">
      <span className="ml-label">Langue de la gravure</span>
      <ChoixLangue code={code} onChoix={choisirLangue} latin={latin} />
      <p className="mqt-note">{note}</p>
      {code !== "fr" && (
        <label className="mqt-swap">
          <input type="checkbox" checked={fv.direct === "oui"} onChange={(e) => basculerDirect(e.target.checked)} />
          <span>J&apos;écris directement {plusieurs ? "mes textes" : "mon texte"} dans cette langue (pas de traduction)</span>
        </label>
      )}
      {traduit && aRelire.length > 0 && (
        <div className="mqt-trad">
          {aRelire.map((l) => (
            <div className="mqt-two" key={l.key}>
              <div><small>{plusieurs && l.label ? `${l.label} · vous avez écrit` : "Vous avez écrit"}</small><b>{l.source}</b></div>
              <div><small>Gravé en {nom}</small><b className={cls} dir={L.dir}>{l.grave || "…"}</b></div>
            </div>
          ))}
          <p className={`mqt-etat${/pas répondu/.test(etat) ? " ko" : ""}`}>{etat}</p>
          <p className="mqt-conseil">Un doute ? Faites-le relire par une personne qui parle cette langue avant de commander.</p>
          <label className={`mqt-check${attente ? " attend" : ""}${toutTraduit ? "" : " off"}`}>
            <input type="checkbox" disabled={!toutTraduit} checked={fv.tradOk === "oui"} onChange={(e) => set({ tradOk: e.target.checked ? "oui" : "" })} />
            <span><b>J&apos;ai relu {deux ? "les textes traduits et je confirme qu'ils sont exacts" : "le texte traduit et je confirme qu'il est exact"}.</b> {deux ? "Ils seront gravés exactement comme ils s'affichent" : "Il sera gravé exactement comme il s'affiche"} ci-dessus et ne {deux ? "pourront" : "pourra"} plus être modifié{deux ? "s" : ""}.</span>
          </label>
        </div>
      )}
    </div>
  );
}
