"use client";

// =============================================================================
// FICHE D'UNE COMMANDE — /gestion/commande/<réf> (04/11/2026, maquette validée
// https://claude.ai/artifact/43E3za7KKg1G87cSCtPowq ; gérant : « la page commande
// c'est trop mélangé… range par étape »). Tout ce que la fiche complète de
// /gestion/fiches montre est ici, UNE fois, à une place fixe :
//   en-tête collé (réf, cliente, 3 statuts, UNE grande action, « Plus d'actions »
//   avec confirmations EN LIGNE) → alertes toujours en haut → frise Payée → Livrée
//   + date limite + « Ce qu'il reste à faire » → raccourcis → GAUCHE : À graver
//   (FicheAtelier, ratés) · Emballage & envoi (conditionnement, Boxtal, étiquette,
//   suivi) · Messages (BatThread) · Historique ; DROITE : Cliente · Livraison ·
//   Paiement · Étiquettes & note · Cadeau & geste · Devis & documents.
// Mêmes API qu'avant ; jamais de prompt / confirm ; la fiche papier (FichePapier +
// imprimerFiche) et /gestion/fiches restent telles quelles.
// =============================================================================
import { imageDesign } from "@/lib/modeles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import Ic from "@/components/admin/IconesGestion";
import VarBadge from "@/components/admin/VarBadge";
import DelaiCommande from "@/components/admin/DelaiCommande";
import HistoriqueCommande from "@/components/admin/HistoriqueCommande";
import { BlocConditionnement } from "@/components/admin/Conditionnement";
import { RatesCommande } from "@/components/admin/Rates";
import { FormExpedition, Pill, LiensSuivi } from "@/components/admin/CarteCommande";
import { chargerAvecCache } from "@/components/admin/adminCache";
import { useAdminBack } from "@/components/admin/adminBack";
import { imprimerFiche } from "@/lib/impression";
import { apparierSpec } from "@/lib/orderSpec";
import { lienSuivi, numerosSuivi } from "@/lib/suiviColis";
import { paysDeLaCommande } from "@/lib/paysLivraison";
import { nomLivraisonDifferent } from "@/lib/nomLivraison";
import { getProductBySlug } from "@/lib/products";
import { formatEuro } from "@/lib/format";
import { FLAGS, CONTROLES, estActive, estFinie, estPartie, modeDe, statutDe, statutInfo, chipsDe, cadeauTexte, ordreTraitement, positions, euro, dateFr, refDe, hrefFiche, adresseLigne } from "@/lib/fileCommandes";

const FicheAtelier = dynamic(() => import("@/components/admin/FicheAtelier"), { loading: () => <p className="faint">Chargement de la fiche atelier…</p> });
const BatThread = dynamic(() => import("@/components/admin/BatThread"), { loading: () => <p className="faint">Chargement des messages…</p> });
const BoxtalCopie = dynamic(() => import("@/components/admin/BoxtalCopie"), { loading: () => <p className="faint">Chargement…</p> });
const FenetreConditionnement = dynamic(() => import("@/components/admin/Conditionnement"), { ssr: false });
const FichePapier = dynamic(() => import("@/components/admin/FichePapier"), { ssr: false });

const ETAPES = [["pay", "Payée"], ["a_preparer", "À préparer"], ["en_gravure", "En fabrication"], ["expediee", "Expédiée"], ["livree", "Livrée"]];
const RANG = { a_preparer: 1, en_gravure: 2, expediee: 3, remise_main_propre: 3, livree: 4 };
const MODE_IC = { express: "bolt", relais: "pin", retrait: "user", domicile: "home" };

// Verrou et remboursement : mêmes règles que la fiche d'avant (/gestion/fiches).
function verrou(o) {
  if (o.immediateStart) return true;
  if (["en_gravure", "expediee", "livree", "remise_main_propre"].includes(o.status)) return true;
  const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
  return t > 0 && Date.now() - t > 24 * 3600 * 1000;
}
function remboursement(o) {
  const st = statutDe(o);
  if (st === "remboursee") return { txt: "Déjà remboursée", tone: "grey" };
  if (st === "annulee") return { txt: "Commande annulée (pas remboursée)", tone: "grey" };
  if (o.immediateStart || ["en_gravure", "expediee", "livree", "remise_main_propre"].includes(st)) return { txt: "Remboursement : NON — fabrication lancée (pièce personnalisée)", tone: "bad" };
  const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
  const ageH = t ? (Date.now() - t) / 3600000 : 999;
  if (ageH <= 24) { const m = Math.max(0, Math.round(24 * 60 - ageH * 60)); return { txt: `Remboursement : INTÉGRAL possible (encore ${Math.floor(m / 60)} h ${m % 60} min sur les 24 h)`, tone: "ok" }; }
  return { txt: "Remboursement : PARTIEL (retenue de 10 €) — 24 h dépassées, fabrication pas lancée", tone: "warn" };
}
function Copier({ texte, label, onToast }) {
  return <button type="button" className="fc-copy" onClick={async () => { try { await navigator.clipboard.writeText(texte); onToast("Copié : " + String(texte).slice(0, 40)); } catch { onToast(texte); } }}><Ic n="copy" /> {label || "copier"}</button>;
}
function Carte({ id, ic, titre, h3 = false, droite, children, className = "" }) {
  return (
    <section className={`fc-card ${className}`} id={id}>
      <div className="ch"><Ic n={ic} />{h3 ? <h3>{titre}</h3> : <h2>{titre}</h2>}<span className="grow" />{droite}</div>
      {children}
    </section>
  );
}

