"use client";

import { useEffect, useRef, useState } from "react";

// Aperçu 3D d'un bracelet à plaque gravée. Polyvalent :
//  • band "chain"    → grosse chaîne (gourmette)
//  • band "silicone" → bracelet silicone souple
//  • finish "silver" / "black" → couleur de la plaque
// À titre indicatif.

const FIN = {
  silver: { plate: "#d4d6d9", base: "#e7e8ea", ink: "rgba(20,20,20,0.92)" },
  black:  { plate: "#2a2a2c", base: "#303033", ink: "rgba(242,242,242,0.95)" },
  gold:   { plate: "#d4af37", base: "#e7d49b", ink: "rgba(40,30,8,0.92)" },
};

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
const SCRIPT_FONTS = new Set(["great-vibes", "allura", "pacifico"]);
function fontSpec(fontKey, sizePx) {
  let fam = FONT_MAP[fontKey] || FONT_MAP.playfair;
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(FONT_VAR[fontKey] || "").trim();
    if (v) fam = `${v}, ${fam}`;
  } catch { /* ignore */ }
  const weight = SCRIPT_FONTS.has(fontKey) ? 400 : 600;
  return `${weight} ${sizePx}px ${fam}`;
}

const TEXW = 440, TEXH = 220;

function layoutText(ctx, text, fontKey, maxW, maxH) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  for (let size = 60; size >= 16; size -= 2) {
    ctx.font = fontSpec(fontKey, size);
    const lines = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width <= maxW || !cur) cur = test;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    const lineH = size * 1.18;
    if (lines.length * lineH <= maxH && lines.every((l) => ctx.measureText(l).width <= maxW)) {
      return { lines, size, lineH };
    }
  }
  return null;
}

function plateCanvas(text, fontKey, fin) {
  const c = document.createElement("canvas");
  c.width = TEXW; c.height = TEXH;
  const ctx = c.getContext("2d");
  ctx.fillStyle = fin.base;
  ctx.fillRect(0, 0, TEXW, TEXH);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const lay = layoutText(ctx, text, fontKey, TEXW * 0.84, TEXH * 0.7);
  if (lay) {
    ctx.font = fontSpec(fontKey, lay.size);
    const startY = TEXH / 2 - ((lay.lines.length - 1) * lay.lineH) / 2;
    lay.lines.forEach((line, i) => {
      ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.fillText(line, TEXW / 2 + 1.2, startY + i * lay.lineH + 1.4);
      ctx.fillStyle = fin.ink; ctx.fillText(line, TEXW / 2, startY + i * lay.lineH);
    });
  }
  return c;
}

