import { runAgent } from "@/lib/agents/registry";
import { sendEmail, emailLayout, BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// AGENTS AUTOMATIQUES — à appeler par un planificateur (Google Cloud Scheduler).
// Chaque agent tourne tout seul et le résultat est ENVOYÉ PAR E-MAIL à la gérante
// (rapport de ventes, brouillon de newsletter, idée de post marketing). La gérante
// relit puis envoie/publie — rien n'est diffusé aux clients sans elle.
//
// Protégé par un jeton secret (variable d'env CRON_SECRET) :
//   /api/cron/agents?token=SECRET            → lance les 3 (hebdo)
//   /api/cron/agents?token=SECRET&task=rapport|newsletter|marketing → un seul
//
// Planificateur conseillé : 1×/semaine (ex. lundi 8h) pour "tout",
// ou un planning par tâche avec le paramètre task.

// Tâche → { agent, prompt, titre } : la consigne donnée à l'agent + le titre du mail.
const TASKS = {
  rapport: {
    agent: "rapport",
    titre: "Rapport de ventes de la semaine",
    prompt:
      "Prépare le rapport de ventes de la SEMAINE écoulée à partir des vraies commandes : chiffre d'affaires, nombre de commandes, panier moyen, produits les plus vendus, et 1 à 3 recommandations concrètes. Réponds en texte clair, prêt à lire.",
  },
  newsletter: {
    agent: "newsletter",
    titre: "Brouillon de newsletter (à relire)",
    prompt:
      "Prépare un BROUILLON de newsletter pour cette semaine (objet accrocheur + corps court et chaleureux), en t'appuyant sur le catalogue et la saison. Mets en avant la carafe à whisky gravée en édition limitée si c'est pertinent. Réponds en texte prêt à copier ; la gérante relira avant envoi.",
  },
  marketing: {
    agent: "marketing",
    titre: "Idée de post marketing (à relire)",
    prompt:
      "Prépare un post marketing (réseaux sociaux) prêt à publier : accroche + texte + une dizaine de hashtags, autour d'un vrai produit du catalogue (par ex. la carafe édition limitée ou un verre gravé). Réponds en texte prêt à copier ; la gérante relira avant publication.",
  },
};

function actionSummary(action) {
  if (!action || typeof action !== "object") return "";
  const parts = [];
  for (const k of ["subject", "objet", "title", "titre", "caption", "body", "texte", "content", "post", "hashtags"]) {
    const v = action[k];
    if (typeof v === "string" && v.trim()) parts.push(`${k} : ${v.trim()}`);
    else if (Array.isArray(v) && v.length) parts.push(`${k} : ${v.join(" ")}`);
  }
  return parts.join("\n\n");
}

async function runOne(key) {
  const t = TASKS[key];
  if (!t) return { key, ok: false, error: "tâche inconnue" };
  const res = await runAgent(t.agent, [{ role: "user", content: t.prompt }]);
  if (res?.configured === false) return { key, ok: false, error: "ANTHROPIC_API_KEY manquante" };
  const text = [res?.reply || "", actionSummary(res?.action)].filter(Boolean).join("\n\n———\n\n").trim()
    || "(l'agent n'a rien renvoyé)";
  const html = emailLayout({
    heading: `${t.titre} ✦`,
    bodyHtml: `<p style="margin:0 0 12px;color:#7a7268;">Préparé automatiquement par l'agent « ${t.agent} ». Relis, ajuste, puis envoie / publie.</p>
      <div style="white-space:pre-line;font-size:15px;line-height:1.6;">${escapeHtml(text)}</div>`,
  });
  const sent = await sendEmail({ to: BRAND.contact, subject: `[Agent] ${t.titre}`, html, replyTo: BRAND.contact });
  return { key, ok: Boolean(sent?.ok) };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// Surveillance automatique du catalogue : détecte les produits mal configurés
// (bijou sans emballage, sans fiche, sans photo, sans prix) et ALERTE la gérante
// PAR E-MAIL uniquement s'il y a quelque chose à corriger.
async function runSante() {
  const { auditCatalog, auditSummaryText, importantIssueCount } = await import("@/lib/catalogAudit");
  const audit = await auditCatalog();
  const important = importantIssueCount(audit);
  // On n'alerte QUE s'il y a des points importants (bijou sans emballage, sans
  // photo, sans prix). Les « fiches détaillées » manquantes (mineur) n'alertent pas.
  if (!important) return { key: "sante", ok: true, issues: 0 };
  const text = auditSummaryText(audit);
  const html = emailLayout({
    heading: "Surveillance du catalogue — à corriger ✦",
    bodyHtml: `<p style="margin:0 0 12px;color:#7a7268;">Vérification automatique du catalogue. ${important} point(s) important(s) à corriger (les autres produits sont OK) :</p>
      <div style="white-space:pre-line;font-size:15px;line-height:1.6;">${escapeHtml(text)}</div>
      <p style="margin:14px 0 0;color:#7a7268;font-size:13px;">Un bijou « sans emballage » se règle dans Gestion → Packaging (ou en demandant à l'agent Technicien).</p>`,
  });
  const sent = await sendEmail({ to: BRAND.contact, subject: `[Surveillance] ${important} produit(s) à corriger`, html, replyTo: BRAND.contact });
  return { key: "sante", ok: Boolean(sent?.ok), issues: important };
}

export async function GET(req) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return Response.json({ error: "CRON_SECRET non configuré." }, { status: 503 });
  if (token !== secret) return Response.json({ error: "Jeton invalide." }, { status: 401 });

  const task = url.searchParams.get("task") || "";
  // "sante" = surveillance catalogue (déterministe, pas un agent IA).
  const keys = task
    ? (TASKS[task] ? [task] : [])
    : Object.keys(TASKS);

  const results = [];
  for (const k of keys) {
    try { results.push(await runOne(k)); }
    catch (e) { results.push({ key: k, ok: false, error: e?.message || "erreur" }); }
  }
  // Surveillance du catalogue : lancée avec "tout" (pas de task) ou via &task=sante.
  if (!task || task === "sante") {
    try { results.push(await runSante()); }
    catch (e) { results.push({ key: "sante", ok: false, error: e?.message || "erreur" }); }
  }
  return Response.json({ ok: true, results });
}
