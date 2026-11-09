"use client";

// =============================================================================
// CARTE D'UNE COMMANDE DANS LA FILE DE PRODUCTION (04/11/2026, maquette validée
// https://claude.ai/artifact/3B7UPQuyWCkAXxSQ6Sf2rE). Rien de la carte d'avant
// n'est retiré : tout est rangé — en-tête (n° d'ordre, réf, total), cliente et
// mode d'envoi, pastilles d'alerte TOUJOURS visibles, articles avec la gravure,
// date limite, étiquettes + note interne + conditionnement, ratés, UNE grande
// action + menu « ··· ». Expédier se fait DANS la carte (n° de suivi, transporteur
// reconnu, case « prévenir ») : plus jamais de fenêtre système.
// =============================================================================
import { useEffect, useState } from "react";
import Link from "next/link";
import Ic from "@/components/admin/IconesGestion";
import VarBadge from "@/components/admin/VarBadge";
import DelaiCommande from "@/components/admin/DelaiCommande";
import { BlocConditionnement, materielConseille } from "@/components/admin/Conditionnement";
import { RatesCommande } from "@/components/admin/Rates";
import { apparierSpec, eclaterParVerre } from "@/lib/orderSpec";
import { lienSuivi, numerosSuivi, joindreSuivis } from "@/lib/suiviColis";
import { paysDeLaCommande } from "@/lib/paysLivraison";
import { FLAGS, FLAG_PAR_ID, chipsDe, pastilleProvenance, modeDe, statutDe, statutInfo, estActive, estFinie, euro, ageDe, dateFr, refDe, hrefFiche, adresseLigne } from "@/lib/fileCommandes";

const MODE_IC = { express: "bolt", relais: "pin", retrait: "user", domicile: "home" };

// Réduit la photo d'une étiquette dans le navigateur (1600 px max, JPEG) avant de l'envoyer à la
// lecture — même méthode que `PhotosJointes.jsx`. → data URL.
function reduirePhoto(file, maxDim = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        try { resolve(c.toDataURL("image/jpeg", quality)); } catch { resolve(r.result); }
      };
      img.onerror = () => reject(new Error("Photo illisible"));
      img.src = r.result;
    };
    r.onerror = () => reject(new Error("Photo illisible"));
    r.readAsDataURL(file);
  });
}

export function Pill({ tone = "grey", ic, children, title }) {
  return <span className={`fq-pill ${tone}`} title={title}>{ic ? <Ic n={ic} /> : null}{children}</span>;
}

