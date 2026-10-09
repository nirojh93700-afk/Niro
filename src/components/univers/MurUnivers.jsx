"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Bouton } from "./Carte";

// Le mur : toutes les créations en trois rangées qui défilent ; un doigt posé
// sur une pièce l'arrête 4 s et montre son nom et son prix.
export default function MurUnivers({ items }) {
  const racine = useRef(null);
  useEffect(() => {
    const mqs = racine.current?.querySelectorAll(".mq") || [];
    const off = [];
    mqs.forEach((mq) => {
      let t = null;
      const hold = (el) => {
        mq.classList.add("hold");
        mq.querySelectorAll(".wt.cur").forEach((w) => w.classList.remove("cur"));
        if (el) el.classList.add("cur");
        clearTimeout(t);
        t = setTimeout(() => mq.classList.remove("hold"), 4000);
      };
      const onTouch = (e) => hold(e.target.closest(".wt"));
      const onClick = (e) => {
        const w = e.target.closest(".wt");
        if (w && !w.classList.contains("cur") && matchMedia("(hover:none)").matches) { e.preventDefault(); e.stopPropagation(); hold(w); }
      };
      mq.addEventListener("touchstart", onTouch, { passive: true });
      mq.addEventListener("click", onClick, true);
      off.push(() => { clearTimeout(t); mq.removeEventListener("touchstart", onTouch); mq.removeEventListener("click", onClick, true); });
    });
    return () => off.forEach((f) => f());
  }, []);
  if (!items?.length) return null;
  const rows = [0, 1, 2].map((i) => items.filter((_, k) => k % 3 === i));
  const tuiles = (row, copie) => row.map((c) => (
    <Link className="wt" href={c.href} key={`${copie}-${c.slug}`} aria-label={copie ? undefined : c.name} tabIndex={copie ? -1 : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="wt-img" src={c.image} alt={copie ? "" : c.name} />
      <span className="wt-l"><span>{c.name}</span><b>{c.prix ? `${c.prix.des ? "dès " : ""}${c.prix.texte}` : ""}</b></span>
    </Link>
  ));
  return (
    <section className="wall rv" id="wall" aria-labelledby="t-wall" ref={racine}>
      <div className="wall-head">
        <h2 id="t-wall">Toutes nos créations, <em>d’un seul regard</em></h2>
        <p>Le mur défile tout seul. Touchez une pièce pour l’arrêter et lire son nom et son prix.</p>
      </div>
      {rows.map((row, r) => (
        <div className={`mq mq-${r}`} key={r}>
          <div className="mq-track">{tuiles(row, 0)}<span className="mq-copy" aria-hidden="true">{tuiles(row, 1)}</span></div>
        </div>
      ))}
      <div className="wall-foot"><Bouton href="/boutique">Parcourir toute la boutique</Bouton></div>
    </section>
  );
}
