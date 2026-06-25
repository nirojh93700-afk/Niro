"use client";

import { useState, useEffect, useCallback } from "react";
import { formatEuro } from "@/lib/format";
import { getCategoryLabel } from "@/lib/products";
import ProductsAdmin from "@/components/admin/ProductsAdmin";
import AssistantAdmin from "@/components/admin/AssistantAdmin";
import EngravingAdmin from "@/components/admin/EngravingAdmin";
import QuotesAdmin from "@/components/admin/QuotesAdmin";
import AppearanceAdmin from "@/components/admin/AppearanceAdmin";
import ReviewsAdmin from "@/components/admin/ReviewsAdmin";
import PromoCodesAdmin from "@/components/admin/PromoCodesAdmin";
import NewsletterAdmin from "@/components/admin/NewsletterAdmin";
import DeclarationReminder from "@/components/admin/DeclarationReminder";
import BatThread from "@/components/admin/BatThread";
import FicheAtelier from "@/components/admin/FicheAtelier";

const CONFIG_LABELS = {
  stripe: "Paiement Stripe (clé secrète)",
  stripeWebhook: "Webhook Stripe (e-mail commande + stock)",
  email: "E-mails Resend (contact + commandes)",
  contactEmail: "Adresse e-mail de réception",
  photoUpload: "Téléversement de photos (Cloudinary)",
  siteUrl: "Adresse du site",
};

