// Fichier à graver d'un texte dans une autre langue (07/11/2026, maquette v5 : « il faut que je l'aie en
// format pour graver… dans le dossier »). Le SVG est fabriqué par le serveur à la taille réelle (mm),
// lettres en TRACÉS : aucune police à installer dans le logiciel du laser. Aperçu noir sur blanc + bouton.
import { langueDe, langueActive, nomFichierLangue, textesEnLangue } from "@/lib/traductionGravure";
import { texteAvecDecor } from "@/lib/decorTexte";
import FichierGravureFormats from "@/components/admin/FichierGravureFormats";

/** Un fichier par texte gravé dans une autre langue (texte seul, ou recto, verso…). */
export function liensFichierGravure(item, { voir = false } = {}) {
  const f = item?.fields || {};
  if (!langueActive(f) || !langueDe(f.langue)?.police) return [];
  const textes = textesEnLangue(f).filter((t) => t.grave);
  const ref = String(item.orderRef || item.ref || item.slug || "commande").replace(/[^A-Za-z0-9-]/g, "");
  return textes.map((t) => {
    const texte = texteAvecDecor(t.cle, f[t.cle], f) || t.grave;
    // La date ne va qu'avec le texte principal (comme l'aperçu du verre).
    const cleDate = String(f.date || "").trim() ? "date" : "texte2";
    const date = t.cle === "texte" ? texteAvecDecor(cleDate, f[cleDate], f) : "";
    const part = textes.length > 1 ? `-${String(t.cle).replace(/[^A-Za-z0-9]/g, "")}` : "";
    const nom = `gravure-${ref}${item.verre ? `-verre${item.verre}` : ""}${part}-${nomFichierLangue(f.langue)}-60x30mm.svg`;
    const q = new URLSearchParams({ l: f.langue, t: texte, ...(date ? { d: date } : {}), nom, ...(voir ? { voir: "1" } : {}) });
    return { href: `/api/fichier-gravure?${q}`, nom, cle: t.cle };
  });
}

export function lienFichierGravure(item, opts) {
  return liensFichierGravure(item, opts)[0] || null;
}

export default function FichierGravure({ item }) {
  const liens = liensFichierGravure(item);
  const vues = liensFichierGravure(item, { voir: true });
  if (!liens.length) return null;
  const plusieurs = liens.length > 1;
  return (
    <div className="fgv" style={{ margin: "6px 0 10px", padding: "8px 10px", border: "1px solid #c9a24b", borderRadius: 8, background: "#fff" }}>
      <div style={{ fontWeight: 700, color: "#8a6d1f", fontSize: "0.9rem", marginBottom: 6 }}>{plusieurs ? "Fichiers à graver" : "Fichier à graver"} — {langueDe(item.fields.langue).nom}</div>
      {liens.map((a, i) => (
        <div key={a.nom} style={{ marginBottom: plusieurs ? 8 : 0 }}>
          {plusieurs && <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#6b5d48" }}>{a.cle}</div>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vues[i].href} alt="Fichier à graver" style={{ display: "block", width: "100%", maxWidth: 300, aspectRatio: "2 / 1", background: "#fff", border: "1px solid #e7d3a1", borderRadius: 6 }} />
          <a href={a.href} download={a.nom} className="no-print" style={{ display: "inline-block", marginTop: 6, fontWeight: 700, color: "#8a6d1f" }}>⬇ {a.nom}</a>
          <FichierGravureFormats href={a.href} nom={a.nom} />
        </div>
      ))}
      <div style={{ fontSize: "0.78rem", color: "#6b5d48" }}>SVG à l&apos;échelle (60 × 30 mm), lettres en tracés : aucune police à installer dans le logiciel du laser. PNG et PDF : la même gravure en image très fine (600 points par pouce), à la même taille.</div>
    </div>
  );
}
