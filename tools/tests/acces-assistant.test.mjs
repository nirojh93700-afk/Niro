// Mot de passe de l'assistant (19/11/2026) : droits limités, feu vert du gérant, jeton de rejeu à usage unique.
// npm run test-acces-assistant
import assert from "node:assert/strict";
process.env.ADMIN_PASSWORD = "mot-de-passe-du-gerant-test";
const S = await import("../../src/lib/stock.js");
const G = "mot-de-passe-du-gerant-test", A = "assist-ceci-est-un-essai-123456";
const req = (chemin, methode = "GET", corps, cle = A) => new Request("http://local" + chemin, {
  method: methode, headers: { "x-admin-key": cle, "Content-Type": "application/json" },
  body: corps ? JSON.stringify(corps) : undefined,
});
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

ok((await S.roleAdminKey(G)) === "gerant", "gérant reconnu");
ok((await S.roleAdminKey(A)) === null, "assistant inconnu avant création");
await S.setAssistantPassword(A);
ok((await S.roleAdminKey(A)) === "assistant", "assistant reconnu");
ok(await S.checkAdminKey(A), "checkAdminKey vrai pour l'assistant (lecture)");
ok(!(await S.checkGerantKey(A)), "checkGerantKey faux pour l'assistant");
ok(await S.isAdmin(req("/api/admin/orders")), "assistant lit les commandes");
ok(await S.isAdmin(req("/api/admin/catalog", "POST", { action: "edit", slug: "x", price: 12 })), "assistant change un prix");
ok(!(await S.isAdmin(req("/api/admin/refund", "POST", { id: "o1" }))), "assistant ne rembourse pas");
ok(!(await S.isAdmin(req("/api/admin/export"))), "assistant n'exporte pas");
ok(!(await S.isAdmin(req("/api/admin/acces-assistant"))), "assistant ne règle pas son accès");
ok(await S.isAdmin(req("/api/admin/refund", "POST", { id: "o1" }, G)), "gérant rembourse");

// Feu vert : la demande est gardée, le gérant l'accepte, le jeton ne vaut qu'une fois et pour cette route.
ok(!(await S.isAdmin(req("/api/admin/promo-codes", "POST", { code: "NOEL5", value: 5 }))), "code promo bloqué en attente");
ok(!(await S.isAdmin(req("/api/admin/promo-codes", "POST", { code: "NOEL5", value: 5 }))), "même demande renvoyée");
let d = await S.getDemandesAssistant();
const att = d.demandes.filter((e) => e.statut === "attente");
ok(att.length === 1, "une seule demande pour deux envois identiques");
ok(d.refus.length >= 3, "refus notés");
const r = await S.accepterDemandeAssistant(att[0].id);
ok(r && r.jeton.startsWith("nvr_"), "jeton de rejeu créé");
ok((await S.roleAdminKey(r.jeton)) === null, "le jeton n'est pas un mot de passe");
ok(!(await S.isAdmin(req("/api/admin/refund", "POST", { id: "o1" }, r.jeton))), "jeton refusé sur une autre route");
ok(await S.isAdmin(req("/api/admin/promo-codes", "POST", { code: "NOEL5", value: 5 }, r.jeton)), "jeton accepté sur sa route");
ok(!(await S.isAdmin(req("/api/admin/promo-codes", "POST", { code: "NOEL5", value: 5 }, r.jeton))), "jeton utilisable une seule fois");
await S.finirDemandeAssistant(att[0].id, { ok: true, texte: "{}" });
d = await S.getDemandesAssistant();
ok(d.demandes.find((e) => e.id === att[0].id).statut === "acceptee", "demande marquée acceptée");
ok(d.faits.length >= 1, "actions de l'assistant notées");

await S.couperAssistant();
ok((await S.roleAdminKey(A)) === null, "accès coupé");
ok(!(await S.isAdmin(req("/api/admin/orders"))), "assistant coupé ne lit plus rien");
ok(await S.isAdmin(req("/api/admin/orders", "GET", null, G)), "le gérant entre toujours");
console.log(`✓ accès de l'assistant : ${n} vérifications`);
