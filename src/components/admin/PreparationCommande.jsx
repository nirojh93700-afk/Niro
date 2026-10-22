"use client";

// =============================================================================
// PRÉPARATION D'UNE COMMANDE (13/10/2026, gérant sur « Fiches complètes » : « je t'ai demandé de mettre
// là aussi tout ce qui est consommable… quand je prépare les commandes, ils sont où »).
// Le même bloc que la file de production : 📦 Conditionnement (matériel utilisé → le stock baisse) et
// « ✗ Raté — à refaire » par article. Réutilise Conditionnement.jsx et Rates.jsx, rien de neuf.
// =============================================================================

import { BlocConditionnement } from "@/components/admin/Conditionnement";
import { RatesCommande } from "@/components/admin/Rates";

export default function PreparationCommande({ o, mat, adminKey, onCond, onMat }) {
  const statut = o.status || "a_preparer";
  if (["annulee", "remboursee"].includes(statut)) return null;
  return (
    <div style={{ margin: "0 0 10px" }}>
      <RatesCommande o={o} mat={mat} adminKey={adminKey} onSaved={onMat} />
      <BlocConditionnement o={o} mat={mat} onOpen={() => onCond(o)} />
    </div>
  );
}
