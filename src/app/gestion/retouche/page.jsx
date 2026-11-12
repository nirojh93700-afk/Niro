"use client";

// =============================================================================
// GESTION → TESTS → RETOUCHER ET FABRIQUER (12/11/2026)
// Gérant : « c'est à moi de corriger… changer le nom, la position où je vais graver, je veux avoir accès pour tout corriger ».
// Les trois outils de création (support de téléphone, arbre de vie, décoration à suspendre) s'ouvrent ici en « mode
// atelier » (public/atelier-outils/, fabriqués par tools/maquettes/retouche-site.py) : il change le texte, la place,
// la taille, l'écriture, la forme… puis « Fabriquer les fichiers » fabrique les VRAIS fichiers pour la machine dans le
// navigateur (public/atelier-outils/fabrique.js : mm, rouge = découpe, noir = gravure, textes en tracés).
// Rien n'est enregistré sur le site et rien n'est vendu : les fichiers se téléchargent ou se partagent depuis l'appareil.
// Depuis une COMMANDE (bouton « Corriger dans l'outil » de la fiche atelier, ?creation=<id>&commande=<réf>) : la création de
// la cliente est rechargée telle quelle ; après « Fabriquer », la version de l'atelier est gardée À CÔTÉ de la sienne
// (/api/admin/creation), jamais à sa place ; « Revenir à la version de la cliente » l'efface.
// =============================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageHead from "@/components/admin/PageHead";

