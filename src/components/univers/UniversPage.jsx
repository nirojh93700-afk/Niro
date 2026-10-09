import Reveal from "./Reveal";
import PageUnivers from "./PageUnivers";
import CoffretSavane from "./CoffretSavane";
import { UvTabs, Crumb } from "./UvTabs";
import { getCatalog } from "@/lib/catalog";
import { rangerCatalogue, cartesPuzzles, POURQUI } from "@/lib/univers";

// Une page univers complète (maquette « Mélange ») : onglets, en-tête (fil
// d'Ariane, titre, accroche, nombre, photo), puis la barre des rayons et les
// rayons. `uid` = un univers ou « boutique » (toute la boutique).
export default async function UniversPage({ uid }) {
  const catalog = await getCatalog().catch(() => []);
  const R = rangerCatalogue(catalog);
  const u = R.getUnivers(uid);
  if (!u) return null;
  const rayons = u.rayons.map((r) => ({
    id: r.id, nom: r.nom, bientot: r.bientot || "",
    cards: r.bientot === "puzzles" ? cartesPuzzles() : r.slugs.map(R.carteDe).filter(Boolean),
  })).filter((r) => r.bientot || r.cards.length);
  const items = uid === "boutique" ? [{ label: u.nom }] : [{ label: "Boutique", href: "/boutique" }, { label: u.nom }];
  return (
    <div className="mx">
      <Reveal />
      <div className="uv">
        <UvTabs univers={R.univers} courant={uid} total={R.boutique.count} />
        <article className="mxup" id={`u-${uid}`}>
          <header className="mxup-head">
            <div className="mxup-txt">
              <Crumb items={items} />
              <h1 style={{ fontSize: "clamp(2.2rem,5vw,4rem)" }}>{u.nom}</h1>
              <p>{u.accroche}</p>
              <p className="mxup-count">{u.count} créations</p>
            </div>
            <figure className="mxup-fig">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u.img} alt="" />
            </figure>
          </header>
          <PageUnivers uid={uid} rayons={rayons} pourqui={!!u.pourqui} pourquiLabels={POURQUI}
            coffret={uid === "enfants" ? <CoffretSavane id="enfants" carteDe={R.carteDe} /> : null} />
        </article>
      </div>
    </div>
  );
}
