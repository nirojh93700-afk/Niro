"use client";

// =============================================================================
// FÊTES DE L'ANNÉE — /gestion/fetes (29/10/2026, maquette https://claude.ai/artifact/215micVgntigmyRFXsG49e)
// Gérant : « dès que je décoche, tout ce qui a rapport avec Noël doit disparaître, ça doit revenir normal…
// une alerte deux mois avant… il faut des numéros sur les images ».
// Une ligne par fête ; le détail de Noël : produits gravés concernés, les 27 images numérotées (offertes =
// 1re gravure, ou masquées), les emballages de Noël des bijoux (prix, stock, poids, ce qui rentre dedans).
// Chaque réglage s'enregistre tout seul, clé par clé (/api/admin/fetes).
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import PageHead from "@/components/admin/PageHead";

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";
const PRIX = [0, 0.9, 1.9, 2.9, 3.9, 4.9, 5.9, 6.9, 7.9, 8.9, 9.9];
const PERMANENTS = [
  { nom: "Chaton au pied du sapin", src: "/produits/cristaux-graves/chat-sapin.jpg" },
  { nom: "Sapin étoilé", src: "/produits/cristaux-graves/sapin.jpg" },
];

function Interrupteur({ on, onClick, label, disabled }) {
  return (
    <button type="button" className={`ft-sw${on ? " on" : ""}`} role="switch" aria-checked={on ? "true" : "false"} aria-label={label} onClick={onClick} disabled={disabled}>
      <span></span>
    </button>
  );
}

