// Icônes au trait des écrans Commandes (04/11/2026) — une seule famille (celle de la maquette), 24 × 24, trait 1,8.
const P = {
  back: "M15 18l-6-6 6-6", next: "M9 18l6-6-6-6", check: "M20 6L9 17l-5-5", more: "M5 12h.01M12 12h.01M19 12h.01", x: "M18 6L6 18M6 6l12 12",
  truck: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM8 18.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0M21 18.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0",
  print: "M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z",
  bolt: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", alert: "M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01",
  gift: "M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z",
  mail: "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6",
  copy: "M9 9h13v13H9zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  box: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.3 7L12 12l8.7-5M12 22V12",
  pin: "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0zM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0", home: "M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0", card: "M1 4h22v16H1zM1 10h22",
  pen: "M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z", tag: "M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L2 12V2h10l8.6 8.6a2 2 0 010 2.8zM7 7h.01",
  clock: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 6v6l4 2", dl: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  img: "M3 3h18v18H3zM10 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0M21 15l-5-5L5 21", undo: "M3 7v6h6M21 17a9 9 0 00-15-6.7L3 13",
  spark: "M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z", flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
  search: "M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0M21 21l-4.3-4.3", phone: "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z",
  euro: "M18 6.5A7 7 0 1 0 18 17.5M4 10h10M4 14h10", list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
};
export default function Ic({ n, className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[n] || P.more} />
    </svg>
  );
}
