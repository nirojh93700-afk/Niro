"use client";

// Adresse propre de l'onglet « stats » de l'accueil Gestion (02/10/2026) — même écran, même code.
// 08/11/2026 : bloc « Posez une question sur vos chiffres » au-dessus (réponses lues dans les vraies commandes).
import GestionPage from "../page";
import QuestionChiffres from "@/components/admin/QuestionChiffres";

export default function Page() {
  return (
    <>
      <QuestionChiffres />
      <GestionPage onglet="stats" />
    </>
  );
}
