import Link from "next/link";
import Reveal from "@/components/univers/Reveal";
import Carte, { Bouton } from "@/components/univers/Carte";
import Rail from "@/components/univers/Rail";
import Finder from "@/components/univers/Finder";
import MurUnivers from "@/components/univers/MurUnivers";
import CoffretSavane from "@/components/univers/CoffretSavane";
import { Ic, Star } from "@/components/univers/icones";
import { getSettings, getRatingSummaries } from "@/lib/stock";
import { getCatalog } from "@/lib/catalog";
import { rangerCatalogue, dernieresSorties } from "@/lib/univers";
import { QUI_TILES, OCC_TILES, FETE_PHOTO, carteLegere } from "@/lib/universFinder";

export const dynamic = "force-dynamic";

export const metadata = { alternates: { canonical: "/" } };

// =============================================================================
// PAGE D'ACCUEIL — maquette « accueil + univers », direction « Mélange »
// (validée « applique » par le gérant le 09/10/2026, version avec puzzles) :
// écrin cristal → ruban → bijoux sur photo → dernières sorties → Bébé & Enfant →
// « Trouver le bon cadeau » en deux étapes → coffret → carafe édition limitée →
// verres en mosaïque → Noël → nos univers → l'atelier → le mur → avis → sur mesure.
// Tout est lu dans le catalogue en direct ; l'en-tête et le pied de page du site
// sont inchangés. Les interrupteurs de Gestion → Apparence → Sections restent :
// newArrivals (dernières sorties), featured (bijoux), verresBand (verres), noel,
// categories (nos univers), atelier, trust (avis), mur.
// =============================================================================
const BIJOUX3 = ["collier-3coeurs", "collier-coeur-plaques", "collier-coeur-grave"];
const VERRES5 = ["verre-a-whisky-grave", "verre-a-cocktail-grave", "verre-a-vin-grave", "flute-a-champagne-gravee", "carafe-a-whisky-gravee"];
const ENFANTS4 = ["plaque-de-naissance-coeur", "veilleuse-arbre-de-vie-prenom", "cartes-etapes-bebe-animaux", "bracelet-empreinte-pied-bebe"];

const prixTexte = (c) => (c?.prix ? `${c.prix.des ? "dès " : ""}${c.prix.texte}` : "");

