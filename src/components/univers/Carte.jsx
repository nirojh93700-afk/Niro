import Link from "next/link";
import WishlistButton from "@/components/WishlistButton";
import { Ic } from "./icones";

// Carte produit de la maquette « accueil + univers » : photo carrée arrondie,
// étiquette SOUS la photo, nom, prix, « Prêt à offrir » pour les pièces non
// gravables, « Personnaliser » au survol, cœur favoris. Utilisable côté
// serveur comme dans les composants client (parcours, filtres).
export function Bouton({ href, cls = "mxbtn-gold", arrow = true, children, ...rest }) {
  return (
    <Link href={href} className={`mxbtn ${cls}`} {...rest}>
      <span>{children}</span>{arrow ? <Ic n="arrow" /> : null}
    </Link>
  );
}

export default function Carte({ c, badge = "", style }) {
  if (!c) return null;
  const tag = c.soon ? "Bientôt" : badge && !c.badge ? badge : c.badge;
  const inner = (
    <>
      <span className="uc-img">
        {c.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="uc-ph uc-remote" src={c.image} alt={c.name} loading="lazy" />
        ) : (
          <span className="uc-none"><Ic n="image" /><small>photo à venir</small></span>
        )}
        {c.perso && !c.soon ? <span className="uc-cta">Personnaliser</span> : null}
      </span>
      <span className="uc-meta">
        {tag ? <span className={`uc-tag${c.soon ? " uc-tag-soon" : ""}`}>{tag}</span> : null}
        <span className="uc-name">{c.name}</span>
        {c.prix ? <span className="uc-price">{c.prix.des ? "dès " : ""}{c.prix.texte}</span> : null}
        {c.soon && c.note ? <span className="uc-note">{c.note}</span> : null}
        {!c.perso && !c.soon ? <span className="uc-note">Prêt à offrir</span> : null}
      </span>
    </>
  );
  return (
    <div className={`uc${c.soon ? " uc-soon" : ""}`} data-prix={c.lo} data-prixmax={c.hi} style={style}>
      {c.href ? <Link className="uc-link" href={c.href}>{inner}</Link> : <span className="uc-link">{inner}</span>}
      {!c.soon ? <WishlistButton slug={c.slug} name={c.name} image={c.image} price={c.prix?.valeur} variant="vignette" /> : null}
    </div>
  );
}

// Encadré « Cristaux déjà gravés » (annoncé, pas encore en ligne).
export function BientotCristaux() {
  return (
    <div className="uc-soonbox">
      <span className="uc-tag uc-tag-soon">Bientôt</span>
      <b>Cristaux déjà gravés</b>
      <span>Sirène, colibri, cœur, Noël : des modèles prêts à offrir, à choisir dans le format et la taille que vous voulez.</span>
    </div>
  );
}
