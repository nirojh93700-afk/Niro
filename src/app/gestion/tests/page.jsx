"use client";

// =============================================================================
// GESTION → TESTS → FICHIERS LASER À ESSAYER (12/11/2026)
// Gérant : « fais une catégorie test dans admin… envoie-moi des tests pour que j'essaie sur la machine si ça fonctionne,
// les découpes, la gravure, pour les trois maquettes ; tu mets pas en ligne ». Les fichiers sont fabriqués à partir des trois
// maquettes (support de téléphone, arbre de vie, décoration à suspendre) par tools/maquettes/fichiers-laser-test.cjs :
// taille réelle en mm, rouge = découpe, noir = gravure (textes déjà en tracés). Rien n'est vendu sur le site.
// Sous chaque fichier : « Ça marche » / « À corriger » + une note ; en haut : ses réglages machine par matière.
// Enregistrés par /api/admin/tests-laser (section testsLaser, clé par clé).
// =============================================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import PageHead from "@/components/admin/PageHead";
import TESTS from "@/lib/testsLaser.json";

// Chaque exemple s'ouvre dans l'outil de retouche (Gestion › Tests › Retoucher et fabriquer) pour être corrigé par le gérant.
const RETOUCHE = { support: "outil=support&ex=camille", arbre: "outil=arbre&ex=lea-tom", boule: "outil=decoration&ex=flocons", mamie: "outil=decoration&ex=mamie", photo: "outil=decoration&ex=coeur-photo" };

function mm(v) { return String(Math.round(v * 10) / 10).replace(".", ","); }
function quand(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" }); } catch { return ""; }
}
const gris = { color: "var(--ash-muted, #7a6d58)" };
const champ = { width: "100%", boxSizing: "border-box", minWidth: 0, padding: "8px 10px", border: "1px solid var(--ash-line-2, #d9cbb0)", borderRadius: 9, font: "inherit", fontSize: 13, background: "#fff" };

