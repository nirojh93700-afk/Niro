"use client";
import { Component } from "react";
import { signalerErreur } from "@/lib/erreurPage";

// Si un morceau de fiche plante (ex. l'aperçu d'un article), seul ce morceau
// est remplacé par un message : le reste de la page reste utilisable, et
// l'erreur est envoyée à l'atelier (/api/erreur-page).
export default class BarriereErreur extends Component {
  constructor(props) { super(props); this.state = { erreur: null }; }
  static getDerivedStateFromError(erreur) { return { erreur }; }
  componentDidCatch(erreur) { signalerErreur(erreur, this.props.origine || "bloc"); }
  render() {
    if (!this.state.erreur) return this.props.children;
    return (
      <div style={{ padding: "10px 12px", border: "1px dashed #c9a24b", borderRadius: 8, fontSize: "0.85rem", color: "#6b5e4a", background: "#fbf7ee" }}>
        {this.props.message || "Aperçu impossible à afficher pour cet article (le reste de la fiche est juste)."}
      </div>
    );
  }
}
