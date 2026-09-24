"use client";

// =============================================================================
// FICHE PAPIER — la feuille qui sort de l'imprimante pour une commande.
// -----------------------------------------------------------------------------
// Demande du gérant (24/09/2026) : « il faut que ça soit concentré pour une
// feuille A4 et correctement, comme un truc professionnel — corrige pour toutes
// les commandes » + « il faut que ça soit bien détaillé avec tous les détails de
// la commande, image comprise ».
//
// D'où cette mise en page PAPIER dédiée (elle ne reprend PAS l'écran) :
//   · colonne gauche  = ce qu'on lit (client, livraison, articles, À GRAVER,
//     encadrés d'alerte, détail du prix) ;
//   · colonne droite  = ce qu'on regarde (visuel du verre reconstruit, réglages
//     de chaque article, photo envoyée par la cliente).
// Les styles sont dans `@media print` de globals.css (classes .fp-*), et
// `src/lib/impression.js` réduit l'ensemble juste ce qu'il faut pour tenir sur
// UNE page, quel que soit le nombre d'articles.
//
// Rendue dans un PORTAIL, à la racine de la page : à l'impression, seule cette
// feuille est envoyée à l'imprimante (les autres enfants du body sont masqués).
// Sans ce portail, l'écran très long de la gestion sortait en pages blanches.
// Invisible à l'écran : elle ne sert qu'au papier.
// =============================================================================

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GlassPreview, ReglagesItem } from "@/components/admin/FicheAtelier";
import PhotosEmail from "@/components/admin/PhotosEmail";
import { TableGravure } from "@/lib/engravingSheet";
import { getProductBySlug } from "@/lib/products";
import { formatEuro } from "@/lib/format";

const STATUTS = {
  a_preparer: "À préparer",
  en_gravure: "En fabrication",
  expediee: "Expédiée",
  livree: "Livrée",
  remise_main_propre: "Remise en main propre",
  annulee: "Annulée",
  remboursee: "Remboursée",
};
const CADEAU = { surprise: "Surprise", femme: "Plutôt femme", homme: "Plutôt homme" };

// Une ligne « libellé → valeur » des blocs de gauche. Rien n'est écrit si la
// valeur est vide : la feuille ne doit pas se remplir de lignes creuses.
function L({ k, v }) {
  if (v === null || v === undefined || v === "") return null;
  return (
    <tr>
      <td className="fp-cle">{k}</td>
      <td>{v}</td>
    </tr>
  );
}

