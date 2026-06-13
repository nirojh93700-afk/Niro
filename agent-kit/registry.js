// =============================================================================
// MOTEUR D'AGENTS — KIT PORTABLE (réutilisable sur n'importe quel projet)
// -----------------------------------------------------------------------------
// Copié depuis Niv Création, version DÉCOUPLÉE : aucune dépendance au projet,
// tout ce qui est spécifique se règle dans la zone CONFIG ci-dessous.
//
// Chaque agent = 3 choses :
//   1. une CONSIGNE (qui il est, ton, règles)  -> `buildSystem`
//   2. des OUTILS (ce qu'il propose)            -> `tools` (+ `parseAction`)
//   3. le CERVEAU Claude (commun)               -> `runAgent`
//
// Pré-requis : `npm i @anthropic-ai/sdk` + variable d'env `ANTHROPIC_API_KEY`
//   (option `ANTHROPIC_MODEL`, défaut le modèle le plus capable).
//
// Placement conseillé (Next.js App Router) : src/lib/agents/registry.js
// =============================================================================

import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

// =============================================================================
// >>> CONFIG À ADAPTER POUR CHAQUE PROJET <<<
// =============================================================================

// 1) Identité + règles de la marque/app (le ton et les règles fermes des agents).
const BRAND_RULES = `Tu travailles pour "Crafia" (À COMPLÉTER : décris l'activité).
Ton : français impeccable, élégant, chaleureux et professionnel. Pas d'emojis.
Règles fermes à respecter : (À COMPLÉTER selon l'activité — ex : politique de retour,
zones de livraison, ce que tu ne dois jamais promettre, etc.)`;

// 2) Fournisseurs de contexte : branchent les agents sur les VRAIES données de
//    l'app. Renvoie une chaîne (texte) injectée dans la consigne. Laisse renvoyer
//    "" si pas pertinent pour ce projet.
const CONTEXT = {
  // Catalogue / contenu de l'app (pour répondre aux questions). Ex : lire la BDD.
  async catalog() {
    // EXEMPLE : return (await getProducts()).map(p => `- ${p.name} : ${p.price}€`).join("\n");
    return "";
  },
  // Données chiffrées (pour l'agent rapport). Ex : ventes, statistiques.
  async sales() {
    // EXEMPLE : calcule un résumé à partir des commandes.
    return "";
  },
};

// =============================================================================
// REGISTRE DES AGENTS (adapte/retire selon le projet)
// =============================================================================
export const AGENTS = {
  // --- AGENT E-MAIL AUTONOME -------------------------------------------------
  email: {
    id: "email",
    name: "Agent e-mail",
    emoji: "✉️",
    blurb: "Répond aux messages des clients ; autonome sur les cas simples.",
    placeholder: "Colle le message du client…",
    needsCatalog: true,
    buildSystem: (ctx) => `${BRAND_RULES}

Ton rôle : RÉPONDRE aux e-mails des clients de façon AUTONOME.
Pour chaque message, appelle l'outil "draft_reply" avec une réponse prête ET une décision :
- "needs_validation" = false (réponds SEUL) pour les demandes SIMPLES et courantes.
- "needs_validation" = true (DEMANDE validation) pour tout cas SPÉCIAL/sensible (litige, geste
  commercial, demande inhabituelle) ou si tu n'es pas sûr / il manque une info. Dans le doute : true.
- Réponds vraiment à toutes les questions, ton chaleureux, texte simple, signe au nom de l'app.

CONTEXTE :
${ctx.catalog || "(non chargé)"}`,
    tools: [{
      name: "draft_reply",
      description: "Rédige la réponse et décide si elle peut partir seule ou doit être validée.",
      input_schema: {
        type: "object",
        properties: {
          to: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" },
          needs_validation: { type: "boolean" },
          reason: { type: "string" },
        },
        required: ["subject", "body", "needs_validation"],
      },
    }],
    parseAction: (block) => ({
      kind: "email_draft",
      to: block.input?.to || "",
      subject: block.input?.subject || "",
      body: block.input?.body || "",
      needsValidation: block.input?.needs_validation !== false,
      reason: block.input?.reason || "",
    }),
  },

  // --- AGENT TECHNICIEN / DEV (universel) ------------------------------------
  technicien: {
    id: "technicien",
    name: "Technicien / Dev",
    emoji: "🛠️",
    blurb: "Diagnostique les soucis et prépare une fiche pour le développeur.",
    placeholder: "Décris le problème ou la fonctionnalité voulue…",
    buildSystem: () => `${BRAND_RULES}

Tu es le TECHNICIEN / support de l'application. L'utilisateur n'est pas développeur : parle simplement.
1. Comprends le problème (pose une question courte si ambigu).
2. Donne un diagnostic clair ; si l'utilisateur peut régler seul, explique les étapes.
3. Si une modification de code est nécessaire, rédige une FICHE TECHNIQUE précise pour le développeur.
Tu ne modifies pas le code toi-même : tu diagnostiques et tu prépares. Sois rassurant et concret.`,
  },

  // --- AGENT RAPPORT (sur données réelles) -----------------------------------
  rapport: {
    id: "rapport",
    name: "Agent rapport",
    emoji: "📊",
    blurb: "Fait le bilan chiffré et donne des conseils concrets.",
    placeholder: "Demande ton bilan (ex : « rapport de la semaine »)…",
    needsOrders: true,
    buildSystem: (ctx) => `${BRAND_RULES}

Tu es l'analyste de l'app. À partir des CHIFFRES RÉELS ci-dessous, fais un bilan court et clair :
chiffres clés, points marquants, 2-3 conseils actionnables. N'invente jamais de chiffres.

DONNÉES :
${ctx.sales || "(non chargées)"}`,
  },

  // (Ajoute ici d'autres agents selon le projet : avis, newsletter, marketing…)
};

