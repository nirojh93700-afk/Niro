"use client";

// PAGE DU DEVIS : EMBALLAGE + « COMPLÉTER VOTRE COMMANDE » (02/11/2026, maquette validée
// https://claude.ai/artifact/Lo8LopW8uKma8KuAgriD6a, « applique »).
// ① « Votre emballage » : les mêmes emballages que la fiche du produit du devis (+ l'emballage de Noël
//    replié quand Noël est allumé) ; le total du devis se met à jour.
// ② « Compléter votre commande » : quelques articles du site. Toucher un article met le devis dans le
//    panier et ouvre la fiche ; « Ajouter ce devis à mon panier » fait de même sans quitter la page.
// Tout se paie ensuite en une fois au panier (une commande, une livraison) ; le serveur relit le devis
// (`/api/checkout`, `src/lib/devisPanier.js`) : le prix du navigateur n'est jamais utilisé.
// Sans emballage choisi, le règlement direct du devis (code promo, livraison, « Payer ») reste là, comme avant.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { emballagesNoelDispo } from "@/lib/fetes";

const euro = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);

export default function DevisPanier({ id, number, totalDevis, n = null, resume = "", grams = 0, principal = null, articles = [], children }) {
  const router = useRouter();
  const { items, addItem, removeItem, setDrawerOpen } = useCart();
  const pk = principal?.packaging?.on && principal.packaging.options?.length ? principal.packaging : null;
  const noelCfg = pk ? principal.packagingNoel : null;
  const [pkgSel, setPkgSel] = useState([]);
  const [noel, setNoel] = useState({ id: "", couleur: "vert" });
  const [noelOpen, setNoelOpen] = useState(false);

  const optPkg = pk ? pk.options.find((o) => o.id === pkgSel[0]) || null : null;
  const singles = pk ? Math.round(pk.options.filter((x) => !/pack/i.test(x.name) && !x.free).reduce((s, x) => s + (Number(x.price) || 0), 0) * 100) / 100 : 0;
  const noelDispo = useMemo(() => (noelCfg ? emballagesNoelDispo(principal, pkgSel) : []), [noelCfg, principal, pkgSel]);
  const noelChoisi = noelDispo.find((o) => o.id === noel.id) || null;
  const coulDe = (o) => (o?.couleurs && noelCfg ? (noelCfg.couleurs.find((c) => c.id === noel.couleur) || noelCfg.couleurs[0]) : null);
  const extra = (Number(optPkg?.price) || 0) + (Number(noelChoisi?.prix) || 0);
  const total = Math.round((Number(totalDevis) + extra) * 100) / 100;
  const enBoite = /boite|pack/i.test(String(pkgSel[0] || "")) || Boolean(noelChoisi?.colis);
  const avecEmballage = Boolean(optPkg) || Boolean(noelChoisi);

  function choisirPkg(ids) {
    setPkgSel(ids);
    // L'emballage de Noël choisi ne rentre plus avec la nouvelle présentation : il se retire.
    if (noel.id && noelCfg && !emballagesNoelDispo(principal, ids).some((o) => o.id === noel.id)) setNoel((p) => ({ ...p, id: "" }));
  }

  // Met le devis dans le panier (une seule ligne : un devis déjà présent est remplacé).
  function mettreAuPanier() {
    for (const it of items) if (it?.devis?.id === id) removeItem(it.key);
    const emb = [optPkg ? `${/pack/i.test(optPkg.name) ? "Pack boîte cadeau" : optPkg.name} (+${euro(optPkg.price)})` : "",
      noelChoisi ? `Emballage de Noël : ${noelChoisi.nom}${coulDe(noelChoisi) ? ` · ${coulDe(noelChoisi).nom.toLowerCase()}` : ""} (+${euro(noelChoisi.prix)})` : ""].filter(Boolean).join(" · ");
    addItem({
      productSlug: principal?.slug || "",
      variantId: `devis:${id}`,
      devis: { id, ...(n != null ? { n } : {}) },
      name: `Devis ${number}`,
      variantTitle: resume,
      price: total,
      image: principal?.image || null,
      personalization: emb ? `Emballage : ${emb}` : "",
      packaging: pkgSel,
      packagingNoel: noelChoisi ? { id: noelChoisi.id, couleur: coulDe(noelChoisi)?.id || null } : undefined,
      verresFixe: true, // un devis = une ligne, quantité fixe (le nombre de pièces se règle sur la page du devis)
      pickup: false,
      weight: grams,
      quantity: 1,
    });
  }

  // Vers une autre page : le panier latéral ne reste pas ouvert par-dessus la fiche.
  function allerA(href) {
    mettreAuPanier();
    setDrawerOpen(false);
    router.push(href);
  }
  // Rester sur la page : le panier latéral s'ouvre et montre le devis ajouté.
  function ajouterSeul() {
    mettreAuPanier();
  }

  return (
    <>
      {pk && (
        <section className="dz no-print" id="dz-emb">
          <h3>Votre emballage</h3>
          <p className="dz-lead">Choisissez la présentation de votre {principal.category === "bijoux" ? "bijou" : "commande"}. Le total se met à jour.</p>
          <div className="dz-embs" role="radiogroup" aria-label="Votre emballage">
            <label className={`dz-emb${!optPkg ? " on" : ""}`}>
              <input type="radio" name="dz-emb" checked={!optPkg} onChange={() => choisirPkg([])} />
              <span className="dz-ph"><span className="dz-x">✕</span></span>
              <span className="dz-tx"><b>Sans emballage cadeau</b><small>Livré protégé, sans boîte</small></span>
              <span className="dz-pr">0 €</span>
            </label>
            {pk.options.map((o) => {
              const isPack = /pack/i.test(o.name);
              const on = optPkg?.id === o.id;
              return (
                <label key={o.id} className={`dz-emb${on ? " on" : ""}`}>
                  <input type="radio" name="dz-emb" checked={on} onChange={() => choisirPkg([o.id])} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <span className="dz-ph">{o.photo ? <img src={o.photo} alt="" /> : <span className="dz-x">🎁</span>}</span>
                  <span className="dz-tx"><b>{isPack ? "Pack boîte cadeau" : o.name}{isPack ? <em className="dz-best">Meilleur choix</em> : null}</b>{o.desc ? <small>{o.desc}</small> : null}</span>
                  <span className="dz-pr">{isPack && singles > o.price ? <s>{euro(singles)}</s> : null}{Number(o.price) > 0 ? `+${euro(o.price)}` : "Offert"}</span>
                </label>
              );
            })}
          </div>

          {noelCfg && noelDispo.length > 0 && (
            noelOpen ? (
              <div className="dz-noelbox">
                <div className="dz-noelt"><b>🎄 Votre emballage de Noël</b><button type="button" onClick={() => setNoelOpen(false)}>Fermer ▴</button></div>
                <p className="dz-lead">{pkgSel.length ? "Votre emballage choisi ci-dessus est glissé dedans, prêt à offrir." : "Le bijou est glissé dedans, prêt à offrir."} Touchez à nouveau l&apos;emballage choisi pour le retirer.</p>
                <div className="dz-embs">
                  {noelDispo.map((o) => {
                    const on = noelChoisi?.id === o.id;
                    const ph = coulDe(o) && o.id === "ruban" ? coulDe(o).photo : o.photo;
                    return (
                      <button type="button" key={o.id} className={`dz-emb${on ? " on" : ""}`} onClick={() => setNoel((p) => ({ ...p, id: p.id === o.id ? "" : o.id }))}>
                        <span className="dz-ok" aria-hidden="true">{on ? "✓" : ""}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <span className="dz-ph">{ph ? <img src={ph} alt="" /> : <span className="dz-x">🎄</span>}</span>
                        <span className="dz-tx"><b>{o.nom}</b><small>{o.d}{o.colis ? " · part en colis" : " · reste en lettre suivie"}</small></span>
                        <span className="dz-pr">{o.barre ? <s>{euro(o.barre)}</s> : null}+{euro(o.prix)}</span>
                      </button>
                    );
                  })}
                </div>
                {noelChoisi?.couleurs && (
                  <div className="dz-coul">
                    {noelCfg.couleurs.map((c) => {
                      const on = coulDe(noelChoisi)?.id === c.id;
                      return (
                        <button type="button" key={c.id} className={on ? "on" : ""} style={{ "--c": c.hex }} onClick={() => setNoel((p) => ({ ...p, couleur: c.id }))}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.photo} alt="" /><span><i></i>{c.nom}{on ? " · choisi" : ""}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <p className="dz-note">{noelCfg.etiquette?.photo ? <img className="dz-etq" src={noelCfg.etiquette.photo} alt="" /> : null}Avec chaque emballage de Noël, l&apos;étiquette « Merry Christmas » et sa ficelle sont offertes.</p>
              </div>
            ) : (
              <button type="button" className="dz-noel" onClick={() => setNoelOpen(true)}>
                <span aria-hidden="true">🎄</span>
                <span className="dz-tx">{noelChoisi
                  ? <><b>Emballage de Noël : {noelChoisi.nom}{coulDe(noelChoisi) ? ` · ${coulDe(noelChoisi).nom.toLowerCase()}` : ""}</b><small>+{euro(noelChoisi.prix)} · étiquette offerte</small></>
                  : <><b>Ajouter un emballage de Noël</b><small>facultatif · dès {euro(Math.min(...noelDispo.map((o) => Number(o.prix) || 0)))} · selon l&apos;emballage choisi</small></>}</span>
                <span className="dz-voir">{noelChoisi ? "Modifier" : "Voir ▾"}</span>
              </button>
            )
          )}

          <div className="dz-tot"><span>Total du devis</span><b>{euro(total)}</b></div>
          <p className="dz-note">{principal.letter
            ? (enBoite ? "Avec une boîte, votre bijou part en colis : livraison choisie au paiement." : "Livraison en lettre suivie, choisie au paiement.")
            : "Livraison choisie au paiement."}</p>
        </section>
      )}

      {articles.length > 0 && (
        <section className="dz no-print" id="dz-plus">
          <h3>Compléter votre commande</h3>
          <p className="dz-lead">Touchez un article : votre devis passe dans votre panier et la fiche s&apos;ouvre sur le site. Vous ajoutez l&apos;article avec sa gravure, puis vous payez tout en une fois, avec une seule livraison.</p>
          <div className="dz-rail">
            {articles.map((a) => (
              <button type="button" key={a.slug} className="dz-card" onClick={() => allerA(`/produit/${a.slug}`)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="dz-cimg"><img src={a.image} alt="" loading="lazy" />{a.badge ? <i className="dz-badge">{a.badge}</i> : null}</span>
                <span className="dz-cn">{a.name}</span>
                {a.sub ? <span className="dz-cs">{a.sub}</span> : null}
                <span className="dz-cp">{a.des ? "dès " : ""}{euro(a.price)}</span>
                <span className="dz-go">Voir et ajouter</span>
              </button>
            ))}
          </div>
          <div className="dz-btns">
            <button type="button" className="dz-cart" onClick={ajouterSeul}>Ajouter ce devis à mon panier</button>
            <a className="dz-shop" href="/boutique" onClick={(e) => { e.preventDefault(); allerA("/boutique"); }}>Voir toute la boutique →</a>
          </div>
        </section>
      )}

      {avecEmballage ? (
        <section className="dz no-print">
          <h3>Régler avec votre emballage</h3>
          <p className="dz-lead">Avec un emballage cadeau, votre devis se règle par le panier : la livraison et le code promo se choisissent à l&apos;étape suivante.</p>
          <div className="dz-btns">
            <button type="button" className="dz-cart" onClick={() => allerA("/panier")}>Ajouter au panier et payer · {euro(total)}</button>
          </div>
        </section>
      ) : children}

    </>
  );
}
