// Écrin encre & or en haut des fiches « Cristal photo 3D — Vertical / Horizontal » (maquette
// fiche-cristal-vertical v5, mise en ligne le 10/10/2026). Le titre de l'écrin est un <p> : le h1 reste
// celui de la fiche, qui est rendue EN DESSOUS exactement comme avant. Styles : .cgg (cristaux-graves.css).
import IcCg from "./IcCg";

export const SLUGS_ECRIN = ["cristal-photo-3d-vertical", "cristal-photo-3d-horizontal"];

export default function EcrinFicheCristal({ product }) {
  const titre = String(product.title || product.name || "");
  const coupe = " — gravure personnalisée en France";
  const i = titre.indexOf(coupe);
  return (
    <div className="cgg cgg-fiche">
      <section className="cg-intro cg-ecrin">
        <div className="container">
          <div className="cg-ecrin-txt">
            <p className="cg-h1">
              {i >= 0 ? <>{titre.slice(0, i)} — <em>gravure personnalisée en France</em></> : titre}
            </p>
            {product.tagline ? <p className="cg-lede">{product.tagline}</p> : null}
            <ul className="cg-trust">
              <li><IcCg n="gem" /><span><b>Cristal optique K9</b>pureté et éclat</span></li>
              <li><IcCg n="pin" /><span><b>Gravé en France</b>dans notre atelier</span></li>
              <li><IcCg n="truck" /><span><b>Livraison suivie</b>colis &amp; point relais</span></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
