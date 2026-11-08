"use client";

// =============================================================================
// GESTION → RÉGLAGES → NOTIFICATIONS & RÉSUMÉS (08/11/2026)
// Le résumé du matin : un e-mail au gérant chaque jour à l'heure choisie (à préparer, à expédier, en retard,
// réponses à valider, matériel, ce qui a changé hier, chiffres). Réglage enregistré par /api/admin/settings
// { notifications } (fusion de clé + journal) ; aperçu et envoi immédiat par /api/admin/notifications.
// =============================================================================
import { useCallback, useEffect, useState } from "react";
import PageHead from "@/components/admin/PageHead";
import { Ico } from "@/components/admin/AdminShell";
import { toast } from "@/components/admin/AdminToast";

const JOURS = [["1", "Lun"], ["2", "Mar"], ["3", "Mer"], ["4", "Jeu"], ["5", "Ven"], ["6", "Sam"], ["0", "Dim"]];
const quand = (ts) => (ts ? new Date(ts).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) : "—");

export default function NotificationsPage() {
  const [key, setKey] = useState("");
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ resumeMatin: false, heure: "07:30", joursOff: [] });
  const [saved, setSaved] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/notifications", { headers: { "x-admin-key": k }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Chargement impossible.");
      setData(j);
      const n = { resumeMatin: Boolean(j.notifications?.resumeMatin), heure: j.notifications?.heure || "07:30", joursOff: (j.notifications?.joursOff || []).map(String) };
      setForm(n); setSaved(n);
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (k) { setKey(k); load(k); }
  }, [load]);

  const modifie = saved && JSON.stringify(form) !== JSON.stringify(saved);

  async function enregistrer() {
    setBusy("save");
    try {
      const r = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ notifications: { resumeMatin: form.resumeMatin, heure: form.heure, joursOff: form.joursOff.map((x) => parseInt(x, 10)) } }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Enregistrement refusé.");
      setSaved(form);
      load(key);
    } catch (e) { toast("Échec : " + e.message, "err"); }
    setBusy("");
  }
  async function envoyer() {
    setBusy("send");
    try {
      const r = await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ action: "envoyer" }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Envoi refusé.");
      toast(`Résumé envoyé à l'atelier (${j.points ?? 0} point${j.points > 1 ? "s" : ""}).`, "ok");
      load(key);
    } catch (e) { toast("Échec : " + e.message, "err"); }
    setBusy("");
  }

  if (!key) return <PageHead eyebrow="Réglages" title="Notifications & résumés" subtitle="Ouvrez d'abord Gestion pour saisir votre mot de passe." />;

  const d = data?.dernier;
  return (
    <div className="fq">
      <PageHead eyebrow="Réglages" title="Notifications & résumés"
        subtitle="Chaque matin, à l'heure choisie, un e-mail à l'atelier : commandes à préparer, à expédier aujourd'hui ou en retard, Express, réponses à valider, matériel à racheter, ce qui a changé hier et les chiffres. Rien ne part aux clientes."
        kpis={[
          { label: "Résumé du matin", value: saved ? (saved.resumeMatin ? "Allumé" : "Éteint") : "—", sub: saved?.resumeMatin ? `à ${saved.heure}` : "à activer ci-dessous", tone: saved?.resumeMatin ? "good" : undefined },
          { label: "Dernier envoi", value: d ? quand(d.at) : "jamais", sub: d ? (d.ok ? `${d.points ?? 0} points${d.force ? " · à la main" : ""}` : "refusé") : "—", tone: d && d.ok === false ? "bad" : undefined },
          { label: "Aujourd'hui", value: data ? data.points ?? 0 : "—", sub: "points dans l'aperçu" },
        ]} />
      {err ? <p className="fq-empty" style={{ color: "var(--ash-bad)" }}>{err}</p> : null}

      <div className="fq-card" style={{ marginTop: 12, gap: 12 }}>
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
          <input type="checkbox" checked={form.resumeMatin} onChange={(e) => setForm({ ...form, resumeMatin: e.target.checked })} style={{ marginTop: 3, width: 18, height: 18 }} />
          <span><strong>Recevoir le résumé du matin</strong><br /><span style={{ fontSize: 13, color: "var(--ash-muted, #7a6d58)" }}>Envoyé à l&apos;adresse de l&apos;atelier, une fois par jour, dans le quart d&apos;heure qui suit l&apos;heure choisie.</span></span>
        </label>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            Heure (Paris)
            <input type="time" value={form.heure} onChange={(e) => setForm({ ...form, heure: e.target.value || "07:30" })} style={{ padding: "6px 8px", border: "1px solid var(--ash-line-2, #e6ddc9)", borderRadius: 9, font: "inherit" }} />
          </label>
        </div>
        <div>
          <div style={{ fontSize: 13, color: "var(--ash-muted, #7a6d58)", marginBottom: 6 }}>Jours SANS résumé (cochés = pas d&apos;e-mail ce jour-là) :</div>
          <div className="fq-chipbar" style={{ flexWrap: "wrap" }}>
            {JOURS.map(([v, l]) => {
              const off = form.joursOff.includes(v);
              return <button key={v} type="button" className={`fq-chip${off ? " on" : ""}`} aria-pressed={off}
                onClick={() => setForm({ ...form, joursOff: off ? form.joursOff.filter((x) => x !== v) : [...form.joursOff, v] })}>{off ? "✕ " : ""}{l}</button>;
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="fq-btn pri" onClick={enregistrer} disabled={!modifie || busy === "save"}>{busy === "save" ? "Enregistrement…" : "Enregistrer"}</button>
          <button type="button" className="fq-btn" onClick={envoyer} disabled={busy === "send"}><Ico n="mail" /> {busy === "send" ? "Envoi…" : "M'envoyer le résumé maintenant"}</button>
          {modifie ? <span style={{ fontSize: 12.5, color: "var(--ash-warn, #b07b12)", alignSelf: "center" }}>Réglage modifié, pas encore enregistré.</span> : null}
        </div>
      </div>

      <div className="fq-card" style={{ marginTop: 12 }}>
        <strong style={{ fontSize: 14 }}>Aperçu : ce que dirait le résumé maintenant</strong>
        {data?.sujet ? <div style={{ fontSize: 13, color: "var(--ash-muted, #7a6d58)" }}>Objet : {data.sujet}</div> : null}
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", font: "inherit", fontSize: 13, lineHeight: 1.5, background: "var(--ash-sand, #f6efe2)", padding: "10px 12px", borderRadius: 10 }}>{data ? data.apercu || "Rien à signaler aujourd'hui." : "Chargement…"}</pre>
      </div>

      <p style={{ color: "var(--ash-muted, #7a6d58)", fontSize: 12.5, marginTop: 12 }}>
        Le résumé est fabriqué par le site lui-même (battement) : il ne dépend d&apos;aucun outil extérieur. Un jour coché « sans résumé » = rien ce jour-là. « M&apos;envoyer le résumé maintenant » envoie même si la case est décochée.
      </p>
    </div>
  );
}
