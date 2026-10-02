"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import RechercheUniverselle from "./RechercheUniverselle";
import { ongletDuChemin } from "./ongletsGestion";
import AdminToast from "@/components/admin/AdminToast";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { lireAdminBack, sAbonnerAdminBack } from "@/components/admin/adminBack";

// =============================================================================
// SQUELETTE MODERNE DE GESTION — barre latérale + barre du haut, sur TOUTES les
// pages /gestion/*. Un seul menu, des compteurs en direct, une recherche
// globale, l'assistant à un clic, un tiroir sur téléphone.
// Les onglets de l'accueil Gestion ont chacun leur adresse (/gestion/avis… — ongletsGestion.js) ;
// les anciens liens /gestion#id marchent toujours.
// =============================================================================
const NAV = [
  { label: "Pilotage", items: [
    { id: "accueil", icon: "◫", text: "Tableau de bord", href: "/gestion" },
    { id: "assistant", icon: "✦", text: "Assistant", href: "/gestion/assistant", badge: "replies", accent: true },
  ] },
  { label: "Commandes", items: [
    { id: "file", icon: "▤", text: "File de production", href: "/gestion/commandes", badge: "prep" },
    { id: "commandes", icon: "▣", text: "Fiches complètes", href: "/gestion/fiches", badge: "unread" },
    { id: "atelier", icon: "◈", text: "Atelier · fichiers", href: "/gestion/atelier" },
    { id: "devis", icon: "▥", text: "Devis & factures", href: "/gestion/devis" },
  ] },
  { label: "Clients", items: [
    { id: "crm", icon: "◉", text: "Clients (CRM)", href: "/gestion/crm" },
    { id: "restaurants", icon: "◆", text: "Restaurants & bars", href: "/gestion/restaurants", badge: "pros" },
    { id: "avis", icon: "★", text: "Avis", href: "/gestion/avis", badge: "reviews" },
    { id: "fidelite", icon: "◇", text: "Fidélité & cashback", href: "/gestion/fidelite" },
    { id: "favoris", icon: "♥", text: "Favoris des clientes", href: "/gestion/favoris" },
    { id: "connexions", icon: "⚿", text: "Connexions", href: "/gestion/connexions" },
    { id: "messages", icon: "✉", text: "Messages", href: "/gestion/messages" },
    { id: "boite-mail", icon: "▨", text: "Boîte mail", href: "/gestion/boite-mail" },
  ] },
  { label: "Catalogue", items: [
    { id: "produits", icon: "◧", text: "Produits & stock", href: "/gestion/produits" },
    { id: "categories", icon: "≣", text: "Catégories & ordre", href: "/gestion/categories" },
    { id: "packaging", icon: "▢", text: "Emballages", href: "/gestion/emballages" },
    { id: "gravure", icon: "✎", text: "Gravure", href: "/gestion/gravure" },
    { id: "reglages-produits", icon: "⚙", text: "Réglages produits", href: "/gestion/reglages" },
    { id: "tailles", icon: "⌗", text: "Tailles & coûts", href: "/gestion/tailles-conseillees" },
    { id: "sante", icon: "◐", text: "Santé du catalogue", href: "/gestion/sante" },
    { id: "achats", icon: "⇩", text: "Achats & factures", href: "/gestion/achats" },
  ] },
  { label: "Marketing", items: [
    { id: "newsletter", icon: "▷", text: "Newsletter", href: "/gestion/newsletter" },
    { id: "promos", icon: "%", text: "Promotions", href: "/gestion/promotions" },
    { id: "offre-gravure", icon: "✦", text: "Offre gravure offerte", href: "/gestion/offre-gravure" },
    { id: "agents", icon: "⬡", text: "Équipe d'agents", href: "/gestion/agents" },
    { id: "etude-marche", icon: "◎", text: "Étude de marché", href: "/gestion/etude-marche" },
  ] },
  { label: "Finances", items: [
    { id: "benefices", icon: "€", text: "Bénéfices", href: "/gestion/benefices" },
    { id: "stats", icon: "▮", text: "Ventes", href: "/gestion/ventes" },
    { id: "visiteurs", icon: "↗", text: "Visiteurs", href: "/gestion/statistiques" },
    { id: "inventaire-compta", icon: "▦", text: "Inventaire & compta", href: "/gestion/inventaire-compta" },
  ] },
  { label: "Réglages", items: [
    { id: "apparence", icon: "◑", text: "Apparence", href: "/gestion/apparence" },
    { id: "livraison", icon: "⇢", text: "Livraison", href: "/gestion/livraison" },
    { id: "reglages", icon: "⚙", text: "Réglages", href: "/gestion/parametres" },
  ] },
];

