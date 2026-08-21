import Link from "next/link";
import Image from "next/image";
import { formatEuro } from "@/lib/format";

// Bandeau horizontal de la page d'accueil (maquette « accueil-mur-tout-en-bas »
// validée le 21/08/2026) : un en-tête à gauche, des vignettes carrées à droite.
// Utilisé deux fois : « Vient d'arriver » (nouveautés automatiques) et
// « Verres & carafes gravés ». Sur mobile, les vignettes défilent au doigt.
//
// Prix affiché : promo de la variante par défaut si elle existe, sinon le prix
// de la première variante, précédé de « dès » quand les variantes ont des prix
// différents et que la première est la moins chère (même logique que ProductCard).
export function prixBandeau(p) {
  const prices = (p.variants || []).map((v) => v.price).filter((x) => Number.isFinite(x));
  if (!prices.length) return null;
  const base = prices[0];
  const sale = p.salePrice;
  const hasPromo = Number.isFinite(sale) && sale > 0 && sale < base;
  const distinct = new Set(prices).size > 1;
  const des = !hasPromo && distinct && base === Math.min(...prices);
  return { texte: formatEuro(hasPromo ? sale : base), des };
}

export default function BandeauAccueil({ eyebrow, title, text, linkHref, linkLabel, items, cinq = false }) {
  if (!items?.length) return null;
  return (
    <section className="na-band">
      <div className="container na-wrap">
        <div className="na-head">
          <span className="na-eyebrow"><span className="na-dot"></span> {eyebrow}</span>
          <h2>{title}</h2>
          <p>{text}</p>
          <Link className="na-all" href={linkHref}>{linkLabel} →</Link>
        </div>
        <div className={cinq ? "na-rail na-rail5" : "na-rail"}>
          {items.map((it) => (
            <Link key={it.slug} className="na-item" href={`/produit/${it.slug}`}>
              <span className="na-pic">
                <Image src={it.image} alt={it.name} width={300} height={300} sizes="(max-width: 860px) 42vw, 260px" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {it.badge ? <span className="na-tag">{it.badge}</span> : null}
              </span>
              <span className="na-name">{it.name}</span>
              {it.prix ? (
                <span className="na-price">{it.prix.des ? <small>dès </small> : null}{it.prix.texte}</span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
