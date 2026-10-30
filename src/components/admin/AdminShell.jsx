"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import RechercheUniverselle from "./RechercheUniverselle";
import { ongletDuChemin } from "./ongletsGestion";
import AdminToast from "@/components/admin/AdminToast";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { lireAdminBack, sAbonnerAdminBack } from "@/components/admin/adminBack";

// =============================================================================
// SQUELETTE DE GESTION — maquette « Gestion moderne » v3 appliquée le 30/10/2026
// (artifact KipDFvam6ABJnV2JGc83PN, « mets en ligne la version B »).
// Barre latérale encre : 9 SECTIONS avec sous-onglets (les 37 écrans, rien de
// supprimé, toutes les adresses /gestion/* inchangées), raccourcis épinglés +
// écrans récents, menu réductible à ses icônes, icônes dessinées d'une seule
// famille, recherche ⌘K, barre du haut (fil d'Ariane, Assistant), 5 onglets en
// bas sur téléphone. Les anciens liens /gestion#id marchent toujours.
// =============================================================================

// Icônes au trait (viewBox 24), les mêmes que la maquette.
const ICONES = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  orders: "M9 3h6v3H9zM7 4.5H5V21h14V4.5h-2M8 11h8M8 15h5",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  users: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8M16 4.2a3.5 3.5 0 0 1 0 6.6",
  tag: "M3 12V4h8l10 10-8 8zM7.5 7.5h.01",
  box: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9",
  mega: "M3 10v4h4l6 4V6L7 10zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12",
  chart: "M4 20V11M10 20V5M16 20v-7M21 20H3",
  set: "M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M20 20l-4-4",
  pin: "M9 3h6l-1 6 3 3H7l3-3zM12 12v9",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2",
  menu: "M4 6h16M4 12h16M4 18h16",
  panel: "M4 4h16v16H4zM9 4v16",
  back: "M19 12H5M11 6l-6 6 6 6",
  x: "M6 6l12 12M18 6 6 18",
  shop: "M3 9l2-5h14l2 5M3 9h18v3a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 14v7h14v-7",
  chev: "M9 6l6 6-6 6",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  alert: "M12 3 2 20h20zM12 10v4M12 17h.01",
  star: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  truck: "M2 6h12v10H2zM14 9h4l3 3v4h-7M8 18.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0M19 18.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0",
  check: "M5 12l5 5 9-10",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  euro: "M18 6.5A7 7 0 1 0 18 17.5M4 10h10M4 14h10",
};
export function Ico({ n, className = "ash-ico" }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d={ICONES[n] || ICONES.more} /></svg>;
}

