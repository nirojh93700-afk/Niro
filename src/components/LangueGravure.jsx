"use client";
// « Langue de la gravure » : sous le champ du texte, comme la maquette v5 enregistrée le 06/11/2026
// (mise en ligne le 07/11/2026). Français par défaut = rien ne change. Une autre langue : la cliente
// écrit en français, le site traduit (phrases de la liste, sinon Claude), elle relit et coche la case
// obligatoire — sans la case, le bouton « Ajouter au panier » reste grisé et le paiement refuse.
import { useEffect, useId, useRef, useState } from "react";
import {
  LANGUES, MENTION_TRAD, langueDe, langueActive, estTraduit, phraseConnue,
} from "@/lib/traductionGravure";
import { chargerPoliceLangue, classeLangue } from "@/lib/policeLangueClient";

/** Valeur à montrer dans le champ du texte (le français tapé quand le texte est traduit). */
export function valeurChampTexte(fv) {
  return estTraduit(fv) ? fv.texteSource || "" : fv.texte || "";
}
/** Ce que la frappe écrit dans les champs. */
export function patchChampTexte(fv, v) {
  return estTraduit(fv) ? { texteSource: v, texte: "", tradOk: "" } : { texte: v, tradOk: "" };
}

// Menu de la langue (09/11/2026, gérant : « cherche un peu partout », puis « trop chargé, pas de
// “même alphabet”, les clientes n'ont pas besoin de savoir ») : Français en tête, puis les langues
// par ordre alphabétique, chacune avec son nom écrit dans la langue (Español, Deutsch, العربية…),
// jamais de drapeau (un drapeau = un pays). Clavier : flèches, Entrée, Échap.
const ORDRE = [langueDe("fr"), ...LANGUES.filter((l) => l.code !== "fr")];

function LigneLangue({ l }) {
  return (
    <>
      <b className="ml-nom">{l.nom}</b>
      {l.natif && l.natif !== l.nom && <small className="ml-natif" lang={l.code} dir={l.dir}>{l.natif}</small>}
    </>
  );
}

function ChoixLangue({ code, onChoix }) {
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

export default function LangueGravure({ fv, setFieldValues }) {
  const code = fv.langue && langueDe(fv.langue) ? fv.langue : "fr";
  const L = langueDe(code);
  const traduit = estTraduit(fv);
  const source = String(fv.texteSource || "").trim();
  const grave = String(fv.texte || "").trim();
  const [etat, setEtat] = useState("");
  const tour = useRef(0);
  const set = (patch) => setFieldValues((prev) => ({ ...prev, ...patch }));

  // Écriture de la langue (aperçu) : seulement les lettres du texte.
  useEffect(() => { if (langueActive(fv) && grave) chargerPoliceLangue(code, grave + "0123456789."); }, [code, grave]); // eslint-disable-line react-hooks/exhaustive-deps

  // Traduction : liste d'abord, sinon le site (Claude), 0,5 s après la dernière frappe.
  useEffect(() => {
    if (!traduit || !source) { setEtat(""); return; }
    if (grave) { setEtat(MENTION_TRAD); return; }
    const connue = phraseConnue(source, code);
    if (connue) { setFieldValues((p) => (p.texteSource === fv.texteSource && p.langue === code ? { ...p, texte: connue } : p)); setEtat(MENTION_TRAD); return; }
    const mon = ++tour.current;
    setEtat("Traduction en cours…");
    const t = setTimeout(() => {
      fetch("/api/traduire", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texte: source, langue: code }) })
        .then((r) => r.json())
        .then((r) => {
          if (mon !== tour.current) return;
          if (r.ok && r.texte) {
            setFieldValues((p) => (String(p.texteSource || "").trim() === source && p.langue === code && p.direct !== "oui" ? { ...p, texte: r.texte } : p));
            setEtat(MENTION_TRAD);
          } else setEtat("La traduction n'a pas répondu, réessayez.");
        })
        .catch(() => { if (mon === tour.current) setEtat("La traduction n'a pas répondu, réessayez."); });
    }, 500);
    return () => clearTimeout(t);
  }, [traduit, source, code]); // eslint-disable-line react-hooks/exhaustive-deps

  function choisirLangue(c) {
    if (c === code) return;
    setFieldValues((p) => {
      const tape = estTraduit(p) ? p.texteSource || "" : p.texte || "";
      if (c === "fr") return { ...p, langue: "", direct: "", tradOk: "", texteSource: "", texte: tape };
      if (p.direct === "oui") return { ...p, langue: c, tradOk: "", texteSource: "", texte: tape };
      return { ...p, langue: c, tradOk: "", texteSource: tape, texte: "" };
    });
  }
  function basculerDirect(on) {
    setFieldValues((p) => {
      if (on) return { ...p, direct: "oui", tradOk: "", texte: p.texteSource || p.texte || "", texteSource: "" };
      return { ...p, direct: "", tradOk: "", texteSource: p.texte || "", texte: "" };
    });
  }

  const nom = L.nom.toLowerCase();
  const Le = /^[aeiouéèh]/.test(nom) ? "L'" : "Le ";
  const note = code === "fr"
    ? "Votre texte est gravé tel que vous l'écrivez."
    : fv.direct === "oui"
      ? `Écrivez votre texte en ${nom} : il est gravé tel quel.`
      : `Écrivez en français, nous le traduisons en ${nom}.${L.police ? ` ${Le}${nom} a son propre alphabet : le choix « Écriture » plus bas ne change pas ce texte.` : ""}`;
  const cls = classeLangue(code);
  const attente = traduit && grave && fv.tradOk !== "oui";

  return (
    <div className="field mqt-langue">
      <span className="ml-label">Langue de la gravure</span>
      <ChoixLangue code={code} onChoix={choisirLangue} />
      <p className="mqt-note">{note}</p>
      {code !== "fr" && (
        <label className="mqt-swap">
          <input type="checkbox" checked={fv.direct === "oui"} onChange={(e) => basculerDirect(e.target.checked)} />
          <span>J&apos;écris directement mon texte dans cette langue (pas de traduction)</span>
        </label>
      )}
      {traduit && source && (
        <div className="mqt-trad">
          <div className="mqt-two">
            <div><small>Vous avez écrit</small><b>{source}</b></div>
            <div><small>Gravé en {nom}</small><b className={cls} dir={L.dir}>{grave || "…"}</b></div>
          </div>
          <p className={`mqt-etat${/pas répondu/.test(etat) ? " ko" : ""}`}>{etat}</p>
          <p className="mqt-conseil">Un doute ? Faites-le relire par une personne qui parle cette langue avant de commander.</p>
          <label className={`mqt-check${attente ? " attend" : ""}${grave ? "" : " off"}`}>
            <input type="checkbox" disabled={!grave} checked={fv.tradOk === "oui"} onChange={(e) => set({ tradOk: e.target.checked ? "oui" : "" })} />
            <span><b>J&apos;ai relu le texte traduit et je confirme qu&apos;il est exact.</b> Il sera gravé exactement comme il s&apos;affiche ci-dessus et ne pourra plus être modifié.</span>
          </label>
        </div>
      )}
    </div>
  );
}