export default function GestionPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState([]);
  const [editable, setEditable] = useState([]);
  const [config, setConfig] = useState(null);
  const [firebase, setFirebase] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersReady, setOrdersReady] = useState(false);
  const [tab, setTab] = useState("commandes");
  const [batOpen, setBatOpen] = useState(null); // id de commande dont la discussion/BAT est ouverte
  const [ficheOpen, setFicheOpen] = useState(null); // id de commande dont la fiche atelier est ouverte
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState("");
  const [refunding, setRefunding] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [openClient, setOpenClient] = useState(-1);
  const [bulkPct, setBulkPct] = useState(20);
  const [statYear, setStatYear] = useState(new Date().getFullYear());
  const [crmSearch, setCrmSearch] = useState("");
  const [siteSettings, setSiteSettings] = useState({ salesGoal: 0, crmNotes: {} });
  const [goalInput, setGoalInput] = useState("");
  const [noteDraft, setNoteDraft] = useState({});
  const [mailOpen, setMailOpen] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [mailMsg, setMailMsg] = useState("");
  const [mailSending, setMailSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [testSending, setTestSending] = useState(false);

  const load = useCallback(async (adminKey) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products", { headers: { "x-admin-key": adminKey } });
      if (res.status === 401) throw new Error("Mot de passe incorrect.");
      if (!res.ok) throw new Error("Erreur de chargement.");
      const data = await res.json();
      setRows(data.rows);
      setEditable(data.editable || []);
      setAuthed(true);
      sessionStorage.setItem("niv-admin-key", adminKey);
      const cfg = await fetch("/api/admin/config", { headers: { "x-admin-key": adminKey } });
      if (cfg.ok) {
        const cfgData = await cfg.json();
        setConfig(cfgData.config);
        setFirebase(cfgData.firebase || null);
      }
      const ord = await fetch("/api/admin/orders", { headers: { "x-admin-key": adminKey } });
      if (ord.ok) {
        const ordData = await ord.json();
        setOrders(ordData.orders || []);
        setOrdersReady(true);
      }
      const stg = await fetch("/api/admin/settings", { headers: { "x-admin-key": adminKey } });
      if (stg.ok) {
        const s = (await stg.json()).settings || {};
        setSiteSettings({ salesGoal: s.salesGoal || 0, crmNotes: s.crmNotes || {} });
        setGoalInput(String(s.salesGoal || ""));
      }
    } catch (e) {
      setError(e.message);
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const k = sessionStorage.getItem("niv-admin-key");
    if (k) {
      setKey(k);
      load(k);
    }
  }, [load]);

  async function saveStock(variantId, value) {
    try {
      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ variantId, stock: value === "" ? null : value }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement.");
      setSaved(variantId);
      setTimeout(() => setSaved(""), 1500);
    } catch (e) {
      setError(e.message);
    }
  }

  async function savePromo(variantId, value) {
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ variantId, salePrice: value === "" ? null : value }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement de la promo.");
      setSaved(variantId);
      setTimeout(() => setSaved(""), 1500);
    } catch (e) {
      setError(e.message);
    }
  }

  async function applyCategoryPromo(category, percent) {
    const label = getCategoryLabel(category);
    if (percent > 0) {
      if (!window.confirm(`Appliquer une remise de ${percent}% sur tous les « ${label} » ?\nLes clientes paieront réellement ${percent}% de moins que le prix affiché.`)) return;
    } else {
      if (!window.confirm(`Retirer toutes les promos sur les « ${label} » ?`)) return;
    }
    setError("");
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ action: "bulk", category, percent }),
      });
      if (!res.ok) throw new Error("Échec de l'application de la remise.");
      await load(key);
      setSaved("bulk-" + category);
      setTimeout(() => setSaved(""), 2000);
    } catch (e) {
      setError(e.message);
    }
  }

  async function setOrderStatus(id, status, extra = {}) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status, ...(extra.tracking != null ? { tracking: extra.tracking } : {}) } : o)));
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ id, status, ...extra }),
      });
      const d = await res.json().catch(() => ({}));
      if (extra.notifyCustomer && !d.emailed) {
        setError("Statut mis à jour, mais l'e-mail au client n'a pas pu être envoyé (vérifie l'e-mail Resend dans Réglages).");
      }
    } catch (e) {
      setError("Échec de la mise à jour du statut.");
    }
  }

  // Marquer expédiée : demande le n° de suivi (optionnel) et propose de prévenir la cliente.
  async function shipOrder(o) {
    const input = window.prompt("Numéro de suivi du colis (laisse vide si tu n'en as pas encore) :", o.tracking || "");
    if (input === null) return; // annulé
    const tracking = input.trim();
    let notifyCustomer = false;
    if (tracking && o.customerEmail) {
      notifyCustomer = window.confirm(`Envoyer un e-mail à ${o.customerEmail} avec le numéro de suivi ?`);
    }
    await setOrderStatus(o.id, "expediee", { tracking, notifyCustomer });
  }

  // Une commande est "verrouillée" (non remboursable / non annulable) dès qu'elle
  // est en gravure / expédiée / livrée, OU passé 24 h après la commande.
  function isLocked(o) {
    if (o.immediateStart) return true; // la cliente a demandé la fabrication immédiate
    if (["en_gravure", "expediee", "livree"].includes(o.status)) return true;
    const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
    return t > 0 && Date.now() - t > 24 * 3600 * 1000;
  }

  // Statut de remboursement AUTOMATIQUE selon le délai + l'état de fabrication.
  // Règle : 0-24 h = remboursement intégral · au-delà de 24 h (avant fabrication)
  // = remboursement partiel (retenue de 10 €) · dès la fabrication = plus de remboursement.
  function refundStatus(o) {
    const st = o.status || "a_preparer";
    if (st === "remboursee") return { txt: "Déjà remboursée", bg: "#eee", color: "#555" };
    if (st === "annulee") return { txt: "Commande annulée", bg: "#eee", color: "#555" };
    const started = o.immediateStart || ["en_gravure", "expediee", "livree"].includes(st);
    if (started) return { txt: "Remboursement : NON — fabrication lancée (produit personnalisé)", bg: "#fdecea", color: "#b3261e" };
    const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
    const ageH = t ? (Date.now() - t) / 3600000 : 999;
    if (ageH <= 24) return { txt: `Remboursement : INTÉGRAL possible (encore ${Math.max(0, Math.round(24 - ageH))} h sur les 24 h)`, bg: "#e7f5ea", color: "#256b34" };
    return { txt: "Remboursement : PARTIEL (retenue de 10 €) — délai 24 h dépassé, tant que la fabrication n'est pas lancée", bg: "#fbf4e6", color: "#8a6d3b" };
  }

  async function refundOrder(o) {
    if (o.status === "remboursee") return;
    const label = o.ref || o.id?.slice(-6);
    const warn = isLocked(o)
      ? "⚠️ Cette commande est en fabrication ou dépasse 24 h : un produit personnalisé n'est normalement PAS remboursable.\n\n"
      : "";
    if (!window.confirm(`${warn}Rembourser entièrement la commande #${label} (${formatEuro(o.total)}) ?\nLe client sera remboursé sur sa carte. Cette action est irréversible.`)) return;
    setRefunding(o.id);
    setError("");
    try {
      const res = await fetch("/api/admin/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ id: o.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec du remboursement.");
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: "remboursee" } : x)));
    } catch (e) {
      setError(e.message);
    } finally {
      setRefunding("");
    }
  }

  async function cancelOrder(o) {
    const label = o.ref || o.id?.slice(-6);
    const warn = isLocked(o)
      ? "⚠️ Cette commande est en fabrication ou dépasse 24 h : normalement elle n'est plus annulable côté cliente.\n\n"
      : "";
    if (!window.confirm(`${warn}Annuler la commande #${label} ?\nElle ne comptera plus dans le chiffre d'affaires. (Aucun remboursement n'est effectué — utilise « Rembourser » pour ça.)`)) return;
    let notifyCustomer = false;
    if (o.customerEmail) {
      notifyCustomer = window.confirm(`Envoyer un e-mail à ${o.customerEmail} pour la prévenir de l'annulation ?`);
    }
    await setOrderStatus(o.id, "annulee", { notifyCustomer });
  }

  async function deleteOrder(o) {
    const label = o.ref || o.id?.slice(-6);
    if (!window.confirm(`Supprimer définitivement la commande #${label} ?\nÀ utiliser surtout pour les commandes de test. Cette action est irréversible.`)) return;
    setOrders((prev) => prev.filter((x) => x.id !== o.id));
    try {
      await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ id: o.id }),
      });
    } catch (e) {
      setError("Échec de la suppression.");
    }
  }

  async function toggleTestOrder(o) {
    const test = !o.test;
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, test } : x)));
    try {
      await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ id: o.id, test }),
      });
    } catch (e) {
      setError("Échec de la mise à jour (test).");
    }
  }

  async function deleteAllTests() {
    const tests = orders.filter((o) => o.test);
    if (tests.length === 0) { setError("Aucune commande marquée « test » à supprimer."); return; }
    if (!window.confirm(`Supprimer définitivement les ${tests.length} commande(s) marquée(s) « test » ?`)) return;
    setOrders((prev) => prev.filter((o) => !o.test));
    for (const o of tests) {
      try {
        await fetch("/api/admin/orders", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", "x-admin-key": key },
          body: JSON.stringify({ id: o.id }),
        });
      } catch { /* ignore */ }
    }
  }

  function downloadCSV(filename, rows) {
    const csv = rows.map((r) => r.map((cell) => {
      const s = String(cell ?? "");
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  async function saveSettingsPatch(patch, label) {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement.");
      const s = (await res.json()).settings || {};
      setSiteSettings({ salesGoal: s.salesGoal || 0, crmNotes: s.crmNotes || {} });
      setSaved(label || "settings");
      setTimeout(() => setSaved(""), 1500);
    } catch (e) {
      setError(e.message);
    }
  }

  function saveGoal() {
    saveSettingsPatch({ salesGoal: Number(goalInput) || 0 }, "goal");
  }

  function saveNote(emailKey) {
    const notes = { ...(siteSettings.crmNotes || {}) };
    const val = (noteDraft[emailKey] ?? notes[emailKey] ?? "").trim();
    if (val) notes[emailKey] = val; else delete notes[emailKey];
    saveSettingsPatch({ crmNotes: notes }, "note-" + emailKey);
  }

  async function sendClientEmail(to) {
    setMailMsg("");
    if (!mailSubject.trim() || !mailBody.trim()) { setMailMsg("Sujet et message obligatoires."); return; }
    setMailSending(true);
    try {
      const res = await fetch("/api/admin/send-client-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ to, subject: mailSubject, message: mailBody }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Échec.");
      setMailMsg("✓ E-mail envoyé à " + to);
      setMailSubject(""); setMailBody("");
      setTimeout(() => { setMailOpen(""); setMailMsg(""); }, 1500);
    } catch (e) { setMailMsg(e.message); }
    finally { setMailSending(false); }
  }

  async function sendTestEmail() {
    setTestMsg("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail.trim())) {
      setTestMsg("Entre une adresse e-mail valide.");
      return;
    }
    setTestSending(true);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ to: testEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi.");
      setTestMsg("✓ E-mail de test envoyé ! Vérifie la boîte de réception (et les spams).");
    } catch (e) {
      setTestMsg(e.message);
    } finally {
      setTestSending(false);
    }
  }

  function updateRow(stockId, value) {
    // le stock est partagé par couleur : on met à jour toutes les variantes du même stockId
    setRows((prev) => prev.map((r) => ((r.stockId || r.variantId) === stockId ? { ...r, stock: value } : r)));
  }
  function updateRowPromo(variantId, value) {
    setRows((prev) => prev.map((r) => (r.variantId === variantId ? { ...r, salePrice: value } : r)));
  }
  if (!authed) {
    return (
      <div className="center-card">
        <h1>Espace gestion</h1>
        <p style={{ color: "var(--ink-soft)" }}>Réservé à Niv Création. Entrez votre mot de passe.</p>
        <div className="field" style={{ textAlign: "left", marginTop: 16 }}>
          <input type="password" placeholder="Mot de passe" value={key}
            onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load(key)} />
        </div>
        {error && <div className="notice">{error}</div>}
        <button className="btn btn-gold" onClick={() => load(key)} disabled={loading}>
          {loading ? "Connexion…" : "Entrer"}
        </button>
      </div>
    );
  }

  const grouped = rows.reduce((acc, r) => {
    (acc[r.productSlug] = acc[r.productSlug] || { name: r.productName, category: r.category, items: [] }).items.push(r);
    return acc;
  }, {});
  // Catégories réellement présentes (pour les boutons de remise rapide, mis à jour tout seuls).
  const promoCats = [...new Set(Object.values(grouped).map((g) => g.category).filter(Boolean))];
  const lowOrOut = rows.filter((r) => typeof r.stock === "number" && r.stock <= 2).length;
  // Photo par produit (pour l'onglet Stock).
  const imgBySlug = {};
  editable.forEach((e) => { imgBySlug[e.slug] = (e.overrideImages && e.overrideImages[0]) || e.image || (e.images && e.images[0]) || ""; });

  // ---- Calculs commandes / clientes / statistiques ----
  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso || "—"; }
  };
  // Les commandes remboursées, annulées ou marquées « test » ne comptent pas dans les stats.
  const validOrders = orders.filter((o) => o.status !== "remboursee" && o.status !== "annulee" && !o.test);
  const ca = validOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const nbCmd = validOrders.length;
  const nbRembourse = orders.length - validOrders.length;
  const nbTest = orders.filter((o) => o.test).length;
  const panierMoyen = nbCmd ? ca / nbCmd : 0;
  const aPreparer = orders.filter((o) => !o.test && o.status !== "expediee" && o.status !== "livree" && o.status !== "remboursee" && o.status !== "annulee").length;

  // Filtre + recherche des commandes (comme sur les grandes plateformes).
  const orderQuery = orderSearch.trim().toLowerCase();
  // Repérage des doublons possibles : même cliente (e-mail) + même(s) article(s)
  // à moins de 30 jours d'intervalle. On ALERTE seulement (on ne supprime rien) :
  // un 2e paiement peut être une vraie nouvelle commande, à vérifier avant de fabriquer.
  const dupIds = (() => {
    const groups = {};
    for (const o of orders) {
      if (o.test || o.status === "annulee" || o.status === "remboursee") continue;
      const email = (o.customerEmail || "").toLowerCase().trim();
      const sig = (o.items || []).map((i) => `${(i.name || "").toLowerCase()}|${i.quantity}`).sort().join(";");
      if (!email || !sig) continue;
      (groups[email + "::" + sig] ||= []).push(o);
    }
    const ids = new Set();
    for (const arr of Object.values(groups)) {
      if (arr.length < 2) continue;
      const times = arr.map((o) => +new Date(o.createdAt || 0));
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          if (Math.abs(times[i] - times[j]) <= 30 * 86400000) { ids.add(arr[i].id); ids.add(arr[j].id); }
        }
      }
    }
    return ids;
  })();

  const filteredOrders = orders.filter((o) => {
    const st = o.status || "a_preparer";
    if (orderFilter === "a_preparer" && !(st === "a_preparer" || st === "en_gravure")) return false;
    if (orderFilter === "expediee" && st !== "expediee") return false;
    if (orderFilter === "livree" && st !== "livree") return false;
    if (orderFilter === "annulee" && st !== "annulee" && st !== "remboursee") return false;
    if (orderQuery) {
      const hay = `${o.ref || ""} ${o.id || ""} ${o.customerName || ""} ${o.customerEmail || ""} ${(o.items || []).map((i) => i.name).join(" ")}`.toLowerCase();
      if (!hay.includes(orderQuery)) return false;
    }
    return true;
  });

  // Clientes (regroupées par e-mail) — hors remboursées
  const clientsMap = {};
  for (const o of validOrders) {
    const k = (o.customerEmail || o.customerName || "—").toLowerCase();
    if (!clientsMap[k]) clientsMap[k] = { name: o.customerName || "—", email: o.customerEmail || "", phone: o.customerPhone || "", nb: 0, total: 0, last: o.createdAt, orders: [] };
    clientsMap[k].nb += 1;
    clientsMap[k].total += Number(o.total) || 0;
    clientsMap[k].orders.push({ id: o.id, ref: o.ref || o.id?.slice(-6), status: o.status || "a_preparer", tracking: o.tracking || "", total: o.total, createdAt: o.createdAt });
    if (o.customerPhone && !clientsMap[k].phone) clientsMap[k].phone = o.customerPhone;
  }
  const clients = Object.values(clientsMap).sort((a, b) => b.total - a.total);

  // Best-sellers (par article) — hors remboursées
  const sellMap = {};
  for (const o of validOrders) {
    for (const it of o.items || []) {
      const n = it.name || "Article";
      if (!sellMap[n]) sellMap[n] = { name: n, qty: 0, total: 0 };
      sellMap[n].qty += Number(it.quantity) || 0;
      sellMap[n].total += Number(it.total) || 0;
    }
  }
  const bestSellers = Object.values(sellMap).sort((a, b) => b.qty - a.qty).slice(0, 10);

  // ---- Tableau de bord annuel ----
  const orderYears = [...new Set(validOrders.map((o) => o.createdAt ? new Date(o.createdAt).getFullYear() : null).filter(Boolean))];
  if (!orderYears.includes(statYear)) orderYears.push(statYear);
  orderYears.sort((a, b) => b - a);
  const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  const monthlyCA = Array(12).fill(0);
  const monthlyNb = Array(12).fill(0);
  let caYear = 0, nbYear = 0;
  for (const o of validOrders) {
    if (!o.createdAt) continue;
    const d = new Date(o.createdAt);
    if (d.getFullYear() !== statYear) continue;
    const m = d.getMonth();
    monthlyCA[m] += Number(o.total) || 0;
    monthlyNb[m] += 1;
    caYear += Number(o.total) || 0;
    nbYear += 1;
  }
  const maxMonthly = Math.max(1, ...monthlyCA);
  const panierYear = nbYear ? caYear / nbYear : 0;
  const bestMonthIdx = monthlyCA.indexOf(Math.max(...monthlyCA));
  // Mois en cours (année réelle)
  const now = new Date();
  const caThisMonth = validOrders.reduce((s, o) => {
    if (!o.createdAt) return s;
    const d = new Date(o.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() ? s + (Number(o.total) || 0) : s;
  }, 0);
  // Clientes : nouvelles vs récurrentes (≥ 2 commandes)
  const recurrentes = clients.filter((c) => c.nb >= 2).length;
  const nouvelles = clients.length - recurrentes;

  // ---- CRM : segments + 1ère/dernière commande ----
  const vipThreshold = 100; // total dépensé pour être "VIP"
  const crmClients = clients.map((c) => {
    const dates = (c.orders || []).map((o) => o.createdAt).filter(Boolean).sort();
    const first = dates[0] || null;
    const last = dates[dates.length - 1] || null;
    let segment = "Nouvelle";
    if (c.total >= vipThreshold || c.nb >= 4) segment = "VIP";
    else if (c.nb >= 2) segment = "Fidèle";
    return { ...c, first, last, segment };
  });
  const crmFiltered = crmClients.filter((c) => {
    const q = crmSearch.trim().toLowerCase();
    if (!q) return true;
    return `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q);
  });
  const segColors = { VIP: "#8a6d3b", "Fidèle": "#256b34", Nouvelle: "#5b6b8a" };

  return (
    <section className="section admin-section">
      <div className="container admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <span className="eyebrow">Espace gestion</span>
            <h2>Mon site</h2>
          </div>
          <nav className="admin-sidebar-nav">
          {[
            {
              label: "Commandes",
              tabs: [
                { id: "commandes", text: `Commandes${aPreparer > 0 ? ` (${aPreparer})` : ""}` },
                { id: "atelier", text: "🥃 Atelier (à graver)", href: "/gestion/atelier" },
                { id: "devis", text: "Devis / Factures" },
              ],
            },
            {
              label: "Clients",
              tabs: [
                { id: "crm", text: "👥 CRM — clients", href: "/gestion/crm" },
              ],
            },
            {
              label: "Catalogue",
              tabs: [
                { id: "produits", text: "Produits" },
                { id: "stock", text: "Stock" },
                { id: "gravure", text: "Gravure" },
                { id: "couverts-reglage", text: "🍴 Réglage couverts", href: "/gestion/couverts-reglage" },
              ],
            },
            {
              label: "Finances",
              tabs: [
                { id: "inventaire-compta", text: "📦 Inventaire & Compta", href: "/gestion/inventaire-compta" },
                { id: "stats", text: "Statistiques (ventes)" },
                { id: "visiteurs", text: "📈 Visiteurs & trafic", href: "/gestion/statistiques" },
              ],
            },
            {
              label: "Marketing",
              tabs: [
                { id: "promos", text: "Promotions" },
                { id: "avis", text: "Avis" },
                { id: "newsletter", text: "Newsletter" },
                { id: "etude-marche", text: "📊 Étude de marché", href: "/gestion/etude-marche" },
              ],
            },
            {
              label: "Assistant & IA",
              tabs: [
                { id: "assistant", text: "Assistant" },
                { id: "agents", text: "Équipe d'agents" },
                { id: "boite-mail", text: "✉️ Boîte mail (agent)", href: "/gestion/boite-mail" },
              ],
            },
            {
              label: "Réglages",
              tabs: [
                { id: "apparence", text: "Apparence" },
                { id: "reglages", text: "Réglages" },
              ],
            },
          ].map((group) => (
            <div className="admin-side-group" key={group.label}>
              <span className="admin-side-label">{group.label}</span>
              {group.tabs.map((t) => (
                t.href ? (
                  <a key={t.id} href={t.href} className="admin-side-item" style={{ textDecoration: "none" }}>
                    {t.text}
                  </a>
                ) : (
                  <button
                    key={t.id}
                    className={`admin-side-item ${tab === t.id ? "active" : ""}`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.text}
                  </button>
                )
              ))}
            </div>
          ))}
          </nav>
        </aside>

        <div className="admin-content">
        <DeclarationReminder />

        {error && <div className="notice">{error}</div>}

        {/* ---------------- COMMANDES ---------------- */}
        {tab === "commandes" && (
          <>
            <a href="/gestion/atelier" className="btn btn-gold" style={{ display: "inline-block", marginBottom: 14, textDecoration: "none" }}>
              🥃 Atelier — verres gravés (visuels + fichiers à graver)
            </a>
            {!firebase?.connected && (
              <div className="notice">Connexion à ton application non active : les commandes ne peuvent pas être affichées. (Voir l'onglet Réglages.)</div>
            )}
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
              {nbCmd} commande{nbCmd > 1 ? "s" : ""} · {aPreparer} à préparer. Marque « Expédiée » une fois envoyée.
              {nbTest > 0 ? ` · ${nbTest} test${nbTest > 1 ? "s" : ""} (non compté${nbTest > 1 ? "s" : ""}).` : ""}
            </p>
            {nbTest > 0 && (
              <button className="btn btn-outline" style={{ marginBottom: 14, color: "#b4452f", borderColor: "#e7b7ad" }} onClick={deleteAllTests}>
                🗑 Supprimer les {nbTest} commande{nbTest > 1 ? "s" : ""} test
              </button>
            )}
            {ordersReady && nbCmd === 0 && (
              <div className="admin-block"><p style={{ margin: 0, color: "var(--ink-soft)" }}>Aucune commande pour le moment. Elles apparaîtront ici automatiquement après chaque vente.</p></div>
            )}

            {orders.length > 0 && (
              <>
                <input
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Rechercher (nom, e-mail, n° de commande, produit)…"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit", marginBottom: 10 }}
                />
                <div className="filters" style={{ justifyContent: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 6 }}>
                  {[
                    ["all", "Toutes"],
                    ["a_preparer", "À préparer"],
                    ["expediee", "Expédiées"],
                    ["livree", "Livrées"],
                    ["annulee", "Annulées / remboursées"],
                  ].map(([val, label]) => (
                    <button key={val} className={`filter-chip ${orderFilter === val ? "active" : ""}`} style={{ padding: "5px 12px", fontSize: "0.85rem" }} onClick={() => setOrderFilter(val)}>
                      {label}
                    </button>
                  ))}
                </div>
                {filteredOrders.length === 0 && (
                  <div className="admin-block"><p style={{ margin: 0, color: "var(--ink-soft)" }}>Aucune commande ne correspond à ce filtre.</p></div>
                )}
              </>
            )}

            {filteredOrders.map((o) => (
              <div key={o.id} className="admin-block">
                <div className="admin-row" style={{ gridTemplateColumns: "1fr auto", alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>
                    #{o.ref || o.id?.slice(-6)}{" "}
                    <span className="admin-cat">{fmtDate(o.createdAt)}</span>
                  </h3>
                  <span style={{ fontWeight: 700, color: "var(--gold-dark)" }}>{formatEuro(o.total)}</span>
                </div>
                {dupIds.has(o.id) && (
                  <div style={{ margin: "6px 0 0", padding: "7px 10px", background: "#fdecea", border: "1px solid #f1b0a8", borderRadius: 8, color: "#b3261e", fontSize: "0.82rem", fontWeight: 600 }}>
                    ⚠️ Possible doublon — même cliente et même(s) article(s) qu'une autre commande récente. Vérifie avant de fabriquer (ne fabrique qu'une fois si c'est le même paiement).
                  </div>
                )}
                {(() => { const r = refundStatus(o); return (
                  <div style={{ margin: "6px 0 0", padding: "6px 10px", background: r.bg, borderRadius: 8, color: r.color, fontSize: "0.8rem", fontWeight: 600 }}>{r.txt}</div>
                ); })()}
                <div style={{ fontSize: "0.9rem", color: "var(--ink-soft)", margin: "4px 0 8px" }}>
                  <strong>{o.customerName || "—"}</strong>
                  {o.customerEmail ? <> · <a href={`mailto:${o.customerEmail}`}>{o.customerEmail}</a></> : null}
                  {o.customerPhone ? <> · {o.customerPhone}</> : null}
                  {o.shippingAddress ? (
                    <div style={{ whiteSpace: "pre-line", marginTop: 4 }}>
                      📦 {[o.shippingName, o.shippingAddress.line1, o.shippingAddress.line2, `${o.shippingAddress.postal_code || ""} ${o.shippingAddress.city || ""}`.trim(), o.shippingAddress.country].filter(Boolean).join(", ")}
                      {o.shippingMethod ? ` — ${o.shippingMethod}` : ""}
                    </div>
                  ) : null}
                </div>
                {(o.surMesure || o.demande) ? (
                  <div style={{ margin: "0 0 10px", padding: "8px 12px", background: "#eef6ff", border: "1px solid #cfe0f0", borderRadius: 8, fontSize: "0.85rem", whiteSpace: "pre-line", color: "#2b5d8a" }}>
                    <strong>📋 Sur mesure{o.quoteNumber ? ` — devis ${o.quoteNumber}` : ""} · ce que le client a demandé :</strong>
                    {o.demande ? `\n${o.demande}` : "\nVoir le détail des articles ci-dessous."}
                  </div>
                ) : null}
                <ul style={{ margin: "0 0 10px", paddingLeft: 18, fontSize: "0.9rem" }}>
                  {(o.items || []).map((it, i) => (
                    <li key={i}>{it.quantity}× {it.name}{it.details ? ` — ${it.details}` : ""} ({formatEuro(it.total)})</li>
                  ))}
                </ul>
                <div style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                    onClick={() => setBatOpen(batOpen === o.id ? null : o.id)}>
                    {batOpen === o.id ? "Fermer la discussion" : "💬 Aperçu à valider / discussion"}
                  </button>
                  <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                    onClick={() => setFicheOpen(ficheOpen === o.id ? null : o.id)}>
                    {ficheOpen === o.id ? "Fermer la fiche" : "🛠️ Fiche atelier (à graver)"}
                  </button>
                </div>
                {batOpen === o.id && <BatThread order={o} adminKey={key} />}
                {ficheOpen === o.id && <FicheAtelier spec={o.spec} />}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {o.test && (
                    <span style={{ fontSize: "0.78rem", padding: "2px 8px", borderRadius: 20, background: "#e7e0f0", color: "#5b4b8a", fontWeight: 600 }}>🧪 Commande test (non comptée)</span>
                  )}
                  <button className="btn btn-outline" style={{ padding: "3px 10px", fontSize: "0.8rem" }} onClick={() => toggleTestOrder(o)}>
                    {o.test ? "Ce n'est pas un test" : "🧪 Marquer comme test"}
                  </button>
                </div>
                {o.status === "remboursee" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, color: "#8a6d3b" }}>↩ Remboursée</span>
                    <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem", color: "#b4452f", borderColor: "#e7b7ad" }} onClick={() => deleteOrder(o)}>
                      🗑 Supprimer
                    </button>
                  </div>
                ) : o.status === "annulee" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, color: "#8a6d3b" }}>✕ Annulée</span>
                    <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setOrderStatus(o.id, "a_preparer")}>
                      Rétablir
                    </button>
                    <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem", color: "#b4452f", borderColor: "#e7b7ad" }} onClick={() => deleteOrder(o)}>
                      🗑 Supprimer
                    </button>
                  </div>
                ) : (
                  <>
                    {o.tracking && (
                      <div style={{ fontSize: "0.85rem", marginBottom: 8 }}>
                        📦 Suivi : <strong>{o.tracking}</strong>{" "}
                        <a href={`https://parcelsapp.com/en/tracking/${encodeURIComponent(o.tracking)}`} target="_blank" rel="noreferrer">suivre</a>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, color: o.status === "livree" || o.status === "expediee" ? "#256b34" : o.status === "en_gravure" ? "#8a6d3b" : "#b4452f" }}>
                        {o.status === "livree" ? "✓✓ Livrée" : o.status === "expediee" ? "✓ Expédiée" : o.status === "en_gravure" ? "✏️ En fabrication" : "● À préparer"}
                      </span>
                      <span style={{ fontSize: "0.78rem", padding: "2px 8px", borderRadius: 20, background: isLocked(o) ? "#f3e2dd" : "#e3f0e3", color: isLocked(o) ? "#b4452f" : "#256b34" }}>
                        {isLocked(o) ? "🔒 Verrouillée" : "🕒 Annulable (24 h)"}
                      </span>
                      {o.immediateStart && (
                        <span style={{ fontSize: "0.78rem", padding: "2px 8px", borderRadius: 20, background: "#fbf3e6", color: "#8a6d3b" }}>
                          ⚡ Fabrication immédiate
                        </span>
                      )}

                      {(!o.status || o.status === "a_preparer") && (
                        <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setOrderStatus(o.id, "en_gravure")}>
                          ✏️ Commencer la fabrication
                        </button>
                      )}
                      {o.status === "en_gravure" && (
                        <>
                          <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => shipOrder(o)}>
                            Marquer expédiée
                          </button>
                          <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setOrderStatus(o.id, "a_preparer")}>
                            Retour à préparer
                          </button>
                        </>
                      )}
                      {(!o.status || o.status === "a_preparer") && (
                        <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => shipOrder(o)}>
                          Marquer expédiée
                        </button>
                      )}
                      {o.status === "expediee" && (
                        <>
                          <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => {
                            // Demande d'avis envoyée automatiquement à la cliente (si e-mail connu).
                            setOrderStatus(o.id, "livree", { notifyCustomer: Boolean(o.customerEmail) });
                          }}>
                            Marquer livrée
                          </button>
                          <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => shipOrder(o)}>
                            {o.tracking ? "Modifier le suivi" : "Ajouter un suivi"}
                          </button>
                          <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setOrderStatus(o.id, "a_preparer")}>
                            Remettre à préparer
                          </button>
                        </>
                      )}
                      {o.status === "livree" && (
                        <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setOrderStatus(o.id, "expediee")}>
                          Remettre expédiée
                        </button>
                      )}

                      <button
                        className="btn btn-outline"
                        style={{ padding: "4px 12px", fontSize: "0.85rem", color: "#b4452f", borderColor: "#e7b7ad" }}
                        onClick={() => refundOrder(o)}
                        disabled={refunding === o.id}
                      >
                        {refunding === o.id ? "Remboursement…" : "↩ Rembourser"}
                      </button>
                      <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => cancelOrder(o)}>
                        ✕ Annuler
                      </button>
                      <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem", color: "#b4452f", borderColor: "#e7b7ad" }} onClick={() => deleteOrder(o)}>
                        🗑 Supprimer
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {/* ---------------- STATISTIQUES ---------------- */}
        {tab === "stats" && (
          <>
            {/* Sélecteur d'année */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <strong>Année :</strong>
              {orderYears.map((y) => (
                <button key={y} className={`filter-chip ${statYear === y ? "active" : ""}`} style={{ padding: "4px 14px" }} onClick={() => setStatYear(y)}>{y}</button>
              ))}
            </div>

            {/* KPIs de l'année */}
            <div className="admin-block" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              <div><div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--gold-dark)" }}>{formatEuro(caYear)}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>CA {statYear}</div></div>
              <div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{nbYear}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Commandes {statYear}</div></div>
              <div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{formatEuro(panierYear)}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Panier moyen</div></div>
              <div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{formatEuro(caThisMonth)}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>CA ce mois-ci</div></div>
            </div>

            {/* Objectif du mois */}
            <div className="admin-block">
              <h3 style={{ marginTop: 0 }}>🎯 Objectif de CA du mois</h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                <input type="number" min="0" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} placeholder="Ex. 1000" style={{ width: 120, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
                <span>€ / mois</span>
                <button className="btn btn-gold" style={{ padding: "6px 14px" }} onClick={saveGoal}>Enregistrer</button>
              </div>
              {siteSettings.salesGoal > 0 ? (
                (() => {
                  const pct = Math.min(100, Math.round((caThisMonth / siteSettings.salesGoal) * 100));
                  return (
                    <>
                      <div style={{ background: "#eee", borderRadius: 20, height: 22, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "#256b34" : "var(--gold)", transition: "width .3s" }} />
                      </div>
                      <p style={{ margin: "8px 0 0", fontSize: "0.9rem" }}>
                        <strong>{formatEuro(caThisMonth)}</strong> / {formatEuro(siteSettings.salesGoal)} — <strong>{pct}%</strong>
                        {pct >= 100 ? " 🎉 Objectif atteint !" : ` · reste ${formatEuro(siteSettings.salesGoal - caThisMonth)}`}
                      </p>
                    </>
                  );
                })()
              ) : (
                <p style={{ color: "var(--ink-soft)", margin: 0, fontSize: "0.85rem" }}>Définis un objectif pour suivre ta progression du mois.</p>
              )}
            </div>

            {/* Graphique CA par mois */}
            <div className="admin-block">
              <h3 style={{ marginTop: 0 }}>Chiffre d'affaires par mois — {statYear}</h3>
              {caYear === 0 ? (
                <p style={{ color: "var(--ink-soft)", margin: 0 }}>Aucune vente sur cette année.</p>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 160, marginTop: 10 }}>
                    {monthlyCA.map((v, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }} title={`${MONTHS[i]} : ${formatEuro(v)} (${monthlyNb[i]} cmd)`}>
                        <span style={{ fontSize: "0.62rem", color: "var(--ink-soft)" }}>{v > 0 ? Math.round(v) : ""}</span>
                        <div style={{ width: "100%", height: `${Math.max(2, (v / maxMonthly) * 120)}px`, background: i === bestMonthIdx && v > 0 ? "var(--gold-dark)" : "var(--gold)", borderRadius: "4px 4px 0 0", opacity: v > 0 ? 1 : 0.25 }} />
                        <span style={{ fontSize: "0.62rem", color: "var(--ink-soft)" }}>{MONTHS[i]}</span>
                      </div>
                    ))}
                  </div>
                  {bestMonthIdx >= 0 && monthlyCA[bestMonthIdx] > 0 && (
                    <p style={{ color: "var(--ink-soft)", fontSize: "0.82rem", marginBottom: 0 }}>Meilleur mois : <strong>{MONTHS[bestMonthIdx]}</strong> ({formatEuro(monthlyCA[bestMonthIdx])}).</p>
                  )}
                </>
              )}
            </div>

            {/* Clientes */}
            <div className="admin-block" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div><div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{clients.length}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.8rem" }}>Clientes</div></div>
              <div><div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{nouvelles}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.8rem" }}>Nouvelles</div></div>
              <div><div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#256b34" }}>{recurrentes}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.8rem" }}>Fidèles (≥2)</div></div>
            </div>

            {/* Best-sellers */}
            <div className="admin-block">
              <h3>Produits les plus vendus (toutes périodes)</h3>
              {bestSellers.length === 0 && <p style={{ color: "var(--ink-soft)", margin: 0 }}>Pas encore de ventes.</p>}
              {bestSellers.map((b) => (
                <div className="admin-row" key={b.name} style={{ gridTemplateColumns: "1fr auto auto", gap: 10 }}>
                  <span className="admin-variant">{b.name}</span>
                  <span style={{ color: "var(--ink-soft)" }}>{b.qty} vendu{b.qty > 1 ? "s" : ""}</span>
                  <span className="admin-price">{formatEuro(b.total)}</span>
                </div>
              ))}
            </div>
            <div className="admin-block" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-outline" onClick={() => {
                const rows = [["Réf", "Date", "Cliente", "Email", "Téléphone", "Statut", "Total (€)", "Articles"]];
                for (const o of orders) rows.push([o.ref || o.id?.slice(-6), fmtDate(o.createdAt), o.customerName || "", o.customerEmail || "", o.customerPhone || "", o.test ? "test" : (o.status || "a_preparer"), (Number(o.total) || 0).toFixed(2), (o.items || []).map((i) => `${i.quantity}x ${i.name}`).join(" | ")]);
                downloadCSV("ventes-nivcreation.csv", rows);
              }}>⬇️ Exporter les ventes (Excel/CSV)</button>
              <button className="btn btn-outline" onClick={() => {
                const rows = [["Cliente", "Email", "Téléphone", "Segment", "Nb commandes", "Total (€)", "1ère commande", "Dernière commande"]];
                for (const c of crmClients) rows.push([c.name, c.email, c.phone, c.segment, c.nb, Number(c.total).toFixed(2), c.first ? fmtDate(c.first) : "", c.last ? fmtDate(c.last) : ""]);
                downloadCSV("clientes-nivcreation.csv", rows);
              }}>⬇️ Exporter les clientes (Excel/CSV)</button>
            </div>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>
              Calculé sur les commandes valides (hors tests, annulées et remboursées
              {nbRembourse > 0 || nbTest > 0 ? ` : ${nbRembourse} remboursée(s), ${nbTest} test(s) exclus` : ""}).
            </p>
          </>
        )}


        {/* ---------------- AVIS ---------------- */}
        {tab === "avis" && <ReviewsAdmin adminKey={key} />}

        {/* ---------------- NEWSLETTER ---------------- */}
        {tab === "newsletter" && <NewsletterAdmin adminKey={key} />}

        {/* ---------------- DEVIS / FACTURES ---------------- */}
        {tab === "devis" && <QuotesAdmin adminKey={key} />}

        {/* ---------------- PRODUITS ---------------- */}
        {tab === "produits" && (
          <ProductsAdmin adminKey={key} products={editable} onReload={() => load(key)} />
        )}

        {/* ---------------- ASSISTANT ---------------- */}
        {tab === "assistant" && (
          <AssistantAdmin adminKey={key} onReload={() => load(key)} />
        )}

        {tab === "agents" && (
          <div style={{ border: "1px solid var(--gold)", borderRadius: 16, padding: 24, background: "linear-gradient(135deg, #fffdf7, var(--cream))" }}>
            <h3 style={{ marginTop: 0, fontFamily: "Georgia, serif", color: "var(--gold)" }}>Centre de commande — Ton équipe d'agents</h3>
            <p style={{ color: "var(--ink-soft)" }}>
              Une page dédiée et professionnelle pour piloter tes agents IA : le Chef qui coordonne tout, l'agent e-mail, et les prochains à venir.
              Chaque agent a son espace de travail. Rien n'est envoyé sans ta validation.
            </p>
            <a href="/gestion/agents" className="btn btn-gold">Ouvrir le centre des agents →</a>
          </div>
        )}

        {/* ---------------- GRAVURE ---------------- */}
        {tab === "gravure" && (
          <EngravingAdmin adminKey={key} products={editable} onReload={() => load(key)} />
        )}

        {/* ---------------- STOCK ---------------- */}
        {tab === "stock" && (
          <>
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
              {rows.length} variantes · {lowOrOut} en stock bas ou épuisé. Vide = « non suivi ». Le stock baisse à chaque vente.
            </p>
            {(() => {
              const ORD = ["bijoux", "verres", "mariage", "cristaux", "cadeaux", "lampes", "couverts", "cles-usb", "porte-cles", "medailles"];
              const rk = (c) => { const i = ORD.indexOf(c); return i < 0 ? 99 : i; };
              let lastCat = null;
              return Object.entries(grouped)
                .sort((a, b) => (rk(a[1].category) - rk(b[1].category)) || a[1].name.localeCompare(b[1].name))
                .map(([slug, g]) => {
                  const head = g.category !== lastCat; lastCat = g.category;
                  return (
              <div key={slug}>
                {head && <h2 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)", margin: "24px 0 8px", borderBottom: "2px solid #e7d9bd", paddingBottom: 4 }}>{getCategoryLabel(g.category)}</h2>}
                <div className="admin-block">
                <h3 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {imgBySlug[slug] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgBySlug[slug]} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid #eee", flexShrink: 0 }} />
                  )}
                  <span>{g.name} <span className="admin-cat">{getCategoryLabel(g.category)}</span></span>
                </h3>
                {(() => {
                  // Stock groupé par couleur : un seul champ par stockId (recto + recto-verso partagés)
                  const counts = {};
                  g.items.forEach((r) => { const k = r.stockId || r.variantId; counts[k] = (counts[k] || 0) + 1; });
                  const seen = new Set();
                  return g.items.filter((r) => { const k = r.stockId || r.variantId; if (seen.has(k)) return false; seen.add(k); return true; }).map((r) => {
                    const k = r.stockId || r.variantId;
                    const grouped = counts[k] > 1;
                    // Stock partagé par plusieurs variantes : on affiche la partie
                    // COMMUNE à toutes (= la vraie couleur/option distinctive), pas
                    // seulement le dernier mot (qui donnait des doublons « Sans texte »).
                    let label = r.variantTitle;
                    if (grouped) {
                      const segs = g.items
                        .filter((x) => (x.stockId || x.variantId) === k)
                        .map((x) => (x.variantTitle || "").split("/").map((s) => s.trim()).filter(Boolean));
                      const common = (segs[0] || []).filter((s) => segs.every((arr) => arr.includes(s)));
                      // option seule (avec/sans gravure) sans couleur commune → pas de sous-étiquette
                      label = common.length ? common.join(" / ") : "";
                    }
                    return (
                      <div className="admin-row" key={k}>
                        <span className="admin-variant">{label}</span>
                        <input className={`admin-stock ${typeof r.stock === "number" && r.stock === 0 ? "out" : ""}`}
                          type="number" min="0" placeholder="—" value={r.stock ?? ""}
                          onChange={(e) => updateRow(k, e.target.value === "" ? "" : Number(e.target.value))}
                          onBlur={(e) => saveStock(k, e.target.value)} />
                        <span className="admin-saved">{saved === k ? "✓" : ""}</span>
                      </div>
                    );
                  });
                })()}
                </div>
              </div>
                  );
                });
            })()}
          </>
        )}

        {/* ---------------- PROMOTIONS ---------------- */}
        {tab === "promos" && (
          <>
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
              Toutes tes promotions au même endroit : <strong>codes promo</strong>, <strong>remise rapide par catégorie</strong>, et <strong>prix promo par produit</strong>.
            </p>

            <PromoCodesAdmin adminKey={key} />


            {/* Remise en lot par catégorie */}
            <div className="admin-block" style={{ display: "grid", gap: 10, border: "1px solid #e7d3a1", background: "#fbf4e6" }}>
              <h3 style={{ margin: 0 }}>🏷️ Remise rapide sur une catégorie</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                Applique une vraie remise sur tous les produits d'une catégorie d'un coup (prix barré + réduction, et la cliente paie vraiment moins). {saved.startsWith("bulk-") ? "✓ Appliqué" : ""}
              </p>
              <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                Remise de
                <input type="number" min="0" max="90" value={bulkPct} style={{ width: 80 }} onChange={(e) => setBulkPct(Number(e.target.value))} />
                %
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {promoCats.map((c) => (
                  <button key={c} className="btn btn-gold" style={{ padding: "6px 14px", fontSize: "0.9rem" }} onClick={() => applyCategoryPromo(c, bulkPct)}>
                    Appliquer sur {getCategoryLabel(c)}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {promoCats.map((c) => (
                  <button key={c} className="btn btn-outline" style={{ padding: "6px 14px", fontSize: "0.85rem" }} onClick={() => applyCategoryPromo(c, 0)}>
                    Retirer sur {getCategoryLabel(c)}
                  </button>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                ⚠️ Rappel : comme tu viens de monter les prix des bijoux, l'affichage « −20 % » se réfère à ce prix récent. Pour être pleinement en règle (loi Omnibus), l'idéal est d'avoir laissé ce prix en place ~30 jours avant d'annoncer la réduction. À toi de voir.
              </p>
            </div>

            <h2 style={{ fontFamily: "Georgia,serif", color: "var(--ink)", marginTop: 24 }}>💸 Prix promo par produit</h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginTop: 0 }}>
              Mets un prix promo (inférieur au prix normal) : le client verra le prix barré + la réduction. Vide = pas de promo.
            </p>
            {(() => {
              const ORD = ["bijoux", "verres", "mariage", "cristaux", "cadeaux", "lampes", "couverts", "cles-usb", "porte-cles", "medailles"];
              const rk = (c) => { const i = ORD.indexOf(c); return i < 0 ? 99 : i; };
              let lastCat = null;
              return Object.entries(grouped)
                .sort((a, b) => (rk(a[1].category) - rk(b[1].category)) || a[1].name.localeCompare(b[1].name))
                .map(([slug, g]) => {
                  const head = g.category !== lastCat; lastCat = g.category;
                  return (
              <div key={slug}>
                {head && <h3 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)", margin: "20px 0 6px", borderBottom: "2px solid #e7d9bd", paddingBottom: 4 }}>{getCategoryLabel(g.category)}</h3>}
                <div className="admin-block">
                <h3 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {imgBySlug[slug] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgBySlug[slug]} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid #eee", flexShrink: 0 }} />
                  )}
                  <span>{g.name}</span>
                </h3>
                {g.items.map((r) => (
                  <div className="admin-row" key={r.variantId} style={{ gridTemplateColumns: "1fr auto 100px 70px" }}>
                    <span className="admin-variant">{r.variantTitle}</span>
                    <span className="admin-price">{formatEuro(r.price)}</span>
                    <input className="admin-stock" type="number" min="0" step="0.01"
                      placeholder="Promo €" value={r.salePrice ?? ""}
                      onChange={(e) => updateRowPromo(r.variantId, e.target.value === "" ? "" : Number(e.target.value))}
                      onBlur={(e) => savePromo(r.variantId, e.target.value)} />
                    <span className="admin-saved">{saved === r.variantId ? "✓" : ""}</span>
                  </div>
                ))}
                </div>
              </div>
                  );
                });
            })()}
          </>
        )}

        {/* ---------------- APPARENCE ---------------- */}
        {tab === "apparence" && <AppearanceAdmin adminKey={key} />}

        {/* ---------------- RÉGLAGES ---------------- */}
        {tab === "reglages" && config && (
          <>
            <div className="admin-block" style={{ display: "grid", gap: 10, border: "1px solid #e7d3a1", background: "#fbf4e6" }}>
              <h3 style={{ margin: 0 }}>📧 Tester l'e-mail de confirmation client</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                Envoie-toi (ou à un proche) le modèle d'e-mail que reçoivent les clients, pour vérifier le rendu.
              </p>
              <input
                type="email"
                placeholder="adresse@exemple.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8 }}
              />
              <button className="btn btn-gold" onClick={sendTestEmail} disabled={testSending}>
                {testSending ? "Envoi…" : "Envoyer l'e-mail de test"}
              </button>
              {testMsg && <div className="notice" style={{ margin: 0 }}>{testMsg}</div>}
            </div>

            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
              État de tes intégrations. Les clés secrètes se règlent dans Netlify (sécurité), elles ne sont jamais stockées ici.
            </p>
            <div className="admin-block">
              {Object.entries(CONFIG_LABELS).map(([k, label]) => (
                <div className="admin-row" key={k} style={{ gridTemplateColumns: "1fr auto" }}>
                  <span className="admin-variant">{label}</span>
                  <span style={{ fontWeight: 600, color: config[k] ? "#256b34" : "#b4452f" }}>
                    {config[k] ? "Configuré" : "À configurer"}
                  </span>
                </div>
              ))}
            </div>

            {/* Diagnostic Firebase (connexion réelle à l'appli de gestion) */}
            {firebase && (
              <div className="admin-block" style={{ marginTop: "1rem" }}>
                <div className="admin-row" style={{ gridTemplateColumns: "1fr auto" }}>
                  <span className="admin-variant">Connexion à ton application (Firebase)</span>
                  <span style={{ fontWeight: 600, color: firebase.connected ? "#256b34" : "#b4452f" }}>
                    {firebase.connected ? "Connecté ✓" : "Non connecté"}
                  </span>
                </div>
                {!firebase.connected && (
                  <div className="admin-row" style={{ gridTemplateColumns: "1fr" }}>
                    <span style={{ color: "#b4452f", fontSize: "0.85rem" }}>
                      {firebase.error}
                      {firebase.present && !firebase.parsed && " (Recolle la clé : tout le contenu du fichier .json, d'un seul bloc.)"}
                    </span>
                  </div>
                )}
                {firebase.connected && firebase.projectId && (
                  <div className="admin-row" style={{ gridTemplateColumns: "1fr" }}>
                    <span style={{ color: "#256b34", fontSize: "0.85rem" }}>Projet : {firebase.projectId}</span>
                  </div>
                )}
              </div>
            )}

            <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>
              Pour configurer une clé manquante : Netlify → Site configuration → Environment variables (voir le guide DEPLOIEMENT.md).
            </p>
          </>
        )}
        </div>
      </div>
    </section>
  );
}
