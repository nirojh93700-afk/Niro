"use client";

// =============================================================================
// Briques réutilisables pour les fenêtres « Ajouter / Modifier un produit ».
// Adaptées au modèle de Niv Création (variantes, gravure multi-types, dégressif,
// saisonnier). Utilisées par ProductsAdmin (création ET édition).
// =============================================================================

const inputStyle = { padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" };

// ---- Coût de revient + marge en direct (sans prix conseillé trompeur) --------
export function MarginBox({ cost, setCost, price }) {
  const c = Number(cost) || 0;
  const pv = Number(price) || 0;
  const margin = Math.round((pv - c) * 100) / 100;
  const pct = pv > 0 ? Math.round((margin / pv) * 100) : 0;
  const ready = pv > 0 && c > 0;
  const color = !ready ? "#777" : pct >= 60 ? "#256b34" : pct >= 40 ? "#9a7d1a" : "#b4452f";
  const dot = !ready ? "" : pct >= 60 ? "🟢" : pct >= 40 ? "🟡" : "🔴";
  return (
    <div style={{ border: "1px dashed var(--line)", borderRadius: 8, padding: "10px 12px", background: "#faf6ee" }}>
      <label className="admin-field" style={{ marginBottom: 6 }}>Coût de revient (€) — matière + temps estimé
        <input type="number" min="0" step="0.01" value={cost ?? ""} onChange={(e) => setCost(e.target.value)} placeholder="Ex : 0,40" />
      </label>
      <div style={{ fontSize: "0.9rem", color }}>
        {!ready
          ? "Saisis le coût et un prix de vente pour voir la marge."
          : <>{dot} Marge : <strong>{margin.toFixed(2).replace(".", ",")} €</strong> ({pct} %) · tu vends {pv.toFixed(2).replace(".", ",")} €, ça te coûte {c.toFixed(2).replace(".", ",")} €.</>}
      </div>
      <p style={{ fontSize: "0.74rem", color: "var(--ink-soft)", margin: "4px 0 0" }}>
        Rappel : sur tes créations le bois coûte quelques centimes — fixe ton prix au <strong>marché</strong> et à ton <strong>temps</strong>, pas au coût.
      </p>
    </div>
  );
}

// ---- Tarifs dégressifs : ajoute une variante « Lot de N (X €/pièce) » --------
// Renvoie une variante prête à pousser dans la liste des variantes.
export function makeTierVariant(slugBase, qty, unitPrice) {
  const n = Math.max(2, parseInt(qty, 10) || 0);
  const u = Math.max(0, Math.round((parseFloat(unitPrice) || 0) * 100) / 100);
  return {
    id: `${slugBase || "lot"}-lot${n}-${Math.random().toString(36).slice(2, 5)}`,
    title: `Lot de ${n} (${u.toFixed(2).replace(".", ",")} €/pièce)`,
    price: Math.round(n * u * 100) / 100,
  };
}

// ---- Constructeur de champs de gravure / personnalisation --------------------
const TYPE_OPTIONS = [
  { value: "text", label: "Texte (1 ligne)" },
  { value: "textarea", label: "Texte long (plusieurs lignes)" },
  { value: "select", label: "Liste de choix" },
  { value: "font", label: "Police de gravure" },
  { value: "color", label: "Couleur" },
  { value: "photo", label: "Photo à envoyer" },
  { value: "note", label: "Note d'information (pas de saisie)" },
];

export function EngravingBuilder({ fields, setFields }) {
  const update = (i, patch) => setFields(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const remove = (i) => setFields(fields.filter((_, j) => j !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    const next = fields.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setFields(next);
  };
  const add = (type) => setFields([...fields, type === "note"
    ? { type: "note", text: "" }
    : { type, label: "", optional: true, ...((type === "select" || type === "color") ? { options: [{ value: "", label: "" }] } : {}) }]);

  const setOpt = (fi, oi, patch) => update(fi, { options: fields[fi].options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) });
  const addOpt = (fi) => update(fi, { options: [...(fields[fi].options || []), { value: "", label: "" }] });
  const delOpt = (fi, oi) => update(fi, { options: fields[fi].options.filter((_, j) => j !== oi) });

  return (
    <div style={{ border: "1px dashed var(--line)", borderRadius: 8, padding: "10px 12px", background: "#faf6ee" }}>
      <span className="admin-field" style={{ display: "block", marginBottom: 6 }}>🖊️ Gravure / personnalisation (ce que le client remplit)</span>
      {fields.length === 0 && <p style={{ margin: "0 0 8px", fontSize: "0.85rem", color: "var(--ink-soft)" }}>Aucune personnalisation (produit sans gravure).</p>}

      {fields.map((f, i) => (
        <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", marginBottom: 8, background: "#fff" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-outline" style={{ padding: "2px 8px" }} disabled={i === 0} onClick={() => move(i, -1)}>▲</button>
            <button type="button" className="btn btn-outline" style={{ padding: "2px 8px" }} disabled={i === fields.length - 1} onClick={() => move(i, 1)}>▼</button>
            <select value={f.type || "text"} onChange={(e) => update(i, { type: e.target.value })} style={inputStyle}>
              {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button type="button" className="btn btn-outline" style={{ padding: "2px 9px", color: "#b4452f", marginLeft: "auto" }} onClick={() => remove(i)}>×</button>
          </div>

          {f.type === "note" ? (
            <input value={f.text || ""} onChange={(e) => update(i, { text: e.target.value })} placeholder="Texte d'information affiché au client" style={{ ...inputStyle, width: "100%" }} />
          ) : (
            <>
              <input value={f.label || ""} onChange={(e) => update(i, { label: e.target.value })} placeholder="Libellé (ex : Prénom à graver)" style={{ ...inputStyle, width: "100%", marginBottom: 6 }} />
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", fontSize: "0.84rem" }}>
                <label style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <input type="checkbox" checked={!!f.optional} onChange={(e) => update(i, { optional: e.target.checked })} style={{ width: "auto" }} /> facultatif
                </label>
                {(f.type === "text" || f.type === "textarea") && (
                  <label style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    max. caractères
                    <input type="number" min="1" value={f.maxLength || ""} onChange={(e) => update(i, { maxLength: e.target.value })} style={{ ...inputStyle, width: 70 }} />
                  </label>
                )}
              </div>
              {(f.type === "select" || f.type === "color") && (
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Choix possibles {f.type === "color" ? "(valeur = code couleur #c9a24b)" : ""} :</span>
                  {(f.options || []).map((o, oi) => (
                    <div key={oi} style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <input value={o.value} onChange={(e) => setOpt(i, oi, { value: e.target.value })} placeholder={f.type === "color" ? "#c9a24b" : "valeur"} style={{ ...inputStyle, flex: 1 }} />
                      <input value={o.label} onChange={(e) => setOpt(i, oi, { label: e.target.value })} placeholder="libellé affiché" style={{ ...inputStyle, flex: 1 }} />
                      <button type="button" className="btn btn-outline" style={{ padding: "2px 8px", color: "#b4452f" }} onClick={() => delOpt(i, oi)}>×</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline" style={{ padding: "3px 9px", fontSize: "0.8rem", marginTop: 5 }} onClick={() => addOpt(i)}>+ choix</button>
                </div>
              )}
            </>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
        {TYPE_OPTIONS.map((t) => (
          <button key={t.value} type="button" className="btn btn-outline" style={{ padding: "4px 10px", fontSize: "0.82rem" }} onClick={() => add(t.value)}>+ {t.label}</button>
        ))}
      </div>
    </div>
  );
}

// ---- Édition saisonnière ------------------------------------------------------
export function SeasonalFields({ seasonal, setSeasonal }) {
  const s = seasonal || {};
  const on = !!s.hideOutOfSeason;
  return (
    <div>
      <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={on} onChange={(e) => setSeasonal({ ...s, hideOutOfSeason: e.target.checked })} style={{ width: "auto" }} />
        ✨ Édition saisonnière — masquer le produit hors période
      </label>
      {on && (
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <label className="admin-field">Occasion (facultatif)
            <input value={s.name || ""} onChange={(e) => setSeasonal({ ...s, name: e.target.value })} placeholder="Ex : Noël, Fête des mères…" />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <label className="admin-field" style={{ flex: 1 }}>Visible du
              <input type="date" value={s.start || ""} onChange={(e) => setSeasonal({ ...s, start: e.target.value })} />
            </label>
            <label className="admin-field" style={{ flex: 1 }}>au
              <input type="date" value={s.end || ""} onChange={(e) => setSeasonal({ ...s, end: e.target.value })} />
            </label>
          </div>
          <p style={{ fontSize: "0.76rem", color: "var(--ink-soft)", margin: 0 }}>Se répète chaque année (seuls le jour et le mois comptent).</p>
        </div>
      )}
    </div>
  );
}