function NoteFichier({ f, note, envoyer }) {
  const [texte, setTexte] = useState(note?.note || "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setTexte(note?.note || ""); }, [note?.note]);
  const etat = note?.etat || "";
  const poser = async (e, n) => { setBusy(true); await envoyer({ fichier: f.nom, etat: e, note: n }); setBusy(false); };
  return (
    <div style={{ display: "grid", gap: 6, borderTop: "1px dashed var(--ash-line, #e7dcc8)", paddingTop: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className={`fq-btn sm${etat === "ok" ? " primary" : ""}`} disabled={busy} aria-pressed={etat === "ok"}
          onClick={() => poser(etat === "ok" ? "" : "ok", texte)} style={etat === "ok" ? { background: "#256b34", borderColor: "#256b34", color: "#fff" } : undefined}>✓ Ça marche</button>
        <button type="button" className="fq-btn sm" disabled={busy} aria-pressed={etat === "ko"}
          onClick={() => poser(etat === "ko" ? "" : "ko", texte)} style={etat === "ko" ? { background: "#b4452f", borderColor: "#b4452f", color: "#fff" } : undefined}>✗ À corriger</button>
        {note?.at ? <span style={{ fontSize: 12, ...gris }}>noté le {quand(note.at)}</span> : null}
      </div>
      <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={2} maxLength={600} placeholder="Votre note : ce qui va, ce qui ne va pas (taille, découpe, gravure, assemblage)…"
        aria-label={`Note sur ${f.nom}`} style={{ ...champ, resize: "vertical" }} />
      {texte !== (note?.note || "") ? (
        <button type="button" className="fq-btn sm" disabled={busy} onClick={() => poser(etat, texte)} style={{ justifySelf: "start" }}>Enregistrer la note</button>
      ) : null}
    </div>
  );
}

function Reglage({ matiere, r, envoyer }) {
  const [d, setD] = useState(r?.decoupe || "");
  const [g, setG] = useState(r?.gravure || "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setD(r?.decoupe || ""); setG(r?.gravure || ""); }, [r?.decoupe, r?.gravure]);
  const change = d !== (r?.decoupe || "") || g !== (r?.gravure || "");
  return (
    <div style={{ display: "grid", gap: 6, padding: "8px 0", borderTop: "1px solid var(--ash-line, #eee3d0)" }}>
      <strong style={{ fontSize: 13 }}>{matiere}</strong>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}>
        <label style={{ fontSize: 12, ...gris, minWidth: 0 }}>Découpe (rouge)
          <input value={d} onChange={(e) => setD(e.target.value)} maxLength={200} placeholder="ex. puissance 100 %, vitesse 8 mm/s, 1 passe" style={champ} /></label>
        <label style={{ fontSize: 12, ...gris, minWidth: 0 }}>Gravure (noir)
          <input value={g} onChange={(e) => setG(e.target.value)} maxLength={200} placeholder="ex. puissance 40 %, vitesse 200 mm/s" style={champ} /></label>
      </div>
      {change ? <button type="button" className="fq-btn sm" disabled={busy} style={{ justifySelf: "start" }}
        onClick={async () => { setBusy(true); await envoyer({ matiere, decoupe: d, gravure: g }); setBusy(false); }}>Enregistrer ces réglages</button> : null}
    </div>
  );
}

export default function TestsLaserPage() {
  const [key, setKey] = useState("");
  const [etat, setEtat] = useState({ notes: {}, reglages: {} });
  const [err, setErr] = useState("");
  const fichiers = useMemo(() => TESTS.groupes.flatMap((g) => g.fichiers), []);
  const matieres = useMemo(() => [...new Set(fichiers.map((f) => f.matiere))], [fichiers]);

  const charger = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/tests-laser", { headers: { "x-admin-key": k }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Lecture impossible.");
      setEtat({ notes: j.notes || {}, reglages: j.reglages || {} }); setErr("");
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    setKey(k); if (k) charger(k);
  }, [charger]);

  const envoyer = useCallback(async (corps) => {
    try {
      const r = await fetch("/api/admin/tests-laser", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify(corps) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Enregistrement impossible.");
      setEtat({ notes: j.notes || {}, reglages: j.reglages || {} }); setErr("");
    } catch (e) { setErr(e.message); }
  }, [key]);

  const ok = fichiers.filter((f) => etat.notes[f.nom]?.etat === "ok").length;
  const ko = fichiers.filter((f) => etat.notes[f.nom]?.etat === "ko").length;
  return (
    <div>
      <PageHead
        eyebrow="Tests"
        title="Fichiers laser à essayer"
        subtitle="Les trois maquettes (support de téléphone, arbre de vie, décoration à suspendre) transformées en vrais fichiers pour la machine. À essayer sur des chutes avant de vendre quoi que ce soit : rien n'est en vente sur le site."
        kpis={[{ label: "Fichiers", value: fichiers.length }, { label: "Ça marche", value: ok, tone: ok ? "good" : undefined }, { label: "À corriger", value: ko, tone: ko ? "bad" : undefined }, { label: "Pas encore essayés", value: fichiers.length - ok - ko }]}
      />
      {err ? <p role="alert" style={{ color: "#b4452f", fontSize: 13, margin: "8px 0 0" }}>{err}</p> : null}

      <div className="fq-card" style={{ marginTop: 12, borderLeftColor: "var(--ash-gold, #c9a24b)" }}>
        <strong style={{ fontSize: 14 }}>Comment les essayer</strong>
        <ol style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: "var(--ash-ink, #2b2216)" }}>
          <li>Commencez par la pièce d'emboîtement : elle dit quelle largeur de fente tient bien dans votre bois.</li>
          <li>Téléchargez un fichier, puis ouvrez-le dans le logiciel du laser (xTool Creative Space : Importer).</li>
          <li>La taille est déjà en millimètres, à l'échelle 100 %. Ne la changez pas.</li>
          <li><b style={{ color: "#d0021b" }}>Rouge = découpe</b> (traits fins) · <b>noir = gravure</b> (zones pleines et photos).</li>
          <li>Chaque nom et chaque pièce est un objet : après « Dissocier », vous pouvez le déplacer. Un prénom de l'arbre déplacé se ressoude avec « Combiner → Unir ».</li>
          <li>Pour changer un texte, sa place ou sa taille vous-même : « Corriger moi-même » ouvre l'outil, puis « Fabriquer les fichiers ».</li>
          <li>Notez sous chaque fichier si ça marche ou ce qu'il faut corriger : je le lis ici.</li>
        </ol>
      </div>

      <details className="fq-card" style={{ marginTop: 12 }}>
        <summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 700 }}>Mes réglages machine, par matière</summary>
        <p style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.45, ...gris }}>Notez une fois les réglages qui marchent : ils sont rappelés sous chaque fichier de la même matière.</p>
        {matieres.map((m) => <Reglage key={m} matiere={m} r={etat.reglages[m]} envoyer={envoyer} />)}
      </details>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", marginTop: 14 }}>
        {TESTS.groupes.map((g) => (
          <section key={g.id} className="fq-card" style={{ gap: 10 }}>
            <img src={g.apercu} alt={`Aperçu : ${g.titre}`} loading="lazy" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "contain", borderRadius: 10, background: "#f4ece0" }} />
            <div>
              <strong style={{ fontSize: 15 }}>{g.titre}</strong>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, lineHeight: 1.45, ...gris }}>{g.sous}</p>
            </div>
            {RETOUCHE[g.id] ? (
              <a className="fq-btn sm primary" href={`/gestion/retouche?${RETOUCHE[g.id]}`} style={{ justifySelf: "start" }}>✎ Corriger moi-même (texte, place, taille)</a>
            ) : null}
            {g.fichiers.map((f) => {
              const r = etat.reglages[f.matiere];
              return (
                <div key={f.nom} style={{ border: "1px solid var(--ash-line, #e7dcc8)", borderRadius: 10, padding: "10px 12px", display: "grid", gap: 6, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span className="fq-pill">{f.matiere}</span>
                    <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{mm(f.w)} × {mm(f.h)} mm</span>
                    <span style={{ fontSize: 12, ...gris }}>{f.gravure ? "découpe + gravure" : "découpe seule"}</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>{f.titre}</div>
                  {f.note ? <div style={{ fontSize: 12.5, lineHeight: 1.4, ...gris }}>{f.note}</div> : null}
                  {r && (r.decoupe || r.gravure) ? (
                    <div style={{ fontSize: 12.5, lineHeight: 1.4, background: "#fffaf0", border: "1px solid #e7d3a1", borderRadius: 8, padding: "6px 8px" }}>
                      <b>Vos réglages :</b>{r.decoupe ? ` découpe ${r.decoupe}` : ""}{r.decoupe && r.gravure ? " ·" : ""}{r.gravure ? ` gravure ${r.gravure}` : ""}
                    </div>
                  ) : null}
                  <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11.5, overflowWrap: "anywhere", ...gris }}>{f.nom}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a className="fq-btn sm" href={f.url} download={f.nom}>Télécharger</a>
                    <a className="fq-btn sm ghost" href={f.url} target="_blank" rel="noreferrer">Voir le fichier</a>
                  </div>
                  <NoteFichier f={f} note={etat.notes[f.nom]} envoyer={envoyer} />
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