// Les 9 sections de la maquette (+ « Fêtes », rubrique ajoutée le 28/10, gardée à part).
// `id` des sous-onglets = les identifiants d'avant (ongletsGestion.js, adresses /gestion/*).
const SECTIONS = [
  { id: "accueil", t: "Aujourd'hui", ic: "home", tabs: [
    { id: "accueil", t: "Aujourd'hui", href: "/gestion" } ] },
  { id: "commandes", t: "Commandes", ic: "orders", badge: "prep", tabs: [
    { id: "file", t: "File de production", href: "/gestion/commandes", badge: "prep" },
    { id: "commandes", t: "Fiches complètes", href: "/gestion/fiches", badge: "unread" },
    { id: "atelier", t: "Atelier · fichiers à graver", href: "/gestion/atelier" },
    { id: "etiquettes", t: "Étiquettes d'adresse", href: "/gestion/etiquettes" },
    { id: "devis", t: "Devis & factures", href: "/gestion/devis" } ] },
  { id: "messagerie", t: "Messages", ic: "mail", badge: "messages", tabs: [
    { id: "boite-mail", t: "Boîte de réception", href: "/gestion/boite-mail" },
    { id: "assistant", t: "Réponses à valider", href: "/gestion/assistant", badge: "replies" },
    { id: "messages", t: "Envois & modèles", href: "/gestion/messages" } ] },
  { id: "clients", t: "Clients", ic: "users", badge: "reviews", tabs: [
    { id: "crm", t: "Clientes", href: "/gestion/crm" },
    { id: "avis", t: "Avis", href: "/gestion/avis", badge: "reviews" },
    { id: "fidelite", t: "Fidélité & cashback", href: "/gestion/fidelite" },
    { id: "favoris", t: "Favoris", href: "/gestion/favoris" },
    { id: "connexions", t: "Connexions", href: "/gestion/connexions" },
    { id: "restaurants", t: "Restaurants & bars", href: "/gestion/restaurants", badge: "pros" } ] },
  { id: "catalogue", t: "Catalogue", ic: "tag", tabs: [
    { id: "produits", t: "Produits & stock", href: "/gestion/produits" },
    { id: "visibilite", t: "Visibilité", href: "/gestion/visibilite" },
    { id: "categories", t: "Catégories & ordre", href: "/gestion/categories" },
    { id: "gravure", t: "Gravure", href: "/gestion/gravure" },
    { id: "reglages-produits", t: "Réglage des aperçus", href: "/gestion/reglages" },
    { id: "tailles", t: "Tailles & coûts", href: "/gestion/tailles-conseillees" },
    { id: "sante", t: "Santé du catalogue", href: "/gestion/sante" } ] },
  { id: "stock", t: "Stock & achats", ic: "box", tabs: [
    { id: "materiel", t: "Matériel", href: "/gestion/materiel" },
    { id: "packaging", t: "Emballages vendus", href: "/gestion/emballages" },
    { id: "achats", t: "Achats & factures", href: "/gestion/achats" } ] },
  { id: "fetes", t: "Fêtes", ic: "spark", tabs: [
    { id: "fetes", t: "Fêtes de l'année", href: "/gestion/fetes" } ] },
  { id: "marketing", t: "Marketing", ic: "mega", tabs: [
    { id: "newsletter", t: "Newsletter", href: "/gestion/newsletter" },
    { id: "promos", t: "Codes promo", href: "/gestion/promotions" },
    { id: "offre-gravure", t: "Offre gravure offerte", href: "/gestion/offre-gravure" },
    { id: "etude-marche", t: "Étude de marché", href: "/gestion/etude-marche" } ] },
  { id: "finances", t: "Finances", ic: "chart", tabs: [
    { id: "benefices", t: "Bénéfices", href: "/gestion/benefices" },
    { id: "stats", t: "Ventes", href: "/gestion/ventes" },
    { id: "visiteurs", t: "Visiteurs", href: "/gestion/statistiques" },
    { id: "inventaire-compta", t: "Inventaire & compta", href: "/gestion/inventaire-compta" } ] },
  { id: "reglages", t: "Réglages", ic: "set", tabs: [
    { id: "reglages", t: "Boutique", href: "/gestion/parametres" },
    { id: "apparence", t: "Apparence du site", href: "/gestion/apparence" },
    { id: "livraison", t: "Livraison", href: "/gestion/livraison" },
    { id: "agents", t: "Équipe d'agents", href: "/gestion/agents" } ] },
];
const ECRANS = SECTIONS.flatMap((s) => s.tabs.map((t) => ({ ...t, section: s.id, group: s.t, icon: s.ic })));
const PAR_ID = Object.fromEntries(ECRANS.map((e) => [e.id, e]));
const SECTION_DE = Object.fromEntries(ECRANS.map((e) => [e.id, e.section]));

// Les 5 onglets du bas (TÉLÉPHONE UNIQUEMENT) : l'essentiel au pouce, le reste derrière « Plus ».
const TABS = [
  { id: "accueil", ic: "home", text: "Aujourd'hui", href: "/gestion" },
  { id: "commandes", ic: "orders", text: "Commandes", href: "/gestion/commandes", badge: "prep" },
  { id: "messagerie", ic: "mail", text: "Messages", href: "/gestion/boite-mail", badge: "messages" },
  { id: "catalogue", ic: "tag", text: "Produits", href: "/gestion/produits" },
];
// Raccourcis par défaut (la maquette) ; il les change d'un clic sur « Épingler ».
const PINS_DEFAUT = ["file", "etiquettes", "materiel"];
const STORE = "niv-gestion-menu";

function currentId(path, hash) {
  // Ancienne ancre (/gestion#avis) encore présente : elle prime.
  const h = (hash || "").replace("#", "");
  if (path === "/gestion" && h) return h;
  const onglet = ongletDuChemin(path);
  if (onglet) return onglet;
  const hit = ECRANS.find((i) => i.href === path);
  return hit ? hit.id : "";
}

