import Anthropic from "@anthropic-ai/sdk";
import { isAdmin } from "@/lib/stock";
import { getCatalogAdmin } from "@/lib/catalog";

export const dynamic = "force-dynamic";

// Modèle par défaut : le plus capable. Pour réduire les crédits, définir
// ANTHROPIC_MODEL=claude-haiku-4-5 dans Netlify.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

const SYSTEM = `Tu es l'assistant d'administration de la boutique en ligne "Niv Création" (bijoux et objets personnalisés, gravés en France). Tu parles à la gérante, en français, avec un ton simple et chaleureux.

Ton rôle : l'aider à gérer son catalogue. Tu ne fais JAMAIS les changements toi-même : tu les PROPOSES via l'outil "propose_changes", et c'est elle qui confirmera ensuite d'un clic.

Règles :
- Si elle demande une modification (masquer/afficher un produit, changer un prix, modifier un texte, ajouter ou supprimer un produit), appelle l'outil "propose_changes" avec la liste précise des actions.
- Pour CHAQUE action, écris un "label" clair en français décrivant ce qui va se passer (ex : "Masquer le produit « Clé USB Bois »").
- Identifie les produits par leur "slug" exact (et les prix par "variantId" exact) en te basant sur le catalogue fourni ci-dessous.
- Pour une suppression, sois prudent et rappelle que c'est définitif.
- Si la demande est ambiguë (plusieurs produits possibles, prix non précisé…), ne propose rien : pose une question courte à la place.
- Si elle pose juste une question (sans demander de changement), réponds normalement sans appeler l'outil.
- Réponds directement, sans montrer ton raisonnement.

Types d'action possibles :
- { "type": "hide", "slug", "label" } : masquer un produit (disparaît du site)
- { "type": "show", "slug", "label" } : réafficher un produit
- { "type": "price", "slug", "variantId", "price" (nombre), "label" } : changer un prix
- { "type": "text", "slug", "name"?, "tagline"?, "descriptionHtml"?, "category"?, "label" } : modifier des textes
- { "type": "add", "name", "category", "price" (nombre), "tagline"?, "descriptionHtml"?, "label" } : ajouter un produit
- { "type": "delete", "slug", "label" } : supprimer définitivement un produit ajouté manuellement

Catégories valides : bijoux, mariage, cristaux, cadeaux, cles-usb, porte-cles, medailles.`;

const TOOL = {
  name: "propose_changes",
  description:
    "Propose une liste de changements à appliquer au catalogue. N'exécute rien : la gérante confirmera. Utilise-le dès qu'elle demande une modification.",
  input_schema: {
    type: "object",
    properties: {
      actions: {
        type: "array",
        description: "Les changements proposés, dans l'ordre.",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["hide", "show", "price", "text", "add", "delete"] },
            slug: { type: "string" },
            variantId: { type: "string" },
            price: { type: "number" },
            name: { type: "string" },
            tagline: { type: "string" },
            descriptionHtml: { type: "string" },
            category: { type: "string" },
            label: { type: "string", description: "Description en français de l'action." },
          },
          required: ["type", "label"],
        },
      },
    },
    required: ["actions"],
  },
};

export async function POST(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({
      configured: false,
      reply:
        "L'assistant n'est pas encore activé : ajoutez la clé ANTHROPIC_API_KEY dans Netlify (variable d'environnement), puis redéployez.",
    });
  }

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const history = Array.isArray(body?.messages) ? body.messages.slice(-12) : [];
  if (!history.length) return Response.json({ error: "Message manquant." }, { status: 400 });

  // Catalogue compact pour donner le contexte au modèle (évite des allers-retours).
  let catalogText = "";
  try {
    const products = await getCatalogAdmin();
    catalogText = products
      .map((p) => {
        const vs = (p.variants || []).map((v) => `${v.title}=${v.id}@${v.price}€`).join(", ");
        return `- ${p.name} | slug:${p.slug} | cat:${p.category}${p.hidden ? " | MASQUÉ" : ""} | variantes: ${vs}`;
      })
      .join("\n");
  } catch {
    catalogText = "(catalogue indisponible)";
  }

  const messages = history.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || ""),
  }));

  const client = new Anthropic();
  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: `${SYSTEM}\n\nCATALOGUE ACTUEL :\n${catalogText}`,
      tools: [TOOL],
      messages,
    });

    let reply = "";
    let actions = null;
    for (const block of resp.content) {
      if (block.type === "text") reply += block.text;
      if (block.type === "tool_use" && block.name === "propose_changes") {
        actions = Array.isArray(block.input?.actions) ? block.input.actions : [];
      }
    }
    if (!reply && actions) reply = "Voici ce que je propose :";
    return Response.json({ reply: reply || "…", actions });
  } catch (err) {
    const msg = err?.status === 401 ? "Clé Claude invalide." : "Erreur de l'assistant, réessayez.";
    return Response.json({ error: msg }, { status: 500 });
  }
}
