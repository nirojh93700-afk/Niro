// Grille des prix de gravure des verres (volet « Personnalisation & Entretien »).
// Les montants viennent de src/lib/prixVerres.js : la grille dit exactement ce que le paiement calcule.
import { PRIX_LOGO_VERRE } from "@/lib/prixVerres";

export default function GrillePrixVerres({ id, faceFond = false }) {
  return (
    <div className="pv-grille" id={id}>
      <div className="pv-gt">Prix de la gravure</div>
      <table><tbody>
        <tr><td>Une gravure par commande, la moins chère (logo, image, modèle ou un texte)</td><td><b>offerte</b></td></tr>
        <tr><td>Chaque logo, image ou modèle en plus</td><td><b>+ {PRIX_LOGO_VERRE} €</b></td></tr>
        <tr><td>Chaque texte en plus (prénom, date, phrase)</td><td><b>+ 3 €</b></td></tr>
        {faceFond && <tr><td>Gravure face et fond</td><td><b>+ 7 € par verre</b></td></tr>}
      </tbody></table>
      <p className="pv-small">Le détail exact de votre prix s’affiche avant l’ajout au panier, puis dans votre panier et votre e-mail de confirmation.</p>
    </div>
  );
}
