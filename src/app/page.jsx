import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import NewArrivalsToast from "@/components/NewArrivalsToast";
import { PaymentLogos } from "@/components/PaymentBand";
import PayInfoModal from "@/components/PayInfo";
import { getProductBySlug } from "@/lib/products";
import { getSettings, getRatingSummaries } from "@/lib/stock";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const CATEGORY_DEFAULTS = [
  { slug: "bijoux", label: "Bijoux", sub: "Colliers & bracelets gravés", image: getProductBySlug("collier-medaillon-coeur-ouvrable").images[0] },
  { slug: "mariage", label: "Mariage & Réception", sub: "Numéros de table, menus, ronds de serviette", image: getProductBySlug("menu-de-mariage-bois-grave").images[0] },
  { slug: "cadeaux", label: "Cadeaux & Accessoires", sub: "Clés USB, porte-clés, médaillons", image: getProductBySlug("cle-usb-personnalisee").images[0] },
  { slug: "verres", label: "Verres & Carafes", sub: "Whisky, vin, champagne & carafe gravés", image: "/produits/verre_a_whisky_card.jpg" },
  { slug: "deco", label: "Déco & Maison", sub: "Lampes, cristal 3D, couverts", image: getProductBySlug("lampe-led-paris-saint-germain").images[0] },
];

const ATELIER_DEFAULTS = {
  eyebrow: "L'atelier",
  title: "Le savoir-faire de la gravure laser",
  text1: "Chez Niv Création, chaque pièce est dessinée puis gravée ou découpée au laser dans notre atelier. Bois noble, acier inoxydable, acrylique : nous sélectionnons des matériaux durables pour des créations qui traversent le temps.",
  text2: "La personnalisation est au cœur de notre métier. Prénoms, dates, messages, photos gravées… nous transformons vos idées en objets chargés de sens.",
  image: getProductBySlug("ronds-de-serviette-bois").images[0],
};

// Repli si aucun produit n'est coché « mis en avant » dans l'admin.
const FEATURED_FALLBACK = [
  "arbre-de-vie-lumineux",
  "veilleuse-arbre-de-vie-ronde",
  "couverts-enfants-personnalises",
  "lampe-led-paris-saint-germain",
  "verre-a-whisky-fete-des-peres",
  "collier-medaillon-coeur-ouvrable",
  "numero-table-arches-bohemes",
  "ronds-de-serviette-bois",
];

function pick(v, def) {
  return v && String(v).trim() ? v : def;
}

