import Anthropic from "@anthropic-ai/sdk";
import { getCatalogAdmin } from "@/lib/catalog";

// Assistant CATALOGUE (masquer/afficher, prix, promo, stock, textes, ajout,
// suppression). Extrait de l'ancienne route /api/admin/assistant pour être
// réutilisé par le fil unifié (hub). Il ne fait jamais les changements : il les
// PROPOSE, et c'est le gérant qui confirme d'un clic.
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
- { "type": "promo", "slug", "variantId", "salePrice" (nombre), "label" } : mettre un prix promo sur une variante (pour RETIRER une promo, mets "salePrice": null)
- { "type": "stock", "slug", "variantId", "stock" (nombre entier), "label" } : définir le stock d'une variante (0 = épuisé)
- { "type": "text", "slug", "name"?, "tagline"?, "descriptionHtml"?, "category"?, "label" } : modifier des textes
- { "type": "add", "name", "category", "price" (nombre), "tagline"?, "descriptionHtml"?, "label" } : ajouter un produit
- { "type": "delete", "slug", "label" } : supprimer définitivement un produit ajouté manuellement

Catégories valides : bijoux, verres, mariage, deco, cadeaux.`;

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
            type: { type: "string", enum: ["hide", "show", "price", "promo", "stock", "text", "add", "delete"] },
            slug: { type: "string" },
            variantId: { type: "string" },
            price: { type: "number" },
            salePrice: { type: ["number", "null"] },
            stock: { type: "number" },
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


export async function runCatalogAssistant(history) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { reply: "L'assistant n'est pas encore activé : ajoutez la clé ANTHROPIC_API_KEY, puis redéployez.", actions: null, configured: false };
  }
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
  const messages = (history || []).slice(-12).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || ""),
  })).filter((m) => m.content.trim());
  if (!messages.length) return { error: "Message manquant." };
  const client = new Anthropic();
  try {
    const resp = await client.messages.create({
      model: MODEL, max_tokens: 1500,
      system: `${SYSTEM}\n\nCATALOGUE ACTUEL :\n${catalogText}`,
      tools: [TOOL], messages,
    });
    let reply = ""; let actions = null;
    for (const block of resp.content) {
      if (block.type === "text") reply += block.text;
      if (block.type === "tool_use" && block.name === "propose_changes") actions = Array.isArray(block.input?.actions) ? block.input.actions : [];
    }
    if (!reply && actions) reply = "Voici ce que je propose :";
    return { reply: reply || "…", actions };
  } catch (err) {
    return { error: err?.status === 401 ? "Clé Claude invalide." : "Erreur de l'assistant, réessayez." };
  }
}
