import { isAdmin, getEmailStats } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Résultats des campagnes : qui a ouvert, qui a cliqué, qui n'a rien fait.
// Sert aussi à préparer une relance ciblée (liste "pasOuvert").
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const stats = await getEmailStats();
  const campagnes = Object.entries(stats)
    .map(([id, c]) => {
      const recipients = c.recipients || [];
      const opens = c.opens || {};
      const clicks = c.clicks || {};
      const ouvreurs = Object.keys(opens);
      const cliqueurs = Object.keys(clicks);
      // Quels produits ont été cliqués, et combien de fois (le vrai signal d'intérêt).
      const parProduit = {};
      for (const liste of Object.values(clicks)) {
        for (const clic of liste) {
          const m = String(clic.url || "").match(/\/produit\/([a-z0-9-]+)/i);
          const cle = m ? m[1] : "boutique";
          parProduit[cle] = (parProduit[cle] || 0) + 1;
        }
      }
      const pct = (n) => (recipients.length ? Math.round((n / recipients.length) * 100) : 0);
      return {
        id,
        subject: c.subject || "",
        at: c.at || 0,
        envoyes: recipients.length,
        ouvertures: ouvreurs.length,
        tauxOuverture: pct(ouvreurs.length),
        clics: cliqueurs.length,
        tauxClic: pct(cliqueurs.length),
        ouvreurs,
        cliqueurs,
        // Pour une relance : celles qui n'ont pas ouvert.
        pasOuvert: recipients.filter((e) => !opens[e]),
        parProduit: Object.entries(parProduit).sort((a, b) => b[1] - a[1]),
      };
    })
    .sort((a, b) => b.at - a.at);
  return Response.json({ campagnes });
}
