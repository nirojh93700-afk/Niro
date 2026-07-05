import Link from "next/link";

export const metadata = { title: "Réglages produits — Niv Création" };

// Page dédiée qui regroupe les outils de réglage « visuels » des produits
// (placement des gravures / photos). Séparé et rangé, un outil par carte.
const TOOLS = [
  {
    href: "/gestion/cristal-reglage",
    icon: "💎",
    title: "Réglage cristaux (photo)",
    desc: "Placez la photo du client sur la vraie photo de chaque cristal (cœur, rectangle, pyramide, trophée, blocs). Vous glissez le cadre, vous enregistrez : la fiche produit l'utilise.",
  },
  {
    href: "/gestion/couverts-reglage",
    icon: "🍴",
    title: "Réglage couverts",
    desc: "Réglez la position et la taille du prénom et du motif gravés sur chaque couvert enfant. Un réglage commun, toujours bien placé.",
  },
];

export default function ReglagesHub() {
  return (
    <main className="container" style={{ maxWidth: 720, margin: "24px auto", padding: 16 }}>
      <div style={{ marginBottom: 18 }}>
        <span style={{ fontFamily: "Georgia, serif", textTransform: "uppercase", letterSpacing: ".2em", fontSize: ".72rem", color: "var(--gold-dark, #a98935)" }}>Gestion</span>
        <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 600, margin: "4px 0 6px" }}>Réglages produits</h1>
        <p style={{ color: "var(--ink-soft)", margin: 0 }}>Les outils pour placer les gravures et les photos sur vos produits. Choisissez un outil.</p>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} style={{ display: "flex", gap: 14, alignItems: "flex-start", textDecoration: "none", color: "inherit", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 18px", background: "var(--card, #fffdf8)", boxShadow: "0 4px 14px rgba(120,95,30,.06)" }}>
            <span style={{ fontSize: "1.8rem", lineHeight: 1 }} aria-hidden="true">{t.icon}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontWeight: 700, fontSize: "1.05rem", marginBottom: 4 }}>{t.title}</span>
              <span style={{ display: "block", fontSize: ".9rem", color: "var(--ink-soft)", lineHeight: 1.5 }}>{t.desc}</span>
            </span>
            <span aria-hidden="true" style={{ color: "var(--gold-dark, #a98935)", fontWeight: 700, alignSelf: "center" }}>→</span>
          </Link>
        ))}
      </div>

      <p style={{ marginTop: 22 }}>
        <Link href="/gestion" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>← Retour à la gestion</Link>
      </p>
    </main>
  );
}