function lireStore() {
  try { return JSON.parse(localStorage.getItem(STORE) || "{}") || {}; } catch { return {}; }
}
function ecrireStore(patch) {
  try { localStorage.setItem(STORE, JSON.stringify({ ...lireStore(), ...patch })); } catch { /* stockage indisponible */ }
}

export default function AdminShell({ children }) {
  const path = usePathname() || "/gestion";
  const router = useRouter();
  const [hash, setHash] = useState("");
  const [open, setOpen] = useState(false);          // tiroir (téléphone)
  const [mini, setMini] = useState(false);          // menu réduit à ses icônes (ordinateur)
  const [deplie, setDeplie] = useState({});          // sections dépliées à la main
  const [pins, setPins] = useState(PINS_DEFAUT);
  const [recents, setRecents] = useState([]);
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

  // Raccourcis, écrans récents et menu réduit : retenus sur cet appareil.
  useEffect(() => {
    const s = lireStore();
    if (Array.isArray(s.pins)) setPins(s.pins.filter((id) => PAR_ID[id]));
    if (Array.isArray(s.recents)) setRecents(s.recents.filter((id) => PAR_ID[id]));
    if (s.mini) setMini(true);
  }, []);

  // Retour « dans la page » déclaré par l'écran courant (un e-mail ouvert…).
  const back = useSyncExternalStore(sAbonnerAdminBack, lireAdminBack, () => null);

  // Compteurs en direct (uniquement si le mot de passe est déjà en session).
  // 02/10/2026 : UN petit appel (chiffres seulement, mis en cache 30 s côté serveur)
  // au lieu de 6 routes complètes + une lecture Gmail à chaque clic de menu.
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
  const ecran = PAR_ID[cur];
  const secId = SECTION_DE[cur] || "";
  const section = SECTIONS.find((s) => s.id === secId);
  const meta = ecran ? { text: ecran.t, group: ecran.group } : { text: "Gestion", group: "" };
  const cnt = { ...counts, messages: counts.unread + counts.replies };
  const totalTodo = counts.prep + counts.unread + counts.replies + counts.reviews + (counts.pros || 0);

  // Écrans récents : l'écran ouvert passe en tête (hors accueil).
  useEffect(() => {
    if (!cur || cur === "accueil" || !PAR_ID[cur]) return;
    setRecents((r) => {
      const n = [cur, ...r.filter((x) => x !== cur)].slice(0, 8);
      ecrireStore({ recents: n });
      return n;
    });
  }, [cur]);

  function togglePin(id) {
    setPins((p) => {
      const n = p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(-6);
      ecrireStore({ pins: n });
      return n;
    });
  }
  function toggleMini() { setMini((m) => { ecrireStore({ mini: !m }); return !m; }); }

  // Sur téléphone, la flèche ‹ remplace le ☰ dès qu'on est descendu d'un cran :
  // soit la page a ouvert quelque chose par-dessus elle (back), soit on n'est
  // pas sur une des destinations de la barre du bas.
  const estRacine = TABS.some((t) => t.id === secId && PAR_ID[cur]?.href === t.href);
  const retour = back
    ? { label: back.label, go: back.fn }
    : (!estRacine ? { label: meta.group || "Gestion", go: () => router.push("/gestion") } : null);

  // 🔴 Corrigé le 02/10/2026 : sur /gestion, un lien vers un autre onglet (/gestion#avis…)
  // changeait l'adresse SANS prévenir la page — le routeur de Next ne déclenche pas
  // l'événement « hashchange ». On change donc l'ancre à la main.
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
  const ecrans = useMemo(() => ECRANS.map((e) => ({ id: e.id, text: e.t, href: e.href, group: e.group, icon: <Ico n={e.icon} className="ash-ico" /> })), []);
  function allerA(href) {
    setRecherche(false);
    const onglet = !href.includes("#") && !href.includes("?") ? ongletDuChemin(href) : "";
    if (onglet && window.__nivGestion) { window.dispatchEvent(new CustomEvent("niv-onglet", { detail: onglet })); return; }
    const i = href.indexOf("#");
    if (i >= 0 && href.slice(0, i) === path) { window.location.hash = href.slice(i); return; }
    router.push(href);
  }

  const Badge = ({ n, red }) => (n > 0 ? <span className={`ash-badge${red ? " red" : ""}`}>{n > 99 ? "99+" : n}</span> : null);
  const sansAccent = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  // Le menu : sections → sous-onglets. Sur téléphone, un filtre d'écran (37 entrées au pouce, c'est long).
  const f = sansAccent(filtre.trim());
  const nav = f
    ? (() => {
        const hits = ECRANS.filter((e) => sansAccent(e.t).includes(f) || sansAccent(e.group).includes(f));
        if (!hits.length) return <div className="ash-vide">Aucun écran à ce nom.</div>;
        return hits.map((e) => (
          <Link key={e.id} href={e.href} onClick={(ev) => allerAncre(ev, e.href)} className={`ash-item${cur === e.id ? " on" : ""}`}>
            <Ico n={e.icon} /><span className="ash-txt">{e.t}<small>{e.group}</small></span><Badge n={e.badge ? cnt[e.badge] : 0} />
          </Link>
        ));
      })()
    : SECTIONS.map((s) => {
        const on = s.id === secId;
        const multi = s.tabs.length > 1;
        const ouvert = multi && (on || deplie[s.id]);
        const premier = s.tabs[0];
        return (
          <div className={`ash-sec${on ? " on" : ""}`} key={s.id}>
            <div className="ash-secrow">
              <Link href={premier.href} onClick={(e) => allerAncre(e, premier.href)} className={`ash-item${on ? " on" : ""}`} title={s.t}>
                <Ico n={s.ic} /><span className="ash-txt">{s.t}</span><Badge n={s.badge ? cnt[s.badge] : 0} />
              </Link>
              {multi ? (
                <button type="button" className={`ash-chev${ouvert ? " open" : ""}`} aria-label={ouvert ? `Replier ${s.t}` : `Déplier ${s.t}`}
                  onClick={() => setDeplie((d) => ({ ...d, [s.id]: !ouvert }))}><Ico n="chev" /></button>
              ) : null}
            </div>
            {ouvert ? (
              <div className="ash-sub">
                {s.tabs.map((t) => (
                  <Link key={t.id} href={t.href} onClick={(e) => allerAncre(e, t.href)} className={cur === t.id ? "on" : ""}>
                    <span>{t.t}</span><Badge n={t.badge ? cnt[t.badge] : 0} />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      });

  const raccourcis = [
    ...pins.map((id) => ({ id, ic: "pin" })),
    ...recents.filter((id) => !pins.includes(id) && id !== cur).slice(0, 3).map((id) => ({ id, ic: "clock" })),
  ].filter((r) => PAR_ID[r.id]);
  const epingle = pins.includes(cur);

  return (
    <div className={`ash${open ? " open" : ""}${mini ? " mini" : ""}`}>
      <aside className="ash-side">
        <div className="ash-brand">
          {/* Le logo du site, servi tel quel (jamais redessiné). */}
          <img className="ash-logo" src="/logo-niv-creation.jpg" alt="Niv Création" />
          <div className="ash-brand-txt"><div className="ash-brand-t">Gestion</div><div className="ash-brand-s">nivcreation.fr</div></div>
          <button type="button" className="ash-close" aria-label="Fermer le menu" onClick={() => setOpen(false)}><Ico n="x" /></button>
        </div>
        <button type="button" className="ash-sfind" onClick={() => { setOpen(false); setRecherche(true); }} aria-label="Rechercher (Ctrl K)">
          <Ico n="search" /><span className="ash-txt">Rechercher…</span><kbd>Ctrl K</kbd>
        </button>
        <div className="ash-find">
          <Ico n="search" />
          <input value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder="Trouver un écran…" aria-label="Trouver un écran" />
          {filtre ? <button type="button" onClick={() => setFiltre("")} aria-label="Effacer"><Ico n="x" /></button> : null}
        </div>
        {!f && raccourcis.length ? (
          <>
            <div className="ash-glabel">Raccourcis</div>
            <nav className="ash-pins" aria-label="Raccourcis">
              {raccourcis.map((r) => {
                const e = PAR_ID[r.id];
                return (
                  <Link key={r.id} href={e.href} onClick={(ev) => allerAncre(ev, e.href)} className={`ash-item${cur === e.id ? " on" : ""}`} title={e.t}>
                    <Ico n={r.ic} /><span className="ash-txt">{e.t}</span><Badge n={e.badge ? cnt[e.badge] : 0} />
                  </Link>
                );
              })}
            </nav>
          </>
        ) : null}
        {!f ? <div className="ash-glabel">Boutique</div> : null}
        <nav className="ash-nav">{nav}</nav>
        <div className="ash-side-foot">
          <a href="/" className="ash-item" target="_blank" rel="noreferrer" title="Voir la boutique"><Ico n="shop" /><span className="ash-txt">Voir la boutique</span></a>
          <button type="button" className="ash-item ash-collapse" onClick={toggleMini} title={mini ? "Agrandir le menu" : "Réduire le menu"}>
            <Ico n="panel" /><span className="ash-txt">{mini ? "Agrandir le menu" : "Réduire le menu"}</span>
          </button>
        </div>
      </aside>
      <button type="button" className="ash-scrim" aria-label="Fermer le menu" onClick={() => setOpen(false)} />

      <div className="ash-main">
        <header className="ash-top">
          {retour
            ? <button type="button" className="ash-back" aria-label="Revenir" onClick={retour.go}><Ico n="back" /></button>
            : <button type="button" className="ash-burger" aria-label="Menu" onClick={() => setOpen((o) => !o)}><Ico n="menu" /></button>}
          <div className="ash-crumb">
            {meta.group && meta.group !== meta.text ? <><span className="ash-crumb-g">{meta.group}</span><span className="ash-crumb-sep">›</span></> : null}
            <span className="ash-crumb-t">{meta.text}</span>
            {retour?.label ? <span className="ash-crumb-back">‹ {retour.label}</span> : null}
          </div>
          <button type="button" className="ash-search ash-search-btn" onClick={() => setRecherche(true)} aria-label="Rechercher (Ctrl K)">
            <span><Ico n="search" /> Rechercher une commande, une cliente, un produit…</span><kbd>Ctrl K</kbd>
          </button>
          <div className="ash-top-actions">
            <button type="button" className="ash-ibtn ash-loupe" onClick={() => setRecherche(true)} aria-label="Rechercher"><Ico n="search" /></button>
            {ecran && cur !== "accueil" ? (
              <button type="button" className={`ash-ibtn ash-pin${epingle ? " on" : ""}`} onClick={() => togglePin(cur)} title={epingle ? "Retirer des raccourcis" : "Épingler dans les raccourcis"} aria-label={epingle ? "Retirer des raccourcis" : "Épingler dans les raccourcis"}>
                <Ico n="pin" /><span>{epingle ? "Épinglé" : "Épingler"}</span>
              </button>
            ) : null}
            {totalTodo > 0 ? <Link href="/gestion/commandes" className="ash-todo" title="À traiter">{totalTodo} à traiter</Link> : null}
            <Link href="/gestion/assistant" onClick={(e) => allerAncre(e, "/gestion/assistant")} className="ash-assist"><Ico n="spark" /><span>Assistant</span></Link>
          </div>
        </header>
        {section && section.tabs.length > 1 ? (
          <nav className="ash-subs" aria-label={`Écrans de ${section.t}`}>
            {section.tabs.map((t) => (
              <Link key={t.id} href={t.href} onClick={(e) => allerAncre(e, t.href)} className={`ash-subtab${cur === t.id ? " on" : ""}`}>
                {t.t}<Badge n={t.badge ? cnt[t.badge] : 0} />
              </Link>
            ))}
          </nav>
        ) : null}
        <main className="ash-content">{children}</main>
        <nav className="ash-tabs" aria-label="Navigation principale">
          {TABS.map((t) => {
            const n = t.badge ? cnt[t.badge] : 0;
            return (
              <Link key={t.id} href={t.href} onClick={(e) => allerAncre(e, t.href)} className={`ash-tab${secId === t.id ? " on" : ""}`}>
                <Ico n={t.ic} />
                <span>{t.text}</span>
                {n > 0 ? <b>{n > 99 ? "99+" : n}</b> : null}
              </Link>
            );
          })}
          <button type="button" className={`ash-tab${open ? " on" : ""}`} onClick={() => setOpen((o) => !o)}>
            <Ico n="menu" />
            <span>Plus</span>
          </button>
        </nav>
      </div>
      <RechercheUniverselle ouvert={recherche} onFermer={() => setRecherche(false)} ecrans={ecrans} onAller={allerA} />
      <AdminToast />
    </div>
  );
}
