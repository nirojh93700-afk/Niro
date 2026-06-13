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

Ton rôle : RÉPONDRE aux e-mails des clientes, de façon AUTONOME, à la place de la gérante.
Pour chaque message reçu, appelle l'outil "draft_reply" avec une réponse prête à envoyer ET une décision : peux-tu répondre seul, ou faut-il l'avis de la gérante ?

Règle d'autonomie (très importante) :
- "needs_validation" = false (tu réponds SEUL) pour les demandes SIMPLES et courantes : suivi/délai de commande, disponibilité, matériaux, dimensions, options de personnalisation, frais de port, comment commander, remerciements, questions sur un produit du catalogue.
- "needs_validation" = true (tu DEMANDES la gérante avant envoi) pour tout ce qui est SPÉCIAL ou sensible : demande de remboursement/retour/échange, réclamation ou cliente mécontente, geste commercial/remise, commande sur-mesure ou devis, gros volume / professionnel, litige ou colis perdu, toute demande inhabituelle, OU dès que tu n'es pas sûr de la réponse ou qu'il te manque une information. Dans le doute, mets toujours true.
- Quand needs_validation = true, rédige quand même une proposition de réponse (la gérante la relira), et explique en une phrase dans "reason" pourquoi tu préfères qu'elle valide.

Style de la réponse :
- Réponds vraiment à toutes les questions posées. Corps en texte simple (pas de HTML), sauts de ligne conservés, paragraphes courts, chaleureux. Signe "L'atelier Niv Création".
- Si une information précise te manque (numéro de commande, date exacte), n'invente jamais : reste général et rassurant, et mets needs_validation = true.
- Pour un remboursement/retour d'article personnalisé : refuse toujours avec tact (jamais sèche), et needs_validation = true.
- Si la gérante te parle directement (sans message de cliente), réponds-lui normalement sans appeler l'outil.

CATALOGUE ACTUEL (pour répondre aux questions produits/prix) :
${ctx.catalog || "(non chargé)"}`,
    tools: [
      {
        name: "draft_reply",
        description:
          "Rédige la réponse e-mail à une cliente et décide si elle peut partir seule ou doit être validée par la gérante. À utiliser dès qu'on te donne un message de cliente.",
        input_schema: {
          type: "object",
          properties: {
            to: { type: "string", description: "Adresse e-mail de la cliente si elle est connue, sinon laisser vide." },
            subject: { type: "string", description: "Objet de l'e-mail." },
            body: { type: "string", description: "Corps du message en texte simple (sauts de ligne conservés, pas de HTML)." },
            needs_validation: { type: "boolean", description: "true si la gérante doit valider avant envoi (cas spécial/sensible ou doute), false si la réponse peut partir seule (cas simple)." },
            reason: { type: "string", description: "Si needs_validation=true : en une phrase, pourquoi tu préfères une validation. Sinon vide." },
          },
          required: ["subject", "body", "needs_validation"],
        },
      },
    ],
    // Transforme un appel d'outil en « proposition » exploitable par l'interface.
    parseAction: (block) => ({
      kind: "email_draft",
      to: block.input?.to || "",
      subject: block.input?.subject || "",
      body: block.input?.body || "",
      needsValidation: block.input?.needs_validation !== false, // par sécurité : valider par défaut
      reason: block.input?.reason || "",
      note: block.input?.reason || "",
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

// =============================================================================
// TRIAGE AUTONOME D'UN E-MAIL ENTRANT (formulaire de contact)
// -----------------------------------------------------------------------------
// Donne le message d'une cliente à l'agent e-mail. Il rédige une réponse et
// décide s'il peut répondre seul (cas simple) ou s'il faut une validation
// (cas spécial). Renvoie { ok, reply, subject, needsValidation, reason }.
// Ne lève jamais : en cas d'échec, renvoie { ok:false } et l'appelant continue.
// =============================================================================
export async function triageIncomingEmail({ name, email, subject, message }) {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, reason: "Clé Claude absente." };
  const prompt = `E-mail reçu d'une cliente via le formulaire de contact.
Nom : ${name || "(non précisé)"}
Adresse : ${email || "(non précisée)"}
Sujet : ${subject || "(sans sujet)"}
Message :
"""
${message || ""}
"""
Rédige la réponse et décide si tu peux répondre seul ou s'il faut la validation de la gérante.`;
  const res = await runAgent("email", [{ role: "user", content: prompt }]);
  const a = res?.action;
  if (!a || a.kind !== "email_draft") {
    // L'agent n'a pas produit de réponse exploitable -> on remonte à la gérante.
    return { ok: false, reply: res?.reply || "", needsValidation: true, reason: "Réponse non structurée." };
  }
  return {
    ok: true,
    reply: a.body || "",
    subject: a.subject || (subject ? `Re : ${subject}` : "Votre message — Niv Création"),
    needsValidation: a.needsValidation !== false,
    reason: a.reason || "",
  };
}
