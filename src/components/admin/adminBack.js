"use client";

import { useEffect } from "react";

// =============================================================================
// BOUTON « RETOUR » DE LA BARRE DU HAUT (téléphone).
//
// Problème réglé (demande du gérant, 19/09/2026) : « quand je suis en train de
// lire les mails, je peux pas retourner en arrière, j'ai pas de bouton retour ».
// Quand une page ouvre quelque chose PAR-DESSUS elle-même (un e-mail, une fiche,
// un fil), elle le déclare ici ; la barre du haut remplace alors le ☰ par une
// flèche ‹ qui referme cet écran. Sur ordinateur, rien ne change visuellement.
//
// Usage dans une page : useAdminBack(!!ouvert, "Boîte mail", () => setOuvert(null));
// =============================================================================

let courant = null;
const abonnes = new Set();

function prevenir() { abonnes.forEach((cb) => { try { cb(); } catch { /* ignore */ } }); }

export function lireAdminBack() { return courant; }

export function sAbonnerAdminBack(cb) {
  abonnes.add(cb);
  return () => abonnes.delete(cb);
}

/**
 * Déclare un retour « dans la page ».
 * @param {boolean} actif   vrai quand l'écran par-dessus est ouvert
 * @param {string}  label   d'où l'on revient (affiché en petit sous le titre)
 * @param {Function} fn     appelée quand on touche la flèche
 */
export function useAdminBack(actif, label, fn) {
  useEffect(() => {
    if (!actif || typeof fn !== "function") return undefined;
    const entree = { label: label || "", fn };
    courant = entree;
    prevenir();
    return () => {
      // On ne libère que SA propre entrée (une autre page a pu prendre la main).
      if (courant === entree) { courant = null; prevenir(); }
    };
  }, [actif, label, fn]);
}