export default function FichePapier({ order, fmtDate, adminKey }) {
  const [pret, setPret] = useState(false);
  useEffect(() => setPret(true), []); // portail seulement côté navigateur
  if (!pret || typeof document === "undefined") return null;

  const a = order.shippingAddress || {};
  const adresse = [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(" "), a.country]
    .filter(Boolean).join(", ");
  // Point relais : il contient déjà le transporteur ET l'adresse du point, donc
  // on l'affiche seul ; sinon on affiche le mode de livraison choisi.
  const livraison = order.relaisPoint || order.shippingMethod || "";
  const items = order.items || [];
  const spec = (order.spec || []).filter(Boolean);

  // --- détail du prix (même calcul qu'à l'écran, pour ne pas dire autre chose)
  const total = Number(order.total) || 0;
  const remise = Number(order.discount) || 0;
  const cagnotte = Number(order.cagnotteUsed) || 0;
  const lignes = items.reduce((s, it) => s + (Number(it.subtotal ?? it.total) || 0), 0);
  const sousTotal = Number(order.subtotal) || lignes;
  const port = order.shippingPrice != null ? Number(order.shippingPrice) : Math.max(0, total - lignes);

  const cadeaux = String(order.cadeauChoix || "").split("+").filter(Boolean);

  // La colonne de droite n'existe que s'il y a quelque chose à regarder :
  // sinon la feuille garderait une bande blanche de 300 px pour rien.
  const colonneDroite = spec.length > 0 || Boolean(order.customerEmail);

  return createPortal(
    <div className="zone-impression">
      {/* ------------------------------------------------------------------ */}
      <header className="fp-tete">
        <div>
          <h2>Fiche atelier — à graver à l&apos;identique</h2>
          <p className="fp-sous">
            {fmtDate ? fmtDate(order.createdAt) : ""}
            {order.quoteNumber ? ` · devis ${order.quoteNumber}` : ""}
            {" · "}Niv Création
          </p>
        </div>
        <div className="fp-ref">
          <b>#{order.ref || (order.id || "").slice(-6)}</b>
          {STATUTS[order.status || "a_preparer"] || order.status}
          {total ? ` · ${formatEuro(total)}` : ""}
        </div>
      </header>

      <div className={`fp-corps${colonneDroite ? "" : " seul"}`}>
        {/* ============================ COLONNE GAUCHE ==================== */}
        <div className="fp-col">
          {/* Ce qui ne doit surtout pas être oublié passe TOUT EN HAUT. */}
          {order.alerteInterne ? (
            <div className="fp-encadre alerte">
              <strong>⚠️ Geste promis à ce client</strong>
              <div className="fp-pre">{order.alerteInterne}</div>
            </div>
          ) : null}

          {order.cadeauChoix ? (
            <div className="fp-encadre alerte">
              <strong>
                🎁 {order.cadeauPromis ? "Cadeau PROMIS — à glisser dans le colis" : "Cadeau à glisser dans le colis"}
              </strong>{" "}
              — {cadeaux.length === 2
                ? `Cadeau 1 : ${CADEAU[cadeaux[0]] || cadeaux[0]} · Cadeau 2 : ${CADEAU[cadeaux[1]] || cadeaux[1]}`
                : `préférence : ${CADEAU[order.cadeauChoix] || order.cadeauChoix}`}
              {order.cadeauPromis ? <div className="fp-pre">{order.cadeauPromis}</div> : null}
              {total >= 80 || cadeaux.length === 2 ? <div><strong>Commande ≥ 80 € → DEUX cadeaux</strong></div> : null}
            </div>
          ) : null}

          {order.demande ? (
            <div className="fp-encadre">
              <strong>📋 {order.quoteNumber ? `Devis ${order.quoteNumber} — ` : ""}ce que la cliente a demandé</strong>
              <div className="fp-pre">{order.demande}</div>
            </div>
          ) : null}


          {/* ------------------------- À GRAVER ---------------------------- */}
          {spec.length ? (
            <section className="fp-bloc fp-graver">
              {spec.map((item, i) => {
                const num = String((item.fields || {}).numstyle || "").trim();
                const vignette = num ? getProductBySlug(item.slug)?.styleImages?.[num] : null;
                return (
                  <div key={i} className="fp-graver-item">
                    <TableGravure item={item} />
                    {vignette ? (
                      <div className="fp-dessin">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={vignette} alt={`Dessin n° ${num}`} />
                        <span>Dessin n° {num}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </section>
          ) : null}

          {/* ------------------------- ARTICLES ---------------------------- */}
          <section className="fp-bloc">
            <h3>Articles ({items.reduce((s, it) => s + (Number(it.quantity) || 1), 0)})</h3>
            <table className="fp-table fp-articles">
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{it.quantity}× {it.name}</strong>
                      {it.details ? <div className="fp-detail">{it.details}</div> : null}
                    </td>
                    <td className="fp-prix">{formatEuro(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* --------------------- CLIENT & LIVRAISON ---------------------- */}
          <section className="fp-bloc">
            <h3>Client &amp; livraison</h3>
            <table className="fp-table">
              <tbody>
                <L k="Cliente" v={order.customerName || "—"} />
                <L k="Téléphone" v={order.customerPhone} />
                <L k="E-mail" v={order.customerEmail} />
                <L k="Livrer à" v={[order.shippingName || order.customerName, adresse].filter(Boolean).join(" — ")} />
                <L k="Mode" v={livraison} />
                <L k="Suivi" v={order.tracking} />
              </tbody>
            </table>
          </section>

          {/* ------------------------ DÉTAIL DU PRIX ----------------------- */}
          <section className="fp-bloc">
            <h3>Détail du prix</h3>
            <table className="fp-table fp-argent">
              <tbody>
                <L k={`Sous-total${remise > 0 || cagnotte > 0 ? " (avant remise)" : ""}`} v={formatEuro(sousTotal)} />
                {remise > 0 ? <L k={`Remise${order.promoCode ? ` — ${order.promoCode}` : ""}`} v={`− ${formatEuro(remise)}`} /> : null}
                {cagnotte > 0 ? <L k="Cagnotte fidélité" v={`− ${formatEuro(cagnotte)}`} /> : null}
                <L k="Livraison" v={port > 0 ? formatEuro(port) : "Offerte"} />
                <tr className="fp-total">
                  <td className="fp-cle">Total payé</td>
                  <td>{formatEuro(total)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {order.adminNote ? (
            <section className="fp-bloc">
              <h3>Note interne</h3>
              <div className="fp-pre">{order.adminNote}</div>
            </section>
          ) : null}
        </div>

        {/* ============================ COLONNE DROITE ==================== */}
        {colonneDroite ? (
          <div className="fp-col">
            {spec.map((item, i) => (
              <div key={i} className="fp-visuel">
                <GlassPreview item={item} />
                <div className="fp-legende">
                  {item.name}{item.variantTitle ? ` — ${item.variantTitle}` : ""}
                </div>
                <div className="fp-reglages">
                  <ReglagesItem item={item} titre={false} />
                </div>
              </div>
            ))}
            {order.customerEmail ? (
              <div className="fp-photos">
                <PhotosEmail email={order.customerEmail} adminKey={adminKey} print />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <footer className="fp-pied">
        <span>Niv Création — fiche interne, à graver à l&apos;identique.</span>
        <span>#{order.ref || (order.id || "").slice(-6)}</span>
      </footer>
    </div>,
    document.body
  );
}
