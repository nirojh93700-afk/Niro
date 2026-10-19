// Grille des prix de gravure des verres (volet « Personnalisation & Entretien »).
// Les montants viennent de src/lib/prixVerres.js : la grille dit exactement ce que le paiement calcule.
import { PRIX_VERRE_SUIVANT } from "@/lib/prixVerres";

export default function GrillePrixVerres({ id, faceFond = false }) {
  return (
    <div className="pv-grille" id={id}>
      <div className="pv-gt">Prix de la gravure</div>
      <table><tbody>
        <tr><td>Verre 1 : image, logo ou modèle</td><td><b>offert</b></td></tr>
        <tr><td>Verre 1 : chaque texte</td><td><b>+ 3 €</b></td></tr>
        <tr><td>Chaque autre verre : logo et texte</td><td><b>+ {PRIX_VERRE_SUIVANT.complet} €</b></td></tr>
        <tr><td>Chaque autre verre : logo seul ou texte seul</td><td><b>+ {PRIX_VERRE_SUIVANT.simple} €</b></td></tr>
        {faceFond && <tr><td>Gravure face et fond</td><td><b>+ 7 € par verre</b></td></tr>}
      </tbody></table>
      <p className="pv-small">Le détail exact de votre prix s’affiche avant l’ajout au panier, puis dans votre panier et votre e-mail de confirmation.</p>
    </div>
  );
}
