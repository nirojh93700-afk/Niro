"use client";

// =============================================================================
// TAILLES & COÛTS CONSEILLÉS (admin) — page de référence (guide).
// Base bois : plaque A3 (42 × 30 cm) tilleul/contreplaqué 3 mm = 2,40 € la plaque
// (lot de 15 à 35,99 €). Le bois ne coûte presque rien : le vrai coût, c'est le
// TEMPS (découpe + gravure + finition). Les « prix conseillés » sont indicatifs.
// =============================================================================
import Link from "next/link";

const SHEET_PRICE = 2.4; // € par plaque A3 (42 × 30 cm)

const ROWS = [
  {
    nom: "Ronds de serviette",
    taille: "Ø ~5 cm (hexagone / cercle / cœur)",
    parPlaque: 30,
    actuel: "4,50 € (fait)",
    conseille: "4,50 € · 3,50 €/20 · 2,90 €/50",
    note: "Achetés en grande quantité (1 par invité) → le dégressif déclenche les grosses commandes.",
  },
  {
    nom: "Étiquette de serviette (initiales)",
    taille: "~3 × 8 cm",
    parPlaque: 35,
    actuel: "5,90 €",
    conseille: "≈ 4,90 €",
    note: "Très petite pièce, gravure rapide. Marge énorme même à 4,90 €.",
  },
  {
    nom: "Numéro de table — Eucalyptus / Feuillage / Arche géométrique",
    taille: "~13 × 18 cm",
    parPlaque: 4,
    actuel: "14,90 € · 12,90 € (lot)",
    conseille: "≈ 12,90 € · 10,90 € (lot)",
    note: "Pièce décorative, peu d'unités par mariage (10-20). Reste premium.",
  },
  {
    nom: "Numéro de table — Arches Bohèmes",
    taille: "~15 × 20 cm",
    parPlaque: 3,
    actuel: "18,90 € · 16,90 € (lot)",
    conseille: "≈ 14,90 € · 12,90 € (lot)",
    note: "Plus grand et plus détaillé → un peu plus cher que les autres numéros.",
  },
  {
    nom: "Menu de mariage en bois gravé",
    taille: "~10 × 21 cm",
    parPlaque: 4,
    actuel: "34,90 € · 31,90 € (lot)",
    conseille: "≈ 22,90 € · 19,90 € (lot)",
    note: "Beaucoup de texte à graver = beaucoup de TEMPS machine. Reste le produit le plus cher (justifié).",
  },
];

function woodCost(parPlaque) {
  return SHEET_PRICE / parPlaque; // € de bois par pièce
}

export default function TaillesConseilleesPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 920 }}>
        <Link href="/gestion" className="link-underline" style={{ fontSize: "0.9rem" }}>← Retour à la gestion</Link>
        <h2 style={{ fontFamily: "Georgia, serif", color: "var(--gold-dark)", marginTop: 10 }}>📐 Tailles &amp; coûts conseillés</h2>
        <p style={{ color: "var(--ink-soft)" }}>
          Guide de référence pour tes produits en bois. <strong>Base :</strong> 1 plaque A3 (42 × 30 cm,
          tilleul 3 mm) = <strong>2,40 €</strong> (lot de 15 à 35,99 €).
        </p>

        <div style={{ background: "#fbf4e6", border: "1px solid #e7d3a1", borderRadius: 12, padding: "14px 16px", margin: "12px 0 22px" }}>
          <strong style={{ color: "var(--gold-dark)" }}>À retenir :</strong> le bois ne coûte <strong>presque rien</strong>
          {" "}(quelques centimes par pièce). Ton vrai coût, c'est le <strong>temps</strong> (découpe + gravure + finition + emballage).
          Donc fixe tes prix selon le <strong>temps</strong> et le <strong>marché</strong>, pas selon le bois. Les « prix conseillés » ci-dessous sont <em>indicatifs</em>.
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "var(--paper)", textAlign: "left" }}>
                <th style={{ padding: "10px 8px", borderBottom: "2px solid var(--line)" }}>Produit</th>
                <th style={{ padding: "10px 8px", borderBottom: "2px solid var(--line)" }}>Taille conseillée</th>
                <th style={{ padding: "10px 8px", borderBottom: "2px solid var(--line)" }}>Pièces / plaque A3</th>
                <th style={{ padding: "10px 8px", borderBottom: "2px solid var(--line)" }}>Coût bois / pièce</th>
                <th style={{ padding: "10px 8px", borderBottom: "2px solid var(--line)" }}>Prix actuel</th>
                <th style={{ padding: "10px 8px", borderBottom: "2px solid var(--line)" }}>Prix conseillé</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.nom} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px 8px", fontWeight: 600 }}>{r.nom}<div style={{ fontWeight: 400, color: "var(--ink-soft)", fontSize: "0.82rem", marginTop: 3 }}>{r.note}</div></td>
                  <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{r.taille}</td>
                  <td style={{ padding: "10px 8px", textAlign: "center" }}>~{r.parPlaque}</td>
                  <td style={{ padding: "10px 8px", textAlign: "center", color: "#256b34", fontWeight: 600 }}>~{woodCost(r.parPlaque).toFixed(2).replace(".", ",")} €</td>
                  <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{r.actuel}</td>
                  <td style={{ padding: "10px 8px", whiteSpace: "nowrap", color: "var(--gold-dark)", fontWeight: 600 }}>{r.conseille}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ color: "var(--ink-soft)", fontSize: "0.84rem", marginTop: 18 }}>
          <strong>Comment je calcule le bois :</strong> surface de la plaque A3 (1260 cm²) ÷ surface d'une pièce
          (avec un peu de marge de découpe) = nombre de pièces par plaque. Puis 2,40 € ÷ ce nombre = coût bois par pièce.
          Ajoute ~0,20–0,30 € (électricité laser, colle/finition, sachet) pour le coût matière total.
        </p>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.84rem" }}>
          Pour appliquer un prix conseillé, dis-le-moi (ou change-le toi-même dans <strong>Catalogue → Produits</strong>).
        </p>
      </div>
    </section>
  );
}
