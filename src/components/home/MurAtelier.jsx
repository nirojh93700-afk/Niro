"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";

// « Le mur de l'atelier » (maquette validée le 21/08/2026) : toutes les
// créations du catalogue défilent doucement en trois rangées. La visiteuse
// pose la souris (ou le doigt) → la rangée s'arrête et la pièce montre son nom
// et son prix ; sans clic, le défilement repart tout seul au bout de 4 secondes.
// Le contenu vient du catalogue en direct : un produit ajouté apparaît, un
// produit masqué disparaît — rien à entretenir.
export default function MurAtelier({ items }) {
  const racine = useRef(null);

  useEffect(() => {
    const rangees = racine.current?.querySelectorAll(".mur-r");
    if (!rangees?.length) return;
    const nettoyage = [];
    rangees.forEach((rangee) => {
      let minuteur = null;
      const arreter = () => {
        rangee.classList.add("mur-stop");
        clearTimeout(minuteur);
        minuteur = setTimeout(() => rangee.classList.remove("mur-stop"), 4000);
      };
      const reprendre = () => {
        clearTimeout(minuteur);
        rangee.classList.remove("mur-stop");
      };
      rangee.addEventListener("pointerenter", arreter);
      rangee.addEventListener("pointermove", arreter);
      rangee.addEventListener("touchstart", arreter, { passive: true });
      rangee.addEventListener("pointerleave", reprendre);
      nettoyage.push(() => {
        clearTimeout(minuteur);
        rangee.removeEventListener("pointerenter", arreter);
        rangee.removeEventListener("pointermove", arreter);
        rangee.removeEventListener("touchstart", arreter);
        rangee.removeEventListener("pointerleave", reprendre);
      });
    });
    return () => nettoyage.forEach((f) => f());
  }, []);

  if (!items?.length) return null;
  // Trois rangées équilibrées (1 produit sur 3 dans chacune).
  const rangees = [items.filter((_, i) => i % 3 === 0), items.filter((_, i) => i % 3 === 1), items.filter((_, i) => i % 3 === 2)];

  return (
    <section className="mur" ref={racine}>
      <div className="container">
        <div className="section-head">
          <span className="mur-compteur">✦ L'atelier au complet · {items.length} créations</span>
          <h2>Toutes nos créations, d'un seul regard</h2>
          <p>
            Le mur défile tout seul — touchez une pièce pour l'arrêter et voir son nom
            et son prix ; sans clic, il repart au bout de quelques secondes.
          </p>
        </div>
      </div>
      <div className="mur-rails">
        {rangees.map((rangee, i) => (
          <div className={i === 1 ? "mur-r mur-inv" : "mur-r"} key={i}>
            <div className="mur-piste">
              {[0, 1].map((copie) => (
                // La rangée est doublée pour un défilement sans couture ; la
                // copie est purement décorative (aria-hidden, non focusable).
                <div className="mur-serie" key={copie} aria-hidden={copie === 1 || undefined}>
                  {rangee.map((it) => (
                    <Link
                      key={`${copie}-${it.slug}`}
                      className="mur-t"
                      href={`/produit/${it.slug}`}
                      aria-label={it.name}
                      tabIndex={copie === 1 ? -1 : undefined}
                    >
                      <Image src={it.image} alt={copie === 1 ? "" : it.name} width={150} height={150} sizes="118px" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span className="mur-l">
                        <b>{it.name}</b>
                        {it.prixTexte ? <i>{it.prixTexte}</i> : null}
                      </span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mur-cta">
        <Link href="/boutique" className="btn btn-gold">Parcourir toute la boutique</Link>
      </div>
    </section>
  );
}
