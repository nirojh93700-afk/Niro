"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminToast from "@/components/admin/AdminToast";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// =============================================================================
// SQUELETTE MODERNE DE GESTION — barre latérale + barre du haut, sur TOUTES les
// pages /gestion/*. Un seul menu, des compteurs en direct, une recherche
// globale, l'assistant à un clic, un tiroir sur téléphone.
// Les onglets de /gestion sont des liens /gestion#id (la page écoute le hash).
// =============================================================================
const NAV = [
  { label: "Pilotage", items: [
    { id: "accueil", icon: "◫", text: "Tableau de bord", href: "/gestion#accueil" },
    { id: "assistant", icon: "✦", text: "Assistant", href: "/gestion#assistant", badge: "replies", accent: true },
  ] },
  { label: "Commandes", items: [
    { id: "file", icon: "▤", text: "File de production", href: "/gestion/commandes", badge: "prep" },
    { id: "commandes", icon: "▣", text: "Fiches complètes", href: "/gestion#commandes", badge: "unread" },
    { id: "atelier", icon: "◈", text: "Atelier · fichiers", href: "/gestion/atelier" },
    { id: "devis", icon: "▥", text: "Devis & factures", href: "/gestion#devis" },
  ] },
  { label: "Clients", items: [
    { id: "crm", icon: "◉", text: "Clients (CRM)", href: "/gestion/crm" },
    { id: "avis", icon: "★", text: "Avis", href: "/gestion#avis", badge: "reviews" },
    { id: "fidelite", icon: "◇", text: "Fidélité & cashback", href: "/gestion/fidelite" },
    { id: "messages", icon: "✉", text: "Messages", href: "/gestion/messages" },
    { id: "boite-mail", icon: "▨", text: "Boîte mail", href: "/gestion/boite-mail" },
  ] },
  { label: "Catalogue", items: [
    { id: "produits", icon: "◧", text: "Produits & stock", href: "/gestion#produits" },
    { id: "categories", icon: "≣", text: "Catégories & ordre", href: "/gestion#categories" },
    { id: "packaging", icon: "▢", text: "Emballages", href: "/gestion/emballages" },
    { id: "gravure", icon: "✎", text: "Gravure", href: "/gestion#gravure" },
    { id: "reglages-produits", icon: "⚙", text: "Réglages produits", href: "/gestion/reglages" },
    { id: "tailles", icon: "⌗", text: "Tailles & coûts", href: "/gestion/tailles-conseillees" },
    { id: "sante", icon: "◐", text: "Santé du catalogue", href: "/gestion/sante" },
    { id: "achats", icon: "⇩", text: "Achats & factures", href: "/gestion/achats" },
  ] },
  { label: "Marketing", items: [
    { id: "newsletter", icon: "▷", text: "Newsletter", href: "/gestion#newsletter" },
    { id: "promos", icon: "%", text: "Promotions", href: "/gestion#promos" },
    { id: "agents", icon: "⬡", text: "Équipe d'agents", href: "/gestion/agents" },
    { id: "etude-marche", icon: "◎", text: "Étude de marché", href: "/gestion/etude-marche" },
  ] },
  { label: "Finances", items: [
    { id: "benefices", icon: "€", text: "Bénéfices", href: "/gestion/benefices" },
    { id: "stats", icon: "▮", text: "Ventes", href: "/gestion#stats" },
    { id: "visiteurs", icon: "↗", text: "Visiteurs", href: "/gestion/statistiques" },
    { id: "inventaire-compta", icon: "▦", text: "Inventaire & compta", href: "/gestion/inventaire-compta" },
  ] },
  { label: "Réglages", items: [
    { id: "apparence", icon: "◑", text: "Apparence", href: "/gestion#apparence" },
    { id: "livraison", icon: "⇢", text: "Livraison", href: "/gestion#livraison" },
    { id: "reglages", icon: "⚙", text: "Réglages", href: "/gestion#reglages" },
  ] },
];

const TITRES = Object.fromEntries(NAV.flatMap((g) => g.items.map((i) => [i.id, { text: i.text, group: g.label }])));

function currentId(path, hash) {
  if (path !== "/gestion") {
    const hit = NAV.flatMap((g) => g.items).find((i) => i.href === path);
    return hit ? hit.id : "";
  }
  return (hash || "").replace("#", "") || "accueil";
}

