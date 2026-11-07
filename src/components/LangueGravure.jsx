"use client";
// « Langue de la gravure » : sous le champ du texte, comme la maquette v5 enregistrée le 06/11/2026
// (mise en ligne le 07/11/2026). Français par défaut = rien ne change. Une autre langue : la cliente
// écrit en français, le site traduit (phrases de la liste, sinon Claude), elle relit et coche la case
// obligatoire — sans la case, le bouton « Ajouter au panier » reste grisé et le paiement refuse.
import { useEffect, useRef, useState } from "react";
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
  const note = code === "fr"
    ? "Votre texte est gravé tel que vous l'écrivez."
    : fv.direct === "oui"
      ? `Écrivez votre texte en ${nom} : il est gravé tel quel.`
      : `Écrivez en français, nous le traduisons en ${nom}.${L.police ? ` Le ${nom} a son propre alphabet : le choix « Écriture » plus bas ne change pas ce texte.` : ""}`;
  const cls = classeLangue(code);
  const attente = traduit && grave && fv.tradOk !== "oui";

  return (
    <div className="field mqt-langue">
      <label>Langue de la gravure</label>
      <div className="mqt-langs">
        {LANGUES.map((l) => (
          <button type="button" key={l.code} className={`mqt-lang${code === l.code ? " on" : ""}`} onClick={() => choisirLangue(l.code)}>{l.nom}</button>
        ))}
      </div>
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
