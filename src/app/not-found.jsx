import Link from "next/link";

export default function NotFound() {
  return (
    <div className="center-card">
      <div className="big-emoji">🔍</div>
      <h1>Page introuvable</h1>
      <p style={{ color: "var(--ink-soft)" }}>
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link href="/" className="btn btn-gold">Retour à l'accueil</Link>
    </div>
  );
}