// Barre d'onglets du bas (TÉLÉPHONE UNIQUEMENT). Les grandes applications de
// gestion (Shopify, Etsy Seller) gardent 4-5 destinations toujours visibles et
// rangent le reste derrière « Plus » : on atteint l'essentiel au pouce, en un
// seul geste, au lieu de deux avec un menu caché.
const TABS = [
  { id: "accueil", icon: "\u25eb", text: "Accueil", href: "/gestion" },
  { id: "file", icon: "\u25a4", text: "Commandes", href: "/gestion/commandes", badge: "prep" },
  { id: "boite-mail", icon: "\u2709", text: "Messages", href: "/gestion/boite-mail", badge: "messages" },
  { id: "produits", icon: "\u25e7", text: "Produits", href: "/gestion/produits" },
];

const TITRES = Object.fromEntries(NAV.flatMap((g) => g.items.map((i) => [i.id, { text: i.text, group: g.label }])));

function currentId(path, hash) {
  // Ancienne ancre (/gestion#avis) encore présente : elle prime.
  const h = (hash || "").replace("#", "");
  if (path === "/gestion" && h) return h;
  const onglet = ongletDuChemin(path);
  if (onglet) return onglet;
  const hit = NAV.flatMap((g) => g.items).find((i) => i.href === path);
  return hit ? hit.id : "";
}

