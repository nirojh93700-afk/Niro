"use client";
// Choix des options cochées sur la page d'un devis (socle, texte) : partagé entre le bloc
// « Options », le tableau, le total, la livraison / le paiement et le panier.
import { useSyncExternalStore } from "react";

let etat = { socle: false, texteOn: false, texte: "", police: "playfair", extra: 0 };
const abonnes = new Set();

export function setDevisChoix(patch) {
  etat = { ...etat, ...patch };
  abonnes.forEach((f) => f());
}
const abonner = (f) => { abonnes.add(f); return () => abonnes.delete(f); };
const lire = () => etat;

export function useDevisChoix() {
  return useSyncExternalStore(abonner, lire, lire);
}

/** Ce qu'on envoie au serveur (il recalcule tout lui-même). */
export function choixPourServeur(c) {
  if (!c) return undefined;
  const o = { socle: Boolean(c.socle), texte: c.texteOn ? String(c.texte || "").trim() : "", police: c.police };
  return o.socle || o.texte ? o : undefined;
}
