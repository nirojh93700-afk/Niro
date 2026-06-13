"use client";

import { useEffect, useRef } from "react";

// Aperçu 3D d'un verre que l'on peut faire tourner, avec la photo / le texte
// "gravés" (frostés) enroulés autour du verre. À titre indicatif (prototype).
// Réutilise Three.js (déjà présent sur le site).

const FONT_MAP = {
  playfair: "Georgia, 'Times New Roman', serif",
  cinzel: "Georgia, serif",
  "cinzel-deco": "Georgia, serif",
  montserrat: "Arial, Helvetica, sans-serif",
  inter: "Arial, Helvetica, sans-serif",
  "great-vibes": "'Snell Roundhand', 'Brush Script MT', cursive",
  allura: "'Snell Roundhand', 'Brush Script MT', cursive",
  pacifico: "'Bradley Hand', cursive",
};
const FONT_VAR = {
  playfair: "--font-display", cinzel: "--font-cinzel", "cinzel-deco": "--font-cinzel-deco",
  montserrat: "--font-montserrat", "great-vibes": "--font-great-vibes", allura: "--font-allura",
  pacifico: "--font-pacifico", inter: "--font-body",
};
const SCRIPT = new Set(["great-vibes", "allura", "pacifico"]);
function fontSpec(key, px) {
  let fam = FONT_MAP[key] || FONT_MAP.playfair;
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(FONT_VAR[key] || "").trim();
    if (v) fam = `${v}, ${fam}`;
  } catch { /* ignore */ }
  return `${SCRIPT.has(key) ? 400 : 600} ${px}px ${fam}`;
}

