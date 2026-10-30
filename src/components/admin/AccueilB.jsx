"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEuro } from "@/lib/format";
import { chiffresPeriode, devisEnAttente, depuis } from "@/lib/dashPeriodes";
import { delaiCommande, jourFr } from "@/lib/delaiCommande";
import { livraisonCommande } from "@/lib/optionsVendues";
import { Ico } from "@/components/admin/AdminShell";

// =============================================================================
// ACCUEIL DE GESTION — « version B », téléphone d'abord (maquette Gestion moderne
// v3, appliquée le 30/10/2026 : « mets en ligne la version B »).
// Bonjour + date · pastilles (Express, à traiter, à valider, à racheter) · bandeau
// de la dernière commande Express · 4 chiffres du mois · « À faire » groupé par
// urgence (Urgent / Aujourd'hui / Cette semaine / Surveillance / Tout), chaque
// point avec son action, « Pourquoi c'est là » et « Plus tard » · dernières
// commandes · colonne droite : activité récente, le mois en détail, et les blocs
// d'avant (URSSAF, ventes hors site, stock cristal, assistant) en volets.
// TOUT est calculé sur les vraies données déjà chargées par la page : aucun
// chiffre inventé (pas de « résumé du matin », pas de règle automatique : ces
// écrans « Nouveau (v3) » de la maquette ne sont pas construits).
// =============================================================================

const ACTIFS = new Set(["a_preparer", "en_gravure"]);
const LATER = "niv-accueil-plus-tard";
const JOUR = 86400000;
const nom = (o) => o?.customerName || o?.customerEmail || "Cliente";
const prenom = (s) => String(s || "").trim().split(/\s+/)[0] || "Cliente";
const liste = (arr, n = 3) => arr.slice(0, n).join(" · ") + (arr.length > n ? ` · +${arr.length - n}` : "");
const plur = (n, mot, fem) => `${n} ${mot}${n > 1 ? "s" : ""}`;

function lireLater() {
  try {
    const s = JSON.parse(localStorage.getItem(LATER) || "{}") || {};
    const today = new Date().toDateString();
    return Object.fromEntries(Object.entries(s).filter(([, d]) => d === today));
  } catch { return {}; }
}

// Chiffre d'affaires par jour sur les 14 derniers jours (courbe des tuiles).
function serieJours(orders, champ, now = Date.now()) {
  const pts = Array(14).fill(0);
  const j0 = Math.floor(now / JOUR) - 13;
  for (const o of orders) {
    const t = Date.parse(o.createdAt || "");
    if (!t) continue;
    const i = Math.floor(t / JOUR) - j0;
    if (i >= 0 && i < 14) pts[i] += champ === "n" ? 1 : Number(o.total) || 0;
  }
  return pts;
}

function Spark({ pts }) {
  if (!pts || !pts.some((v) => v > 0)) return null;
  const w = 160, h = 34, mx = Math.max(...pts), mn = Math.min(...pts);
  const xy = pts.map((v, i) => [i * w / (pts.length - 1), h - 3 - (v - mn) / ((mx - mn) || 1) * (h - 8)]);
  const l = xy.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const e = xy[xy.length - 1];
  return (
    <svg className="hb-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path className="a" d={`${l} L${w} ${h} L0 ${h}Z`} /><path className="l" d={l} /><circle cx={e[0]} cy={e[1]} r="2.5" />
    </svg>
  );
}

const GROUPES = [["urgent", "Urgent", "bad"], ["jour", "Aujourd'hui", ""], ["semaine", "Cette semaine", ""], ["auto", "Surveillance", ""], ["tout", "Tout", ""]];

