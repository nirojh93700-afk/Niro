// Icônes au trait fin (1.4), une seule famille — celles de la maquette « accueil + univers ».
const ICON = {
  heart: '<path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4.5 7.2 4.5c2 0 3.7 1.1 4.8 2.9 1.1-1.8 2.8-2.9 4.8-2.9 3.3 0 5.6 3.1 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/>',
  pen: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="m13.5 6.5 3 3"/>',
  laser: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="3.5"/>',
  gift: '<path d="M4 11h16v9H4zM2 7h20v4H2zM12 7v13"/><path d="M12 7c-1.5-3-5-3-5-1s3 1 5 1zM12 7c1.5-3 5-3 5-1s-3 1-5 1z"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
};

export function Ic({ n, cls = "mxic" }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ICON[n] || "" }} />
  );
}

export function Star() {
  return (
    <svg viewBox="0 0 24 24" className="star" aria-hidden="true">
      <path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.3 1.2 6.1L12 17l-5.5 3 1.2-6.1L3.2 9.6l6.1-.8z" fill="currentColor" />
    </svg>
  );
}
