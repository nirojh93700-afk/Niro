"use client";

// Gestion → Commandes → « Retours » (24/11/2026, gérant : « mets-moi en place tout ce qui est demande de retour…
// sache combien de demandes de retour par rapport aux commandes »).
// Lecture des commandes (champ `retour`) : taux de retour, étapes, motifs, produits, mois. Une demande se déclare
// et se fait avancer depuis la fiche de la commande (bloc « Demande de retour »), ou d'ici avec « Déclarer ».
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHead from "@/components/admin/PageHead";
import { statsRetours, aUnRetour, RETOUR_ETATS, RETOUR_ETAT, RETOUR_MOTIF, RETOUR_EN_COURS } from "@/lib/retours";
import { hrefFiche, refDe } from "@/lib/fileCommandes";
import { nomAffiche } from "@/lib/nomLivraison";

const jour = (t) => (t ? new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" }) : "");
const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const moisLib = (k) => { const [a, m] = String(k).split("-").map(Number); return MOIS[m - 1] ? `${MOIS[m - 1]} ${a}` : k; };
const sansAccent = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const PERIODES = [["", "Depuis le début"], ["365", "12 derniers mois"], ["90", "90 derniers jours"], ["30", "30 derniers jours"]];

export default function RetoursPage() {
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState("");
  const [vue, setVue] = useState("encours");
  const [periode, setPeriode] = useState("");
  const [q, setQ] = useState("");

  const charger = useCallback(async () => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    try {
      const r = await fetch("/api/admin/orders", { headers: { "x-admin-key": k } });
      if (!r.ok) throw new Error(r.status === 401 ? "Mot de passe de Gestion demandé : ouvrez d'abord l'accueil de Gestion." : "Chargement impossible.");
      setOrders((await r.json()).orders || []); setErr("");
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const depuis = periode ? new Date(Date.now() - Number(periode) * 86400000).toISOString() : "";
  const s = useMemo(() => (orders ? statsRetours(orders, { depuis }) : null), [orders, depuis]);
  const avecRetour = useMemo(() => (orders || []).filter((o) => !o.test && aUnRetour(o) && (!depuis || Date.parse(o.createdAt || "") >= Date.parse(depuis)))
    .sort((a, b) => Date.parse(b.retour.demandeLe || 0) - Date.parse(a.retour.demandeLe || 0)), [orders, depuis]);
  const liste = vue === "encours" ? avecRetour.filter((o) => RETOUR_EN_COURS.has(o.retour.etat)) : vue === "tout" ? avecRetour : avecRetour.filter((o) => o.retour.etat === vue);

  // « Déclarer un retour » : retrouver la commande (réf, nom, e-mail) puis ouvrir sa fiche au bloc Retour.
  const trouvees = useMemo(() => {
    const t = sansAccent(q).trim();
    if (t.length < 2 || !orders) return [];
    return orders.filter((o) => !o.test && sansAccent(`${o.ref} ${o.customerName} ${o.customerEmail}`).includes(t)).slice(0, 6);
  }, [q, orders]);

  const maxProduit = Math.max(1, ...(s?.parProduit || []).map((p) => p.n));
  return (
    <div className="container rt-page" style={{ padding: "28px 16px 60px", maxWidth: 1040 }}>
      <PageHead eyebrow="Commandes" title="Retours"
        subtitle="Combien de commandes font l'objet d'une demande de retour, pourquoi, et sur quels produits. Une demande se déclare dans la fiche de la commande (bloc « Demande de retour ») : aucun e-mail ne part d'ici."
        kpis={s ? [
          { label: "Taux de retour", value: s.tauxTexte, sub: `${s.retours} demande${s.retours > 1 ? "s" : ""} sur ${s.commandes} commande${s.commandes > 1 ? "s" : ""}`, tone: s.taux > 0.05 ? "bad" : s.taux > 0.02 ? "warn" : "good" },
          { label: "En cours", value: String(s.enCours), sub: "demandé, accepté ou colis reçu", tone: s.enCours ? "warn" : "good" },
          { label: "Dus à une erreur de l'atelier", value: String(s.erreursAtelier), sub: "gravure, mauvais produit, abîmé, manquant" },
          { label: "Remboursé", value: euro(s.rembourse), sub: "retours remboursés" },
        ] : []} />
      {err ? <div className="notice">{err}</div> : null}
      {!orders && !err ? <p>Chargement…</p> : null}
      {s ? (
        <>
          <div className="rt-bar">
            <label>Période <select value={periode} onChange={(e) => setPeriode(e.target.value)}>{PERIODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <div className="rt-declarer">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Déclarer un retour : réf., nom ou e-mail de la commande" />
              {trouvees.length ? <ul>{trouvees.map((o) => <li key={o.id}><Link href={`${hrefFiche(o)}#fc-retour`}><b>#{refDe(o)}</b> {nomAffiche(o)} · {jour(o.createdAt)}{aUnRetour(o) ? " · retour déjà déclaré" : ""}</Link></li>)}</ul> : null}
            </div>
          </div>

          <div className="rt-onglets">
            {[["encours", `En cours (${s.enCours})`], ...RETOUR_ETATS.filter((e) => !RETOUR_EN_COURS.has(e.id)).map((e) => [e.id, `${e.lib} (${s.parEtat[e.id]})`]), ["tout", `Tout (${s.retours})`]].map(([k, t]) => (
              <button key={k} type="button" className={vue === k ? "on" : ""} onClick={() => setVue(k)}>{t}</button>
            ))}
          </div>

          {liste.length ? (
            <div className="rt-liste">
              {liste.map((o) => {
                const e = RETOUR_ETAT[o.retour.etat];
                return (
                  <Link key={o.id} href={`${hrefFiche(o)}#fc-retour`} className="rt-ligne">
                    <span className="rt-ref"><b>#{refDe(o)}</b><small>{jour(o.retour.demandeLe)}</small></span>
                    <span className="rt-qui"><b>{nomAffiche(o) || "Cliente"}</b><small>{(o.items || []).map((i) => i.name).join(" · ")}</small></span>
                    <span className="rt-motif">{RETOUR_MOTIF[o.retour.motif]?.lib || "—"}{o.retour.note ? <small>{o.retour.note}</small> : null}</span>
                    <span className={`rt-pill rt-${e.tone}`}>{e.lib}{o.retour.montant ? ` · ${euro(o.retour.montant)}` : ""}</span>
                  </Link>
                );
              })}
            </div>
          ) : <p className="faint" style={{ margin: "14px 2px" }}>{s.retours ? "Aucune demande dans cette vue." : "Aucune demande de retour déclarée pour cette période."}</p>}

          <div className="rt-grille">
            <section className="rt-carte">
              <h3>Par motif</h3>
              {s.parMotif.length ? s.parMotif.map((m) => <div key={m.id} className="rt-kv"><span>{m.lib}</span><b>{m.n}</b></div>) : <p className="faint">Rien encore.</p>}
            </section>
            <section className="rt-carte">
              <h3>Par produit</h3>
              {s.parProduit.length ? s.parProduit.slice(0, 12).map((p) => (
                <div key={p.nom} className="rt-prod">
                  <div className="rt-kv"><span>{p.nom}</span><b>{p.n} / {p.vendus}</b></div>
                  <div className="rt-jauge"><i style={{ width: `${(p.n / maxProduit) * 100}%` }} /></div>
                  <small>{(p.taux * 100).toFixed(1).replace(".", ",")} % des commandes de ce produit</small>
                </div>
              )) : <p className="faint">Rien encore.</p>}
            </section>
            <section className="rt-carte">
              <h3>Par mois de la demande</h3>
              {s.parMois.length ? s.parMois.map((m) => <div key={m.mois} className="rt-kv"><span>{moisLib(m.mois)}</span><b>{m.n}</b></div>) : <p className="faint">Rien encore.</p>}
            </section>
          </div>
          <p className="faint" style={{ marginTop: 16 }}>Taux = commandes avec une demande de retour ÷ toutes les commandes de la période (hors commandes test et compléments payés par devis). Un colis non distribué revenu à l&apos;atelier n&apos;est pas un retour : ne le déclarez pas ici.</p>
        </>
      ) : null}
    </div>
  );
}
