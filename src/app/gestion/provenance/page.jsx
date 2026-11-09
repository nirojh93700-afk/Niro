"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageHead from "@/components/admin/PageHead";
import Ic from "@/components/admin/IconesGestion";
import { statsProvenance, lienMarque, slugLien } from "@/lib/provenance";
import { euro } from "@/lib/fileCommandes";

// =============================================================================
// GESTION → MARKETING → D'OÙ VIENNENT LES VENTES (09/11/2026, maquette validée)
// Lecture seule : les vraies commandes, rangées par provenance (Google, Instagram,
// TikTok, e-mail…), + les liens marqués à mettre en bio. Rien n'est écrit ni envoyé.
// =============================================================================

const PERIODES = [["30", "30 jours"], ["90", "90 jours"], ["tout", "Depuis le début"]];
const BIOS = [
  ["Bio Instagram", lienMarque({ source: "instagram", medium: "bio" })],
  ["Bio TikTok", lienMarque({ source: "tiktok", medium: "bio" })],
  ["Page Facebook", lienMarque({ source: "facebook", medium: "page" })],
  ["Pinterest", lienMarque({ source: "pinterest", medium: "epingle" })],
];
const RESEAUX = [["instagram", "Instagram"], ["tiktok", "TikTok"], ["facebook", "Facebook"], ["pinterest", "Pinterest"]];