export default function AdminShell({ children }) {
  const path = usePathname() || "/gestion";
  const router = useRouter();
  const [hash, setHash] = useState("");
  const [open, setOpen] = useState(false);
  const [filtre, setFiltre] = useState(""); // recherche d'écran dans le menu (téléphone)
  const [recherche, setRecherche] = useState(false); // recherche universelle (Ctrl+K)
  const [counts, setCounts] = useState({ prep: 0, unread: 0, replies: 0, reviews: 0, pros: 0 });

  useEffect(() => {
    const apply = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [path]);
  useEffect(() => { setOpen(false); setFiltre(""); }, [path, hash]);

  // Retour « dans la page » déclaré par l'écran courant (un e-mail ouvert…).
  const back = useSyncExternalStore(sAbonnerAdminBack, lireAdminBack, () => null);

  // Compteurs en direct (uniquement si le mot de passe est déjà en session).
  // 02/10/2026 : UN petit appel (chiffres seulement, mis en cache 30 s côté serveur)
  // au lieu de 6 routes complètes + une lecture Gmail à chaque clic de menu — c'est ce
  // qui rendait les changements d'écran lents (« il a du mal, je dois fermer et rouvrir »).
  const loadCounts = useCallback(async () => {
    const key = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") : "";
    if (!key) return;
    const H = { headers: { "x-admin-key": key } };
    // Boîte mail surveillée : lancée en arrière-plan, au plus une fois toutes les
    // 5 minutes depuis ce navigateur, et JAMAIS attendue (le serveur se limite aussi).
    try {
      const last = Number(sessionStorage.getItem("niv-inbox-sync") || 0);
      if (Date.now() - last > 5 * 60 * 1000) {
        sessionStorage.setItem("niv-inbox-sync", String(Date.now()));
        fetch("/api/admin/inbox-sync", { method: "POST", ...H }).catch(() => {});
        // Battement : tâches de fond (réponses des clientes dans les commandes…).
        fetch("/api/heartbeat", { cache: "no-store" }).catch(() => {});
      }
    } catch { /* stockage indisponible : on saute la synchro */ }
    try {
      const r = await fetch("/api/admin/counts", H);
      if (!r.ok) return;
      const c = await r.json();
      setCounts({ prep: c.prep || 0, unread: c.unread || 0, replies: c.replies || 0, reviews: c.reviews || 0, pros: c.pros || 0 });
    } catch { /* réseau : on garde les derniers chiffres */ }
  }, []);
  // Une fois au chargement puis toutes les 2 min — plus à chaque changement d'écran.
  useEffect(() => { loadCounts(); const t = setInterval(loadCounts, 120000); return () => clearInterval(t); }, [loadCounts]);

  const cur = currentId(path, hash);
  const meta = TITRES[cur] || { text: "Gestion", group: "" };
  const totalTodo = counts.prep + counts.unread + counts.replies + counts.reviews + (counts.pros || 0);
  // Pastilles de la barre du bas ("messages" = tout ce qui attend une réponse).
  const tabCount = { prep: counts.prep, messages: counts.unread + counts.replies };

  // Sur téléphone, la flèche ‹ remplace le ☰ dès qu'on est descendu d'un cran :
  // soit la page a ouvert quelque chose par-dessus elle (back), soit on n'est
  // pas sur une des destinations de la barre du bas.
  const estRacine = TABS.some((t) => t.id === cur);
  const retour = back
    ? { label: back.label, go: back.fn }
    : (!estRacine ? { label: meta.group || "Gestion", go: () => router.push("/gestion") } : null);

  // 🔴 Corrigé le 02/10/2026 (« je clique pour changer de catégorie, ça marche pas, je dois
  // fermer et rouvrir ») : sur /gestion, un lien vers un autre onglet (/gestion#avis…)
  // changeait l'adresse SANS prévenir la page — le routeur de Next ne déclenche pas
  // l'événement « hashchange ». On change donc l'ancre à la main : l'onglet s'ouvre
  // aussitôt, et la flèche « retour » du téléphone revient à l'onglet d'avant.
  function allerAncre(e, href) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // ouverture dans un nouvel onglet
    const h = String(href || "");
    // Écran de l'accueil Gestion déjà ouvert : on change d'onglet SANS recharger la page.
    const onglet = !h.includes("#") && !h.includes("?") ? ongletDuChemin(h) : "";
    if (onglet && typeof window !== "undefined" && window.__nivGestion) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("niv-onglet", { detail: onglet }));
      setOpen(false);
      return;
    }
    const i = h.indexOf("#");
    if (i < 0 || h.slice(0, i) !== path) return; // autre page : navigation normale
    e.preventDefault();
    const ancre = h.slice(i);
    if (window.location.hash === ancre) window.dispatchEvent(new HashChangeEvent("hashchange"));
    else window.location.hash = ancre; // déclenche « hashchange » (page + menu se mettent à jour)
    setOpen(false);
  }

  // Recherche universelle : Ctrl+K / ⌘K, ou « / » hors d'un champ de saisie.
  useEffect(() => {
    const k = (e) => {
      const champ = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || "") || e.target?.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setRecherche(true); }
      else if (e.key === "/" && !champ) { e.preventDefault(); setRecherche(true); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  const ecrans = useMemo(() => NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))), []);
  function allerA(href) {
    setRecherche(false);
    const onglet = !href.includes("#") && !href.includes("?") ? ongletDuChemin(href) : "";
    if (onglet && window.__nivGestion) { window.dispatchEvent(new CustomEvent("niv-onglet", { detail: onglet })); return; }
    const i = href.indexOf("#");
    if (i >= 0 && href.slice(0, i) === path) { window.location.hash = href.slice(i); return; }
    router.push(href);
  }

  // Recherche d'écran : 29 entrées, c'est trop long à faire défiler au pouce.
  const nav = useMemo(() => {
    const f = filtre.trim().toLowerCase();
    const sansAccent = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const groupes = NAV
      .map((g) => ({ ...g, items: g.items.filter((i) => !f || sansAccent(i.text.toLowerCase()).includes(sansAccent(f))) }))
      .filter((g) => g.items.length);
    if (!groupes.length) return <div className="ash-vide">Aucun écran à ce nom.</div>;
    return groupes.map((g) => (
      <div className="ash-group" key={g.label}>
        <div className="ash-glabel">{g.label}</div>
        {g.items.map((i) => {
          const n = i.badge ? counts[i.badge] : 0;
          return (
            <Link key={i.id} href={i.href} onClick={(e) => allerAncre(e, i.href)} className={`ash-item${cur === i.id ? " on" : ""}${i.accent ? " accent" : ""}`}>
              <span className="ash-ico" aria-hidden>{i.icon}</span>
              <span className="ash-txt">{i.text}</span>
              {n > 0 ? <span className="ash-badge">{n}</span> : null}
            </Link>
          );
        })}
      </div>
    ));
  }, [cur, counts, filtre, path]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`ash${open ? " open" : ""}`}>
      <aside className="ash-side">
        <div className="ash-brand">
          <div className="ash-logo">NiV</div>
          <div className="ash-brand-txt"><div className="ash-brand-t">Niv Création</div><div className="ash-brand-s">Espace gestion</div></div>
          <button type="button" className="ash-close" aria-label="Fermer le menu" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="ash-find">
          <span aria-hidden>⌕</span>
          <input value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder="Rechercher un écran…" aria-label="Rechercher un écran" />
          {filtre ? <button type="button" onClick={() => setFiltre("")} aria-label="Effacer">✕</button> : null}
        </div>
        <nav className="ash-nav">{nav}</nav>
        <div className="ash-side-foot">
          <a href="/" className="ash-foot-link" target="_blank" rel="noreferrer">↗ Voir la boutique</a>
        </div>
      </aside>
      <button type="button" className="ash-scrim" aria-label="Fermer le menu" onClick={() => setOpen(false)} />

      <div className="ash-main">
        <header className="ash-top">
          {retour
            ? <button type="button" className="ash-back" aria-label="Revenir" onClick={retour.go}>‹</button>
            : <button type="button" className="ash-burger" aria-label="Menu" onClick={() => setOpen((o) => !o)}>☰</button>}
          <div className="ash-crumb">
            {meta.group ? <><span className="ash-crumb-g">{meta.group}</span><span className="ash-crumb-sep">›</span></> : null}
            <span className="ash-crumb-t">{meta.text}</span>
            {retour?.label ? <span className="ash-crumb-back">‹ {retour.label}</span> : null}
          </div>
          <button type="button" className="ash-search ash-search-btn" onClick={() => setRecherche(true)} aria-label="Rechercher (Ctrl K)">
            <span>⌕ Rechercher une commande, une cliente, un produit…</span><kbd>Ctrl K</kbd>
          </button>
          <div className="ash-top-actions">
            <button type="button" className="ash-loupe" onClick={() => setRecherche(true)} aria-label="Rechercher">⌕</button>
            {totalTodo > 0 ? <Link href="/gestion/commandes" className="ash-todo" title="À traiter">{totalTodo} à traiter</Link> : null}
            <Link href="/gestion/assistant" onClick={(e) => allerAncre(e, "/gestion/assistant")} className="ash-assist">✦ Assistant</Link>
          </div>
        </header>
        <main className="ash-content">{children}</main>
        <nav className="ash-tabs" aria-label="Navigation principale">
          {TABS.map((t) => {
            const n = t.badge ? tabCount[t.badge] : 0;
            return (
              <Link key={t.id} href={t.href} onClick={(e) => allerAncre(e, t.href)} className={`ash-tab${cur === t.id ? " on" : ""}`}>
                <i aria-hidden>{t.icon}</i>
                <span>{t.text}</span>
                {n > 0 ? <b>{n > 99 ? "99+" : n}</b> : null}
              </Link>
            );
          })}
          <button type="button" className={`ash-tab${open ? " on" : ""}`} onClick={() => setOpen((o) => !o)}>
            <i aria-hidden>☰</i>
            <span>Plus</span>
          </button>
        </nav>
      </div>
      <RechercheUniverselle ouvert={recherche} onFermer={() => setRecherche(false)} ecrans={ecrans} onAller={allerA} />
      <AdminToast />
    </div>
  );
}
