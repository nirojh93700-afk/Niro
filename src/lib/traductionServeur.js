// Traduction d'un texte à graver (serveur seulement : clé Claude), 07/11/2026.
// Phrases de la liste d'abord, puis Claude ; chaque résultat est gardé (Firestore « traductions »).
import crypto from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { getTraduction, setTraduction } from "@/lib/firebase";
import { langueDe, phraseConnue, cleNormale } from "@/lib/traductionGravure";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

function consigne(nom, code) {
  const ecrit = ["en", "es", "pt", "it", "de"].includes(code)
    ? "Les prénoms et noms propres restent tels quels. "
    : "Écris dans l'écriture de la langue (jamais en lettres latines). Les prénoms et noms propres ne se traduisent pas : transcris-les phonétiquement dans l'écriture de la langue. ";
  return `Traduis ce texte du français vers la langue : ${nom}. C'est un texte court à graver sur un objet offert en cadeau : traduction naturelle et chaleureuse. ${ecrit}Garde les chiffres et les dates tels quels. Réponds UNIQUEMENT par le texte traduit, sans guillemets ni explication.`;
}

/** → { ok, texte, source: "liste" | "cache" | "claude" } ou { ok:false, raison } */
export async function traduireGravure(texte, code) {
  const l = langueDe(code);
  const t = String(texte || "").trim().slice(0, 120);
  if (!l || code === "fr" || !t) return { ok: false, raison: "entree" };
  const connue = phraseConnue(t, code);
  if (connue) return { ok: true, texte: connue, source: "liste" };
  const id = crypto.createHash("sha1").update(`${code}|${cleNormale(t)}|${t}`).digest("hex");
  const c = await getTraduction(id);
  if (c && typeof c.texte === "string" && c.texte) return { ok: true, texte: c.texte, source: "cache" };
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, raison: "cle" };
  try {
    const client = new Anthropic();
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: consigne(l.nom, code),
      messages: [{ role: "user", content: `Texte : ${t}` }],
    });
    const brut = (resp.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    const out = brut.replace(/^["«»“”]+|["«»“”]+$/g, "").replace(/^texte\s*:\s*/i, "").trim().slice(0, 200);
    if (!out) return { ok: false, raison: "reponse" };
    await setTraduction(id, { code, source: t, texte: out });
    return { ok: true, texte: out, source: "claude" };
  } catch (e) {
    console.error("Traduction:", e.message);
    return { ok: false, raison: "erreur" };
  }
}