export default function EngraveGourmette3D({ text = "", fontKey = "playfair", finish = "silver", band = "chain", height = 360, showHint = true }) {
  const mountRef = useRef(null);
  const matRef = useRef(null);
  const threeRef = useRef(null);
  const [tick, setTick] = useState(0);
  const fin = FIN[finish] || FIN.silver;

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed || !mountRef.current) return;

      const mount = mountRef.current;
      const width = mount.clientWidth || 320;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
      camera.position.set(0, 0.4, 7.4);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envMap;
      scene.add(new THREE.AmbientLight(0xffffff, 0.22));
      const keyL = new THREE.DirectionalLight(0xffffff, 1.15); keyL.position.set(3, 6, 5); scene.add(keyL);
      const fillL = new THREE.DirectionalLight(0xffffff, 0.5); fillL.position.set(-4, 1, 2); scene.add(fillL);

      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      const plateMetal = () => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(fin.plate), metalness: 1.0, roughness: 0.25,
        clearcoat: 0.95, clearcoatRoughness: 0.14, envMapIntensity: 1.4,
      });
      const chainMetal = () => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#d4d6d9"), metalness: 1.0, roughness: 0.25,
        clearcoat: 0.95, clearcoatRoughness: 0.14, envMapIntensity: 1.4,
      });
      const siliconeMat = () => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#1b1b1d"), metalness: 0.0, roughness: 0.85, clearcoat: 0.3, clearcoatRoughness: 0.5,
      });
      const leatherMat = () => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#2a1d12"), metalness: 0.0, roughness: 0.78, clearcoat: 0.15, clearcoatRoughness: 0.6,
      });

      const group = new THREE.Group();

      // --- Plaque (rectangle paysage, coins arrondis) ---
      const PW = 1.9, PH = 0.95, RR = 0.2, PT = 0.16;
      const shape = new THREE.Shape();
      const hw = PW / 2, hh = PH / 2;
      shape.moveTo(-hw + RR, -hh);
      shape.lineTo(hw - RR, -hh);
      shape.quadraticCurveTo(hw, -hh, hw, -hh + RR);
      shape.lineTo(hw, hh - RR);
      shape.quadraticCurveTo(hw, hh, hw - RR, hh);
      shape.lineTo(-hw + RR, hh);
      shape.quadraticCurveTo(-hw, hh, -hw, hh - RR);
      shape.lineTo(-hw, -hh + RR);
      shape.quadraticCurveTo(-hw, -hh, -hw + RR, -hh);

      const ext = new THREE.ExtrudeGeometry(shape, { depth: PT, bevelEnabled: false });
      ext.translate(0, 0, -PT / 2);
      group.add(new THREE.Mesh(ext, plateMetal()));

      const faceGeo = new THREE.ShapeGeometry(shape, 24);
      faceGeo.computeBoundingBox();
      const bb = faceGeo.boundingBox;
      const pos = faceGeo.attributes.position, uv = faceGeo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
      }
      uv.needsUpdate = true;
      const map = new THREE.CanvasTexture(plateCanvas(text, fontKey, fin));
      map.anisotropy = maxAniso; map.colorSpace = THREE.SRGBColorSpace;
      const faceMat = new THREE.MeshPhysicalMaterial({
        map, emissiveMap: map, emissive: new THREE.Color(0x3a3a3a),
        color: 0xffffff, metalness: 0.4, roughness: 0.45, envMapIntensity: 0.7,
      });
      matRef.current = faceMat;
      const face = new THREE.Mesh(faceGeo, faceMat);
      face.position.z = PT / 2 + 0.006;
      group.add(face);
      const back = new THREE.Mesh(faceGeo, plateMetal());
      back.position.z = -PT / 2 - 0.006;
      back.rotation.y = Math.PI;
      group.add(back);

      // --- Bracelet : chaîne, silicone ou cuir ---
      if (band === "silicone" || band === "leather") {
        const strapMat = band === "leather" ? leatherMat : siliconeMat;
        const strapLen = 2.0, strapH = PH * 0.66, strapT = 0.13;
        [1, -1].forEach((sign) => {
          // Embout métal qui maintient la plaque (comme sur la vraie photo).
          const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.18, PH * 1.05, PT + 0.16), plateMetal());
          cuff.position.set(sign * (hw + 0.02), 0, 0);
          group.add(cuff);
          // Sangle (silicone ou cuir).
          const strap = new THREE.Mesh(new THREE.BoxGeometry(strapLen, strapH, strapT), strapMat());
          strap.position.set(sign * (hw + 0.12 + strapLen / 2), 0, 0);
          group.add(strap);
          // Bout arrondi de la sangle.
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(strapH / 2, strapH / 2, strapT, 18), strapMat());
          cap.rotation.x = Math.PI / 2;
          cap.position.set(sign * (hw + 0.12 + strapLen), 0, 0);
          group.add(cap);
        });
      } else {
        const linkR = 0.17, tube = 0.06, gap = 0.21;
        [1, -1].forEach((sign) => {
          for (let i = 1; i <= 7; i++) {
            const x = sign * (hw + i * gap);
            const link = new THREE.Mesh(new THREE.TorusGeometry(linkR, tube, 12, 28), chainMetal());
            link.position.set(x, 0, 0);
            if (i % 2 === 0) link.rotation.y = Math.PI / 2; else link.rotation.x = Math.PI / 2;
            group.add(link);
          }
        });
      }

      scene.add(group);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0, 0);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.4;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minPolarAngle = Math.PI / 2.6;
      controls.maxPolarAngle = Math.PI / 1.75;
      controls.update();

      threeRef.current = { THREE, renderer, scene };

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
  }, [finish, band]);

  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setTick((t) => t + 1));
    }
  }, []);

  // Mise à jour du texte / de la police / de la finition.
  useEffect(() => {
    const ctx = threeRef.current;
    const mat = matRef.current;
    if (!ctx || !mat) return;
    const { THREE } = ctx;
    const old = mat.map;
    const m = new THREE.CanvasTexture(plateCanvas(text, fontKey, fin));
    m.anisotropy = ctx.renderer.capabilities.getMaxAnisotropy(); m.colorSpace = THREE.SRGBColorSpace;
    mat.map = m; mat.emissiveMap = m; mat.needsUpdate = true;
    if (old) old.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, fontKey, finish, tick]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, margin: showHint ? "8px 0 4px" : 0 }}>
      <div ref={mountRef} style={{ width: "100%", height, cursor: "grab", touchAction: "pan-y" }} />
      {showHint && (
        <>
          <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
            ↔ Faites pivoter le bracelet — votre texte est gravé sur la plaque
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", textAlign: "center", maxWidth: 340, fontStyle: "italic" }}>
            Aperçu 3D à titre indicatif — le rendu réel de la gravure peut légèrement varier.
          </span>
        </>
      )}
    </div>
  );
}
