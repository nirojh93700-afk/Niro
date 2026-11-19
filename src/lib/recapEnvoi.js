// UN SEUL COMPTE RENDU POUR UN ENVOI GROUPÉ (19/11/2026, gérant : « quand on fait des promos comme ça, il faut que tu
// m'envoies qu'un mail ; un mail de confirmation si tout est bien parti »). Les mails aux clientes d'un envoi groupé
// (mail de Noël, offre gravure, cagnotte…) partent SANS copie à l'atelier ; chaque envoi est noté ici, puis un seul
// récapitulatif part à la fin (combien sont partis, les adresses en échec). Jamais bloquant pour l'envoi lui-même.
import { getJobNote, setJobNote } from "@/lib/stock";
import { sendClientMail } from "@/lib/clientMail";
import { emailLayout, BRAND } from "@/lib/email";

const cle = (k) => `recap:${String(k || "")}`;
const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Note des envois d'un lot : liste = [{ email, ok, error? }]. */
export async function noterEnvoiGroupe(k, titre, liste) {
  if (!Array.isArray(liste) || !liste.length) return;
  try {
    const n = (await getJobNote(cle(k), true)) || { titre, debut: Date.now(), envoyes: [], echecs: [] };
    for (const x of liste) {
      const e = String(x?.email || "").trim().toLowerCase();
      if (!e) continue;
      if (x.ok) { if (!n.envoyes.includes(e)) n.envoyes.push(e); }
      else n.echecs.push({ email: e, error: String(x.error || "envoi refusé").slice(0, 160) });
    }
    n.titre = titre || n.titre;
    await setJobNote(cle(k), n);
  } catch { /* jamais bloquant */ }
}

/** Envoie LE récapitulatif à l'atelier, puis l'efface. Rien à dire = rien n'est envoyé. */
export async function envoyerRecapGroupe(k) {
  try {
    const n = await getJobNote(cle(k), true);
    if (!n || (!n.envoyes?.length && !n.echecs?.length)) return { ok: false, vide: true };
    const ok = n.envoyes.length, ko = n.echecs.length;
    const html = emailLayout({
      heading: "Récapitulatif d'envoi",
      bodyHtml: `<p style="margin:0 0 12px;">${esc(n.titre)} :</p>
        <p style="margin:0 0 12px;font-size:18px;"><strong>${ko ? "⚠️" : "✓"} ${ok} mail${ok > 1 ? "s" : ""} envoyé${ok > 1 ? "s" : ""}, une seule fois chacun</strong>${ko ? ` · ${ko} échec${ko > 1 ? "s" : ""}` : " — tout est parti."}</p>
        ${ko ? `<p style="margin:0 0 6px;">Adresses non servies :</p><ul style="margin:0 0 12px;">${n.echecs.slice(0, 50).map((x) => `<li>${esc(x.email)} — ${esc(x.error)}</li>`).join("")}</ul>` : ""}`,
    });
    const r = await sendClientMail({ to: BRAND.contact, subject: `${ko ? "⚠️" : "✓"} ${n.titre} : ${ok} envoyé${ok > 1 ? "s" : ""}${ko ? `, ${ko} échec${ko > 1 ? "s" : ""}` : ""}`, html, bcc: "" });
    if (r?.ok) await setJobNote(cle(k), null);
    return { ok: Boolean(r?.ok), envoyes: ok, echecs: ko };
  } catch (e) { return { ok: false, error: String(e?.message || e) }; }
}
