"use client";
// =============================================================================
// GESTION → FINANCES → COMPTABILITÉ (15/11/2026, maquette « Niv Admin », version 1 enregistrée)
// Une page comme un logiciel de comptabilité pour auto-entrepreneur : tableau de bord + plafonds, livre des
// recettes, registre des achats, URSSAF, rapprochement Stripe, pièces manquantes, exports. Tout se remplit
// tout seul (commandes du site, devis payés, ventes hors site, classeur des factures). API /api/admin/comptabilite.
// Taux et plafonds vérifiés le 15/11/2026 sur economie.gouv.fr / service-public.fr (voir src/lib/comptabilite.js).
// =============================================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHead from "@/components/admin/PageHead";
import { toast } from "@/components/admin/AdminToast";
import { exportRows, zipStore, downloadBlob } from "@/lib/exportClients";

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const nomMois = (k) => { const [a, m] = String(k).split("-").map(Number); return `${MOIS[m - 1]} ${a}`; };
const dateFr = (d) => (d ? new Date(String(d).length === 10 ? d + "T12:00:00" : d).toLocaleDateString("fr-FR") : "—");
const TABS = [["bord", "Tableau de bord"], ["rec", "Livre des recettes"], ["ach", "Registre des achats"], ["urssaf", "URSSAF"], ["rappro", "Rapprochement"], ["pieces", "Pièces manquantes"], ["export", "Exports"]];

