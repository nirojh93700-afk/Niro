// En-tête commun à toutes les pages de gestion : titre + sous-titre à gauche,
// action principale à droite, chiffres clés en dessous. Même structure partout →
// on sait toujours où regarder et où cliquer.
export default function PageHead({ eyebrow, title, subtitle, actions, kpis }) {
  return (
    <div className="ph">
      <div className="ph-row">
        <div className="ph-txt">
          {eyebrow ? <div className="ph-eyebrow">{eyebrow}</div> : null}
          <h1 className="ph-title">{title}</h1>
          {subtitle ? <p className="ph-sub">{subtitle}</p> : null}
        </div>
        {actions ? <div className="ph-actions">{actions}</div> : null}
      </div>
      {Array.isArray(kpis) && kpis.length > 0 ? (
        <div className="ph-kpis">
          {kpis.map((k, i) => (
            <div key={i} className={`ph-kpi${k.tone ? " " + k.tone : ""}`}>
              <small>{k.label}</small>
              <b>{k.value}</b>
              {k.sub ? <span>{k.sub}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
