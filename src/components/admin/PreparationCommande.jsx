"use client";

// =============================================================================
// PRÉPARATION D'UNE COMMANDE (13/10/2026, gérant sur « Fiches complètes » : « je t'ai demandé de mettre
// là aussi tout ce qui est consommable… quand je prépare les commandes, ils sont où »).
// Le même bloc que la file de production : 📦 Conditionnement (matériel utilisé → le stock baisse) et
// « ✗ Raté — à refaire » par article. Réutilise Conditionnement.jsx et Rates.jsx, rien de neuf.
// =============================================================================

import { BlocConditionnement } from "@/components/admin/Conditionnement";
import BoutonRate from "@/components/admin/Rates";
import { apparierSpec } from "@/lib/orderSpec";

export default function PreparationCommande({ o, mat, adminKey, onCond, onMat }) {
  const statut = o.status || "a_preparer";
  if (["annulee", "remboursee"].includes(statut)) return null;
  const specParLigne = apparierSpec(o.items, o.spec);
  const lignes = (o.items || []).map((it, i) => ({ it, s: specParLigne[i] }))
    .filter(({ it }) => it.slug && !/livraison|point relais|retrait/i.test(it.name || ""));
  const enCours = ["a_preparer", "en_gravure"].includes(statut);
  return (
    <div style={{ margin: "0 0 10px" }}>
      {enCours && lignes.length ? (
        <div className="rt-items">
          {lignes.map(({ it, s }, i) => (
            <div key={i}>
              {lignes.length > 1 ? <div className="rt-nom">{it.name}</div> : null}
              <BoutonRate o={o} item={{ slug: it.slug, name: it.name, variantTitle: s?.variantTitle || "", variantId: s?.variantId, variantDetail: s?.variantDetail || it.variantDetail }} mat={mat} adminKey={adminKey} onSaved={onMat} />
            </div>
          ))}
        </div>
      ) : null}
      <BlocConditionnement o={o} mat={mat} onOpen={() => onCond(o)} />
    </div>
  );
}
