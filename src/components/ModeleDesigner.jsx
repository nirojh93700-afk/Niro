"use client";

import { useEffect, useRef } from "react";
import { MODELES, defaultModele } from "@/lib/modeles";
import { FONTS, getFontLabel } from "@/lib/fonts";
import { MOTIF_LIST, Motif } from "./Motif";
import ModeleArt from "./ModeleArt";

// Formulaire de personnalisation d'un modèle de gravure (page dédiée).
// value = { text:{}, fonts:{}, motif } — stocké tel quel dans la commande.
export default function ModeleDesigner({ template, value, onChange }) {
  const tpl = MODELES[template];
  const v = value && value.text ? value : defaultModele(template);
  const inited = useRef(false);

  // Initialise la valeur par défaut une fois (pour l'aperçu dès l'arrivée).
  useEffect(() => {
    if (!inited.current && !(value && value.text)) {
      inited.current = true;
      onChange(defaultModele(template));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  if (!tpl) return null;

  function setText(key, val) { onChange({ ...v, text: { ...v.text, [key]: val } }); }
  function setFont(key, cls) { onChange({ ...v, fonts: { ...v.fonts, [key]: cls } }); }
  function setMotif(id) { onChange({ ...v, motif: id }); }

  return (
    <div className="modele-designer">
      {/* mini-aperçu */}
      <div className="modele-preview">
        <ModeleArt template={template} value={v} color="#fff" base={26} placeholder />
      </div>

      {/* lignes de texte + police par ligne */}
      {tpl.lines.map((l) => (
        <div className="field" key={l.key}>
          <label>{l.label}</label>
          <input
            value={v.text[l.key] || ""}
            placeholder={l.placeholder}
            maxLength={24}
            onChange={(e) => setText(l.key, e.target.value)}
          />
          <div className="modele-fonts">
            <span className="modele-fonts-lbl">Police :</span>
            <select
              className={`modele-font-select ${v.fonts[l.key] || l.font}`}
              value={v.fonts[l.key] || l.font}
              onChange={(e) => setFont(l.key, e.target.value)}
              aria-label={`Police de la ligne ${l.label}`}
            >
              {FONTS.map((f) => (
                <option key={f.key} value={f.cls} className={f.cls}>
                  {getFontLabel(f.key)}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {/* choix du motif (sauf modèle "badge" qui a ses propres graphismes) */}
      {tpl.style !== "badge" && (
      <>
      <label className="modele-label">Graphisme</label>
      <div className="modele-motifs">
        {MOTIF_LIST.map((m) => (
          <button
            type="button"
            key={m.id}
            className={`modele-motif-cell${v.motif === m.id ? " on" : ""}`}
            onClick={() => setMotif(m.id)}
            aria-label={m.label}
          >
            {m.id === "aucun" ? <span className="modele-motif-none">Aucun</span> : <Motif id={m.id} color="#3a2f1d" size={38} />}
          </button>
        ))}
      </div>
      </>
      )}
    </div>
  );
}