const OUTILS = [
  { id: "support", titre: "Support de téléphone", page: "atelier-support.html", apercu: "/atelier-tests/support-standard-rectangle-camille-apercu.webp",
    quoi: "Forme, taille, inclinaison, motif ajouré ; chaque texte, dessin ou photo gravé se déplace, s'agrandit, se retape.",
    departs: [{ ex: "camille", t: "Ouvrir avec « Camille »" }] },
  { id: "arbre", titre: "Arbre de vie et son pied", page: "atelier-arbre.html", apercu: "/atelier-tests/arbre-de-vie-lea-tom-apercu.webp",
    quoi: "Les prénoms (1 à 6), cœurs ou cercles, l'écriture, le texte du pied ; des flèches en plus pour placer chaque prénom dans son cœur.",
    departs: [{ ex: "lea-tom", t: "Ouvrir avec « Léa » et « Tom »" }] },
  { id: "decoration", titre: "Décoration à suspendre", page: "atelier-decoration.html", apercu: "/atelier-tests/decoration-boule-flocons-camille-apercu.webp",
    quoi: "La forme, la taille, les noms, les dessins, la photo, la matière de chaque pièce, en pièces à coller ou en plaque pleine.",
    departs: [{ ex: "flocons", t: "Boule « Flocons de neige »" }, { ex: "mamie", t: "Plaque « Pour Mamie »" }, { ex: "coeur-photo", t: "Cœur avec photo" }] },
];
const gris = { color: "var(--ash-muted, #7a6d58)" };
function mm(v) { return String(Math.round(v * 10) / 10).replace(".", ","); }
function jour(iso) { try { return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }); } catch { return ""; } }
function heure() { const d = new Date(); return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, "0")}`; }

// Une carte par fichier fabriqué : aperçu (traits épaissis pour qu'on les voie), téléchargement, partage (iPhone).
function Fichier({ f }) {
  const url = useMemo(() => URL.createObjectURL(new Blob([f.svg], { type: "image/svg+xml" })), [f.svg]);
  const vue = useMemo(() => URL.createObjectURL(new Blob([f.svg.replace(/stroke-width="0\.1"/g, 'stroke-width="0.45"')], { type: "image/svg+xml" })), [f.svg]);
  useEffect(() => () => { URL.revokeObjectURL(url); URL.revokeObjectURL(vue); }, [url, vue]);
  const [msg, setMsg] = useState("");
  const fichier = useMemo(() => { try { return new File([f.svg], f.nom, { type: "image/svg+xml" }); } catch { return null; } }, [f.svg, f.nom]);
  const partageable = typeof navigator !== "undefined" && !!navigator.canShare && !!fichier && navigator.canShare({ files: [fichier] });
  const partager = async () => {
    try { await navigator.share({ files: [fichier], title: f.nom }); setMsg(""); }
    catch (e) { if (e && e.name !== "AbortError") setMsg("Le partage n'a pas marché : utilisez « Télécharger »."); }
  };
  return (
    <div style={{ border: "1px solid var(--ash-line, #e7dcc8)", borderRadius: 10, padding: "10px 12px", display: "grid", gap: 6, minWidth: 0, background: "#fff" }}>
      <img src={vue} alt={`Aperçu du fichier ${f.nom}`} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "contain", background: "#fff", border: "1px solid var(--ash-line, #eee3d0)", borderRadius: 8 }} />
      <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
        <span className="fq-pill">{f.matiere}</span>
        <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{mm(f.w)} × {mm(f.h)} mm</span>
        <span style={{ fontSize: 12, ...gris }}>{f.gravure ? "découpe + gravure" : "découpe seule"}</span>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.4 }}>{f.titre}</div>
      {f.note ? <div style={{ fontSize: 12.5, lineHeight: 1.4, ...gris }}>{f.note}</div> : null}
      <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11.5, overflowWrap: "anywhere", ...gris }}>{f.nom}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a className="fq-btn sm primary" href={url} download={f.nom}>Télécharger</a>
        {partageable ? <button type="button" className="fq-btn sm" onClick={partager}>Envoyer vers…</button> : null}
      </div>
      {msg ? <div role="status" style={{ fontSize: 12.5, color: "#b4452f" }}>{msg}</div> : null}
    </div>
  );
}

export default function RetouchePage() {
  const [ouvert, setOuvert] = useState(null);     // { outil, ex } : l'outil chargé dans le cadre (gardé même fermé, pour « Retoucher encore »)
  const [visible, setVisible] = useState(false);
  const [pret, setPret] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState("");
  const [err, setErr] = useState("");
  const [resultat, setResultat] = useState(null); // { outil, a, fichiers, alerte }
  const cadre = useRef(null);
  const outil = ouvert ? OUTILS.find((o) => o.id === ouvert.outil) : null;
  // Mode « commande » : { id, ref, outil, etat (cliente), atelier (retouche gardée), atelierAt, charge (déjà posée dans l'outil) }
  const [cmd, setCmd] = useState(null);
  const [cmdMsg, setCmdMsg] = useState("");
  const cle = useRef("");

  const ouvrir = useCallback((id, ex) => {
    setErr("");
    setOuvert((cur) => { if (!cur || cur.outil !== id || cur.ex !== ex) { setPret(false); return { outil: id, ex }; } return cur; });
    setVisible(true);
  }, []);
  // Depuis la page des fichiers de test : /gestion/retouche?outil=support&ex=camille ouvre directement l'outil.
  // Depuis une commande : ?creation=<id>&commande=<réf> charge la création de la cliente.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search), id = q.get("outil"), o = OUTILS.find((x) => x.id === id);
    cle.current = sessionStorage.getItem("niv-admin-key") || "";
    const cid = q.get("creation");
    if (cid) {
      (async () => {
        try {
          const r = await fetch(`/api/admin/creation?id=${encodeURIComponent(cid)}`, { headers: { "x-admin-key": cle.current }, cache: "no-store" });
          const j = await r.json();
          if (!r.ok) throw new Error(j.error || "Création introuvable.");
          const ou = OUTILS.find((x) => x.id === j.outil);
          if (!ou || !j.etat) throw new Error("Cette création ne peut pas être ouverte.");
          setCmd({ id: j.id, ref: q.get("commande") || "", outil: ou.id, etat: j.etat, atelier: j.atelier || null, atelierAt: j.atelierAt || "", charge: false, direct: q.get("fichiers") === "1" });
          ouvrir(ou.id, ou.departs[0].ex);
        } catch (e) { setCmdMsg(`La création de cette commande n'a pas pu être ouverte : ${e.message}`); }
      })();
      return;
    }
    if (o) ouvrir(o.id, o.departs.some((d) => d.ex === q.get("ex")) ? q.get("ex") : o.departs[0].ex);
  }, [ouvrir]);
  // L'outil est prêt : on y pose la création de la commande (la version de l'atelier si elle existe, sinon celle de la cliente).
  useEffect(() => {
    if (!pret || !cmd || cmd.charge || !ouvert || ouvert.outil !== cmd.outil) return;
    try {
      if (cadre.current?.contentWindow?.nivAtelier?.charger(cmd.atelier || cmd.etat)) setCmd((c) => (c ? { ...c, charge: true } : c));
      else setErr("La création n'a pas pu être chargée dans l'outil.");
    } catch (e) { setErr(`La création n'a pas pu être chargée dans l'outil : ${e?.message || e}`); }
  }, [pret, cmd, ouvert]);
  const garder = async (etat) => {
    const r = await fetch("/api/admin/creation", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": cle.current }, body: JSON.stringify({ id: cmd.id, atelier: etat }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Enregistrement impossible.");
    setCmd((c) => (c ? { ...c, atelier: j.atelier || null, atelierAt: j.atelierAt || "" } : c));
  };
  const revenirCliente = async () => {
    if (!cmd) return;
    setCmdMsg("");
    try {
      await garder(null);
      cadre.current?.contentWindow?.nivAtelier?.charger(cmd.etat);
      setResultat(null); setVisible(true);
    } catch (e) { setCmdMsg(`Le retour à la version de la cliente a échoué : ${e.message}`); }
  };
  // L'outil prévient quand il est prêt (même site) ; on revérifie aussi à intervalles, au cas où le message est passé avant.
  useEffect(() => {
    if (!ouvert) return undefined;
    const voir = () => { try { if (cadre.current?.contentWindow?.nivAtelier?.pret) setPret(true); } catch { /* cadre pas encore chargé */ } };
    const surMessage = (ev) => { if (ev.origin === window.location.origin && ev.data && ev.data.type === "niv-pret") voir(); };
    window.addEventListener("message", surMessage);
    const t = setInterval(voir, 500);
    return () => { window.removeEventListener("message", surMessage); clearInterval(t); };
  }, [ouvert]);
  useEffect(() => {
    if (!visible) return undefined;
    const k = (e) => { if (e.key === "Escape" && !busy) setVisible(false); };
    document.addEventListener("keydown", k);
    const avant = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = avant; };
  }, [visible, busy]);

  // « sansGarder » : bouton « Fichiers pour la machine » de la commande : on refabrique la version gardée, sans rien réécrire.
  const fabriquer = async (sansGarder) => {
    const at = cadre.current?.contentWindow?.nivAtelier;
    if (!at || !at.pret) { setErr("L'outil se charge encore, un instant."); return; }
    setBusy(true); setErr(""); setProg("Fabrication des fichiers…");
    try {
      const fichiers = await at.fabriquer((fait, total) => setProg(`Fabrication des fichiers… ${fait} / ${total}`));
      let alerte = ""; try { alerte = at.alerte() || ""; } catch { /* sans alerte */ }
      // Commande : la version de l'atelier est gardée à côté de celle de la cliente (un échec ne bloque pas les fichiers).
      let gardee = "";
      if (sansGarder !== true && cmd && ouvert.outil === cmd.outil) { try { await garder(at.etat()); gardee = "ok"; } catch (e) { gardee = e.message || "échec"; } }
      setResultat({ outil: ouvert.outil, a: heure(), fichiers: Array.from(fichiers), alerte, policesKo: Array.from(fichiers.policesKo || []), gardee });
      setVisible(false);
      setTimeout(() => document.getElementById("rt-fichiers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (e) {
      setErr(`La fabrication a échoué : ${e?.message || e}`);
    } finally { setBusy(false); setProg(""); }
  };
  // Depuis la commande, bouton « Fichiers pour la machine » (&fichiers=1) : dès que la création est posée dans l'outil, les
  // fichiers sont refabriqués tels qu'elle est gardée (la version de l'atelier si elle existe, sinon celle de la cliente).
  const direct = useRef(false);
  useEffect(() => {
    if (!cmd || !cmd.direct || !cmd.charge || direct.current) return;
    direct.current = true;
    const t = setTimeout(() => fabriquer(true), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmd]);

  return (
    <div>
      <PageHead
        eyebrow="Tests"
        title="Retoucher et fabriquer"
        subtitle="Ouvrez un outil, changez ce que vous voulez (le texte, sa place, sa taille, l'écriture, la forme), puis fabriquez les fichiers pour la machine. Rien n'est vendu ni enregistré sur le site."
      />

      {cmdMsg ? <p role="alert" style={{ color: "#b4452f", fontSize: 13, margin: "10px 0 0" }}>{cmdMsg}</p> : null}
      {cmd ? (
        <section className="fq-card" style={{ marginTop: 12, gap: 8, borderLeftColor: "#b4452f" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            <strong style={{ fontSize: 15 }}>Commande {cmd.ref ? `#${cmd.ref}` : ""}</strong>
            <span style={{ fontSize: 12.5, ...gris }}>{OUTILS.find((o) => o.id === cmd.outil)?.titre}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
            {cmd.atelier ? `Votre version corrigée du ${jour(cmd.atelierAt)} est ouverte. La version de la cliente est gardée à côté.` : "La création est ouverte telle que la cliente l'a commandée. Si vous la corrigez, sa version reste gardée à côté de la vôtre."}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="fq-btn sm primary" onClick={() => setVisible(true)}>{cmd.atelier ? "Retoucher encore" : "Corriger la création"}</button>
            {cmd.atelier ? <button type="button" className="fq-btn sm" onClick={revenirCliente}>Revenir à la version de la cliente</button> : null}
            {cmd.ref ? <a className="fq-btn sm ghost" href={`/gestion/commande/${encodeURIComponent(cmd.ref)}`}>‹ Retour à la commande</a> : null}
          </div>
        </section>
      ) : null}

      <div className="fq-card" style={{ marginTop: 12, borderLeftColor: "var(--ash-gold, #c9a24b)" }}>
        <strong style={{ fontSize: 14 }}>Comment faire</strong>
        <ol style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
          <li>Ouvrez un outil ci-dessous : il s'ouvre sur un exemple, que vous changez comme vous voulez.</li>
          <li>Touchez une pièce dans la liste (ou sur l'aperçu) : sa fiche donne son texte, son écriture, sa place et sa taille en millimètres. Vous tapez une mesure, ou vous déplacez avec les flèches, par pas de 0,1 à 5 mm.</li>
          <li>En haut : Annuler, Refaire, le zoom. « Centrer » et « Aligner » posent une pièce au milieu ou sur une autre. L'onglet « Produit et ajouts » change la forme, la taille, et ajoute une pièce.</li>
          <li>Touchez « Fabriquer les fichiers » : les fichiers apparaissent ici, à la taille réelle en millimètres.</li>
          <li><b style={{ color: "#d0021b" }}>Rouge = découpe</b> · <b>noir = gravure</b>. Dans xTool, chaque nom et chaque pièce reste un objet que vous pouvez encore déplacer.</li>
        </ol>
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", marginTop: 14 }}>
        {OUTILS.map((o) => (
          <section key={o.id} className="fq-card" style={{ gap: 10 }}>
            <img src={o.apercu} alt={`Aperçu : ${o.titre}`} loading="lazy" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "contain", borderRadius: 10, background: "#f4ece0" }} />
            <div>
              <strong style={{ fontSize: 15 }}>{o.titre}</strong>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, lineHeight: 1.45, ...gris }}>{o.quoi}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {o.departs.map((d, i) => (
                <button key={d.ex} type="button" className={`fq-btn sm${i === 0 ? " primary" : ""}`} onClick={() => ouvrir(o.id, d.ex)}>{d.t}</button>
              ))}
            </div>
            {ouvert && ouvert.outil === o.id && !visible ? (
              <button type="button" className="fq-btn sm" style={{ justifySelf: "start" }} onClick={() => setVisible(true)}>Reprendre ma retouche en cours</button>
            ) : null}
          </section>
        ))}
      </div>

      {resultat ? (
        <section id="rt-fichiers" className="fq-card" style={{ marginTop: 14, gap: 10, scrollMarginTop: 80 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            <strong style={{ fontSize: 15 }}>Vos fichiers</strong>
            <span style={{ fontSize: 12.5, ...gris }}>fabriqués à {resultat.a} · {OUTILS.find((o) => o.id === resultat.outil)?.titre}</span>
          </div>
          {resultat.gardee === "ok" ? <div role="status" style={{ fontSize: 12.5, fontWeight: 600, color: "#256b34" }}>✓ Votre version est gardée avec la commande{cmd?.ref ? ` #${cmd.ref}` : ""}. Celle de la cliente n&apos;est pas modifiée.</div> : null}
          {resultat.gardee && resultat.gardee !== "ok" ? <div role="alert" style={{ fontSize: 12.5, color: "#b4452f" }}>Vos fichiers sont prêts, mais votre version n&apos;a pas pu être gardée avec la commande : {resultat.gardee}</div> : null}
          {resultat.alerte ? <div role="alert" style={{ fontSize: 12.5, lineHeight: 1.4, padding: "7px 10px", borderRadius: 9, background: "#fdf1ee", border: "1px solid #e9b9ad", color: "#8a2d1c" }}>⚠ {resultat.alerte} À corriger avant de découper.</div> : null}
          {resultat.policesKo.length ? (
            <div role="alert" style={{ fontSize: 12.5, lineHeight: 1.4, padding: "7px 10px", borderRadius: 9, background: "#fdf1ee", border: "1px solid #e9b9ad", color: "#8a2d1c" }}>
              ⚠ Cet appareil n'a pas su charger l'écriture {resultat.policesKo.map((n) => `« ${n} »`).join(", ")} : les noms du fichier peuvent être dans une autre écriture. Regardez l'aperçu ci-dessous avant de graver, ou refaites la fabrication depuis un ordinateur.
            </div>
          ) : null}
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))" }}>
            {resultat.fichiers.map((f) => <Fichier key={f.nom} f={f} />)}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="fq-btn sm" onClick={() => setVisible(true)}>Retoucher encore</button>
            {cmd && cmd.atelier ? <button type="button" className="fq-btn sm" onClick={revenirCliente}>Revenir à la version de la cliente</button> : null}
            {cmd && cmd.ref ? <a className="fq-btn sm ghost" href={`/gestion/commande/${encodeURIComponent(cmd.ref)}`}>‹ Retour à la commande</a> : null}
          </div>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, ...gris }}>Ces fichiers restent sur cet appareil tant que la page est ouverte : téléchargez-les avant de la quitter.</p>
        </section>
      ) : null}

      {/* L'outil, en plein écran. Le cadre reste chargé quand on le ferme : « Retoucher encore » retrouve tout. */}
      {ouvert ? (
        <div role="dialog" aria-modal="true" aria-label={`Retouche : ${outil?.titre || ""}`} hidden={!visible}
          style={{ position: "fixed", inset: 0, zIndex: 10050, background: "#fbf7ee", display: visible ? "flex" : "none", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "calc(8px + env(safe-area-inset-top, 0px)) 12px 8px", background: "#1a1206", color: "#fbf7ee" }}>
            <button type="button" className="fq-btn sm" disabled={busy} onClick={() => setVisible(false)} style={{ background: "transparent", color: "#fbf7ee", borderColor: "#6b5d4a" }}>‹ Fermer</button>
            <b style={{ flex: "1 1 120px", minWidth: 0, fontSize: 13.5, lineHeight: 1.3 }}>{outil?.titre}
              <small style={{ display: "block", fontWeight: 400, fontSize: 11.5, color: "#d9cbb0" }}>{busy ? prog : !pret ? "L'outil se charge…" : cmd && cmd.ref && ouvert.outil === cmd.outil ? `Commande #${cmd.ref}` : "Corrigez, puis fabriquez."}</small></b>
            <button type="button" className="fq-btn sm" disabled={busy || !pret} onClick={() => fabriquer()}
              style={{ background: "linear-gradient(135deg, #e2c67e, #c9a24b)", borderColor: "#a98935", color: "#1a1206", fontWeight: 700, opacity: busy || !pret ? 0.6 : 1 }}>{busy ? "Fabrication…" : "Fabriquer les fichiers"}</button>
          </div>
          {err ? <div role="alert" style={{ padding: "8px 12px", fontSize: 13, background: "#fdf1ee", color: "#8a2d1c", borderBottom: "1px solid #e9b9ad" }}>{err}</div> : null}
          <iframe ref={cadre} key={`${ouvert.outil}-${ouvert.ex}`} title={`Outil : ${outil?.titre || ""}`} src={`/atelier-outils/${outil?.page}?ex=${ouvert.ex}`}
            style={{ flex: 1, width: "100%", border: 0, background: "#fbf7ee", minHeight: 0 }} />
        </div>
      ) : null}
    </div>
  );
}