export default function FetesPage() {
  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (k) => {
    setErr("");
    try {
      const r = await fetch("/api/admin/fetes", { headers: { "x-admin-key": k } });
      if (r.status === 401) { setErr("Mot de passe incorrect."); setAuthed(false); return; }
      if (!r.ok) { setErr("Erreur de chargement."); return; }
      setD(await r.json()); setKey(k); setAuthed(true);
      try { sessionStorage.setItem("niv-admin-key", k); } catch { /* ignore */ }
    } catch { setErr("Erreur de chargement."); }
  }, []);
  useEffect(() => { try { const k = sessionStorage.getItem("niv-admin-key"); if (k) load(k); } catch { /* ignore */ } }, [load]);

  const envoyer = async (body) => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/admin/fetes", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j.error || "Rien n'a été enregistré."); return; }
      setD(j);
    } catch { setErr("Rien n'a été enregistré."); } finally { setBusy(false); }
  };

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "60px 16px" }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)" }}>Fêtes de l&apos;année</h1>
        <p style={{ color: "var(--ink-soft)" }}>Espace réservé. Entrez le mot de passe de gestion.</p>
        <form onSubmit={(e) => { e.preventDefault(); load(keyInput.trim()); }} style={{ display: "grid", gap: 10 }}>
          <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="Mot de passe" style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
          <button className="btn btn-gold" type="submit">Entrer</button>
          {err && <p style={{ color: "#b3261e" }}>{err}</p>}
        </form>
      </div>
    );
  }
  if (!d) return <div style={{ padding: 20 }}>Chargement…</div>;

  const noelF = d.fetes.find((f) => f.k === "noel");
  const N = d.noel;
  const offertes = N.images.filter((m) => !m.masquee).length;
  const masquees = N.images.length - offertes;
  const droits = N.images.filter((m) => m.droits).length;
  const prochaine = d.fetes.filter((f) => f.k !== "noel").sort((a, b) => a.jours - b.jours)[0];
  const stockDe = (e) => (e.stock || []).map((sid) => d.stock[sid]);

  return (
    <div className="ft-page">
      {noelF.enAlerte && (
        <div className="ft-alert">
          <span className="ft-alert-ico">🎄</span>
          <div><b>Noël dans {noelF.jours} jours.</b> {noelF.on ? "Noël est allumé sur le site." : "Noël est éteint : allumez-le quand vous êtes prêt."} L&apos;alerte part 2 mois avant la fête ({noelF.alerte}) : images de gravure, emballages, newsletter, vidéos.</div>
        </div>
      )}
      <PageHead
        eyebrow="Fêtes"
        title="Fêtes de l'année"
        subtitle="Allumée : ses images de gravure et ses emballages s'ajoutent aux produits cochés. Éteinte : tout ce qui vient de la fête disparaît du site, qui redevient comme avant. Ce qui existe toute l'année ne bouge jamais."
        kpis={[
          { label: "Fête allumée", value: d.fetes.filter((f) => f.on).map((f) => f.nom).join(", ") || "Aucune", tone: noelF.on ? "good" : undefined },
          { label: "Prochaine alerte", value: prochaine ? prochaine.alerte : "—", sub: prochaine?.nom },
          { label: "Images de Noël", value: String(N.images.length), sub: `${offertes} offertes · ${masquees} masquée${masquees > 1 ? "s" : ""}` },
          { label: "Emballages de Noël", value: String(N.emballages.filter((e) => !e.masque).length), sub: "pour les bijoux" },
        ]}
      />
      {err && <div className="notice" style={{ margin: "0 0 12px" }}>{err}</div>}

      <section className="ft-card">
        <div className="ft-card-h"><h2>Les fêtes</h2></div>
        <div className="ft-rows">
          {d.fetes.map((f) => (
            <div key={f.k} className={`ft-row${f.k === "noel" ? " cur" : ""}`}>
              <div className="ft-row-ico">{f.ico}</div>
              <div className="ft-row-main"><b>{f.nom}</b><small>{f.date} · alerte 2 mois avant : {f.alerte}</small>
                <small>{f.k === "noel" ? `${N.images.length} images de gravure · ${N.emballages.length} emballages` : "Images et emballages à préparer"}</small></div>
              <div className="ft-row-etat">
                {f.on ? <span className="ft-chip on">Allumée · dans {f.jours} j</span>
                  : f.enAlerte ? <span className="ft-chip warn">À préparer</span>
                  : <span className="ft-chip">Éteinte · alerte le {f.alerte}</span>}
              </div>
              <div className="ft-row-sw">
                <Interrupteur on={f.on} disabled={busy || f.k !== "noel"} label={`Allumer ${f.nom}`} onClick={() => envoyer({ action: "on", fete: f.k, on: !f.on })} />
              </div>
            </div>
          ))}
        </div>
        <p className="ft-p ft-note">Saint-Valentin, Pâques, fête des mères et fête des pères s&apos;allumeront ici quand leurs images seront prêtes.</p>
      </section>

      <section className="ft-card" id="noel">
        <div className="ft-card-h">
          <h2>🎄 Noël <span className="ft-h2s">{noelF.date}</span></h2>
          <div className="ft-swline"><Interrupteur on={N.on} disabled={busy} label="Allumer Noël" onClick={() => envoyer({ action: "on", fete: "noel", on: !N.on })} /><span>{N.on ? "Allumée" : "Éteinte"}</span></div>
        </div>
        <p className="ft-p">{N.on
          ? <><b>Allumée.</b> Sur les produits cochés, l&apos;étape « Que voulez-vous graver ? » a une carte À PART <b>« 🎄 Un modèle de Noël »</b> (les images numérotées, jamais mélangées aux modèles habituels), et sur chaque bijou les <b>emballages de Noël</b> s&apos;ajoutent sous « Votre emballage ».</>
          : <><b>Éteinte.</b> Aucune image de Noël, aucun emballage de Noël : les fiches sont celles d&apos;aujourd&apos;hui, à l&apos;identique. Les images et les réglages sont gardés ici.</>}</p>

        <h3 className="ft-h3">Produits concernés <span className="ft-h3s">seulement des produits gravés · jamais les bijoux ni le mariage</span></h3>
        <div className="ft-prods">
          {N.produits.map((p) => (
            <label key={p.slug} className={`ft-prod${p.on ? " on" : ""}`}>
              <input type="checkbox" checked={p.on} disabled={busy} onChange={() => envoyer({ action: "produit", slug: p.slug, on: !p.on })} /> <span>{p.nom}</span>
            </label>
          ))}
        </div>
        <p className="ft-p ft-note">Les cristaux photo et les supports téléphone n&apos;ont pas encore la carte « Un modèle de Noël » (leurs fiches n&apos;ont pas le parcours guidé).</p>

        <h3 className="ft-h3">Images de gravure de Noël <span className="ft-h3s">{N.images.length} · le client les choisit par leur numéro, comme les autres modèles</span></h3>
        <div className="ft-bar"><span><b>{offertes}</b> offertes (1re gravure) · <b>{masquees}</b> masquée{masquees > 1 ? "s" : ""} · prénoms / texte ou date en plus : +3 € chacun{droits ? ` · ${droits} images avec un personnage protégé à trancher` : ""}</span></div>
        <p className="ft-p ft-note">Votre règle (29/10) : l&apos;image de Noël choisie est la <b>première gravure</b>, elle est <b>offerte</b>, même si elle contient un texte. Sur la fiche, comme les modèles du site : <b>prénoms / nom / texte</b> et <b>date ou année</b>, <b>+3 €</b> chacun.</p>
        <div className="ft-imgs">
          {N.images.map((m) => (
            <div key={m.n} className="ft-img">
              <span className="ft-num">Noël n° {m.n}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="ph"><img src={m.src} alt="" loading="lazy" /></div>
              <div className="tx">
                <b>{m.nom}</b>
                {(m.mots || m.texte || m.droits || m.gris) && (
                  <span>
                    {m.mots ? <span className="ft-flag t">mots de Noël</span> : m.texte ? <span className="ft-flag t">texte dans l&apos;image</span> : null}
                    {m.droits && <span className="ft-flag d">⚠ personnage protégé</span>}
                    {m.gris && <span className="ft-flag g">niveaux de gris</span>}
                  </span>
                )}
                <select value={m.masquee ? "-1" : "0"} disabled={busy} onChange={(e) => envoyer({ action: "image", n: m.n, masquee: e.target.value === "-1" })}>
                  <option value="0">Offerte (1re gravure)</option>
                  <option value="-1">Masquée</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <h3 className="ft-h3">Emballages de Noël <span className="ft-h3s">pour les BIJOUX · s&apos;ajoutent sous « Votre emballage » de chaque fiche bijou</span></h3>
        <p className="ft-p ft-note">Le bijou — ou son emballage habituel — va <b>dans</b> l&apos;emballage de Noël : cochez dans quoi chaque emballage accepte le bijou ; <b>ce qui ne rentre pas n&apos;est pas proposé</b>. Le stock baisse à chaque commande. L&apos;étiquette rouge est <b>offerte</b> avec chaque emballage de Noël. Le Pack de Noël prend une boîte à ruban et un sac de Noël dans le stock.</p>
        <div className="ft-port"><b>📦 Livraison</b> (règle du site) : sachet, pochette, sac de Noël (plats) → le bijou reste en <b>lettre suivie</b> ; boîte à ruban, boîte rouge, pack (boîtes rigides) → <b>petit colis</b>, comme la boîte cadeau. Le port se calcule au poids : 72 g par bijou + l&apos;emballage (grammes estimés, à peser).</div>
        <div className="ft-embs">
          {N.emballages.map((e) => {
            const marge = e.prix - e.cout;
            const st = stockDe(e);
            return (
              <div key={e.id} className={`ft-embn${e.id === "pack" ? " pk" : ""}`}>
                {e.id === "pack" && <span className="etq">PACK</span>}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.photo} alt="" />
                <div className="b">
                  <b>{e.nom}</b>
                  <div className="d">{e.d}</div>
                  <div className="ft-emb-l">
                    <label>Prix <select value={String(e.prix)} disabled={busy} onChange={(ev) => envoyer({ action: "emballage", id: e.id, prix: Number(ev.target.value) })}>
                      {[...new Set([...PRIX, e.prix])].sort((a, b) => a - b).map((v) => <option key={v} value={String(v)}>{v ? "+" + euro(v) : "Offert"}</option>)}
                    </select></label>
                    {e.id !== "pack" ? (
                      <label>Stock <input type="number" min="0" defaultValue={st[0] ?? ""} key={`s${e.id}${st[0]}`} disabled={busy} onBlur={(ev) => { if (String(ev.target.value) !== String(st[0] ?? "")) envoyer({ action: "stock", stockId: e.stock[0], value: ev.target.value }); }} /></label>
                    ) : (
                      <label>Stock <input type="text" value={st.every((x) => typeof x === "number") ? String(Math.min(...st)) : "—"} readOnly title="boîte à ruban + sac de Noël" /></label>
                    )}
                    <label>Poids (g) <input type="number" min="0" defaultValue={e.poids} key={`p${e.id}${e.poids}`} disabled={busy} onBlur={(ev) => { if (Number(ev.target.value) !== e.poids) envoyer({ action: "emballage", id: e.id, poids: Number(ev.target.value) }); }} /></label>
                  </div>
                  <div className="port">{e.colis ? <>📦 <b>Part en colis</b> (boîte rigide)</> : <>✉️ <b>Reste en lettre suivie</b></>} · ≈ {e.poids} g <i>(à peser)</i></div>
                  <small>Coût rendu {euro(e.cout)} · <span className="marge">marge {marge >= 0 ? "+" : "−"}{euro(Math.abs(marge))}</span>{e.barre ? ` · prix barré ${euro(e.barre)} (= boîte + sac)` : ""}</small>
                  <div className="fit"><small>Convient si le bijou est :</small>
                    {d.fits.map(([k, lab]) => (
                      <label key={k} className={e.fit[k] ? "on" : ""}><input type="checkbox" checked={e.fit[k]} disabled={busy} onChange={() => envoyer({ action: "emballage", id: e.id, fit: { [k]: !e.fit[k] } })} /> {lab}</label>
                    ))}
                  </div>
                  <label className="ft-mini"><input type="checkbox" checked={e.masque} disabled={busy} onChange={() => envoyer({ action: "emballage", id: e.id, masque: !e.masque })} /> Ne pas proposer cet emballage</label>
                </div>
              </div>
            );
          })}
          <div className="ft-embn">
            <span className="etq off">OFFERTE</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={N.etiquette.photo} alt="" />
            <div className="b">
              <b>{N.etiquette.nom}</b>
              <div className="d">{N.etiquette.d}</div>
              <div className="ft-emb-l">
                <label>Stock <input type="number" min="0" defaultValue={d.stock[N.etiquette.stock] ?? ""} key={`e${d.stock[N.etiquette.stock]}`} disabled={busy} onBlur={(ev) => { if (String(ev.target.value) !== String(d.stock[N.etiquette.stock] ?? "")) envoyer({ action: "stock", stockId: N.etiquette.stock, value: ev.target.value }); }} /></label>
              </div>
              <small>Coût {euro(N.etiquette.cout)} · la cliente ne la choisit pas : elle est mise d&apos;office.</small>
            </div>
          </div>
        </div>

        <h3 className="ft-h3">Déjà sur le site toute l&apos;année <span className="ft-h3s">liés à Noël, jamais retirés quand Noël s&apos;éteint</span></h3>
        <div className="ft-perm">
          {PERMANENTS.map((c) => (
            <div key={c.nom}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.src} alt="" />
              <div><b>🔒 {c.nom}</b><small>Cristal déjà gravé, famille Noël. Reste en ligne toute l&apos;année.</small></div>
            </div>
          ))}
        </div>
        <p className="ft-p ft-note">Aussi en permanence, avec leur propre interrupteur dans Apparence : le bandeau Noël de l&apos;accueil et la page « Idées de Noël ».</p>
      </section>
    </div>
  );
}