export default async function HomePage() {
  let s = null;
  try { s = await getSettings(); } catch { /* défauts */ }
  const show = { categories: true, trust: true, featured: true, atelier: true, newArrivals: true, verresBand: true, mur: true, noel: true, ...(s?.sections || {}) };
  const ratings = await getRatingSummaries().catch(() => ({}));
  const rv = Object.values(ratings);
  const nbAvis = rv.reduce((a, r) => a + (r.count || 0), 0);
  const note = nbAvis ? Math.round((rv.reduce((a, r) => a + r.avg * r.count, 0) / nbAvis) * 10) / 10 : 0;
  const noteTexte = note.toFixed(1).replace(".", ",");

  const catalog = await getCatalog().catch(() => []);
  const R = rangerCatalogue(catalog);
  const C = R.carteDe;
  const cristal = C("cristal-photo-3d-vertical");
  const carafe = C("carafe-a-whisky-gravee");
  const couverts = C("couverts-enfants-personnalises");
  const enfants = R.univers.find((u) => u.id === "enfants");
  const nouveaux = dernieresSorties(R.cartes, 6);
  const verres = VERRES5.map(C).filter(Boolean);
  const bijoux = BIJOUX3.map(C).filter(Boolean);
  const mur = R.cartes.filter((c) => c.image);
  const ruban = ["Gravé en France", nbAvis ? `${noteTexte}/5 sur ${nbAvis} avis` : "", "Livraison offerte dès 45 € sur les bijoux", "Paiement sécurisé"].filter(Boolean);

  return (
    <div className="mx">
      <Reveal />
      <div id="contenu">
        {/* ÉCRIN — l'entrée cristal (piste A) */}
        <section className="mxhero" id="hero">
          <div className="mxhero-copy">
            <h1>Votre photo, <em>sculptée</em> dans le cristal.</h1>
            <p className="lead">Gravure photo 3D au cœur d’un cristal K9, réalisée dans notre atelier. Un cadeau qui capte la lumière, et l’émotion.</p>
            <div className="cta-row"><Bouton href="/cristaux">Créer mon cristal</Bouton><Bouton href="/cristaux" cls="mxbtn-ghost" arrow={false}>Voir les tailles et prix</Bouton></div>
          </div>
          <div className="mxframe" id="arch">
            <div className="mxframe-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/produits/cristal-v-femme.jpg" alt="Portrait de femme gravé en trois dimensions dans un bloc de cristal" fetchPriority="high" />
              <span className="laser" aria-hidden="true"></span>
            </div>
            {cristal ? <span className="mxframe-tag"><b>{cristal.name}</b><span>{prixTexte(cristal)}</span></span> : null}
          </div>
        </section>
        <div className="ruban" aria-hidden="true"><div className="ruban-t">{[0, 1].map((k) => ruban.map((t) => <span key={`${k}-${t}`} style={{ display: "contents" }}><span>{t}</span><i>✦</i></span>))}</div></div>

        {/* BIJOUX — photo plein cadre et panneau de verre (piste B) */}
        {show.featured && bijoux.length ? (
          <section className="mxband bij rv" aria-labelledby="t-bij">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="mxband-bg" src="/produits/bracelet-femme-acier-porte.jpg" alt="" />
            <div className="mxband-in"><div className="glass">
              <h2 id="t-bij">Des bijoux gravés <em>avec le prénom</em> de votre choix</h2>
              <p>Colliers et bracelets en acier, gravés à la commande dans notre atelier : un prénom, une date, un mot qui compte.</p>
              <div className="ug ug-3 mini">{bijoux.map((c, i) => <Carte key={c.slug} c={c} badge={i === 0 ? "Best-seller" : ""} />)}</div>
              <div className="bij-cats">
                {[["elle", "Femme"], ["lui", "Homme"], ["couple", "Couple"], ["enfant", "Bébé"]].map(([k, l]) => <Link key={k} className="puce" href={`/offrir?qui=${k}`}>{l}</Link>)}
              </div>
              <Bouton href="/boutique/bijoux" cls="mxbtn-ink">Voir tous les bijoux</Bouton>
              <p className="bij-note">Livraison offerte dès 45 € sur les bijoux.</p>
            </div></div>
          </section>
        ) : null}

        {/* LES DERNIÈRES SORTIES — rail */}
        {show.newArrivals && nouveaux.length ? (
          <Rail titre={<>Les dernières sorties <em>de l’atelier</em></>} sous="Nos créations ajoutées ces derniers jours.">
            {nouveaux.map((c) => <Carte key={c.slug} c={c} />)}
          </Rail>
        ) : null}

        {/* BÉBÉ & ENFANT */}
        {enfants ? (
          <section className="sec enf rv" aria-labelledby="t-enf">
            <div className="enf-grid">
              <Link className="enf-big" href="/boutique/enfants">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/produits/couverts_enfants_ex_enfant.jpg" alt="Enfant qui mange avec sa cuillère personnalisée" />
                {couverts ? <span className="enf-lab"><b>{couverts.name}</b><span>{prixTexte(couverts)}</span></span> : null}
              </Link>
              <div className="enf-copy">
                <h2 id="t-enf">Bébé &amp; Enfant : <em>des cadeaux personnalisés</em> avec le prénom de votre enfant</h2>
                <p>Naissance, premiers repas, chambre, jeux : tous nos cadeaux personnalisés pour les petits, réunis au même endroit.</p>
                <div className="enf-cats">{enfants.rayons.map((r) => <Link key={r.id} className="puce" href={`/boutique/enfants#${r.id}`}>{r.nom}</Link>)}</div>
                <div className="ug ug-2">{ENFANTS4.map(C).filter(Boolean).map((c) => <Carte key={c.slug} c={c} />)}</div>
                <Bouton href="/boutique/enfants" cls="mxbtn-ink">Voir tout l’univers</Bouton>
              </div>
            </div>
          </section>
        ) : null}

        {/* TROUVER LE BON CADEAU — deux étapes */}
        <Finder qui={QUI_TILES} occ={OCC_TILES} fetePhotos={FETE_PHOTO} cards={R.cartes.map(carteLegere)} limit={8} />

        {/* COFFRET ASSORTI */}
        <section className="sec enf enf-cof rv" aria-label="Coffret assorti"><CoffretSavane id="home" carteDe={C} /></section>

        {/* CARAFE — édition limitée (écrin) */}
        {carafe ? (
          <section className="limited rv" aria-labelledby="t-lim">
            <div className="mxframe mxframe-sq"><div className="mxframe-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/produits/carafe_gravee.jpg" alt="Carafe à whisky gravée, bouchon à facettes" />
            </div></div>
            <div className="lim-copy">
              <span className="lim-pill"><i></i>Édition limitée</span>
              <h2 id="t-lim">La carafe à whisky <em>gravée</em>, un cadeau d’exception</h2>
              <p>Verre taillé, bouchon à facettes, gravée avec votre prénom ou le modèle de votre choix. Livraison offerte dès 60 € d’achat.</p>
              <p className="lim-price"><b>{prixTexte(carafe)}</b><span>livraison offerte</span></p>
              <Bouton href={carafe.href}>Découvrir la carafe</Bouton>
            </div>
          </section>
        ) : null}

        {/* VERRES — mosaïque */}
        {show.verresBand && verres.length ? (
          <section className="sec verres rv" aria-labelledby="t-verres">
            <div className="sec-head">
              <div><h2 id="t-verres">Verres &amp; Carafes <em>gravés</em></h2><p className="sub">Whisky, vin, champagne, cocktail et carafe, gravés à la commande dans notre atelier.</p></div>
              <Link className="link" href="/boutique/verres">Voir tous les verres et carafes <Ic n="arrow" /></Link>
            </div>
            <div className="bento-v">
              {verres.map((c, i) => (
                <Link key={c.slug} className={`mxbt${i === 0 ? " mxbt-big" : ""}`} href={c.href}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="mxbt-img" src={c.image} alt={c.name} loading="lazy" />
                  <span className="mxbt-lab"><span className="mxbt-name">{c.name}</span><span className="mxbt-price">{prixTexte(c)}</span></span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* NOËL — rouge et or */}
        {show.noel ? (
          <section className="mxnoel rv" aria-labelledby="t-noel">
            <div className="mxnoel-copy">
              <h2 id="t-noel">Ce Noël, offrez un <em>cadeau unique</em></h2>
              <p>Cristal photo, verres, bijoux gravés : chaque création est faite à la commande dans notre atelier, et n’existe qu’une fois.</p>
              <Bouton href="/offrir?occ=noel">Voir les idées de Noël</Bouton>
              <p className="mxnoel-note">Chaque pièce est gravée une par une : pensez-y tôt.</p>
            </div>
            <div className="fan" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="fan-1" src="/produits/cristal-h-famille.jpg" alt="" loading="lazy" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="fan-2" src="/produits/collier-coeur-plaques-1.jpg" alt="" loading="lazy" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="fan-3" src="/produits/verre_a_whisky_exemple_face.jpg" alt="" loading="lazy" />
            </div>
          </section>
        ) : null}

        {/* NOS UNIVERS */}
        {show.categories ? (
          <section className="sec univ rv" id="univers" aria-labelledby="t-univ">
            <div className="sec-head"><div><h2 id="t-univ">Nos univers</h2><p className="sub">Toutes nos créations, classées par univers. Les pièces personnalisables sont gravées à la commande dans notre atelier.</p></div></div>
            <div className="ut-grid">
              {R.univers.map((u) => (
                <Link key={u.id} className={`ut ut-${u.id}`} href={`/boutique/${u.id}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.img} alt="" loading="lazy" />
                  <span className="ut-lab"><b>{u.nom}</b><span>{u.count} créations</span></span>
                  {u.neuf ? <i className="pill-new ut-new">Nouveau</i> : null}
                </Link>
              ))}
            </div>
            <Link className="ut-offrir" href="/offrir">
              <b>Offrir</b>
              <span className="ut-steps"><i><b>1</b>Pour qui</i><i><b>2</b>L’occasion</i></span>
              <span className="ut-txt">Trouvez le bon cadeau en deux étapes.</span>
              <Ic n="arrow" />
            </Link>
          </section>
        ) : null}

        {/* L'ATELIER — énoncé + trois gestes */}
        {show.atelier ? (
          <section className="atelier rv" id="atelier" aria-labelledby="t-at">
            <h2 id="t-at" className="mxstatement">Chaque pièce est dessinée puis gravée au laser dans notre atelier. Prénoms, dates, messages, photos : vos idées deviennent des objets chargés de sens.</h2>
            <ol className="steps">
              <li><i className="step-n">1</i><Ic n="pen" /><b>Vous choisissez</b><span>Une création, et ce que vous voulez y graver : un prénom, une date, un mot, une photo.</span></li>
              <li><i className="step-n">2</i><Ic n="laser" /><b>Nous gravons</b><span>À la commande, pièce par pièce, dans notre atelier.</span></li>
              <li><i className="step-n">3</i><Ic n="gift" /><b>Vous offrez</b><span>Livraison suivie, emballage soigné, une pièce qui n’existe qu’une fois.</span></li>
            </ol>
            <div className="at-row">
              <div className="at-pics" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="at-1" src="/produits/cristal-v-couple.jpg" alt="" loading="lazy" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="at-2" src="/produits/verre_vin_exemple_dale.jpg" alt="" loading="lazy" />
              </div>
              <div className="at-copy">
                <p>Bois noble, acier inoxydable, cristal : nous choisissons des matériaux durables pour des créations qui traversent le temps.</p>
                <Bouton href="/boutique" cls="mxbtn-ink">Commander une création</Bouton>
              </div>
            </div>
          </section>
        ) : null}

        {/* LE MUR */}
        {show.mur ? <MurUnivers items={mur} /> : null}

        {/* AVIS */}
        {show.trust && nbAvis > 0 ? (
          <section className="proof rv" aria-label="Avis clients">
            <div className="stars" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <Star key={i} />)}</div>
            <p className="proof-note"><b>{noteTexte}/5</b> sur {nbAvis} avis clients</p>
            <Link className="link" href="/avis">Lire les avis <Ic n="arrow" /></Link>
          </section>
        ) : null}

        {/* SUR MESURE */}
        <section className="custom rv" aria-labelledby="t-cus">
          <div className="custom-in">
            <h2 id="t-cus">Une idée précise ? Créons-la <em>ensemble</em></h2>
            <p>Gravure et découpe laser de précision, sur mesure.</p>
            <Bouton href="/contact">Demander un projet sur mesure</Bouton>
          </div>
        </section>
      </div>
    </div>
  );
}
