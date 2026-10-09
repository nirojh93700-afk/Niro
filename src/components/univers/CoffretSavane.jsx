import Coffret from "./Coffret";
import { PUZZLE_PRIX } from "@/lib/univers";

// Le coffret Savane (maquette avec puzzles) : couverts + puzzle Savane (en vente depuis le 09/10/2026) + veilleuse.
export default function CoffretSavane({ id, carteDe }) {
  const couverts = carteDe("couverts-enfants-personnalises");
  const veilleuse = carteDe("veilleuse-arbre-de-vie-prenom");
  const puzzle = carteDe("puzzle-savane");
  if (!couverts) return null;
  const pieces = [
    { name: couverts.name, prix: couverts.prix?.valeur || 0, checked: true },
    { name: puzzle ? puzzle.name : "Puzzle en bois personnalisé", prix: puzzle?.prix?.valeur || PUZZLE_PRIX, checked: false, bientot: !puzzle },
    ...(veilleuse ? [{ name: veilleuse.name, prix: veilleuse.prix?.valeur || 0, checked: false }] : []),
  ];
  return (
    <Coffret id={id} pieces={pieces} titre="le coffret Savane"
      texte="Les couverts, le puzzle et la veilleuse dans le même thème. Vous écrivez le prénom une seule fois : les pièces sont personnalisées ensemble."
      note="D’autres thèmes suivront dès que le même motif existe sur les couverts et sur le puzzle."
      photos={["/produits/couverts_enfants_ex_animaux.jpg", "/produits/puzzle-savane.jpg", "/produits/veilleuse-prenom-1.jpg"]}
      href="/boutique/enfants#r-enfants-1" />
  );
}