// =============================================================================
// AGENT CHEF (orchestrateur) — délègue au bon agent. Généré automatiquement.
// =============================================================================
function workerList() {
  return Object.values(AGENTS).map((a) => `- "${a.id}" — ${a.name} : ${a.blurb}`).join("\n");
}

AGENTS.chef = {
  id: "chef",
  name: "Chef d'équipe",
  emoji: "🧭",
  blurb: "Tu lui parles, il comprend et confie le travail au bon agent.",
  placeholder: "Dis ce que tu veux…",
  isOrchestrator: true,
  buildSystem: () => `${BRAND_RULES}

Tu es le CHEF D'ÉQUIPE. Tu coordonnes ces agents :
${workerList()}
- Comprends la demande, puis CONFIE-la au bon agent via l'outil "delegate" (instruction complète).
- Un seul agent à la fois. Si la demande est vague, pose une question. Sinon réponds directement.`,
  tools: [{
    name: "delegate",
    description: "Confie la tâche à un agent spécialisé.",
    input_schema: {
      type: "object",
      properties: { agent: { type: "string" }, instruction: { type: "string" } },
      required: ["agent", "instruction"],
    },
  }],
};

export function listAgents() {
  const order = ["chef", ...Object.keys(AGENTS).filter((id) => id !== "chef")];
  return order.map((id) => AGENTS[id]).filter(Boolean).map((a) => ({
    id: a.id, name: a.name, emoji: a.emoji, blurb: a.blurb, placeholder: a.placeholder,
  }));
}

// =============================================================================
// EXÉCUTION
// =============================================================================
export async function runAgent(agentId, history) {
  const agent = AGENTS[agentId];
  if (!agent) return { error: "Agent inconnu." };
  if (!process.env.ANTHROPIC_API_KEY) {
    return { configured: false, reply: "Agent non activé : ajoute ANTHROPIC_API_KEY puis redéploie." };
  }

  const ctx = {};
  if (agent.needsCatalog) ctx.catalog = await CONTEXT.catalog();
  if (agent.needsOrders) ctx.sales = await CONTEXT.sales();

  const messages = (history || []).slice(-12)
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "") }))
    .filter((m) => m.content.trim());
  if (!messages.length) return { error: "Message manquant." };

  const client = new Anthropic();
  try {
    const resp = await client.messages.create({
      model: MODEL, max_tokens: 1800, system: agent.buildSystem(ctx), tools: agent.tools || [], messages,
    });

    let reply = "", action = null, delegate = null;
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

    if (delegate?.agent && AGENTS[delegate.agent]) {
      const sub = await runAgent(delegate.agent, [{ role: "user", content: String(delegate.instruction || "") }]);
      return {
        reply: `${reply ? reply + "\n\n" : ""}↳ Confié à « ${AGENTS[delegate.agent].name} ».${sub.reply ? "\n\n" + sub.reply : ""}`,
        action: sub.action || null, delegatedTo: delegate.agent,
      };
    }

    if (!reply && action) reply = "Voici ce que je propose :";
    return { reply: reply || "…", action };
  } catch (err) {
    return { error: err?.status === 401 ? "Clé Claude invalide." : "Erreur de l'agent, réessaie." };
  }
}

// Triage autonome d'un message entrant (à appeler depuis la route du formulaire
// de contact de l'app). Renvoie { ok, reply, subject, needsValidation, reason }.
export async function triageIncomingEmail({ name, email, subject, message }) {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false };
  const prompt = `Message reçu d'un client.
Nom : ${name || "(non précisé)"} | Adresse : ${email || "(non précisée)"} | Sujet : ${subject || "(sans)"}
Message :
"""
${message || ""}
"""
Rédige la réponse et décide si tu peux répondre seul ou s'il faut une validation.`;
  const res = await runAgent("email", [{ role: "user", content: prompt }]);
  const a = res?.action;
  if (!a || a.kind !== "email_draft") return { ok: false, reply: res?.reply || "", needsValidation: true };
  return {
    ok: true, reply: a.body || "",
    subject: a.subject || (subject ? `Re : ${subject}` : "Votre message"),
    needsValidation: a.needsValidation !== false, reason: a.reason || "",
  };
}
