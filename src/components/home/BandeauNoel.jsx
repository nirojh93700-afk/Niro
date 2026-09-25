import Link from "next/link";
import Image from "next/image";

// =============================================================================
// 🎄 BANDEAU NOËL — page d'accueil, JUSTE SOUS le logo et le menu, AVANT l'entrée
// cristal (qui ne bouge pas). Maquette validée `docs/maquettes/noel-sur-accueil-
// actuel.html` (v4, « tu peux mettre en ligne », 25/09/2026) : rouge de Noël & or,
// titre « Ce Noël, offrez un cadeau unique », mosaïque 3×3 = cristal, verres et
// les bijoux GRAVÉS qui se vendent le mieux (photos avec gravure visible).
// Interrupteur : Gestion → Apparence → Sections de l'accueil → « Bandeau Noël »
// (`settings.sections.noel`) — à décocher après les fêtes.
// Styles `.noel-*` en fin de globals.css.
// =============================================================================

// Photos de la mosaïque : toutes montrent une GRAVURE (règle du gérant, 22/09 :
// on vend la personnalisation, jamais un produit vierge).
const MOSAIQUE = [
  ["/produits/cristal-v-femme.jpg", "Cristal photo 3D gravé"],
  ["/produits/verre_a_whisky_exemple_face.jpg", "Verre à whisky gravé"],
  ["/produits/carafe_gravee.jpg", "Carafe à whisky gravée"],
  ["/produits/collier-coeur-grave-1.jpg", "Collier cœur gravé"],
  ["/produits/collier-double-coeur-3.jpg", "Collier double cœur gravé"],
  ["/produits/bracelet-cordon-plaque-4.jpg", "Bracelet cordon à plaque gravée"],
  ["/produits/verre_vin_geniet.jpg", "Verre à vin gravé"],
  ["/produits/bracelet-femme-acier-grave.jpg", "Bracelet femme acier gravé"],
  ["/produits/collier-coeur-plaques-1.jpg", "Collier à plaques gravées"],
];

export default function BandeauNoel() {
  return (
    <section className="noel-band" aria-label="Noël 2026">
      <div className="container noel-in">
        <div className="noel-txt">
          <div className="noel-eyebrow">✦ Noël 2026</div>
          <h2>Ce Noël, offrez un <em>cadeau unique</em></h2>
          <p>Cristal photo, verres, bijoux gravés — chaque pièce est gravée à la commande dans notre atelier. Une pièce qui n&apos;existe qu&apos;une fois.</p>
          <Link className="btn btn-gold noel-cta" href="/offrir/noel">Voir les idées de Noël →</Link>
          <div className="noel-date">Chaque pièce est gravée une par une — pensez-y tôt.</div>
        </div>
        <Link className="noel-mosaic" href="/offrir/noel" aria-label="Voir les idées de Noël">
          {MOSAIQUE.map(([src, alt]) => (
            <Image key={src} src={src} alt={alt} width={220} height={220} sizes="(max-width: 700px) 30vw, 140px" />
          ))}
        </Link>
      </div>
    </section>
  );
}
