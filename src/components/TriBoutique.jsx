"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

// =============================================================================
// TRI + BUDGET sur la boutique (audit du 19/09/2026, validé « applique »).
// Deux menus discrets ; le choix se garde dans l'adresse (?tri=&budget=) pour
// se combiner avec les catégories, sous-catégories et la recherche existantes.
// Le tri s'applique côté serveur (page boutique) — ici on ne fait que naviguer.
// =============================================================================
export default function TriBoutique() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const set = (cle, valeur) => {
    const q = new URLSearchParams(sp.toString());
    if (valeur) q.set(cle, valeur); else q.delete(cle);
    router.push(`${pathname}${q.toString() ? `?${q.toString()}` : ""}`, { scroll: false });
  };

  return (
    <div className="tri-bar">
      <label className="tri-item">
        <span>Trier</span>
        <select value={sp.get("tri") || ""} onChange={(e) => set("tri", e.target.value)}>
          <option value="">Nos suggestions</option>
          <option value="prix-croissant">Prix croissant</option>
          <option value="prix-decroissant">Prix décroissant</option>
          <option value="nouveautes">Nouveautés d&apos;abord</option>
        </select>
      </label>
      <label className="tri-item">
        <span>Budget</span>
        <select value={sp.get("budget") || ""} onChange={(e) => set("budget", e.target.value)}>
          <option value="">Tous les prix</option>
          <option value="moins20">Moins de 20 €</option>
          <option value="20-40">20 à 40 €</option>
          <option value="plus40">40 € et plus</option>
        </select>
      </label>
    </div>
  );
}
