"use client";

import { usePathname } from "next/navigation";

// Barre latérale de gestion PARTAGÉE (affichée sur les sous-pages : Atelier, CRM,
// Emballages…) pour que le menu ne disparaisse jamais. Les onglets internes de la
// page /gestion sont des liens vers /gestion#id (la page les ouvre au chargement).
const GROUPS = [
  { label: "", items: [{ text: "🏠 Accueil", href: "/gestion#accueil" }] },
  { label: "Commandes", items: [
    { text: "Commandes", href: "/gestion#commandes" },
    { text: "🥃 Atelier (à graver)", href: "/gestion/atelier" },
    { text: "Devis / Factures", href: "/gestion#devis" },
  ] },
  { label: "Clients", items: [
    { text: "👥 CRM — clients", href: "/gestion/crm" },
    { text: "✉️ Messages (programmés + auto)", href: "/gestion/messages" },
  ] },
  { label: "Catalogue", items: [
    { text: "Produits & Stock", href: "/gestion#produits" },
    { text: "🗂️ Catégories & ordre", href: "/gestion#categories" },
    { text: "📦 Packaging & emballages", href: "/gestion/emballages" },
    { text: "📐 Tailles & coûts conseillés", href: "/gestion/tailles-conseillees" },
    { text: "Gravure", href: "/gestion#gravure" },
    { text: "⚙️ Réglages produits (cristaux, couverts)", href: "/gestion/reglages" },
  ] },
  { label: "Finances", items: [
    { text: "💰 Bénéfices", href: "/gestion/benefices" },
    { text: "📦 Inventaire & Compta", href: "/gestion/inventaire-compta" },
    { text: "Statistiques (ventes)", href: "/gestion#stats" },
    { text: "📈 Visiteurs & trafic", href: "/gestion/statistiques" },
  ] },
  { label: "Marketing", items: [
    { text: "Promotions", href: "/gestion#promos" },
    { text: "Avis", href: "/gestion#avis" },
    { text: "Newsletter", href: "/gestion#newsletter" },
    { text: "📊 Étude de marché", href: "/gestion/etude-marche" },
  ] },
  { label: "Assistant & IA", items: [
    { text: "Assistant", href: "/gestion#assistant" },
    { text: "Équipe d'agents", href: "/gestion#agents" },
    { text: "✉️ Boîte mail (agent)", href: "/gestion/boite-mail" },
  ] },
  { label: "Réglages", items: [
    { text: "Apparence", href: "/gestion#apparence" },
    { text: "🚚 Livraison (tarifs)", href: "/gestion#livraison" },
    { text: "Réglages", href: "/gestion#reglages" },
  ] },
];

export default function AdminSidebar() {
  const path = usePathname();
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <span className="eyebrow">Espace gestion</span>
        <h2>Mon site</h2>
      </div>
      <nav className="admin-sidebar-nav">
        {GROUPS.map((group, gi) => (
          <div className="admin-side-group" key={group.label || gi}>
            {group.label && <span className="admin-side-label">{group.label}</span>}
            {group.items.map((it) => {
              const isPage = it.href.startsWith("/gestion/");
              const active = isPage && path === it.href;
              return (
                <a key={it.href} href={it.href} className={`admin-side-item${active ? " active" : ""}`} style={{ textDecoration: "none" }}>
                  {it.text}
                </a>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
