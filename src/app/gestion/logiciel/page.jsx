"use client";

// L'ATELIER DANS GESTION (13/11/2026, gérant : « pour le neuf oui tu mets dans le gestion »).
// Un seul logiciel pour toutes les créations : lettre à incruster et sa boîte, boîte seule, support de téléphone,
// arbre de vie, décoration à suspendre, décoration à prénom, suspension à prénoms, fleur à prénom, maisonnette.
// La page du logiciel est public/atelier-outils/logiciel.html, fabriquée par
//   python3 tools/maquettes/atelier-unique.py <demo> <lettre> <prenom> <suspension> <fleur> <maison> public/atelier-outils gestion
// Elle s'ouvre en plein écran dans un cadre ; son bouton « ‹ Gestion » referme le cadre SANS le décharger (les réglages
// en cours sont gardés). Rien n'est vendu ni enregistré sur le site : les réglages (« Ma machine », ce qui est masqué)
// restent sur l'appareil, les fichiers se téléchargent ou partent par le partage du téléphone.

import { useEffect, useState } from "react";
import PageHead from "@/components/admin/PageHead";

const CREATIONS = [
  "Lettre ou chiffre à incruster, avec sa boîte", "Boîte seule", "Support de téléphone", "Arbre de vie à prénoms", "Décoration à suspendre",
  "Décoration à prénom", "Suspension à prénoms", "Fleur à prénom", "Maisonnette en bois",
];

export default function LogicielPage() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const surMessage = (ev) => { if (ev.origin === window.location.origin && ev.data && ev.data.type === "niv-fermer") setVisible(false); };
    window.addEventListener("message", surMessage);
    return () => window.removeEventListener("message", surMessage);
  }, []);
  return (
    <div>
      <PageHead
        eyebrow="Tests"
        title="L'atelier"
        subtitle="Un seul logiciel pour toutes les créations : choisissez le produit, réglez-le, sortez les fichiers pour la machine. Rien n'est vendu ni enregistré sur le site."
        actions={<button type="button" className="fq-btn primary" onClick={() => setVisible(true)}>Ouvrir L&apos;atelier</button>}
      />
      <div style={{ display: "grid", gap: 10, maxWidth: 720, fontSize: 14, lineHeight: 1.5 }}>
        <p style={{ margin: 0 }}>Dans le logiciel : {CREATIONS.join(" · ")}.</p>
        <p style={{ margin: 0, color: "var(--ash-muted, #7a6d58)" }}>
          « Ma machine » (zone, trait de coupe, jeu, épaisseur) et « Masquer ou afficher sur le site » sont gardés sur cet appareil.
          Les créations ne sont pas encore en vente : masquer ici ne change rien sur le site pour l&apos;instant.
          Le logiciel reste ouvert derrière cette page : « Ouvrir L&apos;atelier » le retrouve tel que vous l&apos;avez laissé.
        </p>
      </div>
      <div role="dialog" aria-modal="true" aria-label="L'atelier" hidden={!visible}
        style={{ position: "fixed", inset: 0, zIndex: 10050, background: "#1a1206", display: visible ? "flex" : "none", flexDirection: "column", paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <iframe title="L'atelier : toutes les créations" src="/atelier-outils/logiciel.html" allow="web-share; clipboard-write"
          style={{ flex: 1, width: "100%", border: 0, background: "#f6f3ee", minHeight: 0 }} />
      </div>
    </div>
  );
}