export default function FicheCommandePage() {
  const params = useParams();
  const router = useRouter();
  const refParam = decodeURIComponent(String(params?.ref || "")).trim();
  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState([]);
  const [charge, setCharge] = useState(false);
  const [unread, setUnread] = useState([]);
  const [error, setError] = useState("");
  const [mat, setMat] = useState(null);
  const [condOpen, setCondOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(""); // grav · exp · liv · cancel · refund · delete
  const [boxtal, setBoxtal] = useState(false);
  const [papier, setPapier] = useState(false);
  const [toast, setToast] = useState("");
  const [livNotify, setLivNotify] = useState(true);
  const [cancelNotify, setCancelNotify] = useState(true);
  const [note, setNote] = useState("");
  const [geste, setGeste] = useState("");
  const toastT = useRef(null);
  const autoPrint = useRef(false);

  const montrer = useCallback((t) => { clearTimeout(toastT.current); setToast(t); toastT.current = setTimeout(() => setToast(""), 2600); }, []);
  const loadMat = useCallback(async (k) => { try { const r = await fetch("/api/admin/materiel", { headers: { "x-admin-key": k } }); if (r.ok) setMat(await r.json()); } catch { /* ignore */ } }, []);
  const load = useCallback(async (k) => {
    setError("");
    try {
      const r = await chargerAvecCache("/api/admin/orders", k, (d) => { setKey(k); setAuthed(true); setOrders(d.orders || []); setCharge(true); });
      if (r.status === 401) { setError("Mot de passe incorrect."); setAuthed(false); return; }
      if (!r.ok) { if (!r.data) setError("Erreur de chargement."); return; }
      sessionStorage.setItem("niv-admin-key", k);
      loadMat(k);
      try { const u = await fetch("/api/admin/bat?action=unread", { headers: { "x-admin-key": k } }); if (u.ok) setUnread((await u.json()).unread || []); } catch { /* ignore */ }
    } catch { setError("Erreur de chargement."); }
  }, [loadMat]);
  useEffect(() => {
    const saved = sessionStorage.getItem("niv-admin-key"); if (saved) load(saved);
    try { autoPrint.current = new URLSearchParams(window.location.search).get("imprimer") === "1"; } catch { /* ignore */ }
  }, [load]);

  const o = useMemo(() => orders.find((x) => String(x.ref || "").toUpperCase() === refParam.toUpperCase() || x.id === refParam) || null, [orders, refParam]);
  useEffect(() => { if (o) { setNote(o.adminNote || ""); setGeste(o.alerteInterne || ""); document.title = `#${refDe(o)} · ${o.customerName || ""} — Gestion`; } }, [o?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (o && autoPrint.current) { autoPrint.current = false; setPapier(true); setTimeout(() => imprimerFiche(), 600); } }, [o]);
  useAdminBack(true, "File de production", useCallback(() => router.push("/gestion/commandes"), [router]));

  // Commande précédente / suivante dans l'ordre de traitement (J / K), parmi les actives, sinon toutes.
  const voisines = useMemo(() => {
    const act = orders.filter((x) => !x.test && estActive(x)).sort(ordreTraitement);
    const liste = o && act.some((x) => x.id === o.id) ? act : orders.filter((x) => !x.test).sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0));
    const i = liste.findIndex((x) => x.id === o?.id);
    return { prev: i > 0 ? liste[i - 1] : null, next: i >= 0 && i < liste.length - 1 ? liste[i + 1] : null };
  }, [orders, o]);
  const pos = useMemo(() => positions(orders.filter((x) => !x.test)), [orders]);
  useEffect(() => {
    const h = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { if (e.key === "Escape") e.target.blur(); return; }
      if (e.key === "Escape") { setMenu(false); setConfirm(""); }
      if (e.key === "j" && voisines.next) router.push(hrefFiche(voisines.next));
      if (e.key === "k" && voisines.prev) router.push(hrefFiche(voisines.prev));
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [voisines, router]);

  // ---- actions (mêmes API qu'avant) ----
  const api = useCallback(async (body, method = "POST") => {
    const r = await fetch("/api/admin/orders", { method, headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Échec"); return d;
  }, [key]);
  const setStatus = useCallback(async (ord, status, extra = {}) => {
    const avant = ord.status || "a_preparer";
    setBusy(true); setConfirm(""); setMenu(false);
    setOrders((os) => os.map((x) => (x.id === ord.id ? { ...x, status, ...(extra.tracking != null ? { tracking: extra.tracking } : {}), ...(status === "expediee" ? { shippedAt: new Date().toISOString() } : {}), ...(status === "livree" ? { deliveredAt: new Date().toISOString() } : {}) } : x)));
    try {
      const d = await api({ id: ord.id, status, ...extra });
      montrer(`#${refDe(ord)} : ${statutInfo({ status }).lib.toLowerCase()}${extra.notifyCustomer ? (d.emailed ? " · e-mail envoyé" : " · l'e-mail n'a pas pu partir") : ""}`);
    } catch (e) { setOrders((os) => os.map((x) => (x.id === ord.id ? { ...x, status: avant } : x))); montrer("Échec : " + e.message); }
    finally { setBusy(false); }
  }, [api, montrer]);
  const annotate = useCallback(async (patch, texte) => {
    setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, ...patch } : x)));
    try { await api({ id: o.id, action: "annotate", ...patch }); montrer(texte || "Enregistré"); } catch (e) { montrer("Échec : " + e.message); }
  }, [api, o, montrer]);
  async function rembourser() {
    setBusy(true); setConfirm("");
    try {
      const r = await fetch("/api/admin/refund", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ id: o.id }) });
      const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Échec du remboursement.");
      setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status: "remboursee" } : x))); montrer("Remboursement Stripe lancé");
    } catch (e) { montrer(e.message); } finally { setBusy(false); }
  }
  async function supprimer() {
    setConfirm("");
    try { await api({ id: o.id }, "DELETE"); montrer(`#${refDe(o)} supprimée`); router.push("/gestion/commandes"); } catch (e) { montrer("Échec : " + e.message); }
  }
  async function demanderAvis() {
    setMenu(false);
    try { const d = await api({ id: o.id, action: "review" }); montrer(d.ok ? `Demande d'avis envoyée à ${o.customerEmail}` : d.error || "L'e-mail n'a pas pu partir"); } catch (e) { montrer("Échec : " + e.message); }
  }
  async function basculerTest() {
    setMenu(false);
    const test = !o.test;
    setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, test } : x)));
    try { await api({ id: o.id, test }); montrer(test ? "Marquée commande test (non comptée)" : "N'est plus une commande test"); } catch (e) { montrer("Échec : " + e.message); }
  }
  function imprimer() { setMenu(false); setPapier(true); setTimeout(() => imprimerFiche(), 300); }

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "60px 16px" }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)" }}>Fiche commande</h1>
        <p style={{ color: "var(--ink-soft)" }}>Espace réservé. Entrez le mot de passe de gestion.</p>
        <form onSubmit={(e) => { e.preventDefault(); load(keyInput.trim()); }} style={{ display: "grid", gap: 10 }}>
          <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="Mot de passe" style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
          <button className="btn btn-gold" type="submit">Entrer</button>
          {error ? <div className="notice">{error}</div> : null}
        </form>
      </div>
    );
  }
  if (!o) {
    return (
      <div className="fc">
        <Link className="fc-back" href="/gestion/commandes"><Ic n="back" /> File de production</Link>
        <div className="fq-empty" style={{ marginTop: 14 }}>{charge ? <>Aucune commande « {refParam} ». <Link href="/gestion/commandes">Retour à la file</Link>.</> : "Chargement…"}</div>
      </div>
    );
  }

  // ---- la commande ----
  const st = statutDe(o);
  const info = statutInfo(o);
  const mode = modeDe(o);
  const pays = paysDeLaCommande(o);
  const unreadIci = unread.includes(o.id);
  const chips = chipsDe(o, unreadIci);
  const active = estActive(o);
  const finie = estFinie(o);
  const flags = o.flags || [];
  const controles = Array.isArray(o.controles) ? o.controles : [];
  const rang = ["annulee", "remboursee"].includes(st) ? -1 : (RANG[st] || 1);
  const dates = { pay: o.createdAt, a_preparer: o.createdAt, en_gravure: null, expediee: o.shippedAt || o.remisAt, livree: o.deliveredAt };
  const suivi = o.tracking ? lienSuivi(o.tracking, o) : null;
  const autreNom = nomLivraisonDifferent(o);
  const remb = remboursement(o);
  const specParLigne = apparierSpec(o.items, o.spec);
  const lignes = (o.items || []).map((it, i) => ({ it, s: specParLigne[i] }));
  const usage = mat?.usages?.[o.id];
  const nbCmdCliente = orders.filter((x) => !x.test && x.customerEmail && x.customerEmail.toLowerCase() === String(o.customerEmail || "").toLowerCase()).length;
  // Doublon possible : même cliente, mêmes articles, à moins de 30 jours (règle de la fiche d'avant).
  const doublon = orders.some((x) => x.id !== o.id && !x.test && !["annulee", "remboursee"].includes(x.status) && x.customerEmail && x.customerEmail.toLowerCase() === String(o.customerEmail || "").toLowerCase()
    && (x.items || []).map((i) => `${(i.name || "").toLowerCase()}|${i.quantity}`).sort().join(";") === (o.items || []).map((i) => `${(i.name || "").toLowerCase()}|${i.quantity}`).sort().join(";")
    && Math.abs(Date.parse(x.createdAt || 0) - Date.parse(o.createdAt || 0)) <= 30 * 86400000);
  const total = Number(o.total) || 0, remise = Number(o.discount) || 0, cagnotte = Number(o.cagnotteUsed) || 0;
  const lignesTotal = (o.items || []).reduce((s, it) => s + (Number(it.subtotal ?? it.total) || 0), 0);
  const sousTotal = Number(o.subtotal) || lignesTotal;
  const port = o.shippingPrice != null ? Number(o.shippingPrice) : Math.max(0, total - lignesTotal);

  let primary = null;
  if (st === "a_preparer") primary = { ic: "pen", lib: "Commencer la fabrication", k: "grav" };
  else if (st === "en_gravure") primary = { ic: "truck", lib: "Expédier avec un n° de suivi", k: "exp" };
  else if (st === "expediee") primary = { ic: "check", lib: "Marquer livrée", k: "liv" };
  const boutonPrimaire = primary ? <button type="button" className="fc-btn pri" disabled={busy} onClick={() => { setMenu(false); setConfirm(confirm === primary.k ? "" : primary.k); }}><Ic n={primary.ic} /> {primary.lib}</button> : <span className="fc-pill ok"><Ic n="check" /> {info.lib}</span>;

  const confirmBox = confirm === "grav" ? (
    <div className="fc-confirm">Passer <b>#{refDe(o)}</b> en fabrication ? La cliente ne pourra plus annuler. <button type="button" className="fc-btn sm pri" disabled={busy} onClick={() => setStatus(o, "en_gravure")}>Oui, je commence</button><button type="button" className="fc-btn sm" onClick={() => setConfirm("")}>Non</button></div>
  ) : confirm === "exp" ? (
    <FormExpedition o={o} busy={busy} onStatus={setStatus} onClose={() => setConfirm("")} titre={st === "expediee" ? "Modifier le suivi de" : "Expédier"} />
  ) : confirm === "liv" ? (
    <div className="fc-confirm">Marquer <b>#{refDe(o)}</b> livrée ? {o.customerEmail ? <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={livNotify} onChange={(e) => setLivNotify(e.target.checked)} /> envoyer la demande d&apos;avis à {o.customerEmail}</label> : null}<button type="button" className="fc-btn sm pri" disabled={busy} onClick={() => setStatus(o, "livree", { notifyCustomer: livNotify && Boolean(o.customerEmail) })}>Oui, livrée</button><button type="button" className="fc-btn sm" onClick={() => setConfirm("")}>Non</button></div>
  ) : confirm === "cancel" ? (
    <div className="fc-confirm" style={{ background: "var(--ash-bad-bg)", borderColor: "#f0c4bd" }}>{verrou(o) ? "⚠️ Fabrication lancée ou 24 h dépassées : normalement plus annulable côté cliente. " : ""}Annuler la commande <b>#{refDe(o)}</b> ? Elle ne comptera plus dans le chiffre d&apos;affaires (aucun remboursement : utilise « Rembourser » pour ça). {o.customerEmail ? <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={cancelNotify} onChange={(e) => setCancelNotify(e.target.checked)} /> prévenir la cliente</label> : null}<button type="button" className="fc-btn sm danger" disabled={busy} onClick={() => setStatus(o, "annulee", { notifyCustomer: cancelNotify && Boolean(o.customerEmail) })}>Oui, annuler la commande</button><button type="button" className="fc-btn sm" onClick={() => setConfirm("")}>Non</button></div>
  ) : confirm === "refund" ? (
    <div className="fc-confirm" style={{ background: "var(--ash-bad-bg)", borderColor: "#f0c4bd" }}>{verrou(o) ? "⚠️ Produit personnalisé en fabrication ou 24 h dépassées : normalement PAS remboursable. " : ""}Rembourser <b>{formatEuro(total)}</b> sur la carte de la cliente (Stripe) ? Irréversible. <button type="button" className="fc-btn sm danger" disabled={busy} onClick={rembourser}>Rembourser</button><button type="button" className="fc-btn sm" onClick={() => setConfirm("")}>Non</button></div>
  ) : confirm === "delete" ? (
    <div className="fc-confirm" style={{ background: "var(--ash-bad-bg)", borderColor: "#f0c4bd" }}>Supprimer définitivement <b>#{refDe(o)}</b> ? À réserver aux commandes de test. Irréversible. <button type="button" className="fc-btn sm danger" onClick={supprimer}>Oui, supprimer</button><button type="button" className="fc-btn sm" onClick={() => setConfirm("")}>Non</button></div>
  ) : null;

  const menuBox = menu ? (
    <div className="fc-menu" onClick={() => setMenu(false)}>
      <div className="g">Documents</div>
      <button type="button" onClick={imprimer}><Ic n="print" /> Imprimer la fiche atelier (1 page A4)</button>
      {!finie ? <Link href={`/gestion/etiquettes?id=${encodeURIComponent(o.id)}`}><Ic n="tag" /> Étiquette d&apos;adresse La Poste</Link> : null}
      <button type="button" onClick={() => { setBoxtal(true); document.getElementById("fc-envoi")?.scrollIntoView({ behavior: "smooth" }); }}><Ic n="copy" /> Copier pour Boxtal</button>
      <div className="g">Commande</div>
      {st === "en_gravure" || estPartie(o) || st === "livree" ? <button type="button" onClick={() => setStatus(o, "a_preparer")}><Ic n="undo" /> Remettre à préparer</button> : null}
      {st === "a_preparer" ? <button type="button" onClick={() => setConfirm("exp")}><Ic n="truck" /> Expédier sans passer par la fabrication…</button> : null}
      {st === "expediee" ? <button type="button" onClick={() => setConfirm("exp")}><Ic n="truck" /> {o.tracking ? "Modifier le n° de suivi" : "Ajouter un n° de suivi"}</button> : null}
      {st === "livree" ? <button type="button" onClick={() => setStatus(o, "expediee")}><Ic n="truck" /> Remettre expédiée</button> : null}
      {active || st === "expediee" ? <button type="button" onClick={() => setStatus(o, "remise_main_propre")}><Ic n="user" /> Remise en main propre</button> : null}
      {(estPartie(o) || st === "livree") && o.customerEmail ? <button type="button" onClick={demanderAvis}><Ic n="mail" /> Demander un avis à la cliente</button> : null}
      {st === "annulee" ? <button type="button" onClick={() => setStatus(o, "a_preparer")}><Ic n="undo" /> Rétablir la commande</button> : null}
      <button type="button" onClick={basculerTest}><Ic n="tag" /> {o.test ? "Ce n'est pas un test" : "Marquer comme commande test"}</button>
      <hr />
      <div className="g">Argent — avec confirmation</div>
      {st !== "remboursee" ? <button type="button" className="danger" onClick={() => setConfirm("refund")}><Ic n="undo" /> Rembourser…</button> : null}
      {!["annulee", "remboursee"].includes(st) ? <button type="button" className="danger" onClick={() => setConfirm("cancel")}><Ic n="x" /> Annuler la commande…</button> : null}
      <button type="button" className="danger" onClick={() => setConfirm("delete")}><Ic n="x" /> Supprimer…</button>
    </div>
  ) : null;

  const blocMode = (
    <div className={`fc-mode${mode.k === "express" ? " bad" : ""}`}><span className="ic"><Ic n={MODE_IC[mode.k]} /></span><span>{mode.lib}{mode.k === "express" ? " — à graver EN PRIORITÉ, Chrono 18 sur Boxtal" : ""}<small>{o.shippingMethod || ""}{port > 0 ? ` · ${formatEuro(port)} payés` : " · offerte"}{pays.etranger ? ` · ${pays.drapeau} ${pays.nom.toUpperCase()} : affranchir international` : ""}</small></span></div>
  );
  const alertes = [
    ...chips.filter((c) => c.k !== "test" && c.k !== "surmesure").map((c) => ({ k: c.k, tone: c.tone === "grey" ? "info" : c.tone, ic: { express: "bolt", immediate: "bolt", pays: "flag", reponse: "mail", cadeau: "gift", dateimage: "alert", alerte: "alert", emailfix: "mail" }[c.k], txt: c.k === "emailfix" && o.emailCorrigeDe ? `Adresse e-mail corrigée : tapée « ${o.emailCorrigeDe} », remplacée par « ${o.customerEmail} ».` : c.k === "alerte" ? `Geste promis / alerte interne : ${o.alerteInterne}` : c.lib, jump: c.k === "reponse" ? "fc-messages" : c.k === "dateimage" ? "fc-articles" : "" })),
    ...(doublon ? [{ k: "doublon", tone: "bad", ic: "alert", txt: "Possible doublon : même cliente et mêmes articles qu'une autre commande récente. Vérifie avant de fabriquer (ne fabrique qu'une fois si c'est le même paiement)." }] : []),
    ...(autreNom.different ? [{ k: "nom", tone: "warn", ic: "truck", txt: `Livrée au nom de « ${autreNom.livraison} » (la cliente est « ${autreNom.cliente} ») : à mettre sur l'étiquette.` }] : []),
  ];

  return (
    <div className="fc">
      <div className="fc-head">
        <div className="row1">
          <Link className="fc-back" href="/gestion/commandes"><Ic n="back" /> Commandes</Link>
          <div className="fc-ref"><h1>#{refDe(o)}</h1><Copier texte={refDe(o)} onToast={montrer} /><span className="who"><b>{o.customerName || "—"}</b> · {dateFr(o.createdAt)} · {formatEuro(total)}{pos[o.id] ? ` · n° ${pos[o.id]} dans la file` : ""}</span></div>
          <div className="fc-nav">
            {voisines.prev ? <Link className="fc-ibtn" href={hrefFiche(voisines.prev)} title="Commande précédente (K)"><Ic n="back" /></Link> : <button type="button" className="fc-ibtn" disabled><Ic n="back" /></button>}
            {voisines.next ? <Link className="fc-ibtn" href={hrefFiche(voisines.next)} title="Commande suivante (J)"><Ic n="next" /></Link> : <button type="button" className="fc-ibtn" disabled><Ic n="next" /></button>}
          </div>
        </div>
        <div className="row2">
          <span className="fc-pill ok"><Ic n="check" /> Payée · Stripe</span>
          {rang < 0 ? <Pill tone="bad">{info.lib}</Pill> : rang < 2 ? <Pill tone="warn"><i /> À préparer</Pill> : rang === 2 ? <Pill tone="gold"><i /> En fabrication</Pill> : <Pill tone="ok"><Ic n="check" /> Fabriquée</Pill>}
          {rang >= 3 ? <Pill tone={rang === 4 ? "ok" : "info"}><Ic n={rang === 4 ? "check" : "truck"} /> {st === "remise_main_propre" ? "Remise en main propre" : rang === 4 ? "Livrée" : `Expédiée${o.tracking ? ` · suivi ${numerosSuivi(o.tracking).join(" + ")}` : ""}`}</Pill> : rang >= 0 ? <Pill tone="grey"><Ic n="truck" /> Pas encore expédiée</Pill> : null}
          {rang >= 0 ? <span className="fc-pill lock">{verrou(o) ? "🔒 Verrouillée — fabrication lancée ou 24 h passées" : <><Ic n="clock" /> Annulable par la cliente (24 h)</>}</span> : null}
          {o.immediateStart ? <Pill tone="bad"><Ic n="bolt" /> Fabrication immédiate demandée</Pill> : null}
          {o.test ? <Pill tone="grey">🧪 Commande test (non comptée)</Pill> : null}
          <div className="fc-acts">
            {boutonPrimaire}
            <button type="button" className="fc-btn hidem" onClick={imprimer}><Ic n="print" /> Imprimer</button>
            <button type="button" className="fc-btn" aria-expanded={menu} onClick={() => { setConfirm(""); setMenu((v) => !v); }}><Ic n="more" /> Plus d&apos;actions</button>
            {menuBox}
          </div>
        </div>
        {confirmBox ? <div style={{ marginTop: 8 }}>{confirmBox}</div> : null}
      </div>
      {error ? <div className="notice" style={{ marginTop: 10 }}>{error}</div> : null}

      {alertes.length ? <div className="fc-alerts">{alertes.map((a) => <div key={a.k} className={`fc-alert ${a.tone}`}><Ic n={a.ic} /><span>{a.txt}</span>{a.jump ? <button type="button" className="fc-btn sm act" onClick={() => document.getElementById(a.jump)?.scrollIntoView({ behavior: "smooth" })}>Voir</button> : null}</div>)}</div> : null}

      <div className="fc-steps">
        <Carte ic="clock" titre="Où en est la commande" droite={<span className="faint">Payée → Livrée</span>}>
          <ol className="fc-timeline">
            {ETAPES.map(([k, l], n) => {
              const cls = rang < 0 ? "" : n < rang ? "done" : n === rang ? "now" : "";
              const d = dates[k];
              return <li key={k} className={cls}>{l}<small>{cls === "done" && d ? dateFr(d, false) : cls === "now" ? "maintenant" : ""}</small></li>;
            })}
          </ol>
          {rang < 0 ? <div className="fc-deadline"><Ic n="x" /><span>{info.lib}{st === "remboursee" ? " — par Stripe" : ""}</span></div> : null}
          <div className="fc-deadline" style={{ display: "block" }}><DelaiCommande order={o} style={{ margin: 0, fontSize: "0.9rem" }} /></div>
        </Carte>
        <Carte ic="check" titre="Ce qu'il reste à faire" droite={<span className="faint">{controles.length} / {CONTROLES.length}</span>}>
          <div className="cb">
            <ul className="fc-chk">
              {CONTROLES.map((c) => {
                const on = controles.includes(c.id) || (c.id === "expediee" && (estPartie(o) || st === "livree"));
                return (
                  <li key={c.id} className={on ? "on" : ""}>
                    <button type="button" aria-label={c.label} aria-pressed={on} onClick={() => {
                      const next = on ? controles.filter((x) => x !== c.id) : [...controles, c.id];
                      if (c.id === "expediee" && !on && !estPartie(o) && st !== "livree") { setConfirm("exp"); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
                      annotate({ controles: next }, on ? "Case décochée" : "Fait ✓");
                    }}><Ic n="check" /></button>
                    <span>{c.label}</span>{on ? <small>fait</small> : null}
                  </li>
                );
              })}
            </ul>
            <div className="fc-next">{primary ? <><span className="lead">Prochaine étape :</span>{boutonPrimaire}</> : <span className="lead">{rang < 0 ? info.lib : "Commande terminée."}</span>}</div>
          </div>
        </Carte>
      </div>

      <nav className="fc-jump">
        {[["fc-articles", "À graver"], ["fc-envoi", "Emballage & envoi"], ["fc-messages", "Messages"], ["fc-histo", "Historique"], ["fc-cliente", "Cliente"], ["fc-argent", "Paiement"]].map(([id, l]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{l}{id === "fc-messages" && unreadIci ? <b>1</b> : null}</a>)}
      </nav>

      <div className="fc-cols">
        <div className="fc-main">
          <Carte id="fc-articles" ic="pen" titre="À graver — à l'identique de ce que la cliente a vu">
            {lignes.map(({ it, s }, i) => {
              const photo = it.image || getProductBySlug(it.slug)?.images?.[0] || "";
              const dAncien = s && !s.designCapture && s.modele ? imageDesign(s.modeleTemplate, s.modele.layout) : null; // 0SJAY2KK
              const apercu = (dAncien && dAncien.dark) || s?.previewImage || s?.apercu3dImage || s?.artworkImage || s?.photoSrc || "";
              return (
                <div className="fc-art" key={i}>
                  <div className="co-art-photo">
                    {photo ? <img src={photo} alt="" /> : <span className="fc-face empty" style={{ width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>🎁</span>}
                    {apercu ? <img src={apercu} alt="Aperçu de la gravure" title="Ce que la cliente a demandé" style={{ border: "2px solid var(--ash-gold-2)" }} /> : null}
                  </div>
                  <div>
                    <div className="nm"><span className="q">{it.quantity}×</span>{it.name}{(s?.variantDetail || it.variantDetail) ? <VarBadge texte={s?.variantDetail || it.variantDetail} /> : null}</div>
                    {it.details ? <div className="fc-sub">{it.details}</div> : null}
                    {it.personalization && !s ? <div className="fc-sub"><Ic n="pen" /> {it.personalization}</div> : null}
                  </div>
                  <div className="price">{formatEuro(it.total)}</div>
                </div>
              );
            })}
            <div className="cb" style={{ borderTop: "1px solid var(--ash-line)" }}>
              {o.demande ? <div className="fc-draft"><b>📋 Sur mesure{o.quoteNumber ? ` — devis ${o.quoteNumber}` : ""} · ce que la cliente a demandé</b><span style={{ whiteSpace: "pre-line" }}>{o.demande}</span></div> : null}
              <FicheAtelier spec={o.spec} order={o} adminKey={key} />
              <RatesCommande o={o} mat={mat} adminKey={key} onSaved={() => loadMat(key)} />
            </div>
          </Carte>

          <Carte id="fc-envoi" ic="box" titre="Emballage & envoi" droite={usage ? <Pill tone="ok"><Ic n="check" /> Conditionné · gain {euro(usage.gain)}</Pill> : !finie ? <Pill tone="grey">Conditionnement à faire</Pill> : null}>
            <div className="cb">
              {blocMode}
              {o.relaisPoint ? <div className="fc-row"><Ic n="pin" /><b>Point relais choisi :</b> {o.relaisPoint}<Copier texte={o.relaisPoint} onToast={montrer} /></div> : null}
              {o.shippingAddress ? <div className="fc-row"><Ic n="home" /><span>{o.relaisPoint ? "Coordonnées : " : "Étiquette : "}{adresseLigne(o)}</span><Copier texte={adresseLigne(o)} label="copier l'adresse" onToast={montrer} /></div> : null}
              {!finie ? <BlocConditionnement o={o} mat={mat} onOpen={() => setCondOpen(true)} /> : null}
              <div className="fc-row" style={{ marginTop: 12 }}>
                {!finie ? <Link className="fc-btn" href={`/gestion/etiquettes?id=${encodeURIComponent(o.id)}`}><Ic n="tag" /> Étiquette d&apos;adresse La Poste (45 × 45)</Link> : null}
                <button type="button" className="fc-btn ghost" onClick={() => setBoxtal((v) => !v)}><Ic n="copy" /> {boxtal ? "Fermer les champs Boxtal" : "Champs Boxtal, champ par champ (+ corriger l'adresse)"}</button>
                {!estPartie(o) && !finie ? <button type="button" className="fc-btn ghost" onClick={() => { setConfirm("exp"); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Ic n="truck" /> Expédier…</button> : null}
              </div>
              {boxtal ? <div style={{ marginTop: 10 }}><BoxtalCopie order={o} /></div> : null}
              {suivi ? <div className="fc-row" style={{ marginTop: 12, flexWrap: "wrap" }}><Ic n="truck" /><b>Suivi</b><span><LiensSuivi o={o} sep={<br />} /></span><button type="button" className="fc-lnk" onClick={() => { setConfirm("exp"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>modifier</button>{o.shippedAt ? <span className="faint">expédiée le {dateFr(o.shippedAt)}</span> : null}</div> : null}
            </div>
          </Carte>

          <Carte id="fc-messages" ic="mail" titre={`Messages avec ${(o.customerName || "la cliente").split(" ")[0]}`} droite={unreadIci ? <Pill tone="info"><Ic n="mail" /> Nouvelle réponse</Pill> : <span className="faint">e-mails, bouton « Répondre », aperçus (BAT)</span>}>
            <div className="cb"><BatThread order={o} adminKey={key} /></div>
          </Carte>

          <Carte id="fc-histo" ic="clock" titre="Historique" droite={<span className="faint">devis, images, étapes</span>}>
            <div className="cb">
              <ul className="fc-tl">
                <li className="ok">Payée · {formatEuro(total)}<small>{dateFr(o.createdAt)}</small></li>
                {o.shippedAt ? <li className="ok">Expédiée{o.tracking ? ` · suivi ${numerosSuivi(o.tracking).join(" + ")}` : ""}<small>{dateFr(o.shippedAt)}</small></li> : null}
                {o.remisAt ? <li className="ok">Remise en main propre<small>{dateFr(o.remisAt)}</small></li> : null}
                {o.deliveredAt ? <li className="ok">Livrée<small>{dateFr(o.deliveredAt)}</small></li> : null}
                {st === "annulee" ? <li className="bad">Annulée</li> : null}
                {st === "remboursee" ? <li className="bad">Remboursée (Stripe)</li> : null}
                {o.livraisonCorrigeeDe ? <li className="gold">Adresse de livraison corrigée dans Gestion<small>avant : {[o.livraisonCorrigeeDe.shippingName, o.livraisonCorrigeeDe.line1].filter(Boolean).join(", ")}</small></li> : null}
                {o.emailCorrigeDe ? <li className="gold">E-mail corrigé<small>avant : {o.emailCorrigeDe}</small></li> : null}
              </ul>
              <HistoriqueCommande order={o} />
            </div>
          </Carte>
        </div>

        <div className="fc-side">
          <Carte id="fc-cliente" ic="user" titre="Cliente" h3 droite={o.customerEmail ? <Link className="fc-lnk" href={`/gestion/crm?q=${encodeURIComponent(o.customerEmail)}`}>dossier →</Link> : null}>
            <div className="cb"><dl className="fc-kv">
              <dt>Nom</dt><dd>{o.customerName || "—"}</dd>
              <dt>E-mail</dt><dd>{o.customerEmail ? <>{o.customerEmail}<Copier texte={o.customerEmail} label="" onToast={montrer} /></> : "—"}</dd>
              <dt>Téléphone</dt><dd>{o.customerPhone || "—"}</dd>
              <dt>Commandes</dt><dd>{nbCmdCliente} {nbCmdCliente > 1 ? "(dont celle-ci)" : "(la première)"}</dd>
            </dl></div>
          </Carte>
          <Carte id="fc-livraison" ic="truck" titre="Livraison" h3 droite={<button type="button" className="fc-lnk" onClick={() => { setBoxtal(true); document.getElementById("fc-envoi")?.scrollIntoView({ behavior: "smooth" }); }}>corriger</button>}>
            <div className="cb">
              {blocMode}
              <div className="fc-addr" style={{ marginTop: 10 }}>
                {pays.etranger ? <span className="fc-pill bad" style={{ marginBottom: 6 }}>{pays.drapeau} À ENVOYER EN {pays.nom.toUpperCase()}</span> : <span className="faint">{pays.drapeau} {pays.nom}</span>}
                {o.shippingAddress ? <><b>{o.shippingName || o.customerName}</b>{o.shippingCompany ? <>{o.shippingCompany}<br /></> : null}{o.shippingAddress.line1}<br />{o.shippingAddress.line2 ? <>{o.shippingAddress.line2}<br /></> : null}{o.shippingAddress.postal_code} {o.shippingAddress.city}<br />{o.shippingAddress.country}<Copier texte={adresseLigne(o)} label="copier l'adresse" onToast={montrer} /></> : <div className="faint">Pas d&apos;adresse enregistrée{mode.k === "retrait" ? " (retrait à l'atelier)" : ""}.</div>}
              </div>
              {o.relaisPoint ? <div className="fc-sub"><Ic n="pin" /> Point relais : {o.relaisPoint}</div> : null}
              {autreNom.different ? <div className="fc-sub" style={{ color: "var(--ash-warn)", fontWeight: 700 }}>⚠️ Livré au nom de « {autreNom.livraison} », pas de la cliente.</div> : null}
            </div>
          </Carte>
          <Carte id="fc-argent" ic="card" titre="Paiement" h3 droite={<span className="faint">Stripe</span>}>
            <div className="cb">
              <table className="fc-money"><tbody>
                <tr><td>Sous-total produits{remise > 0 || cagnotte > 0 ? " (avant remise)" : ""}</td><td>{formatEuro(sousTotal)}</td></tr>
                {remise > 0 ? <tr className="neg"><td>Remise{o.promoCode ? ` — code ${o.promoCode}${o.promoCode2 ? ` + ${o.promoCode2}` : ""}` : ""}</td><td>−{formatEuro(remise)}</td></tr> : null}
                {cagnotte > 0 ? <tr className="neg"><td>Cagnotte fidélité utilisée</td><td>−{formatEuro(cagnotte)}</td></tr> : null}
                <tr><td>Livraison{o.shippingMethod ? ` — ${o.shippingMethod}` : ""}</td><td>{port > 0 ? formatEuro(port) : "Offerte"}</td></tr>
                <tr className="tot"><td>Total payé</td><td>{formatEuro(total)}</td></tr>
              </tbody></table>
              {remise > 0 ? <div className="fc-sub">Cette remise vous a coûté {formatEuro(remise)}.</div> : null}
              {usage ? <div className="fc-gain"><span>Gain de la commande<small>après produits, matériel, étiquette, Stripe, ratés</small></span><b>{euro(usage.gain)}</b></div> : <div className="fc-sub">Gain calculé à « Valider » dans Conditionnement.</div>}
              <div className={`fc-sub fc-pay`} style={{ color: remb.tone === "bad" ? "var(--ash-bad)" : remb.tone === "ok" ? "var(--ash-ok)" : remb.tone === "warn" ? "var(--ash-warn)" : undefined, fontWeight: 600 }}>{remb.txt} · dans « Plus d&apos;actions ».</div>
            </div>
          </Carte>
          <Carte id="fc-notes" ic="flag" titre="Étiquettes & note interne" h3>
            <div className="cb">
              <div className="fc-flags">{FLAGS.map((f) => <button key={f.id} type="button" className={flags.includes(f.id) ? "on" : ""} onClick={() => annotate({ flags: flags.includes(f.id) ? flags.filter((x) => x !== f.id) : [...flags, f.id] }, "Étiquettes enregistrées")}>{f.label}</button>)}</div>
              <textarea className="fc-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note interne (choix de la cliente, consigne pour l'atelier) — jamais vue par la cliente" style={{ marginTop: 10 }} />
              <div className="fc-row"><button type="button" className="fc-btn sm" disabled={note === (o.adminNote || "")} onClick={() => annotate({ adminNote: note }, "Note enregistrée")}>Enregistrer la note</button><span className="faint">visible aussi sur la file et la fiche papier</span></div>
            </div>
          </Carte>
          <Carte id="fc-cadeau" ic="gift" titre="Cadeau & geste" h3>
            <div className="cb">
              {o.cadeauChoix ? <div className="fc-alert gold" style={{ padding: "8px 10px" }}><Ic n="gift" /><span><b>{o.cadeauPromis ? "Cadeau PROMIS à cette cliente" : "Cadeau d'attente à glisser dans le colis"}</b> — {cadeauTexte(o)}{o.cadeauPromis ? <><br />{o.cadeauPromis}</> : null}{total >= 80 || String(o.cadeauChoix).includes("+") ? <><br /><b style={{ color: "var(--ash-bad)" }}>🎁🎁 Commande ≥ 80 € → DEUX cadeaux</b></> : null}</span></div> : <div className="fc-sub">Aucun cadeau promis.</div>}
              <textarea className="fc-note" value={geste} onChange={(e) => setGeste(e.target.value)} placeholder="Geste promis / alerte interne (affiché en rouge sur la file et la fiche papier)" style={{ marginTop: 10, minHeight: 56 }} />
              <div className="fc-row"><button type="button" className="fc-btn sm" disabled={geste === (o.alerteInterne || "")} onClick={() => annotate({ alerteInterne: geste }, "Geste / alerte enregistré")}>Enregistrer</button></div>
            </div>
          </Carte>
          <Carte id="fc-devis" ic="orders" titre="Devis & documents" h3>
            <div className="cb">
              {o.quoteNumber || o.surMesure || o.demande ? (
                <dl className="fc-kv">
                  {o.quoteNumber ? <><dt>Devis</dt><dd>{o.quoteNumber} · payé par cette commande <Link className="fc-lnk" href={`/gestion/devis?q=${encodeURIComponent(o.quoteNumber)}`}>ouvrir</Link></dd></> : null}
                  {o.quoteEmballage ? <><dt>Emballage</dt><dd>{o.quoteEmballage}</dd></> : null}
                  {o.demande ? <><dt>Demande</dt><dd style={{ fontWeight: 500, whiteSpace: "pre-line" }}>{o.demande}</dd></> : null}
                </dl>
              ) : <div className="fc-sub">Pas de devis : commande passée sur le site.</div>}
              <div className="fc-sub">Les devis, factures et images échangés sont dans « Historique ».</div>
            </div>
          </Carte>
        </div>
      </div>

      {primary ? <div className="fc-bottom"><button type="button" className="fc-btn pri" disabled={busy} onClick={() => { setMenu(false); setConfirm(primary.k); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Ic n={primary.ic} /> {primary.lib}</button><button type="button" className="fc-btn" onClick={() => { setMenu((v) => !v); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Ic n="more" /></button></div> : null}
      {condOpen ? <FenetreConditionnement o={o} adminKey={key} mat={mat} onClose={() => setCondOpen(false)} onSaved={() => loadMat(key)} /> : null}
      {papier ? <FichePapier order={o} fmtDate={(iso) => dateFr(iso)} adminKey={key} /> : null}
      <div className={`fc-toast${toast ? " on" : ""}`} role="status">{toast}</div>
    </div>
  );
}