// Expédition dans la carte : n° de suivi, transporteur reconnu par lienSuivi (La Poste, Mondial Relay,
// Chronopost…), case « prévenir la cliente » (e-mail avec le lien de suivi), ou remise en main propre.
// 07/11/2026 : UN CHAMP PAR COLIS (« + Ajouter un autre colis ») quand la commande part en plusieurs
// cartons ; les numéros sont rangés ensemble dans `tracking` (séparés par « , », voir joindreSuivis).
export function FormExpedition({ o, onStatus, onClose, busy, titre = "Expédier" }) {
  const depart = numerosSuivi(o.tracking);
  const [nums, setNums] = useState(depart.length ? depart : [""]);
  const [notify, setNotify] = useState(Boolean(o.customerEmail));
  const [erreur, setErreur] = useState("");
  // Scan de l'étiquette (08/11/2026) : { i: n° du colis, etat: "lecture" | "incertain" | "echec" | "ok" }.
  const [scan, setScan] = useState(null);
  const mode = modeDe(o);
  const pays = paysDeLaCommande(o);
  const changer = (i, v) => { setNums((l) => l.map((x, j) => (j === i ? v : x))); setErreur(""); };

  // Matériel du colis proposé ICI (09/11/2026) : si le conditionnement n'est pas encore validé pour
  // cette commande, le matériel habituel est coché d'office et décompté à « Confirmer l'expédition ».
  // Déjà validé (ou modification du suivi) : rien n'est proposé, rien n'est décompté deux fois.
  const [matos, setMatos] = useState(null); // { lignes: [{ id, nom, cout }], etiquette } | { deja: true }
  const [decompter, setDecompter] = useState(true);
  const adminKey = () => (typeof sessionStorage !== "undefined" && sessionStorage.getItem("niv-admin-key")) || "";
  useEffect(() => {
    if (statutDe(o) === "expediee" || !o.id) return undefined;
    let vivant = true;
    fetch(`/api/admin/materiel?orderId=${encodeURIComponent(o.id)}`, { headers: { "x-admin-key": adminKey() } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivant || !d) return;
        if (d.usage) { setMatos({ deja: true }); return; }
        const items = (d.items || []).filter((i) => !i.archive);
        const ids = materielConseille(o, items);
        const lignes = items.filter((i) => ids.has(i.id) && !(typeof i.stock === "number" && i.stock <= 0)).map((i) => ({ id: i.id, nom: i.nom, cout: Number(i.cout) || 0 }));
        if (lignes.length) setMatos({ lignes, etiquette: Number(d.estimation?.etiquette) || 0 });
      })
      .catch(() => {});
    return () => { vivant = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.id]);
  async function decompterMateriel() {
    if (!matos || matos.deja || !decompter || !matos.lignes?.length) return;
    try {
      await fetch("/api/admin/materiel", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey() },
        body: JSON.stringify({ action: "valider", orderId: o.id, lines: Object.fromEntries(matos.lignes.map((l) => [l.id, 1])), etiquette: matos.etiquette }) });
    } catch { /* l'expédition passe quand même : le matériel se valide ensuite dans « Conditionnement » */ }
  }
  const pleins = numerosSuivi(nums);

  // « 📷 Scanner l'étiquette » : la photo est réduite ici, lue par le serveur (admin), le numéro
  // est posé dans le champ du colis i. Le gérant garde la main : il peut corriger ou retaper.
  async function scanner(i, file) {
    if (!file) return;
    setScan({ i, etat: "lecture" });
    try {
      const dataUrl = await reduirePhoto(file);
      const key = (typeof sessionStorage !== "undefined" && sessionStorage.getItem("niv-admin-key")) || "";
      const r = await fetch("/api/admin/lire-etiquette", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ dataUrl }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok || !j.numero) { setScan({ i, etat: "echec" }); return; }
      changer(i, j.numero);
      setScan({ i, etat: j.certain === false ? "incertain" : "ok" });
    } catch {
      setScan({ i, etat: "echec" });
    }
  }
  return (
    <form className="fq-ship" onSubmit={async (e) => {
      e.preventDefault();
      const t = joindreSuivis(nums);
      if (!t && o.customerEmail && notify) { setErreur("Sans numéro de suivi, la cliente ne recevra pas de lien : décoche « Prévenir » ou saisis le numéro."); return; }
      await decompterMateriel();
      await onStatus(o, "expediee", { tracking: t, notifyCustomer: Boolean(t && notify && o.customerEmail) });
      onClose();
    }}>
      <h3><Ic n="truck" /> {titre} #{refDe(o)}</h3>
      {nums.map((n, i) => {
        const sc = scan && scan.i === i ? scan.etat : null;
        const lecture = sc === "lecture";
        const bord = sc === "incertain" ? "#d97706" : sc === "echec" ? "var(--ash-bad)" : undefined;
        return (
          <div key={i}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="text" style={{ flex: 1, minWidth: 0, borderColor: bord, boxShadow: bord ? `0 0 0 1px ${bord}` : undefined }} value={n} onChange={(e) => { changer(i, e.target.value); if (sc && sc !== "lecture") setScan(null); }} placeholder={nums.length > 1 ? `N° de suivi du colis ${i + 1}` : "N° de suivi (La Poste, Mondial Relay, Chronopost…)"} autoFocus={i === 0} />
              {nums.length > 1 ? <button type="button" className="fq-btn ghost" aria-label={`Retirer le colis ${i + 1}`} onClick={() => { setNums((l) => l.filter((_, j) => j !== i)); setScan(null); }}>✕</button> : null}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
              <label className="fq-btn ghost sm" style={{ display: "inline-flex", alignSelf: "flex-start", cursor: lecture ? "wait" : "pointer", opacity: lecture ? 0.6 : 1 }} aria-label={`Scanner l'étiquette du colis ${i + 1}`}>
                <input type="file" accept="image/*" capture="environment" hidden disabled={lecture} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; scanner(i, f); }} />
                <Ic n="img" /> {lecture ? "Lecture…" : "Scanner l'étiquette"}
              </label>
              <div className="car">{nums.length > 1 ? `Colis ${i + 1} · ` : ""}Transporteur reconnu : <b>{n.trim() ? lienSuivi(n.trim(), o).nom : "—"}</b></div>
            </div>
            {sc === "incertain" ? <div className="car" style={{ color: "#b45309", fontWeight: 600 }}>Lecture incertaine : vérifiez le numéro.</div> : null}
            {sc === "echec" ? <div className="car" style={{ color: "var(--ash-bad)", fontWeight: 600 }}>Lecture impossible, tapez le numéro.</div> : null}
          </div>
        );
      })}
      <button type="button" className="fq-btn ghost" style={{ alignSelf: "flex-start" }} onClick={() => setNums((l) => [...l, ""])}>+ Ajouter un autre colis</button>
      <div className="car">{pleins.length > 1 ? `${pleins.length} colis : la cliente recevra un lien de suivi pour chacun.` : "Le lien de suivi envoyé sera le bon."}</div>
      {o.customerEmail ? <label><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Prévenir la cliente par e-mail ({o.customerEmail})</label> : <div className="car">Pas d&apos;e-mail sur cette commande : aucun message ne partira.</div>}
      {matos?.deja ? <div className="car"><Ic n="check" /> Matériel du colis déjà validé.</div> : null}
      {matos?.lignes?.length ? (
        <label style={{ alignItems: "flex-start" }}>
          <input type="checkbox" checked={decompter} onChange={(e) => setDecompter(e.target.checked)} />
          <span>Sortir du stock le matériel habituel de ce colis : <b>{matos.lignes.map((l) => l.nom).join(", ")}</b> ({euro(matos.lignes.reduce((t, l) => t + l.cout, 0))}).
            <small style={{ display: "block", color: "var(--ash-muted, #6b6558)" }}>Autre matériel ? Décochez, puis ouvrez « Conditionnement » sur la carte.</small></span>
        </label>
      ) : null}
      {mode.k === "relais" && o.relaisPoint ? <div className="car"><Ic n="pin" /> {o.relaisPoint}</div> : null}
      {mode.k === "express" ? <div className="car" style={{ color: "var(--ash-bad)", fontWeight: 700 }}><Ic n="bolt" /> Express payé : Chrono 18 à domicile</div> : null}
      {pays.etranger ? <div className="car" style={{ color: "var(--ash-bad)", fontWeight: 700 }}>{pays.drapeau} {pays.nom} : étiquette internationale</div> : null}
      {erreur ? <div className="car" style={{ color: "var(--ash-bad)" }}>{erreur}</div> : null}
      <div className="r">
        {mode.k === "retrait" ? <button type="button" className="fq-btn" disabled={busy} onClick={async () => { await onStatus(o, "remise_main_propre", {}); onClose(); }}><Ic n="user" /> Remise en main propre</button> : null}
        <button type="button" className="fq-btn ghost" onClick={onClose}>Annuler</button>
        <button type="submit" className="fq-btn pri" disabled={busy}><Ic n="check" /> Confirmer l&apos;expédition</button>
      </div>
    </form>
  );
}

