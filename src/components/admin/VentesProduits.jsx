"use client";

// =============================================================================
// GESTION → FINANCES → VENTES → « Ventes par produit » (25/11/2026, « applique » de la maquette
// https://claude.ai/artifact/JNfZA75BXSsnLUiujb2oen ; générateur tools/maquettes/ventes-produits.py).
// Une ligne par produit (pièces, commandes, prix moyen, options, remises, encaissé, coût, gain, marge),
// dépliable par taille / couleur puis par vente. Période, catégorie, recherche, tri, exports.
// Données : /api/admin/ventes-produits (lecture seule, calcul src/lib/ventesProduits.js). CSS .vp-* (globals.css).
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { exportRows } from "@/lib/exportClients";

const CAT = { bijoux: "Bijoux", cristal: "Cristal", verres: "Verres & carafes", cadeaux: "Petits cadeaux", deco: "Maison & mariage", mariage: "Mariage", naissance: "Bébé", jeux: "Jeux", papeterie: "Papeterie", devis: "Sur devis", autre: "Autres" };
const PERIODES = [["tout", "Depuis le début"], ["mois", "Ce mois"], ["prec", "Mois dernier"], ["30", "30 jours"], ["dates", "Dates…"]];
const TRIS = [["encaisse", "Trier : montant encaissé"], ["qte", "Pièces vendues"], ["gain", "Gain"], ["marge", "Marge %"], ["prixMoyen", "Prix moyen"], ["produit", "Nom"]];

