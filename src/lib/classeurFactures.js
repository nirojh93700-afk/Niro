// 🧾 Classeur des factures (15/11/2026, maquette « Niv Admin ») : calculs purs (testables).
// Réunit les factures rangées, les achats (Achats & factures) et les dépenses (Bénéfices) pour dire
// ce qui a sa pièce d'origine et ce qui n'en a pas encore.
export const FORMATS_FACTURE = /^(application\/pdf|image\/(jpeg|png|webp|heic|heif))$/;
export const TAILLE_MAX_FACTURE = 12 * 1024 * 1024;

const mois = (d) => String(d || "").slice(0, 7);

export function etatClasseur({ factures = [], purchases = [], expenses = [] }, maintenant = new Date()) {
  const achatAvecPiece = new Set(factures.filter((f) => f.achatId).map((f) => f.achatId));
  const depenseAvecPiece = new Set(factures.filter((f) => f.depenseId).map((f) => f.depenseId));
  // Une dépense créée par un achat est couverte si cet achat a sa facture.
  for (const p of purchases) if (p.expenseId && achatAvecPiece.has(p.id)) depenseAvecPiece.add(p.expenseId);

  const lignes = factures.map((f) => ({ ...f, etat: f.aVerifier ? "verifier" : "rangee" }));
  for (const p of purchases) {
    if (achatAvecPiece.has(p.id)) continue;
    lignes.push({
      id: "achat:" + p.id, achatId: p.id, fournisseur: p.supplier || "Fournisseur", libelle: (p.lines || []).map((l) => `${l.product || l.label || ""}${l.qty ? ` × ${l.qty}` : ""}`).filter(Boolean).join(", ").slice(0, 140),
      numero: p.invoiceNumber || "", date: p.date || new Date(p.at || 0).toISOString().slice(0, 10), montant: Number(p.total) || 0, categorie: "marchandises", fichier: null, etat: "manquante",
      note: p.fileName ? `lue le ${new Date(p.at).toLocaleDateString("fr-FR")} (« ${p.fileName} »), fichier d'origine non gardé` : "sans fichier d'origine",
    });
  }
  const manquantesDepenses = [];
  for (const e of expenses) {
    if (!e || !e.id || depenseAvecPiece.has(e.id)) continue;
    if (purchases.some((p) => p.expenseId === e.id && !achatAvecPiece.has(p.id))) continue; // déjà listée par son achat
    manquantesDepenses.push({ id: "depense:" + e.id, depenseId: e.id, fournisseur: e.label || "Dépense", libelle: e.category || "", date: e.date || "", montant: Number(e.amount) || 0, categorie: e.category === "achat" ? "marchandises" : "autre", fichier: null, etat: "manquante", note: "dépense de Bénéfices sans pièce" });
  }
  const toutes = [...lignes, ...manquantesDepenses].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const ceMois = maintenant.toISOString().slice(0, 7), cetteAnnee = String(maintenant.getFullYear());
  const somme = (l) => Math.round(l.reduce((s, x) => s + (Number(x.montant) || 0), 0) * 100) / 100;
  const duMois = toutes.filter((x) => mois(x.date) === ceMois);
  const deLAnnee = toutes.filter((x) => String(x.date).startsWith(cetteAnnee));
  return {
    lignes: toutes,
    kpis: {
      mois: { montant: somme(duMois), n: duMois.length },
      annee: { montant: somme(deLAnnee), n: deLAnnee.length },
      verifier: toutes.filter((x) => x.etat === "verifier").length,
      manquantes: toutes.filter((x) => x.etat === "manquante").length,
    },
    moisListe: [...new Set(toutes.map((x) => mois(x.date)).filter(Boolean))].sort().reverse(),
    fournisseurs: [...new Set(toutes.map((x) => x.fournisseur).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")),
  };
}

export function chercher(lignes, q) {
  const t = String(q || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  if (!t) return lignes;
  const mots = t.split(/\s+/);
  return lignes.filter((x) => {
    const h = [x.fournisseur, x.libelle, x.numero, String(x.montant).replace(".", ","), x.date].join(" ").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return mots.every((m) => h.includes(m));
  });
}
