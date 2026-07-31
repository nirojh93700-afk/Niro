"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

// Barre latérale de gestion PARTAGÉE (affichée sur les sous-pages : Atelier, CRM,
// Emballages…) pour que le menu ne disparaisse jamais. Les onglets internes de la
// page /gestion sont des liens vers /gestion#id (la page les ouvre au chargement).
const GROUPS = [
  { label: "", items: [{ text: "🏠 Accueil", href: "/gestion#accueil" }] },
  { label: "Commandes", items: [
    { text: "🧾 Commandes", href: "/gestion#commandes" },
    { text: "🥃 Atelier (à graver)", href: "/gestion/atelier" },
    { text: "📄 Devis / Factures", href: "/gestion#devis" },
  ] },
  { label: "Clients & fidélité", items: [
    { text: "👥 CRM — clients", href: "/gestion/crm" },
    { text: "🎁 Fidélité & cashback", href: "/gestion/fidelite" },
    { text: "✉️ Messages (programmés + auto)", href: "/gestion/messages" },
  ] },
  { label: "Catalogue", items: [
    { text: "🏷️ Produits & Stock", href: "/gestion#produits" },
    { text: "🗂️ Catégories & ordre", href: "/gestion#categories" },
    { text: "📦 Packaging & emballages", href: "/gestion/emballages" },
    { text: "🛡️ Santé du catalogue", href: "/gestion/sante" },
    { text: "📐 Tailles & coûts conseillés", href: "/gestion/tailles-conseillees" },
    { text: "✍️ Gravure", href: "/gestion#gravure" },
    { text: "⚙️ Réglages produits (cristaux, couverts)", href: "/gestion/reglages" },
  ] },
  { label: "Marketing", items: [
    { text: "🎟️ Promotions & ambassadeurs", href: "/gestion#promos" },
    { text: "⭐ Avis", href: "/gestion#avis" },
    { text: "📣 Newsletter", href: "/gestion#newsletter" },
    { text: "📊 Étude de marché", href: "/gestion/etude-marche" },
  ] },
  { label: "Finances & statistiques", items: [
    { text: "💰 Bénéfices", href: "/gestion/benefices" },
    { text: "📦 Inventaire & Compta", href: "/gestion/inventaire-compta" },
    { text: "📊 Statistiques (ventes)", href: "/gestion#stats" },
    { text: "📈 Visiteurs & trafic", href: "/gestion/statistiques" },
  ] },
  { label: "Assistant & IA", items: [
    { text: "🧭 Assistant", href: "/gestion#assistant" },
    { text: "🤖 Équipe d'agents", href: "/gestion#agents" },
    { text: "📬 Boîte mail (agent)", href: "/gestion/boite-mail" },
  ] },
  { label: "Réglages", items: [
    { text: "🎨 Apparence", href: "/gestion#apparence" },
    { text: "🚚 Livraison (tarifs)", href: "/gestion#livraison" },
    { text: "⚙️ Réglages", href: "/gestion#reglages" },
  ] },
];

export default function AdminSidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false); // menu déroulant mobile
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <span className="eyebrow">Espace gestion</span>
        <h2>Mon site</h2>
      </div>
      {/* Bouton visible seulement sur mobile : ouvre/ferme le menu déroulant. */}
      <button type="button" className="admin-side-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>☰ Menu gestion</span>
        <span aria-hidden>{open ? "▲" : "▼"}</span>
      </button>
      <nav className={`admin-sidebar-nav${open ? " open" : ""}`}>
        {GROUPS.map((group, gi) => (
          <div className="admin-side-group" key={group.label || gi}>
            {group.label && <span className="admin-side-label">{group.label}</span>}
            {group.items.map((it) => {
              const isPage = it.href.startsWith("/gestion/");
              const active = isPage && path === it.href;
              return (
                <a key={it.href} href={it.href} onClick={() => setOpen(false)} className={`admin-side-item${active ? " active" : ""}`} style={{ textDecoration: "none" }}>
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
