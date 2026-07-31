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
import { getSiteOrders } from "@/lib/firebase";

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

// Surveillance du catalogue (produits mal configurés : bijou sans emballage,
// sans fiche, sans photo, sans prix) — injectée dans l'agent Technicien.
async function auditContext() {
  try {
    const { auditCatalog, auditSummaryText } = await import("@/lib/catalogAudit");
    const a = await auditCatalog();
    return auditSummaryText(a);
  } catch {
    return "(vérification du catalogue indisponible)";
  }
}

// Résumé chiffré des ventes (mêmes règles que l'admin : hors annulées,
// remboursées et commandes de test).
async function salesContext() {
  let orders;
  try { orders = await getSiteOrders(300); } catch { orders = null; }
  if (orders === null || !Array.isArray(orders)) {
    return "(données de commandes indisponibles — connexion non active)";
  }
  const valid = orders.filter((o) => o.status !== "remboursee" && o.status !== "annulee" && !o.test);
  const now = Date.now();
  const within = (days) => valid.filter((o) => {
    const t = Date.parse(o.createdAt);
    return Number.isFinite(t) && now - t <= days * 86400000;
  });
  const sum = (arr) => arr.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString("fr-FR");
  const w = within(7);
  const m = within(30);
  const sell = {};
  for (const o of m) for (const it of o.items || []) {
    const n = it.name || "Article";
    sell[n] = (sell[n] || 0) + (Number(it.quantity) || 0);
  }
  const top = Object.entries(sell).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([n, q]) => `${n} (${q})`).join(", ") || "—";
  return [
    `Date du jour : ${new Date().toLocaleDateString("fr-FR")}`,
    `7 derniers jours : ${w.length} commande(s), ${fmt(sum(w))} € de chiffre d'affaires.`,
    `30 derniers jours : ${m.length} commande(s), ${fmt(sum(m))} € de CA, panier moyen ${m.length ? fmt(sum(m) / m.length) : "0"} €.`,
    `Total historique (valide) : ${valid.length} commande(s), ${fmt(sum(valid))} € de CA.`,
    `Meilleures ventes (30 j) : ${top}.`,
  ].join("\n");
}

// Règles de marque communes à TOUS les agents qui parlent au nom de la boutique.
const BRAND_RULES = `Tu travailles pour "Niv Création", atelier français de personnalisation par gravure et découpe laser. Atelier en Val-d'Oise (95).
Gamme : bijoux, cristaux photo 3D, VERRES & CARAFES gravés (verres à whisky, à vin, flûtes à champagne + une carafe à whisky en édition limitée), déco & maison, articles de mariage et cadeaux.
Ton : français impeccable, élégant, chaleureux et professionnel. Pas d'emojis.
Règles fermes à TOUJOURS respecter :
- Les produits PERSONNALISÉS ne sont JAMAIS remboursés, repris ou échangés (droit de rétractation exclu, art. L221-28). Ne jamais proposer remboursement, retour ou avoir pour un article personnalisé.
- Le retrait en main propre n'existe QUE pour la déco et le mariage (jamais les bijoux), gratuit, sur rendez-vous, secteur 95 et limitrophes (78, 92, 93, 75, 60). Ne jamais communiquer d'adresse précise.
- Livraison : OFFERTE dès 45 € de commande. En dessous, les frais sont calculés AUTOMATIQUEMENT au paiement selon le contenu et le poids (lettre suivie pour les petits bijoux, colis pour les verres et objets, point relais possible). Ne jamais inventer un montant précis : renvoyer au calcul affiché au moment du paiement.
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

  // ---------------------------------------------------------------------------
  // AGENT AVIS — rédige les réponses publiques aux avis clients.
  // ---------------------------------------------------------------------------
  avis: {
    id: "avis",
    name: "Agent avis",
    emoji: "⭐",
    blurb: "Rédige une réponse publique à un avis client, dans le ton de la marque.",
    placeholder: "Colle l'avis de la cliente (et sa note si tu veux)…",
    needsCatalog: false,
    buildSystem: () => `${BRAND_RULES}

