// =============================================================================
// MOTEUR D'AGENTS — Niv Création
// -----------------------------------------------------------------------------
// Brique RÉUTILISABLE : un petit système multi-agents bâti sur le même
// principe que l'assistant catalogue (clé ANTHROPIC_API_KEY).
//
// Chaque agent = 3 choses :
//   1. une CONSIGNE (qui il est, ton de la marque, règles)        -> `system`
//   2. des OUTILS (ce qu'il a le droit de proposer)               -> `tools`
//   3. le CERVEAU Claude (commun à tous)                          -> runAgent()
//
// Pour AJOUTER un agent plus tard (avis, newsletter, SEO, devis…),
// il suffit d'ajouter une entrée dans l'objet AGENTS ci-dessous.
// Pour un AUTRE projet : recopier ce fichier + l'API + le composant React,
// puis réécrire les consignes. Le reste ne bouge pas.
// =============================================================================

import Anthropic from "@anthropic-ai/sdk";
import { getCatalogAdmin } from "@/lib/catalog";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

// --- Contexte commun (injecté à la demande dans la consigne) -----------------
async function catalogContext() {
  try {
    const products = await getCatalogAdmin();
    return products
      .map((p) => {
        const vs = (p.variants || []).map((v) => `${v.title}=${v.price}€`).join(", ");
        return `- ${p.name} (${p.category})${p.hidden ? " [masqué]" : ""} : ${vs}`;
      })
      .join("\n");
  } catch {
    return "(catalogue indisponible)";
  }
}

// Règles de marque communes à TOUS les agents qui parlent au nom de la boutique.
const BRAND_RULES = `Tu travailles pour "Niv Création", atelier français de bijoux et objets personnalisés (gravure et découpe laser). Atelier en Val-d'Oise (95).
Ton : français impeccable, élégant, chaleureux et professionnel. Pas d'emojis.
Règles fermes à TOUJOURS respecter :
- Les produits PERSONNALISÉS ne sont JAMAIS remboursés, repris ou échangés (droit de rétractation exclu, art. L221-28). Ne jamais proposer remboursement, retour ou avoir pour un article personnalisé.
- Le retrait en main propre n'existe QUE pour la déco et le mariage (jamais les bijoux), gratuit, sur rendez-vous, secteur 95 et limitrophes (78, 92, 93, 75, 60). Ne jamais communiquer d'adresse précise.
- Délais et personnalisation : chaque pièce est faite sur commande ; rester rassurant sans promettre de date que tu ignores.`;

// =============================================================================
// REGISTRE DES AGENTS
// =============================================================================
export const AGENTS = {
  // ---------------------------------------------------------------------------
  // AGENT E-MAIL — rédige les réponses aux clientes (la gérante valide/envoie).
  // ---------------------------------------------------------------------------
  email: {
    id: "email",
    name: "Agent e-mail",
    emoji: "✉️",
    blurb: "Rédige une réponse à une cliente, à ton image. Tu relis, tu modifies, tu envoies.",
    placeholder: "Colle l'e-mail de la cliente (et son adresse si tu veux l'envoyer ensuite)…",
    needsCatalog: true,
    buildSystem: (ctx) => `${BRAND_RULES}

Ton rôle : RÉDIGER la réponse e-mail à une cliente, à la place de la gérante.
- Quand on te donne le message d'une cliente, appelle l'outil "draft_reply" avec un sujet et un corps de réponse prêts à envoyer.
- Réponds à toutes les questions posées ; si une information te manque (numéro de commande, détail introuvable), laisse une mention claire entre crochets [à compléter] et signale-le dans "tone_note".
- Corps en texte simple (pas de HTML), sauts de ligne conservés, paragraphes courts. Signe "L'atelier Niv Création".
- Si la demande de la cliente concerne un remboursement/retour d'un article personnalisé, refuse avec tact en expliquant la raison, sans jamais être sèche.
- Si la gérante te parle sans coller d'e-mail (juste une question), réponds normalement sans appeler l'outil.

CATALOGUE ACTUEL (pour répondre aux questions produits/prix) :
${ctx.catalog || "(non chargé)"}`,
    tools: [
      {
        name: "draft_reply",
        description:
          "Rédige un brouillon de réponse e-mail prêt à relire et envoyer. À utiliser dès qu'une réponse à une cliente est demandée.",
        input_schema: {
          type: "object",
          properties: {
            to: { type: "string", description: "Adresse e-mail de la cliente si elle est connue, sinon laisser vide." },
            subject: { type: "string", description: "Objet de l'e-mail." },
            body: { type: "string", description: "Corps du message en texte simple (sauts de ligne conservés, pas de HTML)." },
            tone_note: { type: "string", description: "Note courte à l'attention de la gérante (ex : info manquante). Optionnel." },
          },
          required: ["subject", "body"],
        },
      },
    ],
    // Transforme un appel d'outil en « proposition » exploitable par l'interface.
    parseAction: (block) => ({
      kind: "email_draft",
      to: block.input?.to || "",
      subject: block.input?.subject || "",
      body: block.input?.body || "",
      note: block.input?.tone_note || "",
    }),
  },
};