export default function AccueilB({
  orders = [], validOrders = [], pendingList = [], unreadMeta = [], quotes = [], pendingReviews = 0,
  salesGoal = 0, rows = [], adminKey = "", urssaf = null, photoProduit = () => "",
  onTab = () => {}, onOpenOrder = () => {}, onRetires = () => {}, adminKeyRetirer = "", apresAFaire = null, children,
}) {
  const now = Date.now();
  const [groupe, setGroupe] = useState("urgent");
  const [menu, setMenu] = useState("");
  const [pourquoi, setPourquoi] = useState("");
  const [later, setLater] = useState({});
  const [urgVu, setUrgVu] = useState(true);
  const [materiel, setMateriel] = useState([]);
  const [sante, setSante] = useState(null);

  useEffect(() => { setLater(lireLater()); }, []);
  // Matériel sous son seuil « à racheter » + santé du catalogue : deux petits appels, une fois.
  useEffect(() => {
    if (!adminKey) return;
    const H = { headers: { "x-admin-key": adminKey } };
    fetch("/api/admin/materiel", H).then((r) => (r.ok ? r.json() : null)).then((d) => {
      const items = (d?.items || []).filter((i) => !i.archive && typeof i.stock === "number" && typeof i.seuil === "number" && i.stock <= i.seuil);
      setMateriel(items);
    }).catch(() => {});
    fetch("/api/admin/catalog-audit", H).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setSante(d); }).catch(() => {});
  }, [adminKey]);

  const actifs = useMemo(() => orders.filter((o) => !o.test && ACTIFS.has(o.status || "a_preparer")), [orders]);
  const express = useMemo(() => actifs.filter((o) => livraisonCommande(o).express), [actifs]);
  const delais = useMemo(() => actifs.map((o) => ({ o, d: delaiCommande(o, now) })).filter((x) => x.d), [actifs, now]);
  const depasses = delais.filter((x) => x.d.etat === "depasse");
  const bientot = delais.filter((x) => x.d.etat === "bientot");
  const devis = useMemo(() => devisEnAttente(quotes), [quotes]);
  const c = useMemo(() => chiffresPeriode(validOrders, "mois", now), [validOrders, now]);
  const serieCa = useMemo(() => serieJours(validOrders, "ca", now), [validOrders, now]);
  const serieN = useMemo(() => serieJours(validOrders, "n", now), [validOrders, now]);
  const ruptures = rows.filter((r) => typeof r.stock === "number" && r.stock === 0);
  const stockBas = rows.filter((r) => typeof r.stock === "number" && r.stock > 0 && r.stock <= 5);
  const pendingTard = pendingList.filter((p) => p.at && now - p.at > 24 * 3600000);
  const unreadTard = unreadMeta.filter((u) => u.lastClientAt && now - new Date(u.lastClientAt).getTime() > 24 * 3600000);

  // Dernière commande Express encore à faire : bandeau rouge, refermable (retenu sur cet appareil).
  const urg = express.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null;
  useEffect(() => {
    if (!urg) return;
    try { setUrgVu(sessionStorage.getItem("niv-accueil-urg") === urg.id); } catch { setUrgVu(false); }
  }, [urg]);

  // ---- « À faire » : un point par sujet, groupé par urgence, chacun avec son pourquoi ----
  const items = [];
  const add = (x) => items.push(x);
  if (express.length) add({ id: "express", g: "urgent", c: "t-bad", ic: "bolt",
    b: `${plur(express.length, "commande")} Express à graver en priorité`,
    s: liste(express.map((o) => `${o.ref || ""} · ${prenom(nom(o))} · ${depuis(new Date(o.createdAt).getTime(), now)}`)),
    a: "Ouvrir", href: `/gestion/commandes?q=${encodeURIComponent(express[0].ref || "")}`,
    why: "Express Chronopost = engagement 24/48 h après confection. Elle passe devant toutes les autres." });
  if (depasses.length) add({ id: "depasse", g: "urgent", c: "t-bad", ic: "clock",
    b: `${plur(depasses.length, "commande")} dépasse${depasses.length > 1 ? "nt" : ""} la date limite d'expédition`,
    s: liste(depasses.map((x) => `${x.o.ref || ""} (${-x.d.ouvresRestants} j ouvré${-x.d.ouvresRestants > 1 ? "s" : ""} de retard)`)),
    a: "Voir", href: "/gestion/commandes",
    why: "Le site promet 5 jours ouvrés de fabrication. Compté en jours ouvrés, jours fériés exclus (règle du 26/10)." });
  if (pendingTard.length || unreadTard.length) add({ id: "msg-tard", g: "urgent", c: "t-bad", ic: "mail",
    b: `${plur(pendingTard.length + unreadTard.length, "message")} attend${pendingTard.length + unreadTard.length > 1 ? "ent" : ""} depuis plus de 24 h`,
    s: liste([...pendingTard.map((p) => p.name || p.email || "Cliente"), ...unreadTard.map((u) => u.customerName || u.customerEmail || u.ref)]),
    a: "Relire", href: pendingTard.length ? "/gestion/assistant" : "/gestion/fiches",
    retirer: { ids: pendingTard.map((p) => p.id), orderIds: unreadTard.map((u) => u.orderId) },
    why: "Une cliente sans réponse plus d'une journée s'inquiète. Les réponses préparées n'attendent que votre relecture." });
  if (bientot.length) add({ id: "bientot", g: "jour", c: "t-warn", ic: "orders",
    b: `${plur(bientot.length, "commande")} à expédier aujourd'hui ou demain`,
    s: liste(bientot.map((x) => `${x.o.ref || ""} · ${x.d.ouvresRestants === 0 ? "dernier jour" : jourFr(x.d.limite)}`)),
    a: "File de production", href: "/gestion/commandes",
    why: "Date limite = 5 jours ouvrés après la commande (fériés exclus). Regroupées pour sortir fiches, étiquettes et matériel en une fois." });
  const pendingFrais = pendingList.filter((p) => !pendingTard.includes(p));
  if (pendingFrais.length) add({ id: "pending", g: "jour", c: "t-gold", ic: "spark",
    b: `${plur(pendingFrais.length, "réponse")} de l'assistant à valider`,
    s: liste(pendingFrais.map((p) => p.name || p.email || "Cliente")),
    a: "Relire", href: "/gestion/assistant",
    retirer: { ids: pendingFrais.map((p) => p.id), orderIds: [] },
    why: "L'assistant a lu chaque message et son dossier (commande, devis, échanges). Rien ne part sans vous." });
  const unreadFrais = unreadMeta.filter((u) => !unreadTard.includes(u));
  if (unreadFrais.length) add({ id: "unread", g: "jour", c: "t-gold", ic: "mail",
    b: `${plur(unreadFrais.length, "réponse")} de cliente${unreadFrais.length > 1 ? "s" : ""} à lire`,
    s: liste(unreadFrais.map((u) => `${u.customerName || u.customerEmail || "Cliente"} · ${u.ref || ""}`)),
    a: "Ouvrir la commande", onClick: () => onOpenOrder(unreadFrais[0].orderId),
    retirer: { ids: [], orderIds: unreadFrais.map((u) => u.orderId) },
    why: "La cliente a répondu dans le fil de sa commande (bouton « Répondre » de l'e-mail)." });
  if (devis.n) add({ id: "devis", g: "jour", c: "t-info", ic: "euro",
    b: `${plur(devis.n, "devis")} en attente · ${formatEuro(devis.total)}`,
    s: liste(devis.liste.map((q) => `${q.number || "Devis"} · ${q.client?.name || q.clientName || "Client"}`)),
    a: "Voir les devis", onClick: () => onTab("devis"),
    why: "De l'argent posé sur la table : un devis envoyé et pas encore payé." });
  if (urssaf && urssaf.daysLeft <= 10) add({ id: "urssaf", g: "jour", c: "t-warn", ic: "euro",
    b: `URSSAF — à déclarer : ${urssaf.montant > 0 ? formatEuro(urssaf.montant) : "0 €"}`,
    s: `Chiffre d'affaires de ${urssaf.periode} · avant le ${urssaf.deadline}${urssaf.daysLeft > 0 ? ` · ${urssaf.daysLeft} j restants` : " · aujourd'hui"}`,
    a: "Déclarer", href: "https://www.autoentrepreneur.urssaf.fr/", ext: true,
    why: "Déclaration mensuelle du chiffre d'affaires encaissé du mois précédent (ventes du site + ventes hors site saisies ci-contre)." });
  if (materiel.length) add({ id: "materiel", g: "semaine", c: "t-warn", ic: "box",
    b: `Réachat conseillé : ${liste(materiel.map((i) => i.nom.toLowerCase()), 2)}`,
    s: liste(materiel.map((i) => `${i.nom} : ${i.stock} restant${i.stock > 1 ? "s" : ""} (seuil ${i.seuil})`), 3),
    a: "Matériel", href: "/gestion/materiel",
    why: "Chaque article de matériel a un seuil « à racheter » réglé dans Matériel & emballages ; le stock est passé dessous." });
  if (ruptures.length || stockBas.length) add({ id: "stock", g: "semaine", c: "t-warn", ic: "tag",
    b: ruptures.length ? `${plur(ruptures.length, "produit")} en rupture${stockBas.length ? ` · ${stockBas.length} bientôt` : ""}` : `${plur(stockBas.length, "produit")} bientôt épuisé${stockBas.length > 1 ? "s" : ""}`,
    s: liste([...ruptures, ...stockBas].map((r) => `${r.productName || r.name || ""}${r.variantTitle ? ` · ${r.variantTitle}` : ""} : ${r.stock}`), 3),
    a: "Produits & stock", onClick: () => onTab("produits"),
    why: "Stock suivi dans Produits & stock : à 0 la fiche affiche « Rupture », à 5 ou moins c'est le moment de recommander." });
  if (pendingReviews) add({ id: "avis", g: "semaine", c: "t-info", ic: "star",
    b: `${plur(pendingReviews, "avis")} à valider`, s: "Un avis n'est publié que sur votre clic.",
    a: "Lire", onClick: () => onTab("avis"), why: "Tout le monde peut noter ; c'est vous qui validez avant publication (règle du 27/10)." });
  if (urssaf && urssaf.daysLeft > 10) add({ id: "urssaf", g: "semaine", c: "t-info", ic: "euro",
    b: `URSSAF — à déclarer : ${urssaf.montant > 0 ? formatEuro(urssaf.montant) : "0 €"}`,
    s: `Chiffre d'affaires de ${urssaf.periode} · avant le ${urssaf.deadline} · ${urssaf.daysLeft} j restants`,
    a: "Déclarer", href: "https://www.autoentrepreneur.urssaf.fr/", ext: true,
    why: "Déclaration mensuelle du chiffre d'affaires encaissé du mois précédent (ventes du site + ventes hors site saisies ci-contre)." });
  if (sante && sante.issueCount) {
    const imp = (sante.issues || []).filter((i) => i.severity === "high" || i.severity === "important").length;
    add({ id: "sante", g: "auto", c: imp ? "t-warn" : "auto", ic: "shield",
      b: `Santé du catalogue : ${plur(sante.issueCount, "point")} à regarder${imp ? ` dont ${imp} important${imp > 1 ? "s" : ""}` : ""}`,
      s: liste((sante.issues || []).map((i) => i.message || i.type), 2),
      a: "Santé du catalogue", href: "/gestion/sante",
      why: "Surveillance automatique : produit sans photo, sans emballage, prix écrit différent du prix payé, choix absent de la fiche atelier…" });
  }

  const visibles = items.filter((i) => !later[i.id]);
  const parGroupe = (g) => (g === "tout" ? visibles : visibles.filter((i) => i.g === g));
  const courants = parGroupe(groupe);
  function plusTard(id) {
    const n = { ...later, [id]: new Date().toDateString() };
    setLater(n); setMenu("");
    try { localStorage.setItem(LATER, JSON.stringify(n)); } catch { /* stockage indisponible */ }
  }
  const [retrait, setRetrait] = useState("");
  async function retirerPoint(it) {
    const { ids = [], orderIds = [] } = it.retirer || {};
    const n = ids.length + orderIds.length;
    if (!n || !confirm(`Retirer ces ${n} message${n > 1 ? "s" : ""} de l'accueil ?\n\nRien n'est supprimé ni envoyé : ils restent dans chaque commande, le dossier de la cliente et la boîte mail.`)) return;
    setRetrait(it.id);
    const H = { "Content-Type": "application/json", "x-admin-key": adminKeyRetirer || adminKey };
    try {
      const [a, b] = await Promise.all([
        ids.length ? fetch("/api/admin/pending-replies", { method: "POST", headers: H, body: JSON.stringify({ action: "traite", ids }) }) : null,
        orderIds.length ? fetch("/api/admin/bat", { method: "POST", headers: H, body: JSON.stringify({ action: "lu", orderIds }) }) : null,
      ]);
      onRetires({ ids: a && a.ok ? ids : [], orderIds: b && b.ok ? orderIds : [] });
      setMenu("");
    } catch { /* le toast global signale l'échec */ }
    finally { setRetrait(""); }
  }
  function vuUrg() { setUrgVu(true); try { sessionStorage.setItem("niv-accueil-urg", urg.id); } catch { /* idem */ } }

  // ---- Dernières commandes ----
  const recentes = [...orders].filter((o) => !o.test).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
  const PILL = { a_preparer: ["prep", "À préparer"], en_gravure: ["grav", "En gravure"], expediee: ["exp", "Expédiée"], livree: ["liv", "Livrée"], remise_main_propre: ["liv", "Remise en main propre"], annulee: ["bad", "Annulée"], remboursee: ["bad", "Remboursée"] };
  const limPill = (o) => {
    if (!ACTIFS.has(o.status || "a_preparer")) return null;
    const d = delaiCommande(o, now);
    if (!d) return null;
    if (d.etat === "depasse") return <span className="hb-lim late">en retard de {-d.ouvresRestants} j</span>;
    if (d.ouvresRestants === 0) return <span className="hb-lim today">aujourd&apos;hui</span>;
    return <span className="hb-lim ok">dans {d.ouvresRestants} j ouvré{d.ouvresRestants > 1 ? "s" : ""}</span>;
  };

  // ---- Activité récente (ce qui s'est vraiment passé, par date) ----
  const activite = useMemo(() => {
    const ev = [];
    for (const o of orders) {
      if (o.test) continue;
      const t = Date.parse(o.createdAt || "");
      if (t) ev.push({ t, c: "t-ok", ic: "check", b: `Commande ${o.ref || ""} payée`, s: `${nom(o)} · ${formatEuro(o.total)}${livraisonCommande(o).express ? " · Express" : ""}` });
      const ts = Date.parse(o.shippedAt || "");
      if (ts) ev.push({ t: ts, c: "t-ok", ic: "truck", b: `${o.ref || ""} expédiée`, s: livraisonCommande(o).texte || "" });
      const td = Date.parse(o.deliveredAt || "");
      if (td) ev.push({ t: td, c: "t-ok", ic: "check", b: `${o.ref || ""} ${o.status === "remise_main_propre" ? "remise en main propre" : "livrée"}`, s: nom(o) });
    }
    for (const p of pendingList) if (p.at) ev.push({ t: p.at, c: "t-gold", ic: "spark", b: `Réponse préparée pour ${p.name || p.email || "une cliente"}`, s: p.subject || "" });
    for (const u of unreadMeta) { const t = Date.parse(u.lastClientAt || ""); if (t) ev.push({ t, c: "t-gold", ic: "mail", b: `${u.customerName || u.customerEmail || "Une cliente"} a répondu`, s: `dans la commande ${u.ref || ""}` }); }
    return ev.sort((a, b) => b.t - a.t).slice(0, 8);
  }, [orders, pendingList, unreadMeta]);

  // ---- Le mois en détail ----
  const mois = useMemo(() => {
    const d0 = new Date(); d0.setDate(1); d0.setHours(0, 0, 0, 0);
    const ceMois = validOrders.filter((o) => Date.parse(o.createdAt || "") >= d0.getTime());
    const pieces = ceMois.reduce((s, o) => s + (o.items || []).reduce((a, i) => a + (Number(i.quantity) || 1), 0), 0);
    const premiere = new Map();
    for (const o of validOrders) { const e = (o.customerEmail || "").toLowerCase(); const t = Date.parse(o.createdAt || ""); if (e && t && (!premiere.has(e) || t < premiere.get(e))) premiere.set(e, t); }
    const nouvelles = [...premiere.values()].filter((t) => t >= d0.getTime()).length;
    const livraison = ceMois.reduce((s, o) => s + (Number(o.shippingCost ?? o.shipping ?? 0) || 0), 0);
    return { ca: c.cur.ca, n: ceMois.length, pieces, nouvelles, livraison };
  }, [validOrders, c]);

  const dateFR = (() => { const d = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }); return d.charAt(0).toUpperCase() + d.slice(1); })();
  const Tr = ({ t }) => <span className={`d ${t.sens === "up" ? "up" : t.sens === "dn" ? "down" : ""}`}>{t.texte} <small>{c.vs}</small></span>;
  const objectif = Number(salesGoal) || 0;
  const pct = objectif > 0 ? Math.min(100, Math.round((c.cur.ca / objectif) * 100)) : 0;

  const Bouton = ({ it, className }) => it.href
    ? <a className={className} href={it.href} target={it.ext ? "_blank" : undefined} rel={it.ext ? "noopener noreferrer" : undefined}>{it.a}</a>
    : <button type="button" className={className} onClick={it.onClick}>{it.a}</button>;

  return (
    <div className="hb">
      <div className="hb-hero">
        <div className="grow"><h1>Bonjour</h1><p>{dateFR}</p></div>
        <div className="hb-nums" aria-label="En un coup d'œil">
          <a href="/gestion/commandes" className={express.length ? "bad" : ""}><i>{express.length}</i> Express</a>
          <a href="/gestion/commandes"><i>{actifs.length}</i> à traiter</a>
          <a href="/gestion/assistant"><i>{pendingList.length + unreadMeta.length}</i> à valider</a>
          <a href="/gestion/materiel"><i>{materiel.length}</i> à racheter</a>
        </div>
      </div>

      {urg && !urgVu ? (
        <div className="hb-urg" role="status">
          <Ico n="bolt" />
          <span className="t">Commande Express {urg.ref || ""} · {nom(urg)} · {formatEuro(urg.total)} · à graver en priorité</span>
          <a className="hb-btn pri sm" href={`/gestion/commandes?q=${encodeURIComponent(urg.ref || "")}`}>Ouvrir</a>
          <button type="button" className="hb-x" onClick={vuUrg} aria-label="Vu"><Ico n="x" /></button>
        </div>
      ) : null}

      <div className="hb-strip">
        <div className="hb-kpi"><span className="l">Chiffre d&apos;affaires · ce mois</span><span className="v">{formatEuro(c.cur.ca)}</span><Tr t={c.trCa} /><Spark pts={serieCa} /></div>
        <div className="hb-kpi"><span className="l">Commandes · ce mois</span><span className="v">{c.cur.n}</span><Tr t={c.trN} /><Spark pts={serieN} /></div>
        <div className="hb-kpi"><span className="l">Panier moyen</span><span className="v">{c.cur.n ? formatEuro(c.cur.panier) : "—"}</span>{c.cur.n ? <Tr t={c.trPanier} /> : <span className="d">pas encore de commande ce mois</span>}</div>
        {objectif > 0 ? (
          <div className="hb-kpi"><span className="l">Objectif du mois</span><span className="v">{pct} %</span><span className="d">{formatEuro(c.cur.ca)} sur {formatEuro(objectif)}</span><span className="hb-bar"><i style={{ width: `${pct}%` }} /></span></div>
        ) : (
          <div className="hb-kpi"><span className="l">Devis en attente</span><span className="v">{devis.n}</span><span className="d">{devis.n ? `${formatEuro(devis.total)} à encaisser` : "aucun devis ouvert"}</span></div>
        )}
      </div>

      <div className="hb-grid">
        <div className="hb-col">
          <div className="hb-card">
            <div className="ch">À faire<span className="grow" /><span className="sub2">{visibles.length} point{visibles.length > 1 ? "s" : ""}</span></div>
            <div className="hb-seg" role="tablist" aria-label="Urgence">
              {GROUPES.map(([g, l, cls]) => { const n = parGroupe(g).length; return (
                <button key={g} type="button" role="tab" aria-selected={groupe === g} className={`hb-chip ${cls}${groupe === g ? " on" : ""}`} onClick={() => { setGroupe(g); setMenu(""); }}>{l}<i>{n}</i></button>
              ); })}
            </div>
            <div className="hb-list">
              {courants.length ? courants.map((it) => (
                <div className={`hb-it ${it.c}`} key={it.id}>
                  <div className="row1"><span className="ic"><Ico n={it.ic} /></span><div style={{ minWidth: 0, flex: 1 }}><b>{it.b}</b><div className="s">{it.s}</div></div></div>
                  <div className="row2">
                    <Bouton it={it} className={`hb-btn${it.g === "urgent" ? " pri" : ""}`} />
                    <button type="button" className="more" aria-label="Plus" onClick={() => { setMenu(menu === it.id ? "" : it.id); setPourquoi(""); }}><Ico n="more" /></button>
                  </div>
                  {menu === it.id ? (
                    <div className="hb-menu">
                      <button type="button" className="hb-btn sm" onClick={() => setPourquoi(pourquoi === it.id ? "" : it.id)}>Pourquoi c&apos;est là</button>
                      {it.retirer ? <button type="button" className="hb-btn sm" disabled={retrait === it.id} onClick={() => retirerPoint(it)}>{retrait === it.id ? "…" : "🗑 Retirer ces messages"}</button> : null}
                      <button type="button" className="hb-btn sm ghost" onClick={() => plusTard(it.id)}>Plus tard (demain)</button>
                    </div>
                  ) : null}
                  {pourquoi === it.id ? <div className="hb-why">{it.why}</div> : null}
                </div>
              )) : (
                <div className="hb-done"><b>Rien ici</b>{groupe === "urgent" ? "Aucune urgence. Passez à « Aujourd'hui »." : "Tout est traité dans ce groupe."}</div>
              )}
            </div>
          </div>

          {apresAFaire}

          <div className="hb-card hb-cmd">
            <div className="ch">Dernières commandes<span className="grow" /><a className="lnk" href="/gestion/commandes">Toutes</a></div>
            {recentes.length === 0 ? <p className="hb-vide">Aucune commande pour le moment.</p> : recentes.map((o) => {
              const [cls, label] = PILL[o.status || "a_preparer"] || ["prep", "À préparer"];
              const its = o.items || [];
              const photo = photoProduit(its[0]?.slug);
              const resume = its.map((i) => `${i.quantity > 1 ? `${i.quantity}× ` : ""}${i.name}`).filter(Boolean).slice(0, 2).join(" · ") || "Commande";
              return (
                <button type="button" className="hb-c" key={o.id} onClick={() => onOpenOrder(o.id)}>
                  {photo ? <img className="th" src={photo} alt="" /> : <span className="th" />}
                  <div style={{ minWidth: 0 }}>
                    <div className="l1"><span className="ref">{o.ref || o.id?.slice(-6)}</span><small>{nom(o)} · {depuis(Date.parse(o.createdAt || "") || 0, now)}</small></div>
                    <div className="l2">{resume}</div>
                    <div className="l3"><span className={`hb-pill p-${cls}`}>{label}</span>{livraisonCommande(o).express ? <span className="hb-pill p-bad">Express</span> : null}{limPill(o)}</div>
                  </div>
                  <div className="tot">{formatEuro(o.total)}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hb-col">
          <details open>
            <summary><Ico n="clock" />Activité récente <span className="sub2">· {activite.length}</span></summary>
            {activite.length === 0 ? <p className="hb-vide">Rien pour le moment.</p> : (
              <ul className="hb-todo">{activite.map((e, i) => <li className={e.c} key={i}><span className="ic"><Ico n={e.ic} /></span><span className="tx"><b>{e.b}</b><span>{e.s ? `${e.s} · ` : ""}{depuis(e.t, now)}</span></span></li>)}</ul>
            )}
          </details>
          <details>
            <summary><Ico n="chart" />Ce mois en détail</summary>
            <table className="hb-tbl"><tbody>
              <tr><td>Ventes encaissées</td><td className="r">{formatEuro(mois.ca)}</td></tr>
              <tr><td>Commandes</td><td className="r">{mois.n}</td></tr>
              <tr><td>Pièces vendues</td><td className="r">{mois.pieces}</td></tr>
              <tr><td>Nouvelles clientes</td><td className="r">{mois.nouvelles}</td></tr>
              {devis.n ? <tr><td>Devis en attente</td><td className="r">{devis.n} · {formatEuro(devis.total)}</td></tr> : null}
            </tbody></table>
            <p className="hb-vide" style={{ paddingTop: 0 }}>Le bénéfice (achat, matériel, ratés, étiquettes déduits) est dans <a href="/gestion/benefices">Finances → Bénéfices</a>.</p>
          </details>
          {children}
        </div>
      </div>
    </div>
  );
}
