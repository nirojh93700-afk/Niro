"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Carte from "./Carte";
import { Ic } from "./icones";

// « Trouver le bon cadeau en deux étapes » (maquette « Mélange », 09/10/2026) :
// ① Pour qui ? ② Pour quelle occasion ? Tuiles photo de pièces gravées, une
// seule par étape, grisées quand elles ne donneraient aucun résultat. Les fêtes
// à venir (3 mois, nom seul) s'ajoutent toutes seules en tête des occasions.
const FETES_PHOTO_DEFAUT = {};

function nthSunday(y, m, n) { const d = new Date(y, m, 1); const off = (7 - d.getDay()) % 7; return new Date(y, m, 1 + off + 7 * (n - 1)); }
function lastSunday(y, m) { const d = new Date(y, m + 1, 0); return new Date(y, m, d.getDate() - d.getDay()); }
function paques(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mo = Math.floor((h + l - 7 * m + 114) / 31) - 1, da = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mo, da);
}
function fetesDe(y) {
  let fm = lastSunday(y, 4);
  const pent = new Date(paques(y)); pent.setDate(pent.getDate() + 49);
  if (fm.getTime() === pent.getTime()) fm = nthSunday(y, 5, 1);
  return [
    { n: "Noël", o: "noel", d: new Date(y, 11, 25) },
    { n: "Saint-Valentin", o: "amour", d: new Date(y, 1, 14) },
    { n: "Fête des grands-mères", o: "pour-elle famille", d: nthSunday(y, 2, 1) },
    { n: "Fête des mères", o: "pour-elle famille", d: fm },
    { n: "Fête des pères", o: "pour-lui famille", d: nthSunday(y, 5, 3) },
  ];
}
export function prochainesFetes(now = new Date()) {
  now = new Date(now); now.setHours(0, 0, 0, 0);
  const y = now.getFullYear();
  const all = [...fetesDe(y), ...fetesDe(y + 1)].filter((f) => f.d >= now).sort((a, b) => a.d - b.d);
  const seen = {}, res = [];
  for (const f of all) if (!seen[f.n] && (f.d - now) / 864e5 <= 92) { seen[f.n] = 1; res.push(f); }
  return res;
}

const has = (list, val) => String(val || "").split(" ").some((v) => v && list.includes(v));
export const matchCarte = (c, sel) => {
  if (sel.qui && !has(c.qui, sel.qui)) return false;
  if (sel.occ && !has(c.occ, sel.occ)) return false;
  if (sel.budget) { const [lo, hi] = sel.budget.split("-").map(Number); if (c.hi < lo || c.lo >= hi) return false; }
  return true;
};

function Tuile({ k, v, label, image, on, off, onClick }) {
  return (
    <button className={`ft${on ? " on" : ""}${off ? " off" : ""}`} type="button" data-k={k} data-v={v} aria-pressed={on ? "true" : "false"} disabled={off} onClick={onClick}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ft-ph" src={image} alt="" aria-hidden="true" loading="lazy" />
      <span className="ft-l">{label}</span>
      <i className="ft-chk"><Ic n="check" /></i>
    </button>
  );
}

export default function Finder({ qui, occ, fetePhotos = FETES_PHOTO_DEFAUT, cards, limit = 8, initial = {}, page = false }) {
  const [sel, setSel] = useState({ qui: initial.qui || "", occ: initial.occ || "" });
  const [fetes, setFetes] = useState([]);
  useEffect(() => { setFetes(prochainesFetes()); }, []);
  // Occasions : les fêtes à venir d'abord, puis les fixes (sans doublon).
  const occTiles = useMemo(() => {
    const f = fetes.map((x) => ({ v: x.o, label: x.n, image: fetePhotos[x.o] || occ[0]?.image }));
    const vus = new Set(f.map((x) => x.v));
    return [...f, ...occ.filter((o) => !vus.has(o.v))];
  }, [fetes, occ, fetePhotos]);
  const actif = !!(sel.qui || sel.occ);
  const ok = useMemo(() => (actif ? cards.filter((c) => matchCarte(c, sel)) : []), [cards, sel, actif]);
  const isOff = (k, v) => !cards.some((c) => matchCarte(c, { ...sel, [k]: v }));
  const toggle = (k, v) => setSel((s) => ({ ...s, [k]: s[k] === v ? "" : v }));
  const lien = `/offrir?${[sel.qui && `qui=${sel.qui}`, sel.occ && `occ=${encodeURIComponent(sel.occ)}`].filter(Boolean).join("&")}`;
  const compte = !actif ? "Choisissez un ou plusieurs critères." : !ok.length ? "Aucune création ne correspond : retirez un critère."
    : ok.length > limit ? `${limit} idées parmi ${ok.length}` : `${ok.length} idée${ok.length > 1 ? "s" : ""} de cadeau`;
  return (
    <section className={`fd rv${page ? " fd-page in" : ""}`} id="trouver" aria-labelledby={page ? undefined : "t-fd"}>
      <div className="fd-in">
        {!page ? <h2 id="t-fd">Trouver le bon cadeau <em>en deux étapes</em></h2> : null}
        <p className="fd-lead">Fait main en France : chaque pièce est gravée et découpée dans notre atelier.</p>
        <div className="fd-step" role="group" aria-label="Pour qui">
          <div className="fd-h"><b>1</b><span>Pour qui ?</span></div>
          <div className="fts">{qui.map((t) => <Tuile key={t.v} k="qui" v={t.v} label={t.label} image={t.image} on={sel.qui === t.v} off={sel.qui !== t.v && isOff("qui", t.v)} onClick={() => toggle("qui", t.v)} />)}</div>
        </div>
        <div className="fd-step" role="group" aria-label="Occasion">
          <div className="fd-h"><b>2</b><span>Pour quelle occasion ?</span></div>
          <div className="fts">{occTiles.map((t) => <Tuile key={t.v} k="occ" v={t.v} label={t.label} image={t.image} on={sel.occ === t.v} off={sel.occ !== t.v && isOff("occ", t.v)} onClick={() => toggle("occ", t.v)} />)}</div>
        </div>
        <p className="fd-count" aria-live="polite">{compte}</p>
        <div className="ug fd-res">
          {ok.slice(0, limit).map((c, i) => <Carte key={c.slug} c={c} style={{ "--i": i }} />)}
        </div>
        {ok.length > limit ? <Link className="link fd-more" href={lien}>Voir les {ok.length} idées <Ic n="arrow" /></Link> : null}
      </div>
    </section>
  );
}
