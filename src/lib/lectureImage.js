// L'agent lit l'image envoyée par la cliente et dit s'il y voit une DATE (26/10/2026).
// Gérant : « l'image est gratuite, une date écrite dedans se paie comme un texte » ;
// la cliente coche la case « Mon image contient une date », l'agent vérifie, montre un
// oubli (en rouge) et alerte le gérant — JAMAIS il ne bloque la commande.
// Serveur seulement (clé Claude). Toute erreur = « non vérifiée », jamais bloquant.
import Anthropic from "@anthropic-ai/sdk";
import { getCustomerUpload, getImageReading, setImageReading } from "@/lib/firebase";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const MAX_OCTETS = 3_600_000; // limite de l'API (5 Mo en base64) avec marge
const TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/** Identifiant d'une photo du site (« /api/img/<id> », adresse complète acceptée), sinon null. */
export function idPhoto(url) {
  const m = String(url || "").match(/\/api\/img\/([A-Za-z0-9_-]{6,64})(?:[?#].*)?$/);
  return m ? m[1] : null;
}

const CONSIGNE = `Tu regardes une image qu'une cliente veut faire graver sur un verre. Ta seule question : y a-t-il une DATE écrite dans l'image, destinée à être gravée ?
- Compte comme date : jour/mois/année sous toutes les formes (03.07.2027, 3 juillet 2027, 12/06/27), une année seule mise en valeur (« 2027 », « depuis 2019 », « 1977 »), une date avec heure.
- Ne compte PAS : chiffres qui font partie de la scène d'une photo (numéro de maillot, plaque, panneau, enseigne, étiquette d'un objet), numéros de modèle, prix, adresses, l'heure seule.
- Si l'image est floue ou si tu hésites vraiment, mets certain=false.
Réponds avec l'outil "lecture" seulement.`;

const OUTIL = {
  name: "lecture",
  description: "Résultat de la lecture de l'image.",
  input_schema: {
    type: "object",
    properties: {
      date: { type: "string", description: "La date telle qu'elle est écrite dans l'image, ou chaîne vide s'il n'y en a pas." },
      certain: { type: "boolean", description: "true si la lecture est sûre." },
    },
    required: ["date", "certain"],
  },
};

/** Lit l'image (cache d'abord). → { ok, date, certain, verifiee } ; verifiee=false si rien n'a pu être lu. */
export async function lireDateImage(url, { cache = true } = {}) {
  const id = idPhoto(url);
  if (!id) return { ok: false, verifiee: false, raison: "adresse" };
  if (cache) {
    const c = await getImageReading(id);
    if (c && typeof c.date === "string") return { ok: true, verifiee: true, date: c.date, certain: c.certain !== false, cache: true };
  }
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, verifiee: false, raison: "cle" };
  const dataUrl = await getCustomerUpload(id);
  const m = String(dataUrl || "").match(/^data:([^;]+);base64,(.*)$/s);
  if (!m || !TYPES.includes(m[1]) || m[2].length * 0.75 > MAX_OCTETS) return { ok: false, verifiee: false, raison: "image" };
  try {
    const client = new Anthropic();
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: CONSIGNE,
      tools: [OUTIL],
      tool_choice: { type: "tool", name: "lecture" },
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } },
        { type: "text", text: "Y a-t-il une date écrite dans cette image ?" },
      ] }],
    });
    const bloc = (resp.content || []).find((b) => b.type === "tool_use");
    const date = String(bloc?.input?.date || "").trim().slice(0, 60);
    const certain = bloc?.input?.certain !== false;
    if (!bloc) return { ok: false, verifiee: false, raison: "reponse" };
    await setImageReading(id, { date, certain });
    return { ok: true, verifiee: true, date, certain };
  } catch (e) {
    console.error("Lecture image:", e.message);
    return { ok: false, verifiee: false, raison: "erreur" };
  }
}

/**
 * Compare la case cochée par la cliente et la lecture de l'agent.
 * → null (rien à signaler) ou { type: "oubli" | "non-verifiee" | "en-trop" | "doute", date }.
 */
export function ecartDate(coche, lecture) {
  if (!lecture || !lecture.verifiee) return { type: "non-verifiee", date: "" };
  const vue = Boolean(lecture.date);
  if (vue && !coche) return { type: lecture.certain ? "oubli" : "doute", date: lecture.date };
  if (!vue && coche) return { type: "en-trop", date: "" };
  return null;
}

const TEXTE_ECART = {
  "oubli": (d) => `date « ${d} » lue dans l'image, case « Mon image contient une date » NON cochée (date non payée)`,
  "doute": (d) => `l'agent croit voir une date « ${d} » dans l'image, case non cochée — à regarder`,
  "non-verifiee": () => "image non lue par l'agent (lecture impossible), case non cochée — regarder s'il y a une date",
  "en-trop": () => "case « date » cochée (payée) mais l'agent ne voit pas de date dans l'image — à regarder",
};

/**
 * Contrôle d'une commande (webhook Stripe) : pour chaque photo d'un produit qui a la case
 * « date dans l'image », compare la case et la lecture. Ne bloque jamais : erreurs avalées,
 * 12 s maximum par image. → [{ nom, verre, cote, type, date, texte }]
 */
export async function controleDatesCommande(specItems, { eclater = (sp) => [sp], getProduct, delaiMs = 12000 } = {}) {
  const taches = [];
  for (const sp of specItems || []) {
    const produit = getProduct ? getProduct(sp.slug) : null;
    const champs = (produit?.personalizationFields || []).filter((f) => f.type === "imageDate" && f.photoKey);
    if (!champs.length) continue;
    for (const it of eclater(sp)) {
      for (const f of champs) {
        const url = it?.fields?.[f.photoKey];
        if (!url) continue;
        const coche = it.fields?.[f.key] === "oui";
        taches.push((async () => {
          let lecture = null;
          try {
            lecture = await Promise.race([lireDateImage(url), new Promise((r) => setTimeout(() => r(null), delaiMs))]);
          } catch { lecture = null; }
          const e = ecartDate(coche, lecture || { verifiee: false });
          if (!e || (e.type === "non-verifiee" && coche)) return null;
          return {
            nom: it.name || produit?.name || sp.slug, verre: it.verre || null,
            cote: /Fond$/.test(f.photoKey) ? "fond du verre" : "", type: e.type, date: e.date,
            texte: TEXTE_ECART[e.type](e.date),
          };
        })());
      }
    }
  }
  const res = await Promise.all(taches.map((t) => t.catch(() => null)));
  return res.filter(Boolean);
}

/** Une ligne lisible par alerte (enregistrée sur la commande, affichée dans Gestion et à l'atelier). */
export function lignesAlerteImage(alertes) {
  return (alertes || []).map((a) => `${a.nom}${a.verre ? ` — verre ${a.verre}` : ""}${a.cote ? ` (${a.cote})` : ""} : ${a.texte}`);
}
