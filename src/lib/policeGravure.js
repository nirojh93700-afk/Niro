// Écritures des langues de gravure (07/11/2026) : tamoul, arabe, hébreu, chinois (Noto, licence OFL).
// Serveur seulement : on demande à Google Fonts SEULEMENT les lettres du texte (sous-ensemble, quelques Ko,
// même le chinois), sans que le navigateur de la cliente ne parle à Google. Mémoire du serveur : 300 polices.
export const FAMILLES = {
  ta: "Noto Serif Tamil",
  ar: "Noto Naskh Arabic",
  he: "Noto Serif Hebrew",
  zh: "Noto Serif SC",
  latin: "Noto Serif",
  symboles: "Noto Sans Symbols 2",
};
const GRAISSE = { symboles: 400 };
const memoire = new Map();

/** Police (TTF) contenant les lettres de `texte` → Buffer, ou null. */
export async function sousEnsemble(cle, texte) {
  const fam = FAMILLES[cle];
  const lettres = [...new Set([...String(texte || "")])].sort().join("").slice(0, 400);
  if (!fam || !lettres.trim()) return null;
  const k = `${cle}|${lettres}`;
  if (memoire.has(k)) return memoire.get(k);
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam).replace(/%20/g, "+")}:wght@${GRAISSE[cle] || 500}&text=${encodeURIComponent(lettres)}`,
      { headers: { "User-Agent": "Mozilla/4.0" }, cache: "no-store" }).then((r) => (r.ok ? r.text() : ""));
    const url = (css.match(/src:\s*url\(([^)]+)\)/) || [])[1];
    if (!url) return null;
    const buf = Buffer.from(await fetch(url, { cache: "no-store" }).then((r) => r.arrayBuffer()));
    if (buf.length < 100) return null;
    if (memoire.size > 300) memoire.delete(memoire.keys().next().value);
    memoire.set(k, buf);
    return buf;
  } catch (e) {
    console.error("Police de gravure:", e.message);
    return null;
  }
}
