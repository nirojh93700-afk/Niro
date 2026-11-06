"use client";

// Bloc « Options de votre cristal » de la page d'un devis (06/11/2026, maquette
// https://claude.ai/artifact/1D7veQp2RzCVybjz9dr6te). Les prix affichés sont ceux de la fiche
// (calculés côté serveur par `optionsDisponibles`) ; le paiement les recalcule.
import { useEffect } from "react";
import { FONTS } from "@/lib/fonts";
import { setDevisChoix, useDevisChoix } from "@/lib/devisChoixStore";
import { POLICES_DEVIS } from "@/lib/devisOptions";

const euro = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);
const r2 = (n) => Math.round(n * 100) / 100;

export function extraOptions(opts, c) {
  return r2((c.socle && opts?.socle ? opts.socle.price : 0) + (c.texteOn && c.texte.trim() && opts?.texte ? opts.texte.price : 0));
}

export default function DevisOptions({ opts }) {
  const c = useDevisChoix();
  useEffect(() => { setDevisChoix({ extra: extraOptions(opts, c) }); }, [opts, c.socle, c.texteOn, c.texte]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!opts) return null;
  const font = FONTS.find((f) => f.key === c.police) || FONTS[0];
  return (
    <section className="dvo no-print" aria-labelledby="dvo-titre">
      <h3 id="dvo-titre">Options de votre cristal <span>facultatif</span></h3>
      <p className="dvo-lead">Cochez ce que vous voulez ajouter : le total se met à jour, et vous payez tout en une fois.</p>
      {opts.socle ? (
        <label className="dvo-opt">
          <input type="checkbox" id="dvo-socle" checked={c.socle} onChange={(e) => setDevisChoix({ socle: e.target.checked })} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {opts.socle.image ? <img src={opts.socle.image} alt="Socle lumineux LED" /> : <span className="dvo-ic">✦</span>}
          <span className="dvo-txt"><b>Socle lumineux LED</b><small>{opts.socle.nom === "petit socle carré" ? "Petit socle carré" : "Grand socle rectangle"}, couleurs qui changent au toucher, câble USB et adaptateur fournis.</small></span>
          <span className="dvo-px">+{euro(opts.socle.price)}</span>
        </label>
      ) : null}
      {opts.texte ? (
        <>
          <label className="dvo-opt">
            <input type="checkbox" id="dvo-texte" checked={c.texteOn} onChange={(e) => setDevisChoix({ texteOn: e.target.checked })} />
            <span className="dvo-ic">Aa</span>
            <span className="dvo-txt"><b>Un texte gravé en plus</b><small>Un prénom, une date, un petit mot, gravé dans le cristal.</small></span>
            <span className="dvo-px">+{euro(opts.texte.price)}</span>
          </label>
          {c.texteOn ? (
            <div className="dvo-champs">
              <label className="dvo-l" htmlFor="dvo-saisie">Votre texte <span>{c.texte.length} / 40</span></label>
              <input type="text" id="dvo-saisie" maxLength={40} value={c.texte} placeholder="Ex : Alissia · 12.11.2026"
                onChange={(e) => setDevisChoix({ texte: e.target.value })} />
              <span className="dvo-l">Écriture</span>
              <div className="dvo-fonts">
                {FONTS.map((f) => (
                  <button key={f.key} type="button" className={`dvo-f ${f.cls}${c.police === f.key ? " on" : ""}`}
                    aria-pressed={c.police === f.key} onClick={() => setDevisChoix({ police: f.key })}>{POLICES_DEVIS[f.key]}</button>
                ))}
              </div>
              <div className={`dvo-apercu ${font.cls}`}>{c.texte.trim() || "Votre texte"}</div>
              {!c.texte.trim() ? <p className="dvo-manque">Écrivez votre texte, ou décochez l&apos;option.</p> : null}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

// Lignes ajoutées dans le tableau du devis (dans le <tbody>).
export function DevisLignesOptions({ opts }) {
  const c = useDevisChoix();
  if (!opts) return null;
  const lignes = [];
  if (c.socle && opts.socle) lignes.push([`Option : socle lumineux LED (${opts.socle.nom})`, opts.socle.price]);
  if (c.texteOn && c.texte.trim() && opts.texte) lignes.push([`Option : texte gravé en plus « ${c.texte.trim()} » (écriture ${POLICES_DEVIS[c.police]})`, opts.texte.price]);
  return lignes.map(([d, p], i) => (
    <tr key={i} style={{ borderBottom: "1px solid var(--line)", background: "#fffaf0" }}>
      <td style={{ padding: "8px 6px" }}>{d}</td>
      <td style={{ padding: "8px 6px", textAlign: "center" }}>1</td>
      <td style={{ padding: "8px 6px", textAlign: "right" }}>{euro(p)}</td>
      <td style={{ padding: "8px 6px", textAlign: "right" }}>{euro(p)}</td>
    </tr>
  ));
}

// Total du tableau, mis à jour avec les options.
export function DevisTotalOptions({ base }) {
  const c = useDevisChoix();
  return <>{euro(r2(Number(base) + (c.extra || 0)))}</>;
}
