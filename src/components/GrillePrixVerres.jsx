// Grille des prix de gravure des verres (volet « Personnalisation & Entretien »).
// Les montants viennent de src/lib/prixVerres.js : la grille dit exactement ce que le paiement calcule.
import { PRIX_VERRE_DIFFERENT, FRAIS_IDENTIQUES } from "@/lib/prixVerres";

const eur = (n) => `${n} €`;

export default function GrillePrixVerres({ id, faceFond = false }) {
  const [f12, f34, f5] = FRAIS_IDENTIQUES;
  return (
    <div className="pv-grille" id={id}>
      <div className="pv-gt">Prix de la gravure</div>
      <table><tbody>
        <tr><td>Image, logo ou modèle du verre 1</td><td><b>offert</b></td></tr>
        <tr><td>Texte gravé</td><td><b>+ 3 € par verre</b></td></tr>
        <tr><td>Chaque verre différent (autre image ou autre texte)</td><td><b>+ {eur(PRIX_VERRE_DIFFERENT)} tout compris</b></td></tr>
        {faceFond && <tr><td>Gravure face et fond</td><td><b>+ 7 € par verre</b></td></tr>}
      </tbody></table>
      <div className="pv-gt">Frais de gravure pour des verres identiques <small>(une seule fois)</small></div>
      <table><tbody>
        <tr><td>1 ou {f12.max} verres</td><td><b>{f12.montant ? `+ ${eur(f12.montant)}` : "aucun"}</b></td></tr>
        <tr><td>3 ou {f34.max} verres</td><td><b>+ {eur(f34.montant)}</b></td></tr>
        <tr><td>5 verres et plus</td><td><b>+ {eur(f5.montant)}</b></td></tr>
      </tbody></table>
      <p className="pv-small">Le détail exact de votre prix s’affiche avant l’ajout au panier, puis dans votre panier et votre e-mail de confirmation.</p>
    </div>
  );
}