export default function AdminShell({ children }) {
  const path = usePathname() || "/gestion";
  const router = useRouter();
  const [hash, setHash] = useState("");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [counts, setCounts] = useState({ prep: 0, unread: 0, replies: 0, reviews: 0 });

  useEffect(() => {
    const apply = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [path]);
  useEffect(() => { setOpen(false); }, [path, hash]);

  // Compteurs en direct (uniquement si le mot de passe est déjà en session).
  const loadCounts = useCallback(async () => {
    const key = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") : "";
    if (!key) return;
    const H = { headers: { "x-admin-key": key } };
    const j = (u) => fetch(u, H).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    // Boîte mail surveillée : l'assistant range les nouveaux e-mails clients dans
    // leur commande et prépare une réponse (limité côté serveur à 1 fois / 3 min).
    try { await fetch("/api/admin/inbox-sync", { method: "POST", ...H }); } catch { /* silencieux */ }
    const [o, u, p, r] = await Promise.all([j("/api/admin/orders"), j("/api/admin/bat?action=unread"), j("/api/admin/pending-replies"), j("/api/admin/reviews")]);
    setCounts({
      prep: (o?.orders || []).filter((x) => !x.test && (!x.status || x.status === "a_preparer")).length,
      unread: (u?.unread || []).length,
      replies: (p?.pending || []).length,
      reviews: (r?.reviews || []).filter((x) => !x.approved).length,
    });
  }, []);
  useEffect(() => { loadCounts(); const t = setInterval(loadCounts, 120000); return () => clearInterval(t); }, [loadCounts, path]);

  const cur = currentId(path, hash);
  const meta = TITRES[cur] || { text: "Gestion", group: "" };
  const totalTodo = counts.prep + counts.unread + counts.replies + counts.reviews;

  function search(e) {
    e.preventDefault();
    const s = q.trim(); if (!s) return;
    router.push(`/gestion/commandes?q=${encodeURIComponent(s)}`);
  }

  const nav = useMemo(() => NAV.map((g) => (
    <div className="ash-group" key={g.label}>
      <div className="ash-glabel">{g.label}</div>
      {g.items.map((i) => {
        const n = i.badge ? counts[i.badge] : 0;
        return (
          <Link key={i.id} href={i.href} className={`ash-item${cur === i.id ? " on" : ""}${i.accent ? " accent" : ""}`}>
            <span className="ash-ico" aria-hidden>{i.icon}</span>
            <span className="ash-txt">{i.text}</span>
            {n > 0 ? <span className="ash-badge">{n}</span> : null}
          </Link>
        );
      })}
    </div>
  )), [cur, counts]);

  return (
    <div className={`ash${open ? " open" : ""}`}>
      <aside className="ash-side">
        <div className="ash-brand">
          <div className="ash-logo">NiV</div>
          <div><div className="ash-brand-t">Niv Création</div><div className="ash-brand-s">Espace gestion</div></div>
        </div>
        <nav className="ash-nav">{nav}</nav>
        <div className="ash-side-foot">
          <a href="/" className="ash-foot-link" target="_blank" rel="noreferrer">↗ Voir la boutique</a>
        </div>
      </aside>
      <button type="button" className="ash-scrim" aria-label="Fermer le menu" onClick={() => setOpen(false)} />

      <div className="ash-main">
        <header className="ash-top">
          <button type="button" className="ash-burger" aria-label="Menu" onClick={() => setOpen((o) => !o)}>☰</button>
          <div className="ash-crumb">
            {meta.group ? <><span className="ash-crumb-g">{meta.group}</span><span className="ash-crumb-sep">›</span></> : null}
            <span className="ash-crumb-t">{meta.text}</span>
          </div>
          <form className="ash-search" onSubmit={search}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une commande, une cliente…" aria-label="Rechercher" />
          </form>
          <div className="ash-top-actions">
            {totalTodo > 0 ? <Link href="/gestion/commandes" className="ash-todo" title="À traiter">{totalTodo} à traiter</Link> : null}
            <Link href="/gestion#assistant" className="ash-assist">✦ Assistant</Link>
          </div>
        </header>
        <main className="ash-content">{children}</main>
      </div>
      <AdminToast />
    </div>
  );
}
