// Envoie les messages programmés « N jours après la livraison » (31/10/2026). Lancé par le battement du site.
// Une commande annulée / remboursée = rien n'est envoyé. Passé la date limite (`until`) = rien n'est envoyé.
import { getEnvoisApresLivraison, majEnvoiApresLivraison, logComm } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { boutonRepondre, sendClientMail, brandedMessage } from "@/lib/clientMail";
import { mailCagnotteNoel } from "@/lib/mailCagnotteNoel";

const DAY = 86400000;
const ts = (v) => { const n = new Date(v).getTime(); return Number.isFinite(n) ? n : 0; };

export async function runEnvoisApresLivraison(now = Date.now()) {
  const tous = await getEnvoisApresLivraison(true);
  const attente = Object.entries(tous).filter(([, e]) => e.status === "attente");
  if (!attente.length) return { attente: 0, envoyes: 0 };
  const orders = (await getSiteOrders(500)) || [];
  const parId = new Map(orders.map((o) => [o.id, o]));
  let envoyes = 0;
  for (const [id, e] of attente) {
    const o = parId.get(e.orderId);
    if (!o) continue;
    if (["annulee", "remboursee"].includes(o.status)) { await majEnvoiApresLivraison(id, { status: "annule" }); continue; }
    if (o.status !== "livree") continue;
    const livre = ts(o.deliveredAt);
    if (!livre || now < livre + e.delayDays * DAY) continue;
    if (e.until && now > e.until) { await majEnvoiApresLivraison(id, { status: "trop-tard" }); continue; }
    // Marqué AVANT l'envoi : un second passage ne peut jamais renvoyer le même mail.
    await majEnvoiApresLivraison(id, { status: "envoi", tryAt: now });
    let r = { ok: false, error: "" };
    try {
      const btn = await boutonRepondre({ email: e.to, name: e.name, subject: e.subject, excerpt: e.message.slice(0, 240), orderId: o.id, orderRef: o.ref || "" });
      const html = e.modele === "cagnotte-noel" ? mailCagnotteNoel({ message: e.message, replyBtn: btn }) : brandedMessage(e.subject, e.message, btn);
      r = await sendClientMail({ to: e.to, subject: e.subject, html });
    } catch (err) { r = { ok: false, error: err.message }; }
    if (r.ok) {
      await majEnvoiApresLivraison(id, { status: "envoye", sentAt: Date.now() });
      try { await logComm({ email: e.to, from: "nous", text: e.message, subject: e.subject, via: "apres-livraison" }); } catch { /* ignore */ }
      envoyes++;
    } else {
      // « Échec » ne veut pas dire « rien n'est parti » (règle du 07/10) : pas de nouvel essai automatique, le gérant vérifie.
      await majEnvoiApresLivraison(id, { status: "echec", error: String(r.error || "").slice(0, 400) });
    }
  }
  return { attente: attente.length, envoyes };
}