export default function ComptabilitePage() {
  const [key, setKey] = useState("");
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("bord");
  const [rappro, setRappro] = useState(null);
  const [busy, setBusy] = useState("");
  const [periode, setPeriode] = useState("annee");
  const [contenu, setContenu] = useState("tout");
  const [format, setFormat] = useState("xlsx");
  const [regl, setRegl] = useState(null);

  const load = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/comptabilite", { headers: { "x-admin-key": k }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Chargement impossible.");
      setD(j); setRegl({ taux: String(j.regl.taux).replace(".", ","), cfp: String(j.regl.cfp).replace(".", ","), vl: String(j.regl.vl).replace(".", ",") });
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (k) { setKey(k); load(k); }
    try { const h = window.location.hash.slice(1); if (TABS.some(([t]) => t === h)) setTab(h); } catch { /* */ }
  }, [load]);

  async function chargerRappro() {
    setBusy("rappro");
    try {
      const r = await fetch("/api/admin/comptabilite?rappro=1", { headers: { "x-admin-key": key } });
      setRappro(await r.json());
    } catch (e) { setRappro({ erreur: e.message }); }
    setBusy("");
  }
  useEffect(() => { if (tab === "rappro" && key && !rappro) chargerRappro(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab, key]);

  async function declarer(mois, oui) {
    setBusy("urssaf:" + mois);
    try {
      const r = await fetch("/api/admin/urssaf", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ month: mois, declared: oui }) });
      if (!r.ok) throw new Error("Refusé.");
      load(key);
    } catch (e) { toast(e.message, "err"); }
    setBusy("");
  }
  async function copier(v) {
    const t = (Math.round(v * 100) / 100).toFixed(2).replace(".", ",");
    try { await navigator.clipboard.writeText(t); toast(`Copié : ${t} €`, "ok"); } catch { toast(`Montant : ${t} €`, "info"); }
  }
  async function enregistrerTaux() {
    setBusy("taux");
    try {
      const r = await fetch("/api/admin/comptabilite", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify(regl) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Refusé.");
      load(key);
    } catch (e) { toast(e.message, "err"); }
    setBusy("");
  }

  const filtrePeriode = useMemo(() => {
    const n = new Date();
    const a = String(n.getFullYear());
    const m = `${a}-${String(n.getMonth() + 1).padStart(2, "0")}`;
    const t = Math.floor(n.getMonth() / 3);
    const trim = [0, 1, 2].map((i) => `${a}-${String(t * 3 + i + 1).padStart(2, "0")}`);
    if (periode === "mois") return { ok: (date) => String(date).startsWith(m), nom: nomMois(m) };
    if (periode === "trimestre") return { ok: (date) => trim.some((x) => String(date).startsWith(x)), nom: `${t + 1}ᵉ trimestre ${a}` };
    if (periode === "avant") return { ok: (date) => String(date).startsWith(String(n.getFullYear() - 1)), nom: `année ${n.getFullYear() - 1}` };
    return { ok: (date) => String(date).startsWith(a), nom: `année ${a}` };
  }, [periode]);

  const COLS_REC = [{ key: "date", label: "Date", width: 12 }, { key: "piece", label: "Pièce (commande)", width: 14 }, { key: "facture", label: "Facture / devis", width: 14 }, { key: "client", label: "Client", width: 24 }, { key: "nature", label: "Nature", width: 40 }, { key: "reglement", label: "Règlement", width: 22 }, { key: "montant", label: "Montant (€)", width: 12 }];
  const COLS_ACH = [{ key: "date", label: "Date", width: 12 }, { key: "fournisseur", label: "Fournisseur", width: 22 }, { key: "nature", label: "Nature", width: 40 }, { key: "categorie", label: "Catégorie", width: 18 }, { key: "montant", label: "Montant TTC (€)", width: 14 }, { key: "piece", label: "Pièce", width: 26 }];
  const lignesRec = (fmt) => (d?.recettes || []).filter((r) => filtrePeriode.ok(r.date)).map((r) => ({ ...r, date: dateFr(r.date), montant: fmt === "xlsx" ? r.montant : (Math.round(r.montant * 100) / 100).toFixed(2).replace(".", ",") }));
  const lignesAch = (fmt) => (d?.achats || []).filter((r) => filtrePeriode.ok(r.date)).map((r) => ({ date: dateFr(r.date), fournisseur: r.fournisseur, nature: r.libelle || "", categorie: r.categorie, montant: fmt === "xlsx" ? Number(r.montant) || 0 : (Math.round((Number(r.montant) || 0) * 100) / 100).toFixed(2).replace(".", ","), piece: r.fichier ? `${r.fichier.nom} · sha256 ${String(r.fichier.sha).slice(0, 16)}` : "FACTURE MANQUANTE" }));

  async function exporter() {
    setBusy("export");
    try {
      const base = `compta-${periode}`;
      if (contenu === "zip") {
        const csv = (rows, cols) => "﻿" + [cols.map((c) => c.label).join(";"), ...rows.map((r) => cols.map((c) => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`).join(";"))].join("\r\n");
        const files = [["livre-des-recettes.csv", csv(lignesRec("csv"), COLS_REC)], ["registre-des-achats.csv", csv(lignesAch("csv"), COLS_ACH)]];
        for (const a of (d?.achats || []).filter((r) => r.fichier && filtrePeriode.ok(r.date))) {
          try {
            const r = await fetch(`/api/admin/factures?fichier=${encodeURIComponent(a.fichier.id)}`, { headers: { "x-admin-key": key } });
            if (r.ok) files.push([`factures/${a.date}-${String(a.fournisseur).replace(/[^\w-]+/g, "_").slice(0, 30)}-${a.fichier.nom.replace(/[^\w.-]+/g, "_")}`, new Uint8Array(await r.arrayBuffer())]);
          } catch { /* fichier sauté */ }
        }
        files.push(["LISEZ-MOI.txt", `Niv Création · comptabilité · ${filtrePeriode.nom}\r\nLivre des recettes, registre des achats et factures d'origine (empreinte sha256 dans le registre).\r\nFabriqué le ${new Date().toLocaleString("fr-FR")}.\r\n`]);
        downloadBlob(zipStore(files, "application/zip"), `${base}-${new Date().toISOString().slice(0, 10)}.zip`);
      } else {
        if (contenu !== "achats") await exportRows(format, lignesRec(format), COLS_REC, { basename: `livre-des-recettes-${periode}`, title: "Livre des recettes", subtitle: `Niv Création · ${filtrePeriode.nom}` });
        if (contenu !== "recettes") await exportRows(format, lignesAch(format), COLS_ACH, { basename: `registre-des-achats-${periode}`, title: "Registre des achats", subtitle: `Niv Création · ${filtrePeriode.nom}` });
      }
    } catch (e) { toast("Export impossible : " + e.message, "err"); }
    setBusy("");
  }

  if (!key) return <PageHead eyebrow="Finances" title="Comptabilité" subtitle="Ouvrez d'abord Gestion pour entrer." />;
  const b = d?.bord;
  const evol = b && b.caMoisPrec > 0 ? Math.round(((b.caMois - b.caMoisPrec) / b.caMoisPrec) * 100) : null;
  const maxMois = b ? Math.max(1, ...b.mois6.map((m) => Math.max(m.recettes, m.achats))) : 1;
  const recettesVues = (d?.recettes || []).filter((r) => filtrePeriode.ok(r.date));

  return (
    <div className="fq cp">
      <PageHead eyebrow="Finances" title="Comptabilité"
        subtitle="Comme un logiciel de comptabilité pour auto-entrepreneur : tout se remplit tout seul avec les commandes du site, les devis payés, les ventes hors site et le classeur des factures. Vous ne ressaisissez rien."
        kpis={b ? [
          { label: `Chiffre d'affaires ${new Date().getFullYear()}`, value: euro(b.caAnnee), sub: "encaissé depuis le 1er janvier" },
          { label: nomMois(b.mois6[5].mois), value: euro(b.caMois), sub: evol === null ? "mois en cours" : `${evol >= 0 ? "+" : ""}${evol} % sur le mois d'avant`, tone: evol !== null && evol >= 0 ? "good" : undefined },
          { label: "À déclarer à l'URSSAF", value: b.aDeclarer ? euro(b.aDeclarer.ca) : "rien", sub: b.aDeclarer ? `${nomMois(b.aDeclarer.mois)} · avant le ${dateFr(b.aDeclarer.echeance)}` : "tout est déclaré", tone: b.aDeclarer ? "warn" : "good" },
          { label: "Cotisations estimées", value: euro(b.cotisationsEstimees), sub: `${String(b.tauxTotal).replace(".", ",")} % · vente de marchandises` },
        ] : []} />
      {err ? <p className="fq-empty" style={{ color: "var(--ash-bad)" }}>{err}</p> : null}
      <nav className="cp-tabs" role="tablist">
        {TABS.map(([t, l]) => <button key={t} type="button" role="tab" aria-selected={tab === t} className={`fq-chip${tab === t ? " on" : ""}`} onClick={() => { setTab(t); try { history.replaceState(null, "", "#" + t); } catch { /* */ } }}>{l}{t === "pieces" && d?.pieces?.length ? ` · ${d.pieces.length}` : ""}</button>)}
      </nav>
      {!d ? <p className="fq-empty">Chargement…</p> : null}

      {d && tab === "bord" ? (
        <>
          <div className="cp-two">
            <section className="cp-box"><h3>Vos plafonds {new Date().getFullYear()}</h3>
              {b.jauges.map((j) => (
                <div key={j.libelle} className={`cp-jauge${j.alerte ? " alerte" : ""}`}>
                  <div className="cp-j1"><b>{j.libelle}</b><span className="mono">{euro(j.valeur)} / {euro(j.seuil)}</span></div>
                  <div className="cp-bar"><span style={{ width: `${(j.part * 100).toFixed(1)}%` }} /></div>
                  <span className="cp-sub">{j.majore ? `Au-delà de ${euro(j.seuil)} : TVA à facturer à partir du 1er janvier suivant ; au-delà de ${euro(j.majore)} : dès le jour du dépassement.` : "Au-delà deux années de suite : sortie du régime micro."}{j.alerte ? " ⚠️ Plus de 80 % atteints." : ""}</span>
                </div>
              ))}
              <p className="cp-sub">Ventes de marchandises. Si une partie de l&apos;activité est une prestation de service, elle a ses propres seuils ({euro(d.seuils.tvaServices.seuil)} pour la TVA, {euro(d.seuils.microServices.seuil)} pour le régime micro).</p>
            </section>
            <section className="cp-box"><h3>Échéances</h3>
              <ul className="cp-ech">
                {d.declarations.filter((x) => !x.declareLe).slice(-3).reverse().map((x) => (
                  <li key={x.mois} className={new Date(x.echeance + "T23:59:00") < new Date() ? "bad" : "warn"}><b>{dateFr(x.echeance)}</b><span>Déclaration URSSAF de {nomMois(x.mois)} · {euro(x.ca)}</span><button type="button" className="fq-btn sm" onClick={() => setTab("urssaf")}>Préparer</button></li>
                ))}
                <li><b>Mai {new Date().getFullYear() + 1}</b><span>Déclaration de revenus (case micro-BIC) · montant de l&apos;année prêt dans « Exports »</span></li>
                <li><b>1/9/2027</b><span>Factures électroniques à émettre</span><Link className="fq-btn sm ghost" href="/gestion/facture-electronique">Voir</Link></li>
              </ul>
            </section>
          </div>
          <section className="cp-box" style={{ marginTop: 14 }}><h3>Recettes et achats par mois</h3>
            <div className="cp-mois">
              {b.mois6.map((m) => (
                <div key={m.mois} title={`${nomMois(m.mois)} · recettes ${euro(m.recettes)} · achats ${euro(m.achats)}`}>
                  <span className="r" style={{ height: `${(m.recettes / maxMois) * 100}%` }} /><span className="a" style={{ height: `${(m.achats / maxMois) * 100}%` }} />
                  <em>{MOIS[Number(m.mois.slice(5)) - 1].slice(0, 4)}.</em>
                </div>
              ))}
            </div>
            <p className="cp-sub"><span className="cp-leg r" /> Recettes encaissées <span className="cp-leg a" /> Achats (classeur des factures)</p>
          </section>
        </>
      ) : null}

      {d && tab === "rec" ? (
        <>
          <p className="cp-sub">Obligatoire pour tout micro-entrepreneur : une ligne par encaissement (date, pièce, client, nature, mode de règlement, montant). Rempli tout seul. Commandes annulées, remboursées en entier et commandes test exclues.</p>
          <ChoixPeriode periode={periode} setPeriode={setPeriode} />
          <div className="cp-tablewrap"><table className="cp-table" style={{ minWidth: 760 }}><thead><tr><th>Date</th><th>Pièce</th><th>Client</th><th>Nature</th><th>Règlement</th><th className="n">Montant</th></tr></thead><tbody>
            {recettesVues.length === 0 ? <tr><td colSpan={6} className="cp-vide">Aucune recette sur cette période.</td></tr> : recettesVues.map((r, i) => (
              <tr key={i} className={r.montant < 0 ? "neg" : ""}><td className="nw">{dateFr(r.date)}</td><td className="nw">{r.orderId ? <Link href={`/gestion/commande/${encodeURIComponent(r.piece)}`}>#{r.piece}</Link> : r.piece}{r.facture ? <span className="cp-sub2">{r.facture}</span> : null}</td><td>{r.client}</td><td>{r.nature}</td><td>{r.reglement}</td><td className="n">{euro(r.montant)}</td></tr>
            ))}
          </tbody><tfoot><tr><td colSpan={5}>Total · {filtrePeriode.nom}</td><td className="n">{euro(recettesVues.reduce((s, r) => s + r.montant, 0))}</td></tr></tfoot></table></div>
          <p className="cp-sub">Une vente hors site (marché, main propre, Etsy) se saisit dans l&apos;accueil de Gestion, volet « Ventes hors site (URSSAF) » : elle apparaît ici toute seule.</p>
        </>
      ) : null}

      {d && tab === "ach" ? (
        <>
          <p className="cp-sub">Obligatoire quand on vend des marchandises : une ligne par achat, reliée à sa facture d&apos;origine dans le classeur.</p>
          <ChoixPeriode periode={periode} setPeriode={setPeriode} />
          <div className="cp-tablewrap"><table className="cp-table" style={{ minWidth: 680 }}><thead><tr><th>Date</th><th>Fournisseur</th><th>Nature</th><th className="n">Montant TTC</th><th>Facture</th></tr></thead><tbody>
            {d.achats.filter((a) => filtrePeriode.ok(a.date)).map((a) => (
              <tr key={a.id}><td className="nw">{dateFr(a.date)}</td><td><b>{a.fournisseur}</b>{a.numero ? <span className="cp-sub2">n° {a.numero}</span> : null}</td><td>{a.libelle}</td><td className="n">{euro(a.montant)}</td><td>{a.fichier ? <span className="fq-pill ok">Rangée</span> : <span className="fq-pill bad">Manquante</span>}</td></tr>
            ))}
          </tbody></table></div>
          <Link className="fq-btn" href="/gestion/achats">Ouvrir le classeur des factures</Link>
        </>
      ) : null}

      {d && tab === "urssaf" ? (
        <>
          {d.declarations.slice(0, 1).concat(d.declarations.filter((x) => !x.declareLe && x !== d.declarations[0])).slice(0, 2).map((x) => (
            <section key={x.mois} className="cp-box" style={{ marginBottom: 12 }}>
              <h3>Déclaration de {nomMois(x.mois)} {x.declareLe ? <span className="fq-pill ok">Déclarée le {dateFr(x.declareLe)}</span> : <span className="fq-pill warn">avant le {dateFr(x.echeance)}</span>}</h3>
              <table className="cp-table"><tbody>
                <tr><td>Ventes du site (Stripe : carte, PayPal…)</td><td className="n">{euro(x.detail.site)}</td></tr>
                <tr><td>Devis payés</td><td className="n">{euro(x.detail.devis)}</td></tr>
                <tr><td>Ventes hors site</td><td className="n">{euro(x.detail.horsSite)}</td></tr>
                <tr><td>− Remboursements du mois</td><td className="n">{euro(x.detail.remb)}</td></tr>
                <tr><td><b>Chiffre d&apos;affaires à déclarer</b></td><td className="n"><b>{euro(x.ca)}</b></td></tr>
                <tr><td>Cotisations estimées ({String(d.bord.tauxTotal).replace(".", ",")} %)</td><td className="n">{euro(x.cotisations)}</td></tr>
              </tbody></table>
              <div className="cp-acts">
                <button type="button" className="fq-btn pri" onClick={() => copier(x.ca)}>Copier le montant</button>
                <a className="fq-btn" href="https://www.autoentrepreneur.urssaf.fr/" target="_blank" rel="noreferrer">Ouvrir autoentrepreneur.urssaf.fr</a>
                {x.declareLe ? <button type="button" className="fq-btn ghost" onClick={() => declarer(x.mois, false)} disabled={busy === "urssaf:" + x.mois}>Annuler « déclarée »</button>
                  : <button type="button" className="fq-btn ok" onClick={() => declarer(x.mois, true)} disabled={busy === "urssaf:" + x.mois}>J&apos;ai déclaré et payé</button>}
              </div>
              <p className="cp-sub">Vous déclarez vous-même sur le site de l&apos;URSSAF ; ici, le montant est prêt et le détail se garde. Les ventes d&apos;un mois se déclarent avant la fin du mois suivant.</p>
            </section>
          ))}
          <section className="cp-box"><h3>Historique</h3>
            <div className="cp-tablewrap"><table className="cp-table"><tbody>
              {d.declarations.map((x) => <tr key={x.mois}><td>{nomMois(x.mois)}</td><td className="n">{euro(x.ca)}</td><td className="n">{euro(x.cotisations)}</td><td>{x.declareLe ? <span className="fq-pill ok">Déclaré le {dateFr(x.declareLe)}</span> : <span className="fq-pill warn">à déclarer avant le {dateFr(x.echeance)}</span>}</td></tr>)}
            </tbody></table></div>
          </section>
          {regl ? (
            <section className="cp-box" style={{ marginTop: 12 }}><h3>Vos taux</h3>
              <div className="cp-taux">
                <label>Cotisations sociales (%)<input inputMode="decimal" value={regl.taux} onChange={(e) => setRegl({ ...regl, taux: e.target.value })} /></label>
                <label>Formation professionnelle (%)<input inputMode="decimal" value={regl.cfp} onChange={(e) => setRegl({ ...regl, cfp: e.target.value })} /></label>
                <label>Versement libératoire de l&apos;impôt (%)<input inputMode="decimal" value={regl.vl} onChange={(e) => setRegl({ ...regl, vl: e.target.value })} /></label>
              </div>
              <div className="cp-acts"><button type="button" className="fq-btn" onClick={enregistrerTaux} disabled={busy === "taux"}>Enregistrer les taux</button></div>
              <p className="cp-sub">Vérifiés le 15/11/2026 : 12,3 % pour la vente de marchandises ; formation professionnelle 0,1 % (commerçant) ou 0,3 % (artisan) ; versement libératoire 1 % seulement si vous l&apos;avez choisi. Avec l&apos;ACRE (aide des débuts), le taux est réduit : mettez celui de votre compte URSSAF.</p>
            </section>
          ) : null}
        </>
      ) : null}

      {tab === "rappro" ? (
        <>
          <p className="cp-sub">Chaque versement de Stripe vers votre banque (carte, PayPal, Klarna passent par Stripe) est comparé aux commandes. Un écart = une vente sans commande, un remboursement ou des frais.</p>
          <div className="cp-acts" style={{ marginTop: 0 }}><button type="button" className="fq-btn" onClick={chargerRappro} disabled={busy === "rappro"}>{busy === "rappro" ? "Lecture de Stripe…" : "Relire Stripe"}</button></div>
          {!rappro ? <p className="fq-empty">Lecture des versements…</p> : rappro.erreur ? <p className="fq-empty" style={{ color: "var(--ash-bad)" }}>{rappro.erreur}</p> : (
            <div className="cp-tablewrap"><table className="cp-table" style={{ minWidth: 700 }}><thead><tr><th>Versement</th><th>Date</th><th className="n">Reçu</th><th>Commandes</th><th className="n">Frais</th><th>État</th></tr></thead><tbody>
              {(rappro.versements || []).length === 0 ? <tr><td colSpan={6} className="cp-vide">Aucun versement Stripe trouvé.</td></tr> : rappro.versements.map((v) => (
                <tr key={v.id}><td><b>Stripe</b><span className="cp-sub2">{v.statut === "paid" ? "versé" : v.statut}</span></td><td className="nw">{dateFr(v.date)}</td><td className="n">{euro(v.montant)}</td>
                  <td>{v.ventes.length} paiement{v.ventes.length > 1 ? "s" : ""} · {euro(v.brut)}<span className="cp-sub2">{v.ventes.filter((t) => t.order).map((t) => "#" + t.order.ref).join(", ")}{v.sansCommande ? ` · ${v.sansCommande} sans commande (devis, carte cadeau…)` : ""}{v.autres ? ` · remboursements / ajustements ${euro(v.autres)}` : ""}</span></td>
                  <td className="n">{euro(v.frais)}</td><td>{v.etat === "ok" ? <span className="fq-pill ok">Concorde</span> : <span className="fq-pill warn">{Math.abs(v.ecart) >= 0.02 ? `Écart ${euro(v.ecart)}` : "À regarder"}</span>}</td></tr>
              ))}
            </tbody></table></div>
          )}
        </>
      ) : null}

      {d && tab === "pieces" ? (
        d.pieces.length === 0 ? <p className="fq-empty">Toutes les pièces sont rangées ✓</p> : (
          <ul className="cp-ech">
            {d.pieces.map((p) => (
              <li key={p.id} className={p.etat === "manquante" ? "bad" : "warn"}><b>{p.etat === "manquante" ? "Achat" : "À vérifier"}</b><span>{p.fournisseur} · {dateFr(p.date)} · {euro(p.montant)}{p.note ? ` · ${p.note}` : ""}</span><Link className="fq-btn sm" href="/gestion/achats">{p.etat === "manquante" ? "Ajouter la facture" : "Vérifier"}</Link></li>
            ))}
          </ul>
        )
      ) : null}

      {d && tab === "export" ? (
        <div className="cp-two">
          <section className="cp-box"><h3>Exporter</h3>
            <div className="cp-taux">
              <label>Période<select value={periode} onChange={(e) => setPeriode(e.target.value)}><option value="annee">Année {new Date().getFullYear()}</option><option value="trimestre">Trimestre en cours</option><option value="mois">Mois en cours</option><option value="avant">Année {new Date().getFullYear() - 1}</option></select></label>
              <label>Contenu<select value={contenu} onChange={(e) => setContenu(e.target.value)}><option value="tout">Livre des recettes + registre des achats</option><option value="recettes">Livre des recettes seul</option><option value="achats">Registre des achats seul</option><option value="zip">Tout + les factures d&apos;origine (dossier .zip)</option></select></label>
              {contenu !== "zip" ? <label>Format<select value={format} onChange={(e) => setFormat(e.target.value)}><option value="xlsx">Tableur (Excel)</option><option value="pdf">PDF</option><option value="csv">CSV</option></select></label> : null}
            </div>
            <div className="cp-acts"><button type="button" className="fq-btn pri" onClick={exporter} disabled={busy === "export"}>{busy === "export" ? "Préparation…" : "Exporter"}</button></div>
          </section>
          <section className="cp-box"><h3>Pour un contrôle ou un comptable</h3>
            <p className="cp-sub" style={{ marginTop: 0 }}>Un seul dossier : le livre des recettes, le registre des achats et chaque facture d&apos;origine avec son empreinte. Les factures se gardent 10 ans.</p>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ChoixPeriode({ periode, setPeriode }) {
  return (
    <div className="fq-chipbar" style={{ flexWrap: "wrap", margin: "8px 0" }}>
      {[["annee", `Année ${new Date().getFullYear()}`], ["trimestre", "Trimestre"], ["mois", "Mois en cours"], ["avant", `Année ${new Date().getFullYear() - 1}`]].map(([v, l]) => <button key={v} type="button" className={`fq-chip${periode === v ? " on" : ""}`} onClick={() => setPeriode(v)}>{l}</button>)}
    </div>
  );
}
