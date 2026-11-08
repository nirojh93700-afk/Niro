"use client";

// =============================================================================
// GESTION → RÉGLAGES → PROGRAMMATIONS (08/11/2026)
// Un changement qui s'applique tout seul à une date et une heure (heure de Paris), annulable avant :
// prix d'une option · visibilité d'un produit · fête · code promo · bandeau.
// Lecture : /api/admin/programmations · POST { action:"ajouter"|"annuler"|"supprimer"|"executer" }.
// Aucune fenêtre système : les retours passent par le toast de Gestion.
// =============================================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import PageHead from "@/components/admin/PageHead";
import { Ico } from "@/components/admin/AdminShell";
import { toast } from "@/components/admin/AdminToast";

const QUOI = [
  ["prix", "Prix d'une option"],
  ["visibilite", "Visibilité d'un produit"],
  ["fete", "Fête (allumer / éteindre)"],
  ["promo", "Code promo"],
  ["bandeau", "Bandeau du site"],
];
const QUOI_COURT = { prix: "Prix", visibilite: "Visibilité", fete: "Fête", promo: "Code promo", bandeau: "Bandeau" };
const ETAT = { a_venir: ["À venir", "info"], fait: ["Fait", "ok"], annule: ["Annulée", "grey"], erreur: ["Erreur", "bad"] };

// --- Heure de Paris → horodatage ---------------------------------------------------------------
function decalageParis(ts) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const o = Object.fromEntries(f.formatToParts(new Date(ts)).map((p) => [p.type, p.value]));
  return Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute, +o.second) - ts;
}
/** « 2026-11-20 » + « 08:00 » lus comme une heure de Paris → ms. NaN si incomplet. */
function parisVersTs(date, heure) {
  if (!date || !heure) return NaN;
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = heure.split(":").map(Number);
  if (![y, m, d, h, mi].every(Number.isFinite)) return NaN;
  const devine = Date.UTC(y, m - 1, d, h, mi);
  const t1 = devine - decalageParis(devine);
  return devine - decalageParis(t1);
}
function quand(ts) {
  const d = new Date(Number(ts));
  if (Number.isNaN(d.getTime())) return "—";
  const jour = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", " h ");
  return `${jour} · ${heure}`;
}
function demainIso() {
  const d = new Date(Date.now() + 86400000);
  return d.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" }); // AAAA-MM-JJ
}
const prixFr = (n) => Number(n).toFixed(2).replace(".", ",") + " €";