// Liens de suivi d'une commande (un par colis), pour Gestion.
export function LiensSuivi({ o, sep = " · " }) {
  const nums = numerosSuivi(o.tracking);
  return nums.map((t, i) => {
    const s = lienSuivi(t, o);
    return (
      <span key={t}>
        {i ? sep : null}{nums.length > 1 ? `Colis ${i + 1} : ` : ""}<span className="mono">{t}</span>
        {s ? <> · <a href={s.url} target="_blank" rel="noreferrer">suivre ({s.nom})</a>{s.autre ? <> · <a href={s.autre.url} target="_blank" rel="noreferrer">{s.autre.nom}</a></> : null}</> : null}
      </span>
    );
  });
}

export default function CarteCommande({ o, pos, inBoard = false, unread = false, selected = false, onSelect, onStatus, onAnnotate, mat, onCond, adminKey, onMat, busy = false, onToast, focus = false }) {
  const [menu, setMenu] = useState(false);
  const [ship, setShip] = useState(false);
  const [noteEdit, setNoteEdit] = useState(false);
  const [note, setNote] = useState(o.adminNote || "");
  const [flagPick, setFlagPick] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelNotify, setCancelNotify] = useState(Boolean(o.customerEmail));
  const [rates, setRates] = useState(false);

  const st = statutDe(o);
  const info = statutInfo(o);
  const mode = modeDe(o);
  const pays = paysDeLaCommande(o);
  const flags = o.flags || [];
  const chips = chipsDe(o, unread);
  let venue = null;
  try { venue = pastilleProvenance(o); } catch { venue = null; }
  const active = estActive(o);
  const finie = estFinie(o);
  const ref = refDe(o);
  const fiche = hrefFiche(o);
  const cls = ["fq-card", active && mode.k === "express" ? "express" : "", selected ? "sel" : "", focus ? "focus" : "", o.test ? "test" : ""].filter(Boolean).join(" ");
  const specParLigne = apparierSpec(o.items, o.spec);
  const lignes = (o.items || []).map((it, i) => ({ it, s: specParLigne[i] })).filter(({ it }) => !/livraison|point relais|retrait/i.test(it.name || ""));
  const suivi = o.tracking ? lienSuivi(o.tracking, o) : null;

  function fermerTout() { setMenu(false); setShip(false); setFlagPick(false); setConfirmCancel(false); }
  async function copierEmail() {
    try { await navigator.clipboard.writeText(o.customerEmail || ""); onToast?.("E-mail copié : " + o.customerEmail); } catch { onToast?.(o.customerEmail || "Pas d'e-mail"); }
  }

  let pri = null;
  if (st === "a_preparer") pri = <button type="button" className="fq-btn pri" disabled={busy} onClick={() => onStatus(o, "en_gravure", {}, { undo: "a_preparer" })}><Ic n="pen" /> Commencer la fabrication</button>;
  else if (st === "en_gravure") pri = <button type="button" className="fq-btn pri" disabled={busy} onClick={() => { fermerTout(); setShip((v) => !v); }}><Ic n="truck" /> Expédier…</button>;
  else if (st === "expediee") pri = <button type="button" className="fq-btn ok" disabled={busy} onClick={() => onStatus(o, "livree", { notifyCustomer: Boolean(o.customerEmail) }, { undo: "expediee", texte: "marquée livrée" + (o.customerEmail ? " · demande d'avis envoyée" : "") })}><Ic n="check" /> Livrée</button>;
  else if (st === "annulee") pri = <button type="button" className="fq-btn" disabled={busy} onClick={() => onStatus(o, "a_preparer", {}, { texte: "rétablie" })}><Ic n="undo" /> Rétablir</button>;

  return (
    <article className={cls} data-card={o.id} tabIndex={0}>
      <div className="fq-c1">
        {onSelect ? <input type="checkbox" className="fq-selbox" checked={selected} onChange={() => onSelect(o)} aria-label={`Sélectionner ${ref}`} /> : null}
        {pos ? <span className="fq-pos" title="Ordre de traitement">{pos}</span> : null}
        <Link className="fq-ref" href={fiche}>#{ref}</Link>
        {!inBoard ? <Pill tone={info.tone}>{info.lib}</Pill> : null}
        <span className="fq-tot mono">{euro(o.total)}</span>
      </div>
      <div className="fq-who">
        <b>{o.customerName || "—"}</b>
        <span className="dot">·</span><span title={dateFr(o.createdAt)}>{ageDe(o.createdAt)}</span>
        <span className="dot">·</span><span className={`fq-mode ${mode.k}`}><Ic n={MODE_IC[mode.k]} /> {mode.lib}{Number(o.shippingPrice) > 0 ? ` · ${euro(o.shippingPrice)}` : ""}</span>
        {mode.k === "relais" && o.relaisPoint ? <><span className="dot">·</span><span>{o.relaisPoint}</span></> : null}
        {pays.etranger ? <><span className="dot">·</span><b style={{ color: "var(--ash-bad)" }}>{pays.drapeau} {pays.nom}</b></> : null}
      </div>
      {chips.length || venue ? <div className="fq-chips">{chips.map((c) => <Pill key={c.k} tone={c.tone} ic={{ express: "bolt", immediate: "bolt", pays: "flag", reponse: "mail", cadeau: "gift", dateimage: "alert", alerte: "alert", surmesure: "pen", emailfix: "mail", test: "tag" }[c.k]}>{c.lib}</Pill>)}{venue ? <span className="fq-pill line pv-src" title="D'où vient la cliente"><i style={{ background: venue.couleur }} />Venue de : <b>{venue.nom}</b>{venue.extra ? ` · ${venue.extra}` : ""}</span> : null}</div> : null}
      {!inBoard && o.shippingAddress ? <div className="fq-adr">{mode.k === "relais" ? "Coordonnées : " : "Étiquette : "}{adresseLigne(o)}</div> : null}

      <ul className="fq-items">
        {lignes.map(({ it, s }, i) => {
          const verres = s ? eclaterParVerre(s) : [];
          const enLot = verres.length > 1;
          const details = enLot ? String(it.details || "").replace(/\s*—\s*Personnalisation\s*:[\s\S]*$/, "") : it.details;
          return (
            <li key={i}>
              <span className="q">{it.quantity}×</span>
              <span>
                <b>{it.name}</b>
                {(s?.variantDetail || it.variantDetail) ? <span className="var"> · <VarBadge texte={s?.variantDetail || it.variantDetail} /></span> : null}
                {!inBoard && details ? <span className="det">{details}</span> : null}
                {enLot ? verres.map((v) => <span key={v.verre} className="perso"><Ic n="pen" /> Verre {v.verre} : {v.personalization}</span>) : null}
                {!enLot && it.personalization ? <span className="perso"><Ic n="pen" /> {it.personalization}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
      {o.demande ? <div className="fq-demande"><b>Sur mesure{o.quoteNumber ? ` · devis ${o.quoteNumber}` : ""} :</b> {o.demande}</div> : null}

      {!finie || st === "livree" ? <DelaiCommande order={o} style={{ margin: 0 }} /> : null}
      {suivi ? <div className="fq-dead done"><Ic n="check" /><span>Suivi <LiensSuivi o={o} />{o.shippedAt ? ` · expédiée le ${dateFr(o.shippedAt, false)}` : ""}</span></div> : null}

      <div className="fq-meta">
        {flags.map((f) => FLAG_PAR_ID[f] ? <button key={f} type="button" className={`fq-pill ${FLAG_PAR_ID[f].tone} btn`} title="Retirer cette étiquette" onClick={() => onAnnotate(o, { flags: flags.filter((x) => x !== f) })}><Ic n="tag" /> {FLAG_PAR_ID[f].label} ×</button> : null)}
        {noteEdit ? (
          <div className="fq-note-wrap">
            <textarea className="fq-note-edit" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note interne (jamais vue par la cliente)" autoFocus />
            <div className="r"><button type="button" className="fq-btn sm pri" onClick={() => { onAnnotate(o, { adminNote: note }); setNoteEdit(false); }}>Enregistrer</button><button type="button" className="fq-btn sm ghost" onClick={() => { setNote(o.adminNote || ""); setNoteEdit(false); }}>Annuler</button></div>
          </div>
        ) : (
          <button type="button" className={`fq-note${o.adminNote ? "" : " empty"}`} onClick={() => setNoteEdit(true)}><Ic n="pen" /> {o.adminNote || "Ajouter une note interne"}</button>
        )}
      </div>
      {flagPick ? (
        <div className="fq-flagpick">
          {FLAGS.map((f) => <button key={f.id} type="button" className={`fq-chip${flags.includes(f.id) ? " on" : ""}`} onClick={() => onAnnotate(o, { flags: flags.includes(f.id) ? flags.filter((x) => x !== f.id) : [...flags, f.id] })}>{f.label}</button>)}
          <button type="button" className="fq-btn sm ghost" onClick={() => setFlagPick(false)}>Fermer</button>
        </div>
      ) : null}
      {!finie ? <BlocConditionnement o={o} mat={mat} onOpen={() => onCond(o)} /> : null}
      {rates ? <RatesCommande o={o} mat={mat} adminKey={adminKey} onSaved={onMat} /> : null}

      {ship ? <FormExpedition o={o} busy={busy} onStatus={onStatus} onClose={() => setShip(false)} titre={st === "expediee" ? "Modifier le suivi de" : "Expédier"} /> : null}
      {confirmCancel ? (
        <div className="fq-confirm">
          <Ic n="alert" />
          <span>Annuler la commande <b>#{ref}</b> ? Elle ne comptera plus dans le chiffre d&apos;affaires (aucun remboursement : « Rembourser » est dans la fiche).{o.customerEmail ? <label style={{ display: "block", marginTop: 4 }}><input type="checkbox" checked={cancelNotify} onChange={(e) => setCancelNotify(e.target.checked)} /> Prévenir la cliente par e-mail</label> : null}</span>
          <span className="r"><button type="button" className="fq-btn sm" onClick={() => setConfirmCancel(false)}>Non</button><button type="button" className="fq-btn sm danger" onClick={() => { setConfirmCancel(false); onStatus(o, "annulee", { notifyCustomer: cancelNotify && Boolean(o.customerEmail) }, { texte: "annulée" }); }}>Oui, annuler</button></span>
        </div>
      ) : null}

      <div className="fq-acts">
        {pri}
        <Link className="fq-btn ghost" href={fiche}>Fiche</Link>
        <button type="button" className="fq-ibtn" aria-label="Plus d'actions" aria-expanded={menu} onClick={() => { const v = !menu; fermerTout(); setMenu(v); }}><Ic n="more" /></button>
        {menu ? (
          <div className="fq-menu" onClick={() => setMenu(false)}>
            <div className="g">Cette commande</div>
            <Link href={fiche}><Ic n="next" /> Ouvrir la fiche complète</Link>
            <Link href={`${fiche}?imprimer=1`}><Ic n="print" /> Imprimer la fiche atelier</Link>
            {!finie ? <Link href={`/gestion/etiquettes?id=${encodeURIComponent(o.id)}`}><Ic n="tag" /> Étiquette d&apos;adresse</Link> : null}
            {!finie ? <button type="button" onClick={() => onCond(o)}><Ic n="box" /> Conditionnement</button> : null}
            {!["annulee", "remboursee"].includes(st) ? <button type="button" onClick={() => setRates((v) => !v)}><Ic n="x" /> Raté — à refaire</button> : null}
            <hr />
            <div className="g">Organiser</div>
            <button type="button" onClick={() => setFlagPick(true)}><Ic n="flag" /> Étiqueter (urgente, cadeau…)</button>
            <button type="button" onClick={() => setNoteEdit(true)}><Ic n="pen" /> Note interne</button>
            <Link href={`${fiche}#messages`}><Ic n="mail" /> Communications &amp; aperçu</Link>
            {o.customerEmail ? <button type="button" onClick={copierEmail}><Ic n="copy" /> Copier l&apos;e-mail de la cliente</button> : null}
            <hr />
            <div className="g">Statut</div>
            {st === "en_gravure" ? <button type="button" onClick={() => onStatus(o, "a_preparer", {}, { texte: "remise à préparer" })}><Ic n="undo" /> Retour à préparer</button> : null}
            {st === "a_preparer" ? <button type="button" onClick={() => setShip(true)}><Ic n="truck" /> Expédier sans passer par la fabrication…</button> : null}
            {active && mode.k !== "retrait" ? <button type="button" onClick={() => onStatus(o, "remise_main_propre", {}, { texte: "remise en main propre" })}><Ic n="user" /> Remise en main propre</button> : null}
            {st === "expediee" ? <button type="button" onClick={() => setShip(true)}><Ic n="truck" /> {o.tracking ? "Modifier le suivi" : "Ajouter un suivi"}</button> : null}
            {["expediee", "livree", "remise_main_propre"].includes(st) ? <button type="button" onClick={() => onStatus(o, "a_preparer", {}, { texte: "remise à préparer" })}><Ic n="undo" /> Remettre à préparer</button> : null}
            {st === "livree" ? <button type="button" onClick={() => onStatus(o, "expediee", {}, { texte: "remise expédiée" })}><Ic n="truck" /> Remettre expédiée</button> : null}
            {active ? <><hr /><button type="button" className="danger" onClick={() => setConfirmCancel(true)}><Ic n="x" /> Annuler la commande…</button></> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
