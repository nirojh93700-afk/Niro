// Icônes des pages cristal (reprises des maquettes cristaux-graves / cristaux-blocs, trait 1,7).
const ICON = {
  "down": "<path d=\"m6 9 6 6 6-6\"/>",
  "check": "<path d=\"m5 12.5 4.5 4.5L19 7.5\"/>",
  "photo": "<rect x=\"3\" y=\"6\" width=\"18\" height=\"14\" rx=\"2.5\"/><circle cx=\"12\" cy=\"13\" r=\"3.6\"/><path d=\"M8.5 6 10 3.8h4L15.5 6\"/>",
  "paw": "<circle cx=\"7\" cy=\"10\" r=\"1.7\"/><circle cx=\"17\" cy=\"10\" r=\"1.7\"/><circle cx=\"9.6\" cy=\"6\" r=\"1.6\"/><circle cx=\"14.4\" cy=\"6\" r=\"1.6\"/><path d=\"M12 12.2c-2.8 0-5 3-5 5.1 0 1.6 1.4 2.2 2.6 2 1-.2 1.6-.6 2.4-.6s1.4.4 2.4.6c1.2.2 2.6-.4 2.6-2 0-2.1-2.2-5.1-5-5.1z\"/>",
  "pen": "<path d=\"M4 20l4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20z\"/><path d=\"m14.5 6.5 3 3\"/>",
  "logo": "<path d=\"M12 3 20 7.5v9L12 21l-8-4.5v-9z\"/><path d=\"M12 12 20 7.5M12 12v9M12 12 4 7.5\"/>",
  "gem": "<path d=\"M6 3h12l4 6-10 12L2 9l4-6z\"/><path d=\"M2 9h20M9 3l3 6 3-6M12 9v12\"/>",
  "pin": "<path d=\"M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z\"/><circle cx=\"12\" cy=\"9.5\" r=\"2.5\"/>",
  "truck": "<path d=\"M3 6h11v10H3zM14 10h4l3 3v3h-7z\"/><circle cx=\"7\" cy=\"17.5\" r=\"1.8\"/><circle cx=\"17.5\" cy=\"17.5\" r=\"1.8\"/>",
  "light": "<path d=\"M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z\"/>",
  "arrow": "<path d=\"M5 12h14M13 6l6 6-6 6\"/>",
  "up": "<path d=\"M12 19V5M6 11l6-6 6 6\"/>",
  "send": "<path d=\"M21 3 10 14M21 3l-7 18-4-7-7-4z\"/>",
  "spark": "<path d=\"M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6\"/>",
  "back": "<path d=\"M19 12H5M11 18l-6-6 6-6\"/>"
};

export default function IcCg({ n, cls = "cg-ic" }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ICON[n] || "" }} />
  );
}
