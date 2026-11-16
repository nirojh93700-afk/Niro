// Garde de taille des sections du catalogue (16/11/2026, commande 1OIRDYI2 d'Olivier : la photo jointe au
// formulaire n'apparaissait pas dans la commande ; gérant : « je t'ai dit à chaque commande, il faut que tout soit
// prêt »). Chaque section est UN document Firestore, limité à 1 Mo. Les dossiers des clientes (`comms`) et les fils
// des commandes (`bat`) grossissent sans fin (rangement des mails chaque soir) : au-delà de 1 Mo, l'écriture échouait
// EN SILENCE et le message (avec sa photo) était perdu. Avant d'écrire, on réduit donc ces deux sections :
// d'abord les textes anciens (le texte complet reste dans Gmail), puis le nombre de messages par dossier, en gardant
// TOUJOURS les messages qui portent une image ou des photos. Pur, sans dépendance (testé par test-taille-section).

export const LIMITE_SECTION = 900_000; // octets : marge sous la limite de 1 048 487 octets d'un champ Firestore
export const SECTIONS_REDUCTIBLES = ["comms", "bat"];

export const octets = (v) => {
  const s = typeof v === "string" ? v : JSON.stringify(v ?? null);
  return typeof Buffer !== "undefined" ? Buffer.byteLength(s, "utf8") : new TextEncoder().encode(s).length;
};

const aUneImage = (m) => !!(m && (String(m.image || "").trim() || (Array.isArray(m.photos) && m.photos.length)));
const couper = (t, n) => {
  const s = String(t || "");
  return s.length > n ? s.slice(0, n) + " […]" : s;
};

// Une étape de réduction appliquée à chaque dossier { messages: [...] }.
function etape(valeur, fn) {
  for (const d of Object.values(valeur || {})) {
    if (d && Array.isArray(d.messages)) d.messages = fn(d.messages, d);
    if (d && Array.isArray(d.importedGmailIds) && d.importedGmailIds.length > 300) d.importedGmailIds = d.importedGmailIds.slice(-300);
  }
}

// Garde au plus `n` messages par dossier (les plus récents), plus tous ceux qui ont une image.
const garderDerniers = (n) => (msgs) => {
  if (msgs.length <= n) return msgs;
  const seuil = msgs.length - n;
  return msgs.filter((m, i) => i >= seuil || aUneImage(m));
};

// Renvoie { valeur, reduit, avant, apres }. `valeur` est une COPIE (l'original n'est jamais modifié).
export function reduireSection(valeur, { limite = LIMITE_SECTION, maintenant = Date.now() } = {}) {
  const avant = octets(valeur);
  if (avant <= limite || !valeur || typeof valeur !== "object") return { valeur, reduit: false, avant, apres: avant };
  const v = JSON.parse(JSON.stringify(valeur));
  const vieux = maintenant - 30 * 86400000;
  const etapes = [
    () => etape(v, (msgs) => msgs.map((m) => ((m.at || 0) < vieux ? { ...m, text: couper(m.text, 1200) } : m))),
    () => etape(v, (msgs) => msgs.map((m) => ({ ...m, text: couper(m.text, 1500) }))),
    () => etape(v, garderDerniers(120)),
    () => etape(v, (msgs) => msgs.map((m) => ((m.at || 0) < vieux ? { ...m, text: couper(m.text, 400) } : m))),
    () => etape(v, garderDerniers(60)),
    () => etape(v, (msgs) => msgs.map((m) => ({ ...m, text: couper(m.text, 600) }))),
    () => etape(v, garderDerniers(30)),
    () => etape(v, (msgs) => msgs.map((m) => ({ ...m, text: couper(m.text, 250) }))),
  ];
  for (const f of etapes) {
    f();
    if (octets(v) <= limite) return { valeur: v, reduit: true, avant, apres: octets(v) };
  }
  // En dernier recours : on retire les dossiers les plus anciens (jamais celui écrit à l'instant, le plus récent).
  const cles = Object.keys(v).sort((a, b) => (v[a]?.updatedAt || 0) - (v[b]?.updatedAt || 0));
  for (const k of cles.slice(0, -1)) {
    if (octets(v) <= limite) break;
    delete v[k];
  }
  return { valeur: v, reduit: true, avant, apres: octets(v) };
}
