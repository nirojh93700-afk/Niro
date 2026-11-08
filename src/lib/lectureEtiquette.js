// =============================================================================
// LECTURE D'UNE ÉTIQUETTE D'EXPÉDITION PHOTOGRAPHIÉE (08/11/2026). Le gérant prend
// l'étiquette Boxtal / La Poste / Mondial Relay / Chronopost en photo depuis le
// formulaire « Expédier » de Gestion : l'agent lit le NUMÉRO DE SUIVI et le
// transporteur, le champ se remplit, le gérant vérifie. Le numéro tapé à la main
// marche toujours. Serveur seulement (clé Claude). Même façon de faire que
// `lectureImage.js` (image en base64 + outil imposé). Aucune exception ne remonte.
// =============================================================================
import Anthropic from "@anthropic-ai/sdk";
import { nettoyerNumero, estNumeroLaPoste, estNumeroMondialRelay } from "@/lib/suiviColis";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const MAX_OCTETS = 3_600_000; // limite de l'API (5 Mo en base64) avec marge
const TYPES = ["image/jpeg", "image/png", "image/webp"];

const CONSIGNE = `Tu lis la photo d'une étiquette d'expédition française (Boxtal, La Poste / Colissimo / Lettre suivie, Mondial Relay, Chronopost).
Donne le NUMÉRO DE SUIVI (pas le code-barres produit, pas le numéro de commande, pas le code postal) et le transporteur.
Formats connus :
- La Poste (lettre suivie, Colissimo) : 13 caractères « chiffre + lettre + 11 chiffres » (ex. 1A12345678901), ou 14 chiffres + 1 lettre (ex. 87001500427259Z) ;
- Mondial Relay : 8 chiffres (ex. 74550444) ;
- Chronopost / international : 2 lettres + 9 chiffres + 2 lettres (ex. XY123456789FR).
Si plusieurs numéros sont visibles, prends celui écrit sous le code-barres de suivi.
Si la photo est floue, coupée, ou si tu hésites vraiment, mets certain=false.
Réponds avec l'outil "etiquette" seulement.`;

const OUTIL = {
  name: "etiquette",
  description: "Numéro de suivi lu sur l'étiquette.",
  input_schema: {
    type: "object",
    properties: {
      numero: { type: "string", description: "Le numéro de suivi tel qu'il est écrit, ou chaîne vide si aucun n'est lisible." },
      transporteur: { type: "string", description: "Le transporteur : La Poste, Colissimo, Mondial Relay, Chronopost, Colis Privé, UPS… ou chaîne vide si inconnu." },
      certain: { type: "boolean", description: "true si la lecture est sûre." },
    },
    required: ["numero", "transporteur", "certain"],
  },
};

/** Le numéro a-t-il l'un des formats connus du site ? (sert à baisser la confiance, jamais à refuser) */
function formatConnu(numero) {
  return estNumeroLaPoste(numero) || estNumeroMondialRelay(numero, null) || /^[0-9]{10,14}$/.test(numero);
}

/**
 * Lit l'étiquette photographiée. `dataUrl` = « data:image/jpeg;base64,… » (JPEG / PNG / WebP, < 3,6 Mo).
 * → { ok, numero, transporteur, certain, raison? } ; raison = "image" | "cle" | "reponse" | "vide" | "erreur".
 */
export async function lireEtiquette(dataUrl) {
  try {
    const m = String(dataUrl || "").match(/^data:([^;]+);base64,(.*)$/s);
    if (!m || !TYPES.includes(m[1]) || m[2].length * 0.75 > MAX_OCTETS) {
      return { ok: false, numero: "", transporteur: "", certain: false, raison: "image" };
    }
    if (!process.env.ANTHROPIC_API_KEY) return { ok: false, numero: "", transporteur: "", certain: false, raison: "cle" };
    const client = new Anthropic();
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: CONSIGNE,
      tools: [OUTIL],
      tool_choice: { type: "tool", name: "etiquette" },
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } },
        { type: "text", text: "Quel est le numéro de suivi de cette étiquette, et quel transporteur ?" },
      ] }],
    });
    const bloc = (resp.content || []).find((b) => b.type === "tool_use");
    if (!bloc) return { ok: false, numero: "", transporteur: "", certain: false, raison: "reponse" };
    const numero = nettoyerNumero(bloc.input?.numero).replace(/[^A-Z0-9]/g, "").slice(0, 40);
    const transporteur = String(bloc.input?.transporteur || "").trim().slice(0, 40);
    if (!numero) return { ok: false, numero: "", transporteur, certain: false, raison: "vide" };
    const certain = bloc.input?.certain !== false && formatConnu(numero);
    return { ok: true, numero, transporteur, certain };
  } catch (e) {
    console.error("Lecture étiquette:", e?.message || e);
    return { ok: false, numero: "", transporteur: "", certain: false, raison: "erreur" };
  }
}
