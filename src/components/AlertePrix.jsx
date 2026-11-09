"use client";

// « Me prévenir si le prix baisse » sur la fiche produit (09/11/2026).
// L'alerte existait déjà sur la page Mes favoris (compte connecté) ; rien ne le disait sur la fiche.
// Même mécanique : /api/favoris {action:"watch"} (prix de départ relevé côté serveur, un e-mail
// groupé si le prix baisse). Pas connectée : on l'explique et on mène à l'espace client.
import { useState } from "react";
import Link from "next/link";

export default function AlertePrix({ slug }) {
  const [etat, setEtat] = useState("repos"); // repos | attente | on | off | connexion | erreur
  if (!slug) return null;

  const basculer = async () => {
    if (etat === "attente") return;
    const activer = etat !== "on";
    setEtat("attente");
    try {
      const moi = await fetch("/api/favoris", { cache: "no-store" }).then((r) => r.json());
      if (!moi?.loggedIn) { setEtat("connexion"); return; }
      // Rangé aussi dans ses favoris, pour qu'elle retrouve et coupe l'alerte dans « Mes favoris ».
      if (activer && !(moi.slugs || []).includes(slug)) {
        await fetch("/api/favoris", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggle", slug }) });
      }
      const rep = await fetch("/api/favoris", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "watch", slug, on: activer }) });
      const d = await rep.json().catch(() => ({}));
      if (!rep.ok) { setEtat("erreur"); return; }
      setEtat(d.on ? "on" : "off");
    } catch { setEtat("erreur"); }
  };

  return (
    <div className="alerte-prix">
      <button type="button" className={etat === "on" ? "fav-ligne fav-ligne-on" : "fav-ligne"} onClick={basculer} aria-pressed={etat === "on"}>
        <span aria-hidden="true">🔔</span>
        {etat === "on" ? "Alerte activée : nous vous écrirons si le prix baisse" : etat === "attente" ? "Un instant…" : "Me prévenir si le prix baisse"}
      </button>
      {etat === "connexion" && (
        <p className="alerte-prix-note">
          Pour recevoir cette alerte, <Link className="link" href="/espace">connectez-vous à votre espace</Link> (un simple lien envoyé par e-mail), puis revenez sur cette page.
        </p>
      )}
      {etat === "off" && <p className="alerte-prix-note">Alerte retirée.</p>}
      {etat === "erreur" && <p className="alerte-prix-note">L'alerte n'a pas pu être enregistrée. Réessayez dans un instant.</p>}
    </div>
  );
}