export default function ProvenanceAdminPage() {
  const [key, setKey] = useState("");
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState("");
  const [periode, setPeriode] = useState("30");
  const [mode, setMode] = useState("premiere");
  const [src, setSrc] = useState("instagram");
  const [nom, setNom] = useState("");
  const [page, setPage] = useState("");
  const [bulle, setBulle] = useState("");

  const load = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/orders", { headers: { "x-admin-key": k }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Chargement impossible.");
      setOrders(Array.isArray(j.orders) ? j.orders : []);
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (k) { setKey(k); load(k); }
  }, [load]);

  const retenues = useMemo(() => {
    const depuis = periode === "tout" ? 0 : Date.now() - Number(periode) * 86400000;
    return (orders || []).filter((o) => !o.test && !["annulee", "remboursee"].includes(o.status) && Date.parse(o.createdAt || 0) >= depuis);
  }, [orders, periode]);
  const st = useMemo(() => statsProvenance(retenues, mode), [retenues, mode]);
  const maxCa = Math.max(1, ...st.lignes.map((l) => l.ca));
  const tete = st.lignes.find((l) => l.cle !== "inconnue");
  const lienPub = lienMarque({ source: src, medium: "publication", campagne: nom, page });

  async function copier(texte) {
    try { await navigator.clipboard.writeText(texte); setBulle("Lien copié"); }
    catch { setBulle("Copie impossible : sélectionnez le lien à la main"); }
    setTimeout(() => setBulle(""), 1800);
  }

  if (!key) {
    return <PageHead eyebrow="Marketing" title="D'où viennent les ventes" subtitle="Ouvrez d'abord Gestion pour saisir votre mot de passe." />;
  }

  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

  return (
    <>
      <PageHead
        eyebrow="Marketing"
        title="D'où viennent les ventes"
        subtitle="Google, Instagram, TikTok, e-mail… pour chaque commande, et en chiffres. Lecture seule."
        kpis={[
          { label: "Commandes", value: orders ? st.commandes : "…" },
          { label: "Chiffre d'affaires", value: orders ? euro(st.ca) : "…" },
          { label: "1re source", value: tete ? tete.nom : "…", sub: tete ? `${tete.commandes} commande${tete.commandes > 1 ? "s" : ""} · ${pct(tete.ca, st.ca)} %` : "pas encore relevée" },
          { label: "Provenance connue", value: orders && st.commandes ? `${pct(st.connues, st.commandes)} %` : "…", sub: orders ? `${st.commandes - st.connues} commande${st.commandes - st.connues > 1 ? "s" : ""} « non relevée »` : "" },
        ]}
      />

      <div className="fq pv-page">
        {err ? <p className="pv-note">{err}</p> : null}
        {!orders && !err ? <p>Chargement…</p> : null}

        {orders ? (
          <>
            <div className="pv-per">
              {PERIODES.map(([v, l]) => <button key={v} type="button" className={`fq-chip${periode === v ? " on" : ""}`} onClick={() => setPeriode(v)}>{l}</button>)}
            </div>
            <div className="pv-switch">
              <label><input type="radio" name="pvm" checked={mode === "premiere"} onChange={() => setMode("premiere")} /> Compter la <b>1<sup>re</sup> visite</b> (qui l&apos;a fait découvrir)</label>
              <label><input type="radio" name="pvm" checked={mode === "derniere"} onChange={() => setMode("derniere")} /> Compter la <b>dernière visite</b> avant l&apos;achat (qui l&apos;a décidée)</label>
            </div>

            {st.commandes === 0 ? <p className="pv-note">Aucune commande sur cette période.</p> : (
              <div className="pv-tablewrap"><table className="pv-table">
                <thead><tr><th>D&apos;où vient la cliente</th><th className="n">Commandes</th><th className="n">Chiffre d&apos;affaires</th><th className="n">Panier moyen</th><th>Part du chiffre</th></tr></thead>
                <tbody>
                  {st.lignes.flatMap((l) => [
                    <tr key={l.cle}>
                      <td><span className="pv-name"><i className="pv-dot" style={{ background: l.couleur }} />{l.nom}</span></td>
                      <td className="n">{l.commandes}</td><td className="n">{euro(l.ca)}</td><td className="n">{euro(l.panier)}</td>
                      <td><span className="pv-barcell"><span className="pv-bar"><span style={{ width: `${Math.round((l.ca / maxCa) * 100)}%` }} /></span><span className="n">{pct(l.ca, st.ca)} %</span></span></td>
                    </tr>,
                    ...l.liens.map((c) => (
                      <tr key={`${l.cle}:${c.nom}`} className="pv-sousligne">
                        <td>lien « {c.nom} »</td><td className="n">{c.commandes}</td><td className="n">{euro(c.ca)}</td><td className="n">{euro(c.commandes ? c.ca / c.commandes : 0)}</td><td />
                      </tr>
                    )),
                  ])}
                </tbody>
              </table></div>
            )}
            {st.commandes > st.connues ? <p className="pv-aide" style={{ margin: "0 0 18px" }}>« Non relevée » : commandes passées avant la mise en place du relevé (09/11/2026), ou visiteuses qui bloquent le suivi dans leur navigateur.</p> : null}

            <section className="pv-box pv-liens">
              <h3><Ic n="tag" /> Vos liens à mettre en bio</h3>
              <p className="pv-aide">Les applis Instagram et TikTok cachent souvent d&apos;où vient la visite. Avec ces liens, le site sait que c&apos;est elles, à coup sûr.</p>
              {BIOS.map(([l, u]) => (
                <div className="pv-link" key={l}><span className="pv-ll">{l}</span><input readOnly value={u} onFocus={(e) => e.target.select()} aria-label={l} /><button type="button" className="fq-btn sm" onClick={() => copier(u)}><Ic n="copy" /> Copier</button></div>
              ))}
              <div className="pv-mk">
                <span className="pv-ll">Lien pour une publication précise</span>
                <div className="pv-mk-row">
                  <select value={src} onChange={(e) => setSrc(e.target.value)} aria-label="Réseau">{RESEAUX.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom de la publication (ex. reel-noel-cristal)" aria-label="Nom de la publication" maxLength={60} />
                  <input value={page} onChange={(e) => setPage(e.target.value.replace(/^https?:\/\/[^/]+\//, "").replace(/[?#].*$/, ""))} placeholder="Page (vide = accueil, ex. produit/collier-coeur-grave)" aria-label="Page d'arrivée" maxLength={120} />
                </div>
                <div className="pv-link"><input readOnly value={lienPub} onFocus={(e) => e.target.select()} aria-label="Lien de la publication" /><button type="button" className="fq-btn sm" onClick={() => copier(lienPub)}><Ic n="copy" /> Copier</button></div>
                <p className="pv-aide">{slugLien(nom) ? "Dans le tableau, cette publication aura sa propre ligne : vous verrez quel réel ou quelle vidéo a vraiment fait vendre." : "Donnez un nom à la publication pour qu'elle ait sa propre ligne dans le tableau."}</p>
              </div>
            </section>

            <section className="pv-box pv-how">
              <h3><Ic n="spark" /> Comment c&apos;est relevé</h3>
              <ul>
                <li>À l&apos;arrivée sur le site, la page d&apos;où vient la visiteuse (Google, Instagram, TikTok…) et le lien marqué sont notés <b>dans son navigateur</b>, 30 jours.</li>
                <li>Au paiement, cette information part avec la commande : c&apos;est elle que vous voyez dans Gestion.</li>
                <li>Rien n&apos;est envoyé à Instagram, TikTok ni Google ; aucune donnée en plus n&apos;est demandée à la cliente.</li>
                <li>Le site ne connaît ni les mots tapés dans Google, ni le nom du compte qui a partagé le lien.</li>
              </ul>
            </section>
          </>
        ) : null}
        {bulle ? <div className="pv-copied" role="status">{bulle}</div> : null}
      </div>
    </>
  );
}
