// Fichier à graver d'un texte dans une autre langue (07/11/2026, maquette v5 : « il faut que je l'aie en
// format pour graver… dans le dossier »). Le SVG est fabriqué par le serveur à la taille réelle (mm),
// lettres en TRACÉS : aucune police à installer dans le logiciel du laser. Aperçu noir sur blanc + bouton.
import { langueDe, langueActive, nomFichierLangue } from "@/lib/traductionGravure";
import { texteAvecDecor } from "@/lib/decorTexte";

export function lienFichierGravure(item, { voir = false } = {}) {
  const f = item?.fields || {};
  if (!langueActive(f) || !langueDe(f.langue)?.police) return null;
  const texte = texteAvecDecor("texte", f.texte, f);
  if (!texte) return null;
  const cleDate = String(f.date || "").trim() ? "date" : "texte2";
  const date = texteAvecDecor(cleDate, f[cleDate], f);
  const ref = String(item.orderRef || item.ref || item.slug || "commande").replace(/[^A-Za-z0-9-]/g, "");
  const nom = `gravure-${ref}${item.verre ? `-verre${item.verre}` : ""}-${nomFichierLangue(f.langue)}-60x30mm.svg`;
  const q = new URLSearchParams({ l: f.langue, t: texte, ...(date ? { d: date } : {}), nom, ...(voir ? { voir: "1" } : {}) });
  return { href: `/api/fichier-gravure?${q}`, nom };
}

export default function FichierGravure({ item }) {
  const a = lienFichierGravure(item);
  const v = lienFichierGravure(item, { voir: true });
  if (!a) return null;
  return (
    <div className="fgv" style={{ margin: "6px 0 10px", padding: "8px 10px", border: "1px solid #c9a24b", borderRadius: 8, background: "#fff" }}>
      <div style={{ fontWeight: 700, color: "#8a6d1f", fontSize: "0.9rem", marginBottom: 6 }}>Fichier à graver — {langueDe(item.fields.langue).nom}</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={v.href} alt="Fichier à graver" style={{ display: "block", width: "100%", maxWidth: 300, aspectRatio: "2 / 1", background: "#fff", border: "1px solid #e7d3a1", borderRadius: 6 }} />
      <a href={a.href} download={a.nom} className="no-print" style={{ display: "inline-block", marginTop: 6, fontWeight: 700, color: "#8a6d1f" }}>⬇ {a.nom}</a>
      <div style={{ fontSize: "0.78rem", color: "#6b5d48" }}>SVG à l&apos;échelle (60 × 30 mm), lettres en tracés : aucune police à installer dans le logiciel du laser.</div>
    </div>
  );
}