// Charge une image et renvoie une promesse.
function loadImg(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// Convertit une image en "gravure frostée" (blanc translucide sur transparent) :
// zones sombres → blanc opaque, zones claires → transparent.
function frostedFromImage(img, maxW) {
  const scale = Math.min(1, maxW / Math.max(img.naturalWidth, 1));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  let data;
  try { data = ctx.getImageData(0, 0, w, h); } catch { return c; }
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    let a = 255 - lum;
    a = a < 30 ? 0 : Math.min(255, (a - 30) * 1.9);
    d[i] = 38; d[i + 1] = 33; d[i + 2] = 27; d[i + 3] = a; // gravure foncée (bien visible)
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

export default function Glass3D({ photoSrc, lines = [], fontKey = "playfair", height = 380 }) {
  const mountRef = useRef(null);
  const apiRef = useRef(null);
  const dataRef = useRef({ photoSrc, lines, fontKey });
  dataRef.current = { photoSrc, lines, fontKey };

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      let THREE, OrbitControls, RoomEnvironment;
      try {
        THREE = await import("three");
        ({ OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js"));
        ({ RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js"));
      } catch {
        return;
      }
      if (disposed || !mountRef.current) return;
      const mount = mountRef.current;
      const width = mount.clientWidth || 320;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
      camera.position.set(0, 0.3, 8.8);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envMap;
      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(3, 5, 4); scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.4); fill.position.set(-4, 1, 3); scene.add(fill);

      const R = 1.0;
      const H = 2.4;
      const group = new THREE.Group();
      group.rotation.y = Math.PI; // amène l'avant (gravure) face caméra

      // Verre translucide fiable (pas de transmission : trop lourd/laiteux sur mobile).
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xeaf0f2, metalness: 0, roughness: 0.08,
        transparent: true, opacity: 0.22, envMapIntensity: 1.5,
        clearcoat: 0.6, clearcoatRoughness: 0.08,
      });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.95, H, 72, 1, false), glassMat);
      scene.add(group);
      group.add(body);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 0.9, H * 0.16, 72), glassMat);
      base.position.y = -H / 2 + H * 0.08;
      group.add(base);

      // Calque "gravure" : cylindre ouvert, texture transparente sauf l'artwork.
      const engCanvas = document.createElement("canvas");
      engCanvas.width = 1024; engCanvas.height = 512;
      const engTex = new THREE.CanvasTexture(engCanvas);
      engTex.colorSpace = THREE.SRGBColorSpace;
      const engMat = new THREE.MeshStandardMaterial({
        map: engTex, transparent: true, roughness: 0.85, metalness: 0,
        depthWrite: false, side: THREE.DoubleSide,
      });
      const eng = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.004, R * 1.004 * 0.95, H * 0.82, 72, 1, true), engMat);
      group.add(eng);

      let photoCanvas = null;

      function redraw() {
        const { lines, fontKey } = dataRef.current;
        const cw = engCanvas.width, ch = engCanvas.height;
        const ctx = engCanvas.getContext("2d");
        ctx.clearRect(0, 0, cw, ch);
        const midX = cw / 2;
        let y = ch * 0.5;

        if (photoCanvas) {
          const pw = photoCanvas.width, ph = photoCanvas.height;
          let dw = cw * 0.30;
          let dh = ph * (dw / pw);
          const maxH = ch * 0.6;
          if (dh > maxH) { dh = maxH; dw = pw * (dh / ph); }
          const photoTop = lines.length ? ch * 0.18 : ch * 0.5 - dh / 2;
          ctx.drawImage(photoCanvas, midX - dw / 2, photoTop, dw, dh);
          y = photoTop + dh + ch * 0.06;
        }

        const txt = (lines || []).map((l) => l.trim()).filter(Boolean);
        if (txt.length) {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const fontPx = Math.round(ch * 0.10);
          ctx.font = fontSpec(fontKey, fontPx);
          ctx.fillStyle = "rgba(38,33,27,0.96)"; // texte gravé foncé
          ctx.shadowColor = "rgba(255,255,255,0.3)";
          ctx.shadowBlur = 1;
          const startY = photoCanvas ? y : ch * 0.5 - ((txt.length - 1) * fontPx * 1.25) / 2;
          txt.forEach((line, i) => ctx.fillText(line, midX, startY + i * fontPx * 1.25));
          ctx.shadowBlur = 0;
        }
        engTex.needsUpdate = true;
      }

      apiRef.current = {
        async setPhoto(src) {
          if (!src) { photoCanvas = null; redraw(); return; }
          try {
            const img = await loadImg(src);
            if (disposed) return;
            photoCanvas = frostedFromImage(img, 700);
          } catch { photoCanvas = null; }
          redraw();
        },
        redraw,
      };

      // Premier rendu (photo éventuelle + texte)
      apiRef.current.setPhoto(dataRef.current.photoSrc);
      if (document.fonts?.ready) document.fonts.ready.then(() => !disposed && redraw());

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0, 0);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.4;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minPolarAngle = Math.PI / 2.4;
      controls.maxPolarAngle = Math.PI / 1.85;
      controls.update();

      let raf;
      const animate = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(animate); };
      animate();

      const onResize = () => {
        const w = mount.clientWidth || 320;
        renderer.setSize(w, height);
        camera.aspect = w / height; camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        controls.dispose();
        scene.traverse((o) => {
          if (o.isMesh) {
            o.geometry?.dispose();
            const mm = Array.isArray(o.material) ? o.material : [o.material];
            mm.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
          }
        });
        envMap.dispose(); pmrem.dispose(); renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    })();

    return () => { disposed = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  // Mise à jour quand la photo / le texte / la police changent.
  useEffect(() => {
    if (apiRef.current) apiRef.current.setPhoto(photoSrc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoSrc]);
  useEffect(() => {
    if (apiRef.current) apiRef.current.redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.join("|"), fontKey]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div ref={mountRef} style={{ width: "100%", height, cursor: "grab", touchAction: "pan-y" }} />
      <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
        ↔ Faites tourner le verre avec le doigt
      </span>
      <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", textAlign: "center", maxWidth: 340, fontStyle: "italic" }}>
        Aperçu 3D à titre indicatif — le rendu réel de la gravure peut varier.
      </span>
    </div>
  );
}
