import Anthropic from "@anthropic-ai/sdk";
import { AGENTS, runAgent } from "@/lib/agents/registry";
import { runCatalogAssistant } from "@/lib/agents/catalogAssistant";
import { listPendingReplies } from "@/lib/stock";

// =============================================================================
// FIL UNIFIÉ (« hub ») — UN seul endroit où le gérant parle en français.
// Un aiguilleur lit la demande et l'envoie au bon endroit :
//   catalogue  → assistant catalogue (propose des changements à confirmer)
//   email      → agent e-mail (brouillon à relire/envoyer)
//   avis / newsletter / marketing / rapport / technicien → l'agent concerné
//   sinon      → il répond directement (question générale, salutation…)
// Rien n'est appliqué ni envoyé ici : tout revient au gérant pour un clic.
// =============================================================================
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const TARGETS = ["catalogue", "email", "avis", "newsletter", "marketing", "rapport", "technicien"];
const LABELS = {
  catalogue: "🧭 Catalogue", email: "✉️ Agent e-mail", avis: "⭐ Agent avis", newsletter: "📣 Agent newsletter",
  marketing: "🎨 Agent marketing", rapport: "📊 Agent rapport", technicien: "🛠️ Technicien",
};

function describeAgents() {
  const lines = ["- catalogue : masquer/afficher un produit, changer un prix, une promo, un stock, un texte, ajouter ou supprimer un produit."];
  for (const id of TARGETS.slice(1)) {
    const a = AGENTS[id];
    if (a) lines.push(`- ${id} : ${a.blurb}`);
  }
  return lines.join("\n");
}

const ROUTE_TOOL = {
  name: "route",
  description: "Envoie la demande à la bonne compétence. À utiliser dès qu'une compétence peut faire le travail.",
  input_schema: {
    type: "object",
    properties: {
      target: { type: "string", enum: TARGETS, description: "La compétence à qui confier la demande." },
      instruction: { type: "string", description: "Instruction complète et autonome (recopie le contexte utile : produit, prix, message de la cliente…)." },
    },
    required: ["target", "instruction"],
  },
};

export async function runHub(history) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { reply: "L'assistant n'est pas encore activé : ajoutez la clé ANTHROPIC_API_KEY, puis redéployez." };
  }
  const messages = (history || []).slice(-12).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || ""),
  })).filter((m) => m.content.trim());
  if (!messages.length) return { error: "Message manquant." };

  // Contexte utile pour répondre tout de suite aux questions de suivi.
  let pendingInfo = "";
  try {
    const pend = (await listPendingReplies()).filter((r) => r.status === "pending");
    pendingInfo = pend.length
      ? `RÉPONSES CLIENTES À VALIDER (${pend.length}) : ${pend.map((p) => `${p.name} — « ${p.subject} »`).join(" ; ")}. Elles se valident depuis les cartes en haut de cette page.`
      : "Aucune réponse cliente en attente de validation.";
  } catch { pendingInfo = ""; }

  const system = `Tu es l'assistant unique du gérant de Niv Création (bijoux et objets gravés, France). Tu lui parles en français, simplement, sans jargon, avec le tutoiement chaleureux de l'équipe.

Tu as plusieurs compétences à ta disposition. Dès que la demande relève de l'une d'elles, appelle l'outil "route" avec une instruction complète :
${describeAgents()}

Règles :
- Une demande de MODIFICATION du site (prix, promo, stock, masquer, texte, ajout/suppression de produit) → target "catalogue".
- Un message de cliente à traiter, une réponse à rédiger → "email".
- Si la demande est vague (quel produit ? quel prix ?), pose UNE question courte au lieu de router.
- Question générale, bonjour, merci, ou question sur ce que tu sais faire → réponds directement, sans outil.
- Ne promets jamais qu'une chose est faite : tout ce que tu proposes sera confirmé par le gérant d'un clic.

ÉTAT ACTUEL : ${pendingInfo}`;

  const client = new Anthropic();
  let resp;
  try {
    resp = await client.messages.create({ model: MODEL, max_tokens: 900, system, tools: [ROUTE_TOOL], messages });
  } catch (err) {
    return { error: err?.status === 401 ? "Clé Claude invalide." : "Erreur de l'assistant, réessaie." };
  }
  let reply = ""; let route = null;
  for (const block of resp.content) {
    if (block.type === "text") reply += block.text;
    if (block.type === "tool_use" && block.name === "route") route = { target: block.input?.target, instruction: String(block.input?.instruction || "") };
  }
  if (!route || !TARGETS.includes(route.target)) return { reply: reply || "…" };

  // Aiguillage.
  if (route.target === "catalogue") {
    const r = await runCatalogAssistant([...messages.slice(0, -1), { role: "user", content: route.instruction || messages[messages.length - 1].content }]);
    if (r.error) return { error: r.error };
    return { reply: r.reply || "…", actions: r.actions || null, agent: "catalogue", label: LABELS.catalogue };
  }
  const r = await runAgent(route.target, [{ role: "user", content: route.instruction }]);
  if (r.error) return { error: r.error };
  return { reply: r.reply || "…", action: r.action || null, agent: route.target, label: LABELS[route.target] || route.target };
}
