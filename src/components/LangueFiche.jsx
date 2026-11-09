"use client";
// « Langue de la gravure » pour les fiches à part (carnet, marque-pages — 09/11/2026). Ces fiches rangent
// leurs textes dans des emplacements ({ t: texte GRAVÉ, ts: français tapé }) et non dans des champs à plat :
// ce composant fait le pont et affiche le MÊME bloc que partout (LangueGravure : menu, traduction, case
// « J'ai relu… »). UNE langue pour toute la pièce.
//   lg      = { langue, direct, tradOk }           (état de la fiche)
//   textes  = [{ key, label, t, ts }]              (tous les textes de la pièce, vides compris)
//   ecrire  = (key, { t, ts }) => …                (écrit dans l'emplacement)
// Une date, un numéro (aucune lettre) ne passe jamais par la traduction : il reste gravé tel quel.
import { useEffect, useRef } from "react";
import LangueGravure from "./LangueGravure";
import { cleSource, estTraduit, aDesLettres } from "@/lib/traductionGravure";

export default function LangueFiche({ lg, setLg, textes, ecrire }) {
  const fv = { langue: lg.langue || "", direct: lg.direct || "", tradOk: lg.tradOk || "" };
  for (const x of textes) { fv[x.key] = x.t || ""; fv[cleSource(x.key)] = x.ts || ""; }
  const etat = useRef(null);
  etat.current = { fv, textes, ecrire, setLg };

  // LangueGravure écrit dans des champs à plat : on reporte chaque changement dans la fiche.
  const setFv = useRef((u) => {
    const { fv: prev, textes: ts, ecrire: ec, setLg: sl } = etat.current;
    const next = typeof u === "function" ? u(prev) : { ...prev, ...u };
    if (!next || next === prev) return;
    etat.current = { ...etat.current, fv: next };
    if (["langue", "direct", "tradOk"].some((k) => (next[k] || "") !== (prev[k] || ""))) {
      sl({ langue: next.langue || "", direct: next.direct || "", tradOk: next.tradOk || "" });
    }
    for (const x of ts) {
      const s = cleSource(x.key);
      if ((next[x.key] || "") !== (prev[x.key] || "") || (next[s] || "") !== (prev[s] || "")) ec(x.key, { t: next[x.key] || "", ts: next[s] || "" });
    }
  }).current;

  // Un texte resté sans son français tapé alors que la pièce est traduite (copié d'une autre pièce…) : il repart en traduction.
  const orphelins = estTraduit(lg) ? textes.filter((x) => !x.ts && aDesLettres(x.t)).map((x) => x.key).join(",") : "";
  useEffect(() => {
    if (!orphelins) return;
    const { textes: ts, ecrire: ec } = etat.current;
    for (const x of ts) if (!x.ts && aDesLettres(x.t)) ec(x.key, { t: "", ts: x.t });
  }, [orphelins]);

  const cles = textes.filter((x) => aDesLettres(x.ts || x.t)).map(({ key, label }) => ({ key, label }));
  return <LangueGravure fv={fv} setFieldValues={setFv} cles={cles.length ? cles : null} />;
}
