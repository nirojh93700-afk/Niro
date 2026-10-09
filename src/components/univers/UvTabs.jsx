import Link from "next/link";

// Onglets des univers (en haut des pages univers, boutique et offrir) + fil d'Ariane.
export function UvTabs({ univers, courant, total }) {
  return (
    <nav className="uv-tabs" aria-label="Univers">
      <Link className="puce" href="/">Accueil</Link>
      {univers.map((u) => (
        <Link key={u.id} className="puce" href={`/boutique/${u.id}`} aria-current={courant === u.id ? "page" : "false"}>{u.nom} <small>{u.count}</small></Link>
      ))}
      <Link className="puce" href="/boutique" aria-current={courant === "boutique" ? "page" : "false"}>Tout <small>{total}</small></Link>
      <Link className="puce" href="/offrir" aria-current={courant === "offrir" ? "page" : "false"}>Offrir</Link>
    </nav>
  );
}

export function Crumb({ items }) {
  return (
    <nav className="crumb" aria-label="Fil d’Ariane">
      <Link href="/">Accueil</Link>
      {items.map((it, i) => (
        <span key={i} style={{ display: "contents" }}>
          <span>/</span>
          {it.href ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}
