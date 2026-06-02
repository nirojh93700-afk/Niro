import Link from "next/link";

// Petit menu en haut des maquettes pour passer de l'une à l'autre.
export default function MockupSwitcher({ current }) {
  const styles = [1, 2, 3];
  const labels = { 1: "Éditorial", 2: "Immersif", 3: "Manifeste" };
  return (
    <div className="mockbar">
      <span className="lbl">Maquettes</span>
      {styles.map((n) => (
        <Link key={n} href={`/style-${n}`} className={n === current ? "active" : ""}>
          {n}. {labels[n]}
        </Link>
      ))}
    </div>
  );
}