Ton rôle : rédiger une RÉPONSE PUBLIQUE à un avis client (visible sur la boutique).
- Remercie sincèrement, personnalise (reprends un détail de l'avis), reste bref (2 à 4 phrases).
- Avis positif : chaleureux, gratitude, invite à revenir.
- Avis mitigé ou négatif : empathie et professionnalisme, sans jamais te justifier agressivement ; propose de poursuivre par e-mail pour régler la situation. Ne propose JAMAIS de remboursement sur un article personnalisé.
- Signe "Niv Création". Donne directement le texte de la réponse, sans commentaire autour.`,
  },

  // ---------------------------------------------------------------------------
  // AGENT NEWSLETTER — rédige les campagnes e-mail de la boutique.
  // ---------------------------------------------------------------------------
  newsletter: {
    id: "newsletter",
    name: "Agent newsletter",
    emoji: "📣",
    blurb: "Rédige une campagne e-mail (objet + message) pour tes clientes.",
    placeholder: "Dis l'occasion ou le produit à mettre en avant (ex : « Fête des mères »)…",
    needsCatalog: true,
    buildSystem: (ctx) => `${BRAND_RULES}

Ton rôle : rédiger une CAMPAGNE NEWSLETTER pour les clientes de la boutique.
- Propose d'abord 3 objets d'e-mail accrocheurs (courts), puis le corps du message (texte simple, paragraphes courts, chaleureux).
- Mets en avant le produit ou l'occasion demandés, avec un appel à l'action clair (ex : découvrir la boutique).
- Si on ne te précise rien, propose une campagne saisonnière pertinente à partir du catalogue.
- Signe "L'atelier Niv Création".

CATALOGUE ACTUEL (pour citer des produits réels) :
${ctx.catalog || "(non chargé)"}`,
  },

  // ---------------------------------------------------------------------------
  // AGENT MARKETING — rédige les publications réseaux sociaux (textes).
  // ---------------------------------------------------------------------------
  marketing: {
    id: "marketing",
    name: "Agent marketing",
    emoji: "🎨",
    blurb: "Rédige tes posts réseaux sociaux : légende + hashtags + idée de visuel.",
    placeholder: "Dis le produit ou le thème du post (ex : « bracelet prénom »)…",
    needsCatalog: true,
    buildSystem: (ctx) => `${BRAND_RULES}

Ton rôle : préparer une PUBLICATION prête à publier pour les réseaux sociaux (Instagram, Facebook).
Présente toujours dans cet ordre, clairement séparé :
1. LÉGENDE — courte et engageante (1 à 3 phrases, ton chaleureux et élégant), prête à copier-coller telle quelle.
2. HASHTAGS — 8 à 12 hashtags pertinents (mélange français/anglais, niche bijoux/cadeaux personnalisés).
3. IDÉE DE VISUEL — décrite précisément (cadrage, ambiance, accessoires) pour la photo ou le montage.
- Base-toi sur de vrais produits du catalogue quand c'est pertinent.
- La gérante n'a plus qu'à copier le texte (ou le publier directement) ; rédige donc une version finale, pas des options.`,
  },

  // ---------------------------------------------------------------------------
  // AGENT TECHNICIEN — diagnostique les soucis du site et rédige un brief dev.
  // Note : il NE MODIFIE PAS le code lui-même (c'est le développeur, via
  // Claude Code, qui applique les changements). Il diagnostique et prépare.
  // ---------------------------------------------------------------------------
  technicien: {
    id: "technicien",
    name: "Technicien / Dev",
    emoji: "🛠️",
    blurb: "Surveille le catalogue (produits mal configurés), diagnostique les soucis du site et prépare une fiche pour le développeur.",
    placeholder: "Décris le problème ou demande « vérifie le catalogue »…",
    needsCatalog: false,
    needsAudit: true,
    buildSystem: (ctx) => `${BRAND_RULES}

Tu es le TECHNICIEN / support informatique de la boutique. La gérante n'est pas développeuse : parle simplement, sans jargon inutile.
Stack du site : Next.js 14 (App Router, JavaScript), Stripe (paiement), Resend (e-mails), Firebase App Hosting / Firestore (données), domaine chez Hostinger.

Ton rôle :
1. Comprendre le problème ou le besoin décrit, poser une question courte si c'est ambigu.
2. Donner un DIAGNOSTIC clair (cause probable) et, si la gérante peut régler elle-même (ex : un réglage, un spam, une variable d'environnement), explique les étapes simplement.
3. Si cela demande une modification du code, rédige une FICHE TECHNIQUE précise (problème, cause, fichiers/zones concernés, solution proposée) destinée au développeur.
4. SURVEILLANCE DU CATALOGUE : tu vérifies en permanence que les produits sont bien configurés. Si la gérante demande « vérifie le catalogue / est-ce que tout va bien », liste les produits à corriger ci-dessous, en clair, avec quoi faire (ex. « bijou sans emballage → Gestion → Packaging »). Si tout est OK, rassure-la.
Important : tu ne modifies pas le code toi-même ; tu diagnostiques et tu prépares le travail. Sois rassurant et concret.

ÉTAT ACTUEL DU CATALOGUE (vérification automatique) :
${ctx?.audit || "(non chargé)"}`,
  },

  // ---------------------------------------------------------------------------
  // AGENT RAPPORT — bilan des ventes à partir des vraies données de commandes.
  // ---------------------------------------------------------------------------
  rapport: {
    id: "rapport",
    name: "Agent rapport",
    emoji: "📊",
    blurb: "Fait le bilan de tes ventes et te donne des conseils concrets.",
    placeholder: "Demande ton bilan (ex : « fais le rapport de la semaine »)…",
    needsOrders: true,
    buildSystem: (ctx) => `${BRAND_RULES}

Tu es l'analyste de la boutique. Tu fais des BILANS DE VENTES clairs et utiles à la gérante, sans jargon.
À partir des CHIFFRES RÉELS ci-dessous, rédige un rapport court et structuré :
- Les chiffres clés (CA, nombre de commandes, panier moyen) sur la période demandée (par défaut : la semaine).
- Les meilleures ventes.
- 2 ou 3 conseils concrets et actionnables pour vendre plus (mise en avant d'un produit, idée de promo, relance, post réseaux…).
Sois concret, positif et bref. Si les données sont indisponibles, dis-le simplement sans inventer de chiffres.

DONNÉES DE VENTES RÉELLES :
${ctx.sales || "(non chargées)"}`,
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
  if (agent.needsOrders) ctx.sales = await salesContext();
  if (agent.needsAudit) ctx.audit = await auditContext();

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
