"use client";

import { useState, useEffect } from "react";

const FONTS = [
  { v: "", label: "Par défaut" },
  { v: "playfair", label: "Playfair — élégante (serif)" },
  { v: "cinzel", label: "Cinzel — chic (serif)" },
  { v: "cinzel-deco", label: "Cinzel Decorative" },
  { v: "montserrat", label: "Montserrat — moderne" },
  { v: "great-vibes", label: "Great Vibes — manuscrite" },
  { v: "allura", label: "Allura — manuscrite fine" },
  { v: "pacifico", label: "Pacifico — décontractée" },
  { v: "inter", label: "Inter — simple" },
];
const CAT_NAMES = ["Carte 1 (Bijoux)", "Carte 2 (Mariage)", "Carte 3 (Cadeaux)"];

// Sous-pages bien séparées (au lieu d'un seul fourre-tout).
const SUBS = [
  ["visuel", "🎨 Visuel"],
  ["accueil", "🏠 Page d'accueil"],
  ["popups", "📣 Bandeau & pop-ups"],
  ["marketing", "📈 Marketing & prix"],
  ["acces", "🔒 Accès & état du site"],
  ["pages", "📄 Pages"],
];

export default function AppearanceAdmin({ adminKey }) {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState("visuel");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings", { headers: { "x-admin-key": adminKey } });
        if (res.ok) {
          const data = (await res.json()).settings;
          data.categories = [0, 1, 2].map((i) => data.categories?.[i] || { label: "", sub: "", image: "" });
          setS(data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [adminKey]);

  async function save(patch, label) {
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      await res.json();
      setMsg((label || "Enregistré") + " ✓ (visible sur le site dans 1-2 min)");
    } else {
      setMsg("Échec de l'enregistrement.");
    }
  }

  if (loading) return <p style={{ color: "var(--ink-soft)" }}>Chargement…</p>;
  if (!s) return <div className="notice">Impossible de charger les réglages.</div>;

  const set = (patch) => setS({ ...s, ...patch });
  const setHero = (patch) => setS({ ...s, hero: { ...s.hero, ...patch } });
  const setAtelier = (patch) => setS({ ...s, atelier: { ...s.atelier, ...patch } });
  const setCat = (i, patch) => setS({ ...s, categories: s.categories.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const setSection = (k, v) => setS({ ...s, sections: { ...s.sections, [k]: v } });

  return (
    <>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Personnalise l'apparence de ton site, section par section. Laisse un champ vide pour garder la valeur par défaut.
      </p>

      {/* Sous-menu : chaque thème dans sa propre page */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {SUBS.map(([id, label]) => (
          <button key={id} onClick={() => { setSub(id); setMsg(""); }}
            style={{ padding: "6px 13px", fontSize: "0.85rem", borderRadius: 20, border: "1px solid var(--line)", background: sub === id ? "var(--gold-dark)" : "#fff", color: sub === id ? "#fff" : "var(--ink)", fontWeight: 600, cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {msg && <div className="notice">{msg}</div>}

      {/* ============== VISUEL : couleur + polices ============== */}
      {sub === "visuel" && (
        <>
          <div className="admin-block" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>🎨 Couleur principale</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="color" value={s.color || "#c2a14e"} onChange={(e) => set({ color: e.target.value })}
                style={{ width: 56, height: 40, border: "1px solid var(--line)", borderRadius: 8, background: "#fff" }} />
              <input className="admin-field" value={s.color || ""} placeholder="#c2a14e (vide = défaut)"
                onChange={(e) => set({ color: e.target.value })} style={{ flex: 1 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-gold" onClick={() => save({ color: s.color || "" }, "Couleur enregistrée")}>Enregistrer</button>
              <button className="btn btn-outline" onClick={() => { set({ color: "" }); save({ color: "" }, "Couleur réinitialisée"); }}>Réinitialiser</button>
            </div>
          </div>

          <div className="admin-block" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>🔤 Polices du site</h3>
            <label className="admin-field">Police des titres
              <select value={s.fontHeading || ""} onChange={(e) => set({ fontHeading: e.target.value })}>
                {FONTS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
              </select>
            </label>
            <label className="admin-field">Police du texte
              <select value={s.fontBody || ""} onChange={(e) => set({ fontBody: e.target.value })}>
                {FONTS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
              </select>
            </label>
            <button className="btn btn-gold" onClick={() => save({ fontHeading: s.fontHeading || "", fontBody: s.fontBody || "" }, "Polices enregistrées")}>Enregistrer les polices</button>
          </div>
        </>
      )}

      {/* ============== PAGE D'ACCUEIL ============== */}
      {sub === "accueil" && (
        <>
          <div className="admin-block" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>🏠 Bandeau principal (hero)</h3>
            <label className="admin-field">Petit titre
              <input value={s.hero?.eyebrow || ""} placeholder="Atelier français · gravure laser" onChange={(e) => setHero({ eyebrow: e.target.value })} />
            </label>
            <label className="admin-field">Grand titre
              <input value={s.hero?.title || ""} placeholder="Des créations uniques…" onChange={(e) => setHero({ title: e.target.value })} />
            </label>
            <label className="admin-field">Paragraphe
              <textarea value={s.hero?.text || ""} style={{ minHeight: 70 }} onChange={(e) => setHero({ text: e.target.value })} />
            </label>
            <label className="admin-field">Bouton principal
              <input value={s.hero?.cta1 || ""} placeholder="Découvrir la boutique" onChange={(e) => setHero({ cta1: e.target.value })} />
            </label>
            <label className="admin-field">Bouton secondaire
              <input value={s.hero?.cta2 || ""} placeholder="Collection mariage" onChange={(e) => setHero({ cta2: e.target.value })} />
            </label>
            <label className="admin-field">Image principale (lien)
              <input value={s.hero?.image || ""} placeholder="https://… (vide = image par défaut)" onChange={(e) => setHero({ image: e.target.value })} />
            </label>
            <button className="btn btn-gold" onClick={() => save({ hero: s.hero }, "Accueil enregistré")}>Enregistrer le bandeau principal</button>
          </div>

          <div className="admin-block" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>🗂️ 3 cartes catégories</h3>
            {s.categories.map((c, i) => (
              <div key={i} style={{ borderTop: i ? "1px solid var(--line)" : "none", paddingTop: i ? 10 : 0, display: "grid", gap: 8 }}>
                <strong style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>{CAT_NAMES[i]}</strong>
                <label className="admin-field">Titre<input value={c.label || ""} onChange={(e) => setCat(i, { label: e.target.value })} /></label>
                <label className="admin-field">Sous-titre<input value={c.sub || ""} onChange={(e) => setCat(i, { sub: e.target.value })} /></label>
                <label className="admin-field">Image (lien)<input value={c.image || ""} placeholder="https://…" onChange={(e) => setCat(i, { image: e.target.value })} /></label>
              </div>
            ))}
            <button className="btn btn-gold" onClick={() => save({ categories: s.categories }, "Cartes enregistrées")}>Enregistrer les cartes</button>
          </div>

          <div className="admin-block" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>🪵 Section atelier</h3>
            <label className="admin-field">Petit titre<input value={s.atelier?.eyebrow || ""} onChange={(e) => setAtelier({ eyebrow: e.target.value })} /></label>
            <label className="admin-field">Titre<input value={s.atelier?.title || ""} onChange={(e) => setAtelier({ title: e.target.value })} /></label>
            <label className="admin-field">Paragraphe 1<textarea value={s.atelier?.text1 || ""} style={{ minHeight: 60 }} onChange={(e) => setAtelier({ text1: e.target.value })} /></label>
            <label className="admin-field">Paragraphe 2<textarea value={s.atelier?.text2 || ""} style={{ minHeight: 60 }} onChange={(e) => setAtelier({ text2: e.target.value })} /></label>
            <label className="admin-field">Image (lien)<input value={s.atelier?.image || ""} placeholder="https://…" onChange={(e) => setAtelier({ image: e.target.value })} /></label>
            <button className="btn btn-gold" onClick={() => save({ atelier: s.atelier }, "Atelier enregistré")}>Enregistrer l'atelier</button>
          </div>

          <div className="admin-block" style={{ display: "grid", gap: 8 }}>
            <h3 style={{ margin: 0 }}>👁️ Sections de l'accueil (afficher / masquer)</h3>
            {[["categories", "Cartes catégories"], ["trust", "Bandeau confiance (4 atouts)"], ["featured", "Produits phares"], ["atelier", "Section atelier"]].map(([k, lbl]) => (
              <label key={k} className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={s.sections?.[k] !== false} style={{ width: "auto" }} onChange={(e) => setSection(k, e.target.checked)} />
                {lbl}
              </label>
            ))}
            <button className="btn btn-gold" onClick={() => save({ sections: s.sections }, "Sections enregistrées")}>Enregistrer les sections</button>
          </div>
        </>
      )}

      {/* ============== BANDEAU & POP-UPS ============== */}
      {sub === "popups" && (
        <>
          <div className="admin-block" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>📣 Bandeau d'annonce (haut du site)</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Petit bandeau en haut de toutes les pages (ex. « Livraison offerte dès 45 € » ou « −10 % avec le code BIENVENUE10 »).
            </p>
            <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" style={{ width: "auto" }} checked={s.announce?.enabled || false} onChange={(e) => set({ announce: { ...s.announce, enabled: e.target.checked } })} />
              Afficher le bandeau
            </label>
            <label className="admin-field">Texte
              <input value={s.announce?.text || ""} placeholder="Ex. Livraison offerte dès 45 € ✦" onChange={(e) => set({ announce: { ...s.announce, text: e.target.value } })} />
            </label>
            <label className="admin-field">Lien (facultatif)
              <input value={s.announce?.link || ""} placeholder="/boutique" onChange={(e) => set({ announce: { ...s.announce, link: e.target.value } })} />
            </label>
            <button className="btn btn-gold" style={{ justifySelf: "start" }} onClick={() => save({ announce: s.announce }, "Bandeau enregistré")}>Enregistrer le bandeau</button>
          </div>

          <div className="admin-block" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>✦ Bandeau SOLDES (animé, avec compte à rebours)</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Bandeau doré animé en haut du site. Il s'affiche <strong>uniquement</strong> entre la date de début et la date de fin, puis s'arrête tout seul. Idéal pour les soldes (réutilisable à chaque saison).
            </p>
            <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" style={{ width: "auto" }} checked={s.salesBanner?.enabled || false} onChange={(e) => set({ salesBanner: { ...s.salesBanner, enabled: e.target.checked } })} />
              Activer le bandeau Soldes
            </label>
            <label className="admin-field">Texte
              <input value={s.salesBanner?.text || ""} placeholder="Ex. Profitez des soldes d'été sur une sélection de créations !" onChange={(e) => set({ salesBanner: { ...s.salesBanner, text: e.target.value } })} />
            </label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <label className="admin-field" style={{ flex: 1, minWidth: 150 }}>Date de début
                <input type="date" value={s.salesBanner?.start || ""} onChange={(e) => set({ salesBanner: { ...s.salesBanner, start: e.target.value } })} />
              </label>
              <label className="admin-field" style={{ flex: 1, minWidth: 150 }}>Date de fin
                <input type="date" value={s.salesBanner?.end || ""} onChange={(e) => set({ salesBanner: { ...s.salesBanner, end: e.target.value } })} />
              </label>
            </div>
            <button className="btn btn-gold" style={{ justifySelf: "start" }} onClick={() => save({ salesBanner: s.salesBanner }, "Bandeau Soldes enregistré")}>Enregistrer le bandeau Soldes</button>
          </div>

          <div className="admin-block" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>🏖️ Mode vacances (annonce du délai)</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              La boutique <strong>reste ouverte</strong> : les clientes commandent normalement, mais le délai est annoncé
              <strong> partout</strong> (bandeau en haut du site, fiche produit, panier, et dans l&apos;e-mail de confirmation).
              Avec des dates, tout s&apos;allume et s&apos;éteint <strong>tout seul</strong>. Tant que la case n&apos;est pas cochée, rien ne s&apos;affiche.
            </p>
            <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" style={{ width: "auto" }} checked={s.vacation?.enabled || false} onChange={(e) => set({ vacation: { ...s.vacation, enabled: e.target.checked } })} />
              Activer le mode vacances
            </label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <label className="admin-field" style={{ flex: 1, minWidth: 140 }}>Début des congés
                <input type="date" value={s.vacation?.start || ""} onChange={(e) => set({ vacation: { ...s.vacation, start: e.target.value } })} />
              </label>
              <label className="admin-field" style={{ flex: 1, minWidth: 140 }}>Fin des congés
                <input type="date" value={s.vacation?.end || ""} onChange={(e) => set({ vacation: { ...s.vacation, end: e.target.value } })} />
              </label>
              <label className="admin-field" style={{ flex: 1, minWidth: 140 }}>Reprise des expéditions
                <input type="date" value={s.vacation?.resume || ""} onChange={(e) => set({ vacation: { ...s.vacation, resume: e.target.value } })} />
              </label>
            </div>
            <label className="admin-field">Message personnalisé (facultatif — sinon un message clair est écrit tout seul avec vos dates)
              <input value={s.vacation?.text || ""} placeholder="Ex. Atelier en congés du 20 au 31 août — les expéditions reprennent le 1er septembre." onChange={(e) => set({ vacation: { ...s.vacation, text: e.target.value } })} />
            </label>
            <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" style={{ width: "auto" }} checked={s.vacation?.gift || false} onChange={(e) => set({ vacation: { ...s.vacation, gift: e.target.checked } })} />
              🎁 Cadeau offert : annoncer un petit cadeau dans chaque commande passée pendant les congés
            </label>
            {s.vacation?.gift ? (
              <label className="admin-field">Message du cadeau (facultatif)
                <input value={s.vacation?.giftText || ""} placeholder="Ex. Un petit cadeau sera glissé dans votre colis pour vous remercier de votre patience." onChange={(e) => set({ vacation: { ...s.vacation, giftText: e.target.value } })} />
              </label>
            ) : null}
            <button className="btn btn-gold" style={{ justifySelf: "start" }} onClick={() => save({ vacation: s.vacation }, "Mode vacances enregistré")}>Enregistrer le mode vacances</button>
          </div>

          <div className="admin-block" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>🎁 Fenêtre de bienvenue (inscription + code promo)</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Une fenêtre s'affiche à l'arrivée des visiteurs : inscription newsletter + code promo. (Affichée une seule fois par personne.)
            </p>
            <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" style={{ width: "auto" }} checked={s.welcome?.enabled || false} onChange={(e) => set({ welcome: { ...s.welcome, enabled: e.target.checked } })} />
              Activer la fenêtre de bienvenue
            </label>
            <label className="admin-field">Texte de l'offre
              <input value={s.welcome?.text || ""} placeholder="−10 % sur votre première commande" onChange={(e) => set({ welcome: { ...s.welcome, text: e.target.value } })} />
            </label>
            <label className="admin-field">Code promo à afficher
              <input value={s.welcome?.code || ""} placeholder="BIENVENUE10" onChange={(e) => set({ welcome: { ...s.welcome, code: e.target.value } })} />
            </label>
            <button className="btn btn-gold" style={{ justifySelf: "start" }} onClick={() => save({ welcome: s.welcome }, "Fenêtre de bienvenue enregistrée")}>Enregistrer</button>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-soft)" }}>
              ⚠️ Crée bien ce code dans <strong>Marketing → Promotions → 🎟️ Codes promo</strong>, sinon il ne réduira rien au paiement.
            </p>
          </div>

          <div className="admin-block" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>🤝 Parrainage (code à partager après achat)</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Quand c'est activé, chaque client reçoit dans son e-mail de confirmation un <strong>code à offrir</strong>. <strong>Désactivé par défaut</strong>.
            </p>
            <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" style={{ width: "auto" }} checked={s.referral?.enabled || false} onChange={(e) => set({ referral: { ...s.referral, enabled: e.target.checked } })} />
              Activer le parrainage
            </label>
            <label className="admin-field">Code à partager
              <input value={s.referral?.code || ""} placeholder="Ex. AMIE10" onChange={(e) => set({ referral: { ...s.referral, code: e.target.value.toUpperCase() } })} />
            </label>
            <label className="admin-field">Texte de l'offre
              <input value={s.referral?.text || ""} placeholder="−10 % à offrir à une amie" onChange={(e) => set({ referral: { ...s.referral, text: e.target.value } })} />
            </label>
            <button className="btn btn-gold" style={{ justifySelf: "start" }} onClick={() => save({ referral: s.referral }, "Parrainage enregistré")}>Enregistrer</button>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-soft)" }}>
              ⚠️ Crée ce code dans <strong>Marketing → Promotions</strong> (1 seule utilisation par client).
            </p>
          </div>
        </>
      )}

      {/* ============== MARKETING & PRIX ============== */}
      {sub === "marketing" && (
        <>
          <div className="admin-block" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>🏷️ Prix conseillé (« moins cher qu'ailleurs »)</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Affiche sur chaque produit un <strong>prix conseillé barré</strong> au-dessus de ton prix.
              Indique de combien de % le prix conseillé est plus haut (0 = désactivé).
              <br />Exemple à 20 % : <span style={{ textDecoration: "line-through" }}>23,90 €</span> → <strong>19,90 €</strong>.
              <br /><em>À utiliser seulement si tes prix sont réellement plus bas que le marché.</em>
            </p>
            <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              Prix conseillé plus élevé de
              <input type="number" min="0" max="90" value={s.refMarkup ?? 0} style={{ width: 90 }} onChange={(e) => set({ refMarkup: e.target.value })} />
              %
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-gold" onClick={() => save({ refMarkup: Number(s.refMarkup) || 0 }, "Prix conseillé enregistré")}>Enregistrer</button>
              <button className="btn btn-outline" onClick={() => { set({ refMarkup: 0 }); save({ refMarkup: 0 }, "Prix conseillé désactivé"); }}>Désactiver</button>
            </div>
          </div>

          <div className="admin-block" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>📈 Publicité & statistiques de visites</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Colle tes identifiants quand tu auras créé les comptes (gratuits). Tant que c'est vide, rien ne se charge — aucun risque.
            </p>
            <label className="admin-field">ID Pixel Meta (Facebook/Instagram) <span style={{ color: "var(--ink-soft)" }}>— chiffres uniquement</span>
              <input value={s.metaPixelId || ""} placeholder="Ex. 123456789012345" onChange={(e) => set({ metaPixelId: e.target.value })} />
            </label>
            <label className="admin-field">ID Google (Analytics / Ads) <span style={{ color: "var(--ink-soft)" }}>— ex. G-XXXXXXX</span>
              <input value={s.gaId || ""} placeholder="Ex. G-ABCDE12345" onChange={(e) => set({ gaId: e.target.value })} />
            </label>
            <button className="btn btn-gold" style={{ justifySelf: "start" }} onClick={() => save({ metaPixelId: s.metaPixelId || "", gaId: s.gaId || "" }, "Balises marketing enregistrées")}>Enregistrer</button>
          </div>
        </>
      )}

      {/* ============== ACCÈS & ÉTAT DU SITE ============== */}
      {sub === "acces" && (
        <>
          {(() => {
            const maint = s.maintenance?.enabled;
            const priv = s.access?.locked;
            const etat = maint ? "🛠️ En maintenance (hors-ligne)" : priv ? "🔒 Privé (code d'accès)" : "🟢 En ligne (public)";
            const goOnline = () => { const access = { ...s.access, locked: false }; const maintenance = { ...s.maintenance, enabled: false }; set({ access, maintenance }); save({ access, maintenance }, "Site mis EN LIGNE (public)"); };
            const goPrivate = () => { const access = { ...s.access, locked: true }; const maintenance = { ...s.maintenance, enabled: false }; set({ access, maintenance }); save({ access, maintenance }, "Site mis en mode privé (code d'accès)"); };
            const goMaint = () => { const maintenance = { ...s.maintenance, enabled: true }; set({ maintenance }); save({ maintenance }, "Site mis EN MAINTENANCE"); };
            return (
              <div className="admin-block" style={{ display: "grid", gap: 10, border: "2px solid #e7d3a1", background: "#fbf4e6" }}>
                <h3 style={{ margin: 0 }}>🌐 État du site</h3>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>État actuel : <strong>{etat}</strong></p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn btn-gold" onClick={goOnline}>🟢 Mettre EN LIGNE</button>
                  <button className="btn btn-outline" onClick={goPrivate}>🔒 Privé (code)</button>
                  <button className="btn btn-outline" onClick={goMaint}>🛠️ Maintenance</button>
                </div>
                <label className="admin-field" style={{ marginTop: 4 }}>Message affiché en maintenance (facultatif)
                  <textarea placeholder="Ex. Notre site est momentanément en maintenance, nous revenons très vite !"
                    value={s.maintenance?.message || ""} onChange={(e) => set({ maintenance: { ...s.maintenance, message: e.target.value } })} style={{ minHeight: 60 }} />
                </label>
                <button className="btn btn-outline" style={{ justifySelf: "start" }} onClick={() => save({ maintenance: s.maintenance }, "Message de maintenance enregistré")}>Enregistrer le message</button>
              </div>
            );
          })()}

          <div className="admin-block" style={{ display: "grid", gap: 10, border: "1px solid #e7d3a1", background: "#fbf4e6" }}>
            <h3 style={{ margin: 0 }}>🔒 Code d'accès (site privé)</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Si activé, les visiteurs doivent entrer un code pour voir le site (idéal avant l'ouverture). Décoche le jour de l'ouverture.
            </p>
            <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={s.access?.locked || false} style={{ width: "auto" }} onChange={(e) => set({ access: { ...s.access, locked: e.target.checked } })} />
              Activer le code d'accès (site privé)
            </label>
            <label className="admin-field">Code d'accès
              <input value={s.access?.code || ""} placeholder="Ex : Niro2026" onChange={(e) => set({ access: { ...s.access, code: e.target.value } })} />
            </label>
            <button className="btn btn-gold" style={{ justifySelf: "start" }} onClick={() => save({ access: s.access }, "Accès enregistré")}>Enregistrer l'accès</button>
          </div>

          <div className="admin-block" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>📍 Retrait en main propre — zone autorisée</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Atelier dans le <strong>Val-d'Oise (95)</strong>. Le retrait n'est proposé que si le <strong>code postal</strong> commence par l'un de ces codes (séparés par des virgules).
              <br /><strong>Par défaut</strong> : <code>95, 78, 92, 93, 75, 60</code>.
            </p>
            <input type="text" placeholder="95, 78, 92, 93, 75, 60" value={s.pickupZones || ""} onChange={(e) => set({ pickupZones: e.target.value })}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
            <button className="btn btn-gold" style={{ justifySelf: "start" }} onClick={() => save({ pickupZones: s.pickupZones || "" }, "Zone de retrait enregistrée")}>Enregistrer la zone</button>
          </div>
        </>
      )}

      {/* ============== PAGES ============== */}
      {sub === "pages" && (
        <div className="admin-block" style={{ display: "grid", gap: 10 }}>
          <h3 style={{ margin: 0 }}>📄 Page « À propos »</h3>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-soft)" }}>
            Contenu central de la page À propos. Texte simple ou HTML (&lt;h3&gt;, &lt;p&gt;). Vide = texte par défaut.
          </p>
          <textarea value={s.apropos || ""} style={{ minHeight: 160 }} placeholder="<h3>Mon histoire</h3><p>…</p>" onChange={(e) => set({ apropos: e.target.value })} />
          <button className="btn btn-gold" onClick={() => save({ apropos: s.apropos || "" }, "Page À propos enregistrée")}>Enregistrer la page À propos</button>
        </div>
      )}
    </>
  );
}