const r2 = (x) => Math.round((Number(x) || 0) * 100) / 100;
const eur = (x) => (x == null ? "—" : Number(x).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €");
const fdate = (d) => { try { return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" }); } catch { return ""; } };
const sansAccent = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function bornes(per, du, au) {
  const now = new Date();
  if (per === "mois") return [new Date(now.getFullYear(), now.getMonth(), 1), null];
  if (per === "prec") return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 1)];
  if (per === "30") return [new Date(now.getTime() - 30 * 864e5), null];
  if (per === "dates") return [du ? new Date(du) : null, au ? new Date(new Date(au).getTime() + 864e5) : null];
  return [null, null];
}

const vide = () => ({ qte: 0, encaisse: 0, options: 0, remise: 0, cout: 0, coutManquant: false, encConnu: 0, refs: new Set() });
function add(a, v) {
  a.qte += v.qte; a.encaisse = r2(a.encaisse + v.encaisse); a.options = r2(a.options + v.options + v.emballage); a.remise = r2(a.remise + v.remise);
  if (v.cout == null) a.coutManquant = true; else { a.cout = r2(a.cout + v.cout); a.encConnu = r2(a.encConnu + v.encaisse); }
  a.refs.add(v.ref);
  return a;
}
function fin(a) {
  a.commandes = a.refs.size; a.prixMoyen = a.qte ? r2(a.encaisse / a.qte) : 0;
  a.gain = a.coutManquant ? null : r2(a.encaisse - a.cout);
  a.marge = a.gain != null && a.encaisse > 0 ? Math.round((a.gain / a.encaisse) * 100) : null;
  return a;
}
/** produit → variantes → ventes ; toutes les lignes de devis réunies en un seul « produit », toujours en bas. */
function grouper(list, tri, asc) {
  const m = new Map();
  const devis = Object.assign(vide(), { cle: "devis", produit: "Lignes de devis (sur mesure)", categorie: "devis", va: new Map() });
  for (const v of list) {
    const p = v.categorie === "devis" ? devis : (m.get(v.slug) || m.set(v.slug, Object.assign(vide(), { cle: v.slug, slug: v.slug, produit: v.produit, categorie: v.categorie, va: new Map() })).get(v.slug));
    add(p, v);
    const x = p.va.get(v.variante) || p.va.set(v.variante, Object.assign(vide(), { variante: v.variante, ventes: [] })).get(v.variante);
    add(x, v); x.ventes.push(v);
  }
  const ps = [...m.values()];
  if (devis.qte) ps.push(devis);
  for (const p of ps) {
    fin(p);
    p.vas = [...p.va.values()].map(fin).sort((a, b) => b.encaisse - a.encaisse);
    p.vas.forEach((x) => x.ventes.sort((a, b) => String(b.date).localeCompare(String(a.date))));
  }
  const s = asc ? 1 : -1;
  return ps.sort((a, b) => {
    if ((a.categorie === "devis") !== (b.categorie === "devis")) return a.categorie === "devis" ? 1 : -1;
    if (tri === "produit") return -s * a.produit.localeCompare(b.produit, "fr");
    const A = a[tri] == null ? -1e9 : a[tri], B = b[tri] == null ? -1e9 : b[tri];
    return s * (A - B);
  });
}

function Marge({ m }) {
  if (m == null) return <span className="vp-mute">—</span>;
  const w = Math.max(0, Math.min(100, m));
  return <span className="vp-marge">{m} %<i><em style={{ width: `${w}%` }} /></i></span>;
}
function Cout({ a }) {
  if (!a.coutManquant) return eur(a.cout);
  return a.cout > 0 ? <>{eur(a.cout)}<br /><span className="vp-pill warn">en partie inconnu</span></> : <span className="vp-pill warn">coût inconnu</span>;
}
function Gain({ g }) {
  if (g == null) return <span className="vp-mute">—</span>;
  return <span className={g < 0 ? "vp-neg" : "vp-gain"}>{eur(g)}</span>;
}
const Remise = ({ r }) => (r ? `− ${eur(r)}` : <span className="vp-mute">—</span>);

export default function VentesProduits() {
  const [ventes, setVentes] = useState(null);
  const [erreur, setErreur] = useState("");
  const [per, setPer] = useState("tout");
  const [du, setDu] = useState("");
  const [au, setAu] = useState("");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("tout");
  const [tri, setTri] = useState("encaisse");
  const [asc, setAsc] = useState(false);
  const [ouverts, setOuverts] = useState(() => new Set());
  const [ouvertsVa, setOuvertsVa] = useState(() => new Set());
  const [exp, setExp] = useState("");

  useEffect(() => {
    let cle = "";
    try { cle = sessionStorage.getItem("niv-admin-key") || ""; } catch { /* navigation privée */ }
    if (!cle) { setErreur("Ouvrez d'abord Gestion pour saisir votre mot de passe."); return; }
    fetch("/api/admin/ventes-produits", { headers: { "x-admin-key": cle }, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => (d?.ok ? setVentes(d.ventes || []) : setErreur(d?.error || "Ventes illisibles pour le moment.")))
      .catch(() => setErreur("Ventes illisibles pour le moment."));
  }, []);

  const parPeriode = useMemo(() => {
    if (!ventes) return [];
    const [a, b] = bornes(per, du, au);
    const mots = sansAccent(q).split(/\s+/).filter(Boolean);
    return ventes.filter((v) => {
      const t = new Date(v.date);
      if (a && t < a) return false;
      if (b && t >= b) return false;
      if (mots.length) { const h = sansAccent(`${v.produit} ${v.variante} ${v.cliente} ${v.ref}`); if (!mots.every((m) => h.includes(m))) return false; }
      return true;
    });
  }, [ventes, per, du, au, q]);
  const liste = useMemo(() => (cat === "tout" ? parPeriode : parPeriode.filter((v) => v.categorie === cat)), [parPeriode, cat]);
  const produits = useMemo(() => grouper(liste, tri, asc), [liste, tri, asc]);
  const total = useMemo(() => fin(liste.reduce(add, vide())), [liste]);
  const comptesCat = useMemo(() => { const n = {}; parPeriode.forEach((v) => { n[v.categorie] = (n[v.categorie] || 0) + v.qte; }); return n; }, [parPeriode]);

  const basculer = (set, setter, k) => { const n = new Set(set); n.has(k) ? n.delete(k) : n.add(k); setter(n); };
  const trierPar = (k) => { if (tri === k) setAsc(!asc); else { setTri(k); setAsc(k === "produit"); } };

  async function exporter(format) {
    setExp(format);
    try {
      const rows = [];
      for (const p of produits) for (const x of p.vas) for (const v of x.ventes) {
        rows.push({ date: fdate(v.date), ref: v.ref, cliente: v.cliente, produit: p.produit, variante: x.variante, qte: v.qte,
          prix: r2(v.encaisse / v.qte), options: r2(v.options + v.emballage), remise: v.remise, encaisse: v.encaisse,
          cout: v.cout == null ? "inconnu" : v.cout, gain: v.cout == null ? "" : r2(v.encaisse - v.cout) });
      }
      const cols = [["date", "Date"], ["ref", "Commande"], ["cliente", "Cliente"], ["produit", "Produit"], ["variante", "Taille / couleur"], ["qte", "Pièces"],
        ["prix", "Prix payé / pièce (€)"], ["options", "Options (€)"], ["remise", "Remise (€)"], ["encaisse", "Encaissé (€)"], ["cout", "Coût d'achat (€)"], ["gain", "Gain (€)"]]
        .map(([key, label]) => ({ key, label }));
      const lib = PERIODES.find((x) => x[0] === per)?.[1] || "";
      await exportRows(format, rows, cols, { basename: "ventes-par-produit", title: "Ventes par produit", subtitle: `${lib} · ${rows.length} ventes · ${eur(total.encaisse)} encaissés` });
    } finally { setExp(""); }
  }

  if (erreur) return <div className="vp"><p className="vp-note">{erreur}</p></div>;
  if (!ventes) return <div className="vp"><p className="vp-note">Lecture des ventes…</p></div>;

  const meilleur = produits.filter((p) => p.categorie !== "devis").sort((a, b) => b.encaisse - a.encaisse)[0];
  const gainConnu = r2(total.encConnu - total.cout);
  const sansCout = r2(total.encaisse - total.encConnu);
  const catsPresentes = Object.keys(CAT).filter((k) => comptesCat[k]);
  const lienCommande = (v) => `/gestion/commande/${encodeURIComponent(v.ref || v.id)}`;

  return (
    <section className="vp" aria-labelledby="vp-titre">
      <div className="vp-head">
        <div>
          <h2 id="vp-titre">Ventes par produit</h2>
          <p>Ce que vous avez vendu, à quel prix, et ce qu'il vous reste après le coût d'achat. Touchez un produit pour voir chaque taille ou couleur, puis chaque vente.</p>
        </div>
        <div className="vp-exp">
          {[["xlsx", "Excel"], ["csv", "CSV"], ["pdf", "PDF"]].map(([f, l]) => (
            <button key={f} type="button" className="vp-btn" disabled={!!exp || !liste.length} onClick={() => exporter(f)}>{exp === f ? "…" : l}</button>
          ))}
        </div>
      </div>

      <div className="vp-kpis">
        <div className="vp-kpi"><span>Encaissé (articles)</span><b>{eur(total.encaisse)}</b><small>{total.commandes} commande{total.commandes > 1 ? "s" : ""} · hors livraison</small></div>
        <div className="vp-kpi"><span>Pièces vendues</span><b>{total.qte}</b><small>{produits.length} produit{produits.length > 1 ? "s" : ""} différent{produits.length > 1 ? "s" : ""}</small></div>
        <div className="vp-kpi"><span>Prix moyen d'une pièce</span><b>{eur(total.prixMoyen)}</b><small>dont options {eur(total.options)}</small></div>
        <div className="vp-kpi"><span>Gain sur coût connu</span><b>{eur(gainConnu)}</b><small>{sansCout > 0 ? `${eur(sansCout)} vendus sans coût d'achat` : "tous les coûts sont connus"}</small></div>
        <div className="vp-kpi"><span>Produit n° 1</span><b className="vp-kpi-nom">{meilleur ? meilleur.produit : "—"}</b><small>{meilleur ? `${eur(meilleur.encaisse)} · ${meilleur.qte} pièce${meilleur.qte > 1 ? "s" : ""}` : ""}</small></div>
      </div>

      <div className="vp-bar">
        <div className="vp-row">
          <div className="vp-seg" role="group" aria-label="Période">
            {PERIODES.map(([k, l]) => <button key={k} type="button" className={per === k ? "on" : ""} onClick={() => setPer(k)}>{l}</button>)}
          </div>
          {per === "dates" ? (
            <span className="vp-dates">du <input type="date" value={du} onChange={(e) => setDu(e.target.value)} /> au <input type="date" value={au} onChange={(e) => setAu(e.target.value)} /></span>
          ) : null}
        </div>
        <div className="vp-row">
          <input className="vp-find" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit, une taille, une cliente, une commande…" aria-label="Rechercher" />
          <select className="vp-sel" value={tri} onChange={(e) => { setTri(e.target.value); setAsc(e.target.value === "produit"); }} aria-label="Trier">
            {TRIS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div className="vp-chips">
          <button type="button" className={cat === "tout" ? "on" : ""} onClick={() => setCat("tout")}>Tout<i>{parPeriode.reduce((s, v) => s + v.qte, 0)}</i></button>
          {catsPresentes.map((k) => <button key={k} type="button" className={cat === k ? "on" : ""} onClick={() => setCat(k)}>{CAT[k]}<i>{comptesCat[k]}</i></button>)}
        </div>
      </div>

      {!produits.length ? <p className="vp-note">Aucune vente sur cette période.</p> : (
        <>
          <div className="vp-tablewrap vp-desk">
            <table className="vp-t">
              <thead>
                <tr>
                  {[["produit", "Produit"], ["qte", "Pièces"], ["commandes", "Cdes"], ["prixMoyen", "Prix moyen"], ["options", "Options"], ["remise", "Remises"], ["encaisse", "Encaissé"], ["cout", "Coût"], ["gain", "Gain"], ["marge", "Marge"]].map(([k, l]) => (
                    <th key={k} className={tri === k ? `sorted${asc ? " asc" : ""}` : ""} onClick={() => trierPar(k)} aria-sort={tri === k ? (asc ? "ascending" : "descending") : "none"}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {produits.map((p) => {
                  const o = ouverts.has(p.cle);
                  return [
                    <tr key={p.cle} className={`p${o ? " open" : ""}`} onClick={() => basculer(ouverts, setOuverts, p.cle)}>
                      <td><div className="vp-name"><span className="vp-car">›</span><span className="vp-av">{p.produit[0]}</span><div><b>{p.produit}</b><small>{CAT[p.categorie] || p.categorie} · {p.vas.length} variante{p.vas.length > 1 ? "s" : ""}</small></div></div></td>
                      <td>{p.qte}</td><td>{p.commandes}</td><td>{eur(p.prixMoyen)}</td><td>{eur(p.options)}</td><td><Remise r={p.remise} /></td>
                      <td><b>{eur(p.encaisse)}</b></td><td><Cout a={p} /></td><td><Gain g={p.gain} /></td><td><Marge m={p.marge} /></td>
                    </tr>,
                    ...(o ? p.vas.flatMap((x) => {
                      const vk = `${p.cle}|${x.variante}`; const ov = ouvertsVa.has(vk);
                      return [
                        <tr key={vk} className="va" onClick={() => basculer(ouvertsVa, setOuvertsVa, vk)}>
                          <td><span className="vp-car" style={ov ? { transform: "rotate(90deg)" } : undefined}>›</span> {x.variante}</td>
                          <td>{x.qte}</td><td>{x.commandes}</td><td>{eur(x.prixMoyen)}</td><td>{eur(x.options)}</td><td><Remise r={x.remise} /></td>
                          <td>{eur(x.encaisse)}</td><td><Cout a={x} /></td><td><Gain g={x.gain} /></td><td><Marge m={x.marge} /></td>
                        </tr>,
                        ...(ov ? x.ventes.map((v, i) => (
                          <tr key={`${vk}#${v.ref}#${i}`} className="ve">
                            <td>{fdate(v.date)} · <Link className="vp-ref" href={lienCommande(v)}>#{v.ref}</Link> · {v.cliente}</td>
                            <td>{v.qte}</td><td /><td>{eur(r2(v.encaisse / v.qte))}</td><td>{eur(r2(v.options + v.emballage))}</td><td><Remise r={v.remise} /></td>
                            <td>{eur(v.encaisse)}</td><td>{v.cout == null ? <span className="vp-pill warn">inconnu</span> : eur(v.cout)}</td>
                            <td><Gain g={v.cout == null ? null : r2(v.encaisse - v.cout)} /></td><td />
                          </tr>
                        )) : []),
                      ];
                    }) : []),
                  ];
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total · {produits.length} produits</td><td>{total.qte}</td><td>{total.commandes}</td><td>{eur(total.prixMoyen)}</td><td>{eur(total.options)}</td>
                  <td><Remise r={total.remise} /></td><td>{eur(total.encaisse)}</td><td><Cout a={total} /></td><td>{eur(gainConnu)}*</td><td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="vp-cards">
            {produits.map((p) => {
              const o = ouverts.has(p.cle);
              return (
                <div key={p.cle} className={`vp-card${o ? " open" : ""}`}>
                  <button type="button" onClick={() => basculer(ouverts, setOuverts, p.cle)} aria-expanded={o}>
                    <span className="vp-av">{p.produit[0]}</span>
                    <span><b>{p.produit}</b><small>{p.qte} pièce{p.qte > 1 ? "s" : ""} · {CAT[p.categorie] || ""}</small></span>
                    <span className="amt"><b>{eur(p.encaisse)}</b><br /><Gain g={p.gain} /></span>
                  </button>
                  <div className="vp-cgrid">
                    <div>Prix moyen<b>{eur(p.prixMoyen)}</b></div>
                    <div>Coût<b>{p.coutManquant ? "inconnu" : eur(p.cout)}</b></div>
                    <div>Marge<b>{p.marge == null ? "—" : `${p.marge} %`}</b></div>
                  </div>
                  {o ? (
                    <div className="vp-cdet">
                      {p.vas.map((x) => (
                        <div key={x.variante} className="vp-cva">
                          <div className="h"><span>{x.variante} · {x.qte}</span><span>{eur(x.encaisse)}</span></div>
                          <ul>{x.ventes.map((v, i) => <li key={`${v.ref}#${i}`}><span>{fdate(v.date)} · <Link className="vp-ref" href={lienCommande(v)}>#{v.ref}</Link> · {v.cliente}</span><span>{eur(v.encaisse)}</span></li>)}</ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="vp-note"><b>Comment c'est calculé.</b> <b>Encaissé</b> = ce que la cliente a payé pour l'article, options comprises, remise déduite, <b>sans la livraison</b>. <b>Options</b> = gravures, textes, socles et emballages payés en plus. <b>Remises</b> = codes promo et cartes cadeaux. <b>Coût</b> = le prix d'achat de la pièce ; quand il n'est pas connu, la ligne porte « coût inconnu » et son gain n'est pas compté (*le total ne compte que les coûts connus). Tests, commandes annulées et remboursées exclus. Le matériel d'emballage, les étiquettes, Stripe et les pièces ratées restent dans Bénéfices.</p>
    </section>
  );
}
