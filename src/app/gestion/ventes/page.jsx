"use client";

// Adresse propre de l'onglet « stats » de l'accueil Gestion (02/10/2026) — même écran, même code.
// 08/11/2026 : bloc « Posez une question sur vos chiffres » au-dessus (réponses lues dans les vraies commandes).
// 25/11/2026 : tableau « Ventes par produit » en tête (quel produit vendu à combien, coût, gain).
import GestionPage from "../page";
import QuestionChiffres from "@/components/admin/QuestionChiffres";
import VentesProduits from "@/components/admin/VentesProduits";

export default function Page() {
  return (
    <>
      <VentesProduits />
      <QuestionChiffres />
      <GestionPage onglet="stats" />
    </>
  );
}
