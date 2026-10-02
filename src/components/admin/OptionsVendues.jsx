"use client";

// Encadré « VENDU EN PLUS — à ne pas oublier » des fiches de travail (écran,
// papier, page Atelier). Un article par bloc, ses options en clair : emballage,
// coffret, socle, date, 2e face, lot… et le mode de livraison (express en rouge).
// Demande du gérant, 02/10/2026 : « il faut que ça soit bien précisé, faut pas
// que je me trompe ». Calcul dans src/lib/optionsVendues.js.
import { optionsCommande } from "@/lib/optionsVendues";
import { formatEuro } from "@/lib/format";

export default function OptionsVendues({ order, papier = false }) {
  if (!order) return null;
  const { articles, livraison, nbOptions } = optionsCommande(order);
  if (!articles.length) return null;
  const cls = papier ? "fp-encadre alerte ov ov-papier" : "ov";
  return (
    <div className={cls}>
      <div className="ov-titre">
        🧾 Vendu en plus — à ne pas oublier
        <span className="ov-sous">{nbOptions ? `${nbOptions} option${nbOptions > 1 ? "s" : ""} au total` : "aucune option : pièces seules, telles quelles"}</span>
      </div>
      {articles.map((a, i) => (
        <div key={i} className="ov-art">
          <div className="ov-nom">
            <b>{a.quantite} × {a.nom}</b>{a.variantTitle ? <span className="ov-var"> — {a.variantTitle}</span> : null}
            {a.quantite > 1 ? <span className="ov-qte">⚠️ {a.quantite} exemplaires</span> : null}
            {a.prix ? <span className="ov-prix">{formatEuro(a.prix)}</span> : null}
          </div>
          {a.options.length ? (
            <ul className="ov-liste">
              {a.options.map((o, j) => (
                <li key={j} className={o.physique ? "ov-phys" : ""}>
                  <span className="ov-puce">{o.physique ? "📦" : "✒️"}</span>
                  <b>{o.libelle}</b>{o.detail ? ` : ${o.detail}` : ""}
                  {o.montant > 0 ? <span className="ov-montant">+{formatEuro(o.montant)}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="ov-rien">Rien en plus — pièce seule{a.sansReglages ? " (ancienne commande, sans réglages enregistrés)" : ""}.</div>
          )}
        </div>
      ))}
      {livraison.texte ? (
        <div className={`ov-livr${livraison.express ? " express" : ""}`}>
          🚚 Livraison : <b>{livraison.texte}</b>
          {livraison.express ? " — ⚡ EXPRESS : à graver EN PRIORITÉ" : ""}
          {livraison.retrait ? " — remise en main propre" : ""}
        </div>
      ) : null}
    </div>
  );
}