// Canonical de la page d'accueil (le reste des métadonnées vient du layout racine).
export const metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  let s = null;
  try { s = await getSettings(); } catch { /* défauts */ }
  const ratings = await getRatingSummaries().catch(() => ({}));
  // Note globale de la boutique (moyenne pondérée de tous les avis produits).
  const _rv = Object.values(ratings);
  const siteReviewCount = _rv.reduce((s, r) => s + (r.count || 0), 0);
  const siteRating = siteReviewCount
    ? Math.round((_rv.reduce((s, r) => s + r.avg * r.count, 0) / siteReviewCount) * 10) / 10
    : 0;

  // Produits mis en avant : ceux cochés « ⭐ mis en avant » dans l'admin,
  // sinon une sélection par défaut. (Repli sûr sur le code.)
  const catalog = await getCatalog().catch(() => []);
  const flagged = catalog.filter((p) => p.featured);
  const featured = (flagged.length
    ? flagged
    : FEATURED_FALLBACK.map((sl) => catalog.find((p) => p.slug === sl) || getProductBySlug(sl)).filter(Boolean)
  ).slice(0, 8);
  // Carafe édition limitée : bandeau d'accueil (affiché seulement si elle est visible).
  const carafeLim = catalog.find((p) => p.slug === "carafe-a-whisky-gravee" && !p.hidden);

  const cats = CATEGORY_DEFAULTS.map((c, i) => ({
    ...c,
    label: pick(s?.categories?.[i]?.label, c.label),
    sub: pick(s?.categories?.[i]?.sub, c.sub),
    image: pick(s?.categories?.[i]?.image, c.image),
  }));
  const atelier = {
    eyebrow: pick(s?.atelier?.eyebrow, ATELIER_DEFAULTS.eyebrow),
    title: pick(s?.atelier?.title, ATELIER_DEFAULTS.title),
    text1: pick(s?.atelier?.text1, ATELIER_DEFAULTS.text1),
    text2: pick(s?.atelier?.text2, ATELIER_DEFAULTS.text2),
    image: pick(s?.atelier?.image, ATELIER_DEFAULTS.image),
  };
  const show = { categories: true, trust: true, featured: true, atelier: true, newArrivals: true, ...(s?.sections || {}) };
  // Nouveautés : TOUS les produits taggés « Nouveau ». Les verres gravés en tête
  // (ordre catalogue), puis le reste (les plus récents d'abord).
  const allNew = catalog.filter((p) => p.badge === "Nouveau");
  const newProducts = [
    ...allNew.filter((p) => p.category === "verres"),
    ...allNew.filter((p) => p.category !== "verres").reverse(),
  ].slice(0, 8);
  // Pour la petite fenêtre flottante.
  const newItems = newProducts.map((p) => ({ slug: p.slug, name: p.name, image: p.cardImage || p.images?.[0] || "" }));

  return (
    <>
      {/* HERO — Cristal Photo 3D (produit phare) */}
      <section className="cr-hero">
        <style>{`
          /* VERSION FONCÉE mémorisée (pour revenir) : bg linear-gradient(160deg,#241a0c,#120c05 72%);color:#f5efe2 · eyebrow #e2c67e / border .35 · h1 #fff · shine #fff→#e2c67e→#fff · lede #b9c2cc · link2 #e7edf2 / border rgba(255,255,255,.3) · badges #8f9aa5 / b #cfd6dd · halo rgba(232,204,140,.42) · shot shadow rgba(0,0,0,.6) */
          .cr-hero{position:relative;overflow:hidden;background:
            radial-gradient(90% 120% at 85% 8%, rgba(201,162,75,.20), transparent 55%),
            radial-gradient(80% 100% at 5% 100%, rgba(201,162,75,.14), transparent 55%),
            linear-gradient(160deg,#faf5ea,#f1e6d2 78%);color:#241a0c}
          .cr-wrap{max-width:var(--max,1180px);margin:0 auto;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:24px;padding:clamp(30px,5vw,60px) clamp(20px,5vw,48px)}
          @media(max-width:840px){.cr-wrap{grid-template-columns:1fr;text-align:center}}
          .cr-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.74rem;letter-spacing:.22em;text-transform:uppercase;color:#a5822f;border:1px solid rgba(201,162,75,.55);border-radius:999px;padding:7px 14px;margin-bottom:20px}
          .cr-dot{width:6px;height:6px;border-radius:50%;background:#c9a24b;animation:crpulse 2.4s infinite}
          @keyframes crpulse{0%{box-shadow:0 0 0 0 rgba(201,162,75,.55)}70%{box-shadow:0 0 0 10px rgba(201,162,75,0)}100%{box-shadow:0 0 0 0 rgba(201,162,75,0)}}
          .cr-hero h1{font-family:Georgia,serif;font-weight:600;font-size:clamp(2.1rem,5.5vw,3.6rem);line-height:1.05;letter-spacing:-.015em;margin:0 0 16px;color:#241a0c}
          .cr-shine{background:linear-gradient(92deg,#c9a24b,#9a7b2e);-webkit-background-clip:text;background-clip:text;color:transparent}
          .cr-lede{color:#6f6453;font-size:clamp(1rem,2.2vw,1.14rem);max-width:46ch;margin:0 0 26px;line-height:1.6}
          @media(max-width:840px){.cr-lede{margin-left:auto;margin-right:auto}}
          .cr-cta{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
          @media(max-width:840px){.cr-cta{justify-content:center}}
          .cr-btn{border-radius:14px;padding:15px 28px;font-weight:700;font-size:1rem;text-decoration:none;background:linear-gradient(135deg,#c9a24b,#e2c67e);color:#1a1206;box-shadow:0 10px 30px rgba(201,162,75,.28);transition:transform .15s}
          .cr-btn:hover{transform:translateY(-2px)}
          .cr-link2{color:#5a4a2a;text-decoration:none;font-size:.96rem;border-bottom:1px solid rgba(0,0,0,.2);padding-bottom:2px}
          .cr-badges{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px}
          @media(max-width:840px){.cr-badges{justify-content:center}}
          .cr-badges span{display:inline-flex;align-items:center;gap:6px;font-size:.8rem;color:#6f6453;background:rgba(201,162,75,.10);border:1px solid rgba(201,162,75,.38);border-radius:999px;padding:6px 13px}
          .cr-badges b{color:#4a3f2a;font-weight:700}
          .cr-viz{position:relative;display:grid;place-items:center;min-height:300px}
          .cr-halo{position:absolute;width:74%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(214,175,95,.34),rgba(201,162,75,.14) 45%,transparent 66%);filter:blur(18px);animation:crbreathe 5s ease-in-out infinite}
          @keyframes crbreathe{0%,100%{transform:scale(.96);opacity:.75}50%{transform:scale(1.05);opacity:1}}
          .cr-shot{position:relative;width:min(400px,82%);border-radius:18px;overflow:hidden;box-shadow:0 24px 54px rgba(90,70,30,.28);animation:crfloat 6s ease-in-out infinite;-webkit-mask-image:radial-gradient(120% 120% at 50% 40%,#000 74%,transparent 100%);mask-image:radial-gradient(120% 120% at 50% 40%,#000 74%,transparent 100%)}
          .cr-shot img{display:block;width:100%;height:auto}
          @keyframes crfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
          @media(prefers-reduced-motion:reduce){.cr-shot,.cr-halo,.cr-dot{animation:none}}
        `}</style>
        <div className="cr-wrap">
          <div>
            <span className="cr-eyebrow"><span className="cr-dot"></span> Nouveau · Fait main en France</span>
            <h1>Votre photo,<br/><span className="cr-shine">sculptée dans le cristal.</span></h1>
            <p className="cr-lede">Gravure photo 3D au cœur d&apos;un cristal K9, réalisée dans notre atelier. Un cadeau qui capte la lumière — et l&apos;émotion.</p>
            <div className="cr-cta">
              <Link href="/cristaux" className="cr-btn">Créer mon cristal →</Link>
              <Link href="/cristaux" className="cr-link2">Voir les tailles &amp; prix</Link>
            </div>
            <div className="cr-badges">
              <span>🇫🇷 <b>Gravé en France</b></span>
              <span>💎 <b>Cristal K9</b> premium</span>
              <span>🚚 <b>Livraison rapide</b> &amp; suivie</span>
            </div>
          </div>
          <div className="cr-viz">
            <div className="cr-halo"></div>
            <Link href="/cristaux" className="cr-shot" aria-label="Voir les cristaux photo 3D" style={{ display: "block", cursor: "pointer" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/produits/cristal-v-bebe.jpg" alt="Cristal photo 3D personnalisé" />
            </Link>
          </div>
        </div>
      </section>

      {/* BANDEAU — Carafe édition limitée (entre l'entrée cristal et les nouveautés) */}
      {carafeLim && (
        <section style={{ padding: "8px 0 4px" }}>
          <div className="container">
            <style>{`
              .limed{position:relative;overflow:hidden;border-radius:18px;background:linear-gradient(150deg,#241a0c,#120c05 75%);color:#f5efe2;display:grid;grid-template-columns:1.15fr .85fr;min-height:230px;box-shadow:0 14px 40px rgba(36,26,12,.28);animation:lmglow 3.6s ease-in-out infinite}
              @keyframes lmglow{0%,100%{box-shadow:0 14px 40px rgba(36,26,12,.28)}50%{box-shadow:0 16px 52px rgba(201,162,75,.4)}}
              .limed .lm-txt{padding:26px 24px;display:flex;flex-direction:column;justify-content:center;gap:12px;z-index:2}
              .limed .lm-tag{display:inline-flex;align-items:center;gap:8px;font-size:.7rem;letter-spacing:.24em;text-transform:uppercase;color:#e2c67e;border:1px solid rgba(226,198,126,.5);border-radius:999px;padding:7px 14px;font-weight:700;align-self:flex-start}
              .limed .lm-dot{width:7px;height:7px;border-radius:50%;background:#e2c67e;animation:lmpulse 1.8s infinite}
              @keyframes lmpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.75)}}
              .limed h2{margin:0;font-family:Georgia,'Times New Roman',serif;font-size:clamp(21px,4.4vw,30px);line-height:1.15;color:#fff;font-weight:600}
              .limed h2 em{font-style:normal;background:linear-gradient(90deg,#e2c67e,#f6e7bd,#e2c67e,#f6e7bd,#e2c67e);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:lmshimmer 3s linear infinite}
              @keyframes lmshimmer{to{background-position:-200% center}}
              .limed p{margin:0;font-size:13.5px;color:#cdbfa4;max-width:34ch}
              .limed .lm-cta{align-self:flex-start;background:linear-gradient(135deg,#c9a24b,#a98935);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:999px;box-shadow:0 6px 18px rgba(201,162,75,.4);animation:lmbtn 2.4s ease-in-out infinite}
              .limed .lm-cta:hover{animation:none;transform:translateY(-2px)}
              @keyframes lmbtn{0%,100%{transform:translateY(0);box-shadow:0 6px 18px rgba(201,162,75,.4)}50%{transform:translateY(-3px);box-shadow:0 12px 26px rgba(201,162,75,.6)}}
              .limed .lm-pic{position:relative;min-height:200px}
              .limed .lm-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:lmzoom 9s ease-in-out infinite}
              @keyframes lmzoom{0%,100%{transform:scale(1.03)}50%{transform:scale(1.11)}}
              .limed .lm-pic::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#120c05,rgba(18,12,5,0) 44%);z-index:1}
              .limed .lm-shine{position:absolute;top:-40%;left:-30%;width:36%;height:180%;background:linear-gradient(100deg,transparent,rgba(255,244,214,.13),transparent);transform:rotate(12deg);animation:lmsweep 4.5s ease-in-out infinite;z-index:2;pointer-events:none}
              @keyframes lmsweep{0%{left:-36%}55%{left:110%}100%{left:110%}}
              @media(max-width:560px){.limed{grid-template-columns:1fr}.limed .lm-pic{order:-1;min-height:160px}.limed .lm-pic::before{background:linear-gradient(0deg,#120c05 6%,rgba(18,12,5,0) 55%)}}
              @media(prefers-reduced-motion:reduce){.limed,.limed .lm-shine,.limed .lm-dot,.limed .lm-cta,.limed .lm-pic img,.limed h2 em{animation:none}.limed .lm-shine{opacity:0}}
            `}</style>
            <div className="limed">
              <div className="lm-txt">
                <span className="lm-tag"><span className="lm-dot"></span> Édition limitée</span>
                <h2>La carafe à whisky <em>gravée</em>, un cadeau d&apos;exception</h2>
                <p>Verre taillé, bouchon à facettes, gravée à votre prénom ou au modèle de votre choix. Livraison offerte.</p>
                <Link href="/produit/carafe-a-whisky-gravee" className="lm-cta">Découvrir la carafe →</Link>
              </div>
              <Link href="/produit/carafe-a-whisky-gravee" className="lm-pic" aria-label="Découvrir la carafe" style={{ display: "block" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={(carafeLim.images && carafeLim.images[0]) || "/produits/carafe_ambiance.jpg"} alt="Carafe à whisky gravée — édition limitée" />
              </Link>
              <div className="lm-shine"></div>
            </div>
          </div>
        </section>
      )}

      {/* NOUVEAUTÉS — alimenté automatiquement par le badge « Nouveau » */}
      {show.newArrivals && newProducts.length > 0 && (
        <section className="section new-arrivals" style={{ background: "linear-gradient(180deg,#fbf4e6 0%,#fffdf9 65%)", borderTop: "1px solid #efe2c2" }}>
          <div className="container">
            <div className="section-head">
              <span className="eyebrow" style={{ color: "var(--gold-dark)" }}>✦ Vient d'arriver</span>
              <h2>Nos nouveautés</h2>
              <p>Les dernières créations sorties de notre atelier — à découvrir en avant-première.</p>
            </div>
            <div className="product-grid">
              {newProducts.map((p) => { const r = ratings[p.slug]; const mk = Number(s?.refMarkup) > 0; return (<ProductCard key={p.slug} product={{ ...p, ...(mk ? { refMarkup: Number(s.refMarkup) } : {}), ...(r ? { rating: r } : {}) }} />); })}
            </div>
            <div style={{ textAlign: "center", marginTop: 34 }}>
              <Link href="/boutique" className="btn btn-gold">Découvrir toutes les nouveautés</Link>
            </div>
          </div>
        </section>
      )}

      {/* CATÉGORIES */}
      {show.categories && (
        <section className="section" id="collections">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Nos univers</span>
              <h2>Explorez nos collections</h2>
              <p>Nos familles de créations, une même exigence : la personnalisation soignée.</p>
            </div>
            <div className="cat-grid">
              {cats.map((cat) => (
                <Link href={cat.slug === "cristal" ? "/cristaux" : cat.slug === "naissance" ? "/naissance" : `/boutique/${cat.slug}`} key={cat.slug} className="cat-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cat.image} alt={cat.label} width={500} height={650} />
                  <div className="cat-overlay">
                    <h3>{cat.label}</h3>
                    <span>{cat.sub}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BANDEAU CONFIANCE */}
      {show.trust && (
        <section className="trust">
          {siteReviewCount > 0 && (
            <div className="container">
              <Link href="/avis" className="site-rating" title="Lire les avis clients">
                <span className="sr-stars" aria-hidden="true">
                  {"★★★★★".slice(0, Math.round(siteRating))}
                  <span className="sr-stars-empty">{"★★★★★".slice(Math.round(siteRating))}</span>
                </span>
                <strong>{siteRating.toFixed(1).replace(".", ",")}/5</strong>
                <span className="sr-count">· {siteReviewCount} avis clients</span>
                <span className="sr-verified">Lire les avis →</span>
              </Link>
            </div>
          )}
          <div className="container trust-grid">
            <div className="trust-item"><span>🇫🇷</span><strong>Personnalisé en France</strong><small>Atelier français · gravure laser</small></div>
            <div className="trust-item"><span>✦</span><strong>Sur mesure</strong><small>Gravure & découpe laser de précision</small></div>
            <div className="trust-item"><span>🔒</span><strong>Paiement sécurisé</strong><small>Carte bancaire via Stripe</small></div>
            <div className="trust-item"><span>💌</span><strong>Cadeau idéal</strong><small>Une attention qui marque les esprits</small></div>
          </div>
          {/* Paiement : logos + plusieurs fois, regroupé dans le même bandeau */}
          <div className="container trust-pay">
            <PaymentLogos dark />
            <p className="trust-pay-line">
              💳 <strong>Payez en plusieurs fois sans frais</strong> — 4× avec PayPal (dès 30 €) ou 3× avec Klarna (dès 50 €). <PayInfoModal label="En savoir plus" className="trust-pay-link" />
            </p>
          </div>
        </section>
      )}

      {/* PRODUITS PHARES */}
      {show.featured && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Coups de cœur</span>
              <h2>Nos créations phares</h2>
              <p>Une sélection de pièces appréciées, prêtes à être personnalisées pour vous.</p>
            </div>
            <div className="product-grid">
              {featured.map((p) => { const r = ratings[p.slug]; const mk = Number(s?.refMarkup) > 0; return (<ProductCard key={p.slug} product={{ ...p, ...(mk ? { refMarkup: Number(s.refMarkup) } : {}), ...(r ? { rating: r } : {}) }} />); })}
            </div>
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Link href="/boutique" className="btn btn-primary">Voir toute la boutique</Link>
            </div>
          </div>
        </section>
      )}

      {/* ATELIER */}
      {show.atelier && (
        <section className="section" id="atelier" style={{ background: "var(--paper)" }}>
          <div className="container hero-grid">
            <div className="hero-visual">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={atelier.image} alt="L'atelier Niv Création" width={700} height={700} />
            </div>
            <div>
              <span className="hero-eyebrow">{atelier.eyebrow}</span>
              <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.5rem)", marginTop: 0 }}>{atelier.title}</h2>
              <p style={{ color: "var(--ink-soft)" }}>{atelier.text1}</p>
              <p style={{ color: "var(--ink-soft)" }} id="personnalisation">{atelier.text2}</p>
              <Link href="/boutique" className="btn btn-outline">Commander une création</Link>
            </div>
          </div>
        </section>
      )}

      {/* SUR MESURE — commande personnalisée bois & déco */}
      <section className="section">
        <div className="container">
          <div
            style={{
              background: "linear-gradient(135deg, #f7efe0, #fbf7ee)",
              border: "1px solid #e7d3a1",
              borderRadius: 18,
              padding: "40px 28px",
              textAlign: "center",
            }}
          >
            <span className="eyebrow">Sur mesure</span>
            <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", margin: "8px 0 10px" }}>
              Une idée précise&nbsp;? Créons-la ensemble
            </h2>
            <p style={{ color: "var(--ink-soft)", maxWidth: 560, margin: "0 auto 22px" }}>
              Objet personnalisé en bois, décoration sur mesure, pièce unique
              pour un mariage ou un cadeau… Contactez-nous directement, par
              e-mail ou par téléphone, et donnons vie à votre projet.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/contact" className="btn btn-gold">Demander un projet sur mesure</Link>
              <a href="tel:+33766153102" className="btn btn-outline">📞 07 66 15 31 02</a>
            </div>
          </div>
        </div>
      </section>
      <NewArrivalsToast items={newItems} />
    </>
  );
}