// ---------------------------------------------------------------------------
// AGENT CHEF (orchestrateur) — comprend la demande et délègue au bon agent.
// La gérante peut tout lui dire ; il choisit l'agent compétent, le fait
// travailler, et ramène le résultat. C'est le point d'entrée unique.
// ---------------------------------------------------------------------------
function workerList() {
  return Object.values(AGENTS)
    .map((a) => `- "${a.id}" — ${a.name} : ${a.blurb}`)
    .join("\n");
}

AGENTS.chef = {
  id: "chef",
  name: "Chef d'équipe",
  emoji: "🧭",
  blurb: "Tu lui parles, il comprend et confie le travail au bon agent.",
  placeholder: "Dis ce que tu veux (ex : « réponds à cette cliente… »)…",
  isOrchestrator: true,
  buildSystem: () => `${BRAND_RULES}

Tu es le CHEF D'ÉQUIPE des agents de la boutique. Tu coordonnes une équipe d'agents spécialisés :
${workerList()}

Ton rôle :
- Comprendre ce que veut la gérante, puis CONFIER la tâche au bon agent via l'outil "delegate" (donne-lui une instruction claire et complète, en y recopiant le contexte utile : message de la cliente, numéro de commande, etc.).
- Choisis UN seul agent à la fois, le plus pertinent.
- Si la demande est trop vague pour déléguer, pose une question courte à la gérante au lieu de déléguer.
- Si elle te pose juste une question générale, réponds directement sans déléguer.`,
  tools: [
    {
      name: "delegate",
      description: "Confie la tâche à l'un des agents spécialisés. À utiliser dès qu'un agent peut faire le travail.",
      input_schema: {
        type: "object",
        properties: {
          agent: { type: "string", description: "L'id de l'agent à qui confier la tâche (ex : \"email\")." },
          instruction: { type: "string", description: "Instruction complète et autonome pour l'agent (recopie le contexte utile)." },
        },
        required: ["agent", "instruction"],
      },
    },
  ],
};

export function listAgents() {
  // Le chef en premier : c'est le point d'entrée recommandé.
  const order = ["chef", ...Object.keys(AGENTS).filter((id) => id !== "chef")];
  return order
    .map((id) => AGENTS[id])
    .filter(Boolean)
    .map((a) => ({
    id: a.id,
    name: a.name,
    emoji: a.emoji,
    blurb: a.blurb,
    placeholder: a.placeholder,
  }));
}

// =============================================================================
// EXÉCUTION D'UN AGENT
// =============================================================================
export async function runAgent(agentId, history) {
  const agent = AGENTS[agentId];
  if (!agent) return { error: "Agent inconnu." };
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      configured: false,
      reply:
        "L'agent n'est pas encore activé : ajoute la clé ANTHROPIC_API_KEY dans tes variables d'environnement, puis redéploie.",
    };
  }

  const ctx = {};
  if (agent.needsCatalog) ctx.catalog = await catalogContext();

  const messages = (history || [])
    .slice(-12)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || ""),
    }))
    .filter((m) => m.content.trim());
  if (!messages.length) return { error: "Message manquant." };

  const client = new Anthropic();
  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1800,
      system: agent.buildSystem(ctx),
      tools: agent.tools || [],
      messages,
    });

    let reply = "";
    let action = null;
    let delegate = null;
    for (const block of resp.content) {
      if (block.type === "text") reply += block.text;
      if (block.type === "tool_use") {
        if (agent.isOrchestrator && block.name === "delegate") {
          delegate = { agent: block.input?.agent, instruction: block.input?.instruction };
        } else if (typeof agent.parseAction === "function") {
          action = agent.parseAction(block);
        }
      }
    }

    // Le chef confie la tâche à un agent spécialisé et ramène son résultat.
    if (delegate?.agent && AGENTS[delegate.agent]) {
      const sub = await runAgent(delegate.agent, [
        { role: "user", content: String(delegate.instruction || "") },
      ]);
      const who = AGENTS[delegate.agent].name;
      return {
        reply: `${reply ? reply + "\n\n" : ""}↳ Confié à « ${who} ».${sub.reply ? "\n\n" + sub.reply : ""}`,
        action: sub.action || null,
        delegatedTo: delegate.agent,
      };
    }

    if (!reply && action) reply = "Voici ce que je propose :";
    return { reply: reply || "…", action };
  } catch (err) {
    const msg = err?.status === 401 ? "Clé Claude invalide." : "Erreur de l'agent, réessaie.";
    return { error: msg };
  }
}