const champ = { width: "100%", padding: "8px 10px", border: "1px solid var(--ash-line-2, #e6ddc9)", borderRadius: 10, font: "inherit", fontSize: 13, background: "#fff", minHeight: 36 };
const etiquette = { display: "block", fontSize: 11.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ash-muted, #7a6d58)", marginBottom: 4 };

function Champ({ label, children, span }) {
  return (
    <label style={{ display: "block", minWidth: 0, gridColumn: span ? "1 / -1" : undefined }}>
      <span style={etiquette}>{label}</span>
      {children}
    </label>
  );
}

function Choix({ valeur, onChange, options }) {
  return (
    <div className="fq-chipbar" style={{ minHeight: 36, alignItems: "center", flexWrap: "wrap" }}>
      {options.map(([v, t]) => (
        <button key={String(v)} type="button" className={`fq-chip${valeur === v ? " on" : ""}`} onClick={() => onChange(v)}>{t}</button>
      ))}
    </div>
  );
}

export default function ProgrammationsPage() {
  const [key, setKey] = useState("");
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [envoi, setEnvoi] = useState(false);

  // Formulaire
  const [quoi, setQuoi] = useState("prix");
  const [slug, setSlug] = useState("");
  const [variantId, setVariantId] = useState("");
  const [prix, setPrix] = useState("");
  const [visible, setVisible] = useState(false);
  const [fete, setFete] = useState("noel");
  const [allumer, setAllumer] = useState(true);
  const [code, setCode] = useState("");
  const [promoAction, setPromoAction] = useState("creer");
  const [promoType, setPromoType] = useState("percent");
  const [promoValeur, setPromoValeur] = useState("");
  const [promoJours, setPromoJours] = useState("");
  const [bandeauOn, setBandeauOn] = useState(true);
  const [bandeauTexte, setBandeauTexte] = useState("");
  const [bandeauLien, setBandeauLien] = useState("");
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("08:00");
  const [note, setNote] = useState("");

  const load = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/programmations", { headers: { "x-admin-key": k }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Chargement impossible.");
      setD(j);
      setErr("");
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (k) { setKey(k); load(k); }
    setDate(demainIso());
  }, [load]);

  const produits = d?.produits || [];
  const produit = useMemo(() => produits.find((p) => p.slug === slug) || null, [produits, slug]);
  useEffect(() => {
    // Une seule option = choisie d'office ; sinon on repart de zéro quand le produit change.
    if (produit && produit.variants.length === 1) setVariantId(produit.variants[0].id);
    else setVariantId("");
  }, [produit]);
  const variante = produit ? produit.variants.find((v) => v.id === variantId) : null;

  const at = parisVersTs(date, heure);

  function programmationDuFormulaire() {
    const base = { quoi, at, note };
    if (quoi === "prix") return { ...base, cible: slug, variantId, valeur: prix };
    if (quoi === "visibilite") return { ...base, cible: slug, valeur: visible };
    if (quoi === "fete") return { ...base, cible: fete, valeur: allumer };
    if (quoi === "promo") return { ...base, cible: code, valeur: promoAction === "supprimer" ? null : { type: promoType, value: promoValeur, days: promoJours, reusable: true } };
    return { ...base, cible: "", valeur: { enabled: bandeauOn, text: bandeauTexte, link: bandeauLien } };
  }

  async function poster(body) {
    const r = await fetch("/api/admin/programmations", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Impossible.");
    if (Array.isArray(j.programmations)) setD((cur) => (cur ? { ...cur, programmations: j.programmations } : cur));
    return j;
  }

  async function programmer(e) {
    e.preventDefault();
    if (envoi) return;
    setEnvoi(true);
    try {
      await poster({ action: "ajouter", programmation: programmationDuFormulaire() });
      toast("Programmé ✓", "ok");
      setPrix(""); setNote(""); setPromoValeur(""); setPromoJours("");
      if (quoi === "promo" && promoAction === "creer") load(key);
    } catch (e2) { toast(e2.message, "err"); }
    finally { setEnvoi(false); }
  }
  async function annuler(id) {
    try { await poster({ action: "annuler", id }); toast("Programmation annulée", "ok"); }
    catch (e) { toast(e.message, "err"); }
  }
  async function supprimer(id) {
    try { await poster({ action: "supprimer", id }); toast("Ligne retirée", "ok"); }
    catch (e) { toast(e.message, "err"); }
  }
  async function executerMaintenant() {
    if (envoi) return;
    setEnvoi(true);
    try {
      const j = await poster({ action: "executer" });
      toast(j.faites ? `${j.faites} changement${j.faites > 1 ? "s" : ""} appliqué${j.faites > 1 ? "s" : ""}${j.erreurs ? ` · ${j.erreurs} en erreur` : ""}` : "Rien n'était à appliquer pour l'instant", j.erreurs ? "err" : "ok");
    } catch (e) { toast(e.message, "err"); }
    finally { setEnvoi(false); }
  }

  if (!key) return <PageHead eyebrow="Réglages" title="Programmations" subtitle="Ouvrez d'abord Gestion pour saisir votre mot de passe." />;

  const liste = d?.programmations || [];
  const aVenir = liste.filter((p) => p.etat === "a_venir").sort((a, b) => a.at - b.at);
  const passees = liste.filter((p) => p.etat !== "a_venir").sort((a, b) => (b.faitLe || b.annuleLe || b.at) - (a.faitLe || a.annuleLe || a.at));
  const enErreur = liste.filter((p) => p.etat === "erreur").length;
  const echeance = aVenir.filter((p) => p.at <= Date.now()).length;

  // Aperçu lisible de ce qui va être programmé.
  let apercu = "";
  if (quoi === "prix" && produit) apercu = `${produit.name}${produit.variants.length > 1 && variante ? " · " + variante.title : ""} : ${prix ? prix.replace(".", ",") + " €" : "…"}${variante && Number.isFinite(variante.price) ? ` (aujourd'hui ${prixFr(variante.price)})` : ""}`;
  if (quoi === "visibilite" && produit) apercu = `${visible ? "Afficher" : "Masquer"} ${produit.name}`;
  if (quoi === "fete") apercu = `${(d?.fetes || []).find((f) => f.k === fete)?.nom || fete} : ${allumer ? "allumer" : "éteindre"}`;
  if (quoi === "promo" && code) apercu = promoAction === "supprimer" ? `Code ${code.toUpperCase()} : supprimer` : `Code ${code.toUpperCase()} : créer (−${promoValeur || "…"}${promoType === "fixed" ? " €" : " %"}${promoJours ? `, ${promoJours} j` : ""})`;
  if (quoi === "bandeau") apercu = bandeauOn ? `Bandeau : « ${bandeauTexte || "…"} »` : "Bandeau : désactiver";

  return (
    <div className="fq">
      <PageHead eyebrow="Réglages" title="Programmations"
        subtitle="Un changement qui s'applique tout seul à la date et à l'heure que vous choisissez (heure de Paris) : un prix, un produit affiché ou masqué, une fête allumée ou éteinte, un code promo, le bandeau du site. Vous pouvez l'annuler tant qu'il n'est pas fait."
        kpis={[
          { label: "À venir", value: d ? aVenir.length : "—", sub: "changements programmés" },
          { label: "Faits", value: d ? liste.filter((p) => p.etat === "fait").length : "—", sub: "appliqués par le site" },
          { label: "En erreur", value: d ? enErreur : "—", sub: "à regarder", tone: enErreur ? "bad" : undefined },
        ]} />
      {err ? <p className="fq-empty" style={{ color: "var(--ash-bad)" }}>{err}</p> : null}
      {!d && !err ? <p className="fq-empty">Chargement…</p> : null}

      {/* ---------------- Formulaire ---------------- */}
      <form onSubmit={programmer} className="fq-card" style={{ gap: 12, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 }}><Ico n="clock" /> Programmer un changement</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <Champ label="Quoi" span>
            <Choix valeur={quoi} onChange={setQuoi} options={QUOI} />
          </Champ>

          {(quoi === "prix" || quoi === "visibilite") ? (
            <Champ label="Produit">
              <select style={champ} value={slug} onChange={(e) => setSlug(e.target.value)} required>
                <option value="">— Choisir un produit —</option>
                {produits.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              </select>
            </Champ>
          ) : null}

          {quoi === "prix" && produit ? (
            <Champ label="Option">
              <select style={champ} value={variantId} onChange={(e) => setVariantId(e.target.value)} required>
                {produit.variants.length > 1 ? <option value="">— Choisir l'option —</option> : null}
                {produit.variants.map((v) => <option key={v.id} value={v.id}>{v.title}{Number.isFinite(v.price) ? ` · ${prixFr(v.price)}` : ""}</option>)}
              </select>
            </Champ>
          ) : null}
          {quoi === "prix" ? (
            <Champ label="Nouveau prix (prix du code, barré pour un bijou)">
              <input style={champ} value={prix} onChange={(e) => setPrix(e.target.value)} inputMode="decimal" placeholder="24,90" required />
            </Champ>
          ) : null}

          {quoi === "visibilite" ? (
            <Champ label="Le produit sera">
              <Choix valeur={visible} onChange={setVisible} options={[[true, "Visible"], [false, "Masqué"]]} />
            </Champ>
          ) : null}

          {quoi === "fete" ? (
            <>
              <Champ label="Fête">
                <select style={champ} value={fete} onChange={(e) => setFete(e.target.value)}>
                  {(d?.fetes || []).map((f) => <option key={f.k} value={f.k}>{f.nom}</option>)}
                </select>
              </Champ>
              <Champ label="Action">
                <Choix valeur={allumer} onChange={setAllumer} options={[[true, "Allumer"], [false, "Éteindre"]]} />
              </Champ>
            </>
          ) : null}

          {quoi === "promo" ? (
            <>
              <Champ label="Action">
                <Choix valeur={promoAction} onChange={setPromoAction} options={[["creer", "Créer / modifier"], ["supprimer", "Supprimer"]]} />
              </Champ>
              <Champ label="Code">
                <input style={{ ...champ, textTransform: "uppercase" }} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="NOEL10" list="codes-existants" required />
                <datalist id="codes-existants">{(d?.codes || []).map((c) => <option key={c} value={c} />)}</datalist>
              </Champ>
              {promoAction === "creer" ? (
                <>
                  <Champ label="Remise">
                    <div style={{ display: "flex", gap: 6 }}>
                      <input style={{ ...champ, flex: 1 }} value={promoValeur} onChange={(e) => setPromoValeur(e.target.value)} inputMode="decimal" placeholder="10" required />
                      <select className="fq-select" value={promoType} onChange={(e) => setPromoType(e.target.value)} aria-label="Type de remise">
                        <option value="percent">%</option>
                        <option value="fixed">€</option>
                      </select>
                    </div>
                  </Champ>
                  <Champ label="Valable (jours, vide = sans limite)">
                    <input style={champ} value={promoJours} onChange={(e) => setPromoJours(e.target.value)} inputMode="numeric" placeholder="30" />
                  </Champ>
                </>
              ) : null}
            </>
          ) : null}

          {quoi === "bandeau" ? (
            <>
              <Champ label="Le bandeau sera">
                <Choix valeur={bandeauOn} onChange={setBandeauOn} options={[[true, "Activé"], [false, "Désactivé"]]} />
              </Champ>
              {bandeauOn ? (
                <>
                  <Champ label="Texte du bandeau">
                    <input style={champ} value={bandeauTexte} onChange={(e) => setBandeauTexte(e.target.value)} maxLength={160} placeholder="Commandez avant le 10 décembre pour Noël" required />
                  </Champ>
                  <Champ label="Lien (facultatif)">
                    <input style={champ} value={bandeauLien} onChange={(e) => setBandeauLien(e.target.value)} maxLength={200} placeholder="/offrir/noel" />
                  </Champ>
                </>
              ) : null}
            </>
          ) : null}

          <Champ label="Date">
            <input style={champ} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Champ>
          <Champ label="Heure (Paris)">
            <input style={champ} type="time" value={heure} onChange={(e) => setHeure(e.target.value)} required />
          </Champ>
          <Champ label="Note (pourquoi, facultatif)" span>
            <input style={champ} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Ex. : fin de la promotion de Noël" />
          </Champ>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, color: "var(--ash-muted, #7a6d58)", minWidth: 0 }}>
            {apercu ? <><b style={{ color: "var(--ash-ink, #1a1206)" }}>{apercu}</b>{Number.isFinite(at) ? <> · le {quand(at)}</> : null}</> : "Choisissez ce qui doit changer."}
            {Number.isFinite(at) && at <= Date.now() ? <span className="fq-pill bad" style={{ marginLeft: 8 }}><Ico n="alert" /> cette heure est déjà passée</span> : null}
          </div>
          <button type="submit" className="fq-btn pri" disabled={envoi || !Number.isFinite(at)}><Ico n="clock" /> Programmer</button>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--ash-muted, #7a6d58)" }}>
          Le site vérifie toutes les 15 minutes : le changement se fait dans le quart d&apos;heure qui suit l&apos;heure choisie. Chaque changement appliqué est noté dans le journal d&apos;activité.
        </p>
      </form>

      {/* ---------------- À venir ---------------- */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", margin: "18px 0 8px" }}>
        <h2 style={{ fontSize: 15 }}>À venir{d ? ` (${aVenir.length})` : ""}</h2>
        {echeance ? <button type="button" className="fq-btn sm" onClick={executerMaintenant} disabled={envoi}><Ico n="bolt" /> Appliquer maintenant ce qui est échu</button> : null}
      </div>
      {d && !aVenir.length ? <p className="fq-empty">Aucun changement programmé. Remplissez le formulaire ci-dessus : le site s&apos;en chargera à l&apos;heure dite.</p> : null}
      {aVenir.length ? (
        <div className="fq-card" style={{ padding: 0, gap: 0 }}>
          {aVenir.map((p, i) => (
            <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "10px 12px", borderTop: i ? "1px solid var(--ash-line, #eee5d4)" : "none" }}>
              <span className="fq-pill info">{QUOI_COURT[p.quoi] || p.quoi}</span>
              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, overflowWrap: "anywhere" }}>{p.libelle}</div>
                {p.note ? <div style={{ fontSize: 12.5, color: "var(--ash-muted, #7a6d58)", overflowWrap: "anywhere" }}>{p.note}</div> : null}
              </div>
              <div style={{ whiteSpace: "nowrap", fontSize: 13, fontVariantNumeric: "tabular-nums", display: "inline-flex", alignItems: "center", gap: 6, color: p.at <= Date.now() ? "var(--ash-warn)" : undefined }}>
                <Ico n="clock" /> {quand(p.at)}
              </div>
              <button type="button" className="fq-btn sm danger" onClick={() => annuler(p.id)}><Ico n="x" /> Annuler</button>
            </div>
          ))}
        </div>
      ) : null}

      {/* ---------------- Passées ---------------- */}
      {passees.length ? (
        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 14 }}>Faites, annulées ou en erreur ({passees.length})</summary>
          <div className="fq-card" style={{ padding: 0, gap: 0, marginTop: 8 }}>
            {passees.slice(0, 200).map((p, i) => {
              const [txt, ton] = ETAT[p.etat] || [p.etat, "grey"];
              return (
                <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "9px 12px", borderTop: i ? "1px solid var(--ash-line, #eee5d4)" : "none", opacity: p.etat === "annule" ? 0.65 : 1 }}>
                  <span className={`fq-pill ${ton}`}>{p.etat === "fait" ? <Ico n="check" /> : p.etat === "erreur" ? <Ico n="alert" /> : null}{txt}</span>
                  <span className="fq-pill grey">{QUOI_COURT[p.quoi] || p.quoi}</span>
                  <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflowWrap: "anywhere" }}>{p.libelle}</div>
                    {p.note ? <div style={{ fontSize: 12, color: "var(--ash-muted, #7a6d58)", overflowWrap: "anywhere" }}>{p.note}</div> : null}
                    {p.erreur ? <div style={{ fontSize: 12, color: "var(--ash-bad)", overflowWrap: "anywhere" }}>{p.erreur}</div> : null}
                  </div>
                  <div style={{ whiteSpace: "nowrap", fontSize: 12.5, color: "var(--ash-muted, #7a6d58)", fontVariantNumeric: "tabular-nums" }}>
                    prévu {quand(p.at)}{p.faitLe ? ` · ${p.etat === "erreur" ? "essayé" : "fait"} ${quand(p.faitLe)}` : ""}
                  </div>
                  <button type="button" className="fq-btn sm ghost" onClick={() => supprimer(p.id)} title="Retirer de la liste"><Ico n="x" /></button>
                </div>
              );
            })}
          </div>
        </details>
      ) : null}
    </div>
  );
}
