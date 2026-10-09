"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Carte, { BientotCristaux } from "./Carte";
import { matchCarte } from "./Finder";

// Corps d'une page univers (maquette « Mélange ») : la barre des rayons et des
// filtres (pour qui, budget, tri ; menus déroulants sur téléphone), puis les
// rayons avec les mêmes cartes partout. Les choix sans résultat sont grisés.
const BUD = [["0-20", "Moins de 20 €"], ["20-40", "20 à 40 €"], ["40-999", "Plus de 40 €"]];

export default function PageUnivers({ uid, rayons, pourqui, pourquiLabels, coffret = null, quiInitial = "" }) {
  const [sel, setSel] = useState({ qui: quiInitial, budget: "" });
  const [tri, setTri] = useState("");
  const [cur, setCur] = useState("");
  const root = useRef(null);
  const pool = useMemo(() => rayons.flatMap((r) => r.cards || []), [rayons]);
  const toggle = (k, v) => setSel((s) => ({ ...s, [k]: s[k] === v ? "" : v }));
  const isOff = (k, v) => sel[k] !== v && !pool.some((c) => matchCarte(c, { ...sel, [k]: v }));
  const trier = (cards) => {
    if (!tri) return cards;
    return [...cards].sort((a, b) => (tri === "asc" ? 1 : -1) * (a.lo - b.lo));
  };
  // Rayon en cours (chips) : suit le défilement.
  useEffect(() => {
    const secs = root.current?.querySelectorAll(".ur,.cof") || [];
    if (!secs.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) setCur(e.target.id); }); }, { rootMargin: "-35% 0px -55% 0px" });
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  const Puce = ({ k, v, label }) => (
    <button type="button" className={`puce${sel[k] === v ? " on" : ""}${isOff(k, v) ? " off" : ""}`} data-f={k} data-v={v} aria-pressed={sel[k] === v ? "true" : "false"} disabled={isOff(k, v)} onClick={() => toggle(k, v)}>{label}</button>
  );
  const Sel = ({ k, label, items }) => (
    <select className={`uf-sel${sel[k] ? " on" : ""}`} data-fs={k} aria-label={label} value={sel[k]} onChange={(e) => setSel((s) => ({ ...s, [k]: e.target.value }))}>
      <option value="">{label}</option>
      {items.map(([v, l]) => <option key={v} value={v} disabled={isOff(k, v)}>{l}</option>)}
    </select>
  );
  const quiItems = Object.entries(pourquiLabels || {});
  return (
    <div ref={root}>
      <div className="mxup-bar">
        <nav className="mxup-rayons" aria-label="Rayons">
          {rayons.map((r) => <a key={r.id} className="puce" href={`#${r.id}`} aria-current={cur === r.id ? "true" : "false"}>{r.nom}</a>)}
          {coffret ? <a className="puce" href={`#coffret-${uid}`} aria-current={cur === `coffret-${uid}` ? "true" : "false"}>Coffret assorti</a> : null}
        </nav>
        <div className="uf">
          {pourqui ? (
            <div className="uf-grp" role="group" aria-label="Pour qui"><span>Pour qui</span>
              {quiItems.map(([v, l]) => <Puce key={v} k="qui" v={v} label={l} />)}
              <Sel k="qui" label="Pour qui" items={quiItems} />
            </div>
          ) : null}
          <div className="uf-grp" role="group" aria-label="Budget"><span>Budget</span>
            {BUD.map(([v, l]) => <Puce key={v} k="budget" v={v} label={l} />)}
            <Sel k="budget" label="Budget" items={BUD} />
          </div>
          <label className="uf-sort"><span className="vh">Trier</span>
            <select value={tri} onChange={(e) => setTri(e.target.value)}><option value="">Trier</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option></select>
          </label>
        </div>
      </div>
      {rayons.map((r) => {
        const cards = r.cards || [];
        const visibles = trier(cards).filter((c) => matchCarte(c, sel));
        return (
          <section className="ur rv in" id={r.id} key={r.id}>
            <h3>{r.nom} <small>{r.bientot ? "bientôt" : `${cards.length} créations`}</small></h3>
            <div className="ug">
              {r.bientot === "cristaux" ? <BientotCristaux /> : null}
              {trier(cards).map((c) => <Carte key={c.slug} c={c} style={matchCarte(c, sel) ? undefined : { display: "none" }} />)}
            </div>
            {!r.bientot && cards.length && !visibles.length ? <p className="ur-empty">Aucune création de ce rayon ne correspond à votre choix.</p> : null}
          </section>
        );
      })}
      {coffret}
      {!pool.some((c) => matchCarte(c, sel)) && (sel.qui || sel.budget) ? (
        <p className="ur-empty" style={{ padding: "20px 0" }}>Aucune création ne correspond : <Link className="link" href="/boutique">voir toute la boutique</Link>.</p>
      ) : null}
    </div>
  );
}
