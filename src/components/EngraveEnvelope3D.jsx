"use client";

import { useEffect, useRef, useState } from "react";
import { drawMotifInBox, preloadMotifs } from "@/lib/motifCanvas";

// Aperçu 3D du collier ENVELOPPE : l'enveloppe est ouverte, la plaque (la
// « feuille ») sort par le haut, puis montre la gravure (recto, et verso si
// l'option Recto-Verso est choisie). Finition or / argent / or rose.
// À titre indicatif.

const FINISH = {
  silver: { base: "#edeef0", ink: "rgba(22,20,18,0.92)", metal: "#d7d7d9" },
  gold:   { base: "#ecc863", ink: "rgba(42,31,8,0.92)",  metal: "#d4af37" },
  rose:   { base: "#ecc1b8", ink: "rgba(45,24,22,0.92)", metal: "#dba8a1" },
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

// Plaque : format paysage (comme le pendentif enveloppe).
const TEXW = 470, TEXH = 300;

function layoutText(ctx, text, fontKey, maxW, maxH) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  for (let size = 46; size >= 14; size -= 2) {
    ctx.font = fontSpec(fontKey, size);
    const lines = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width <= maxW || !cur) cur = test;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    const lineH = size * 1.2;
    if (lines.length * lineH <= maxH && lines.every((l) => ctx.measureText(l).width <= maxW)) {
      return { lines, size, lineH };
    }
  }
  return null;
}

function drawSheetFace(ctx, { text, motifVal, motifPos, fontKey, baseColor, ink, bevel }) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, TEXW, TEXH);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Motif au-dessus (défaut) ou en dessous du texte.
  const above = motifPos !== "below";
  let topReserve = 0, botReserve = 0;
  if (motifVal) {
    const bandH = TEXH * 0.34;
    const cy = above ? TEXH * 0.06 + bandH / 2 : TEXH * 0.94 - bandH / 2;
    if (drawMotifInBox(ctx, motifVal, TEXW / 2, cy, TEXW * 0.42, bandH, ink, bevel)) {
      if (above) topReserve = bandH + TEXH * 0.04; else botReserve = bandH + TEXH * 0.04;
    }
  }
  const boxW = TEXW * 0.82;
  const boxTop = topReserve || TEXH * 0.12;
  const boxH = TEXH - boxTop - (botReserve || TEXH * 0.12);
  const lay = layoutText(ctx, text, fontKey, boxW, boxH);
  if (lay) {
    ctx.font = fontSpec(fontKey, lay.size);
    const cy = boxTop + boxH / 2;
    const startY = cy - ((lay.lines.length - 1) * lay.lineH) / 2;
    lay.lines.forEach((line, i) => {
      const y = startY + i * lay.lineH;
      if (bevel) { ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.fillText(line, TEXW / 2 + 1.1, y + 1.2); }
      ctx.fillStyle = ink; ctx.fillText(line, TEXW / 2, y);
    });
  }
}

function faceCanvas(opts) {
  const c = document.createElement("canvas");
  c.width = TEXW; c.height = TEXH;
  drawSheetFace(c.getContext("2d"), opts);
  return c;
}

function smoothstep(p) { const x = Math.max(0, Math.min(1, p)); return x * x * (3 - 2 * x); }

export default function EngraveEnvelope3D({
  faces = [], motifs = [], motifPositions = [], finish = "gold", fontKey = "playfair", twoSided = false, height = 400, showHint = true,
}) {
  const mountRef = useRef(null);
  const matsRef = useRef([]); // [recto, verso]
  const threeRef = useRef(null);
  const [tick, setTick] = useState(0);

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
      camera.position.set(0, 0.55, 7.8);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envMap;
      scene.add(new THREE.AmbientLight(0xffffff, 0.22));
      const keyL = new THREE.DirectionalLight(0xffffff, 1.15); keyL.position.set(3, 6, 5); scene.add(keyL);
      const fillL = new THREE.DirectionalLight(0xffffff, 0.5); fillL.position.set(-4, 1, 2); scene.add(fillL);

      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      const f = FINISH[finish] || FINISH.gold;

      const metalMat = () => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(f.metal), metalness: 1.0, roughness: 0.28,
        clearcoat: 0.95, clearcoatRoughness: 0.16, envMapIntensity: 1.35,
      });
      const sheetFaceMat = (text, motifVal, motifPos) => {
        const map = new THREE.CanvasTexture(faceCanvas({ text: text || "", motifVal: motifVal || "", motifPos, fontKey, baseColor: f.base, ink: f.ink, bevel: false }));
        map.anisotropy = maxAniso; map.colorSpace = THREE.SRGBColorSpace;
        // Plaque peu « miroir » : on doit bien lire la gravure (la couleur du
        // métal vient du map ; emissiveMap garantit la lisibilité même à l'ombre).
        return new THREE.MeshPhysicalMaterial({
          map, emissiveMap: map, emissive: new THREE.Color(0x4a4a4a),
          color: 0xffffff, metalness: 0.35, roughness: 0.55, envMapIntensity: 0.6,
        });
      };

      // --- Enveloppe (centrée à l'origine) ---
      const EW = 2.0, EH = 1.3, ED = 0.06;
      const backPanel = new THREE.Mesh(new THREE.BoxGeometry(EW, EH, ED), metalMat());
      backPanel.position.set(0, 0, -0.05);
      scene.add(backPanel);
      const frontPanel = new THREE.Mesh(new THREE.BoxGeometry(EW, EH, ED), metalMat());
      frontPanel.position.set(0, 0, 0.05);
      scene.add(frontPanel);

      // Rabat triangulaire ouvert (au-dessus, légèrement incliné vers l'arrière).
      const flapShape = new THREE.Shape();
      flapShape.moveTo(-EW / 2, 0);
      flapShape.lineTo(EW / 2, 0);
      flapShape.lineTo(0, -EH * 0.52);
      flapShape.lineTo(-EW / 2, 0);
      const flapGeo = new THREE.ExtrudeGeometry(flapShape, { depth: ED, bevelEnabled: false });
      flapGeo.translate(0, 0, -ED / 2);
      const flap = new THREE.Mesh(flapGeo, metalMat());
      flap.position.set(0, EH / 2, -0.05);
      flap.rotation.x = -2.45; // ouvert : bascule vers l'arrière, pointe vers le haut
      scene.add(flap);

      // Petit cœur doré sur l'avant de l'enveloppe.
      const hShape = new THREE.Shape();
      hShape.moveTo(0, 0.06);
      hShape.bezierCurveTo(0.06, 0.16, 0.18, 0.07, 0, -0.08);
      hShape.bezierCurveTo(-0.18, 0.07, -0.06, 0.16, 0, 0.06);
      const heartGeo = new THREE.ExtrudeGeometry(hShape, { depth: 0.03, bevelEnabled: false });
      const heart = new THREE.Mesh(heartGeo, metalMat());
      heart.position.set(0, -0.08, 0.085);
      heart.scale.set(1.1, 1.1, 1);
      scene.add(heart);

      // --- Plaque (la « feuille ») qui sort de l'enveloppe ---
      const SW = 1.82, SHt = 1.14, ST = 0.04;
      const recto = sheetFaceMat(faces[0], motifs[0], motifPositions[0]);
      const verso = sheetFaceMat(faces[1], motifs[1], motifPositions[1]);
      const edge = metalMat();
      const sheet = new THREE.Mesh(
        new THREE.BoxGeometry(SW, SHt, ST),
        [edge, edge, edge, edge, recto, verso]
      );
      matsRef.current = [recto, verso];
      const sheetPivot = new THREE.Group();
      sheetPivot.add(sheet);
      sheetPivot.position.set(0, 0, 0); // démarre cachée dans l'enveloppe
      scene.add(sheetPivot);

      // La plaque part du dedans (cachée, z=0) puis vient EN AVANT et un peu en
      // haut, bien visible face à la caméra.
      const Y_DOWN = 0, Z_DOWN = 0;
      const Y_UP = 0.5, Z_UP = 0.55;

      // --- Bélière + chaîne ---
      const topY = EH / 2;
      const bail = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.024, 16, 32), metalMat());
      bail.position.set(0, topY + 0.14, -0.05);
      scene.add(bail);
      const mkChain = (sign) => {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(0, topY + 0.24, -0.05),
          new THREE.Vector3(sign * 0.55, topY + 1.0, -0.05),
          new THREE.Vector3(sign * 0.95, topY + 1.7, -0.05)
        );
        return new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.02, 8, false), metalMat());
      };
      scene.add(mkChain(-1), mkChain(1));

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.4, 0);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minPolarAngle = Math.PI / 2.7;
      controls.maxPolarAngle = Math.PI / 1.8;
      controls.update();

      threeRef.current = { THREE, renderer, scene };

      // Animation : la plaque monte, montre le recto, (se retourne pour le verso),
      // puis redescend. En boucle.
      const PERIOD = 13;
      const clock = new THREE.Clock();
      let raf;
      const animate = () => {
        const tt = (clock.getElapsedTime() % PERIOD) / PERIOD;
        let p2, rotY;
        if (tt < 0.26) {                 // sortie (vers l'avant + un peu en haut)
          p2 = smoothstep(tt / 0.26); rotY = 0;
        } else if (tt < 0.44) {          // recto visible
          p2 = 1; rotY = 0;
        } else if (tt < 0.60) {          // retournement (si recto-verso)
          p2 = 1; rotY = twoSided ? Math.PI * smoothstep((tt - 0.44) / 0.16) : 0;
        } else if (tt < 0.76) {          // verso visible
          p2 = 1; rotY = twoSided ? Math.PI : 0;
        } else if (tt < 0.86) {          // retour face recto
          p2 = 1; rotY = twoSided ? Math.PI * (1 - smoothstep((tt - 0.76) / 0.10)) : 0;
        } else {                          // rentre dans l'enveloppe
          p2 = 1 - smoothstep((tt - 0.86) / 0.14); rotY = 0;
        }
        sheetPivot.position.y = Y_DOWN + (Y_UP - Y_DOWN) * p2;
        sheetPivot.position.z = Z_DOWN + (Z_UP - Z_DOWN) * p2;
        sheetPivot.rotation.y = rotY;
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
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
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setTick((t) => t + 1));
    }
  }, []);

  // Précharge les images de motifs ; rafraîchit une fois chargées.
  useEffect(() => {
    preloadMotifs(motifs, () => setTick((t) => t + 1));
  }, [motifs]);

  // Mise à jour des textes / motifs recto / verso / police / finition.
  useEffect(() => {
    const ctx = threeRef.current;
    const mats = matsRef.current;
    if (!ctx || !mats.length) return;
    const { THREE } = ctx;
    const maxAniso = ctx.renderer.capabilities.getMaxAnisotropy();
    const f = FINISH[finish] || FINISH.gold;
    [faces[0], faces[1]].forEach((text, i) => {
      const mat = mats[i];
      if (!mat) return;
      const old = mat.map;
      const map = new THREE.CanvasTexture(faceCanvas({ text: text || "", motifVal: motifs[i] || "", motifPos: motifPositions[i], fontKey, baseColor: f.base, ink: f.ink, bevel: false }));
      map.anisotropy = maxAniso; map.colorSpace = THREE.SRGBColorSpace;
      mat.map = map; mat.needsUpdate = true;
      if (old) old.dispose();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faces, motifs, motifPositions, finish, fontKey, tick]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, margin: showHint ? "8px 0 4px" : 0 }}>
      <div ref={mountRef} style={{ width: "100%", height, cursor: "grab", touchAction: "pan-y" }} />
      {showHint && (
        <>
          <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
            ↔ La plaque sort de l'enveloppe et montre votre gravure{twoSided ? " (recto-verso)" : ""}
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", textAlign: "center", maxWidth: 340, fontStyle: "italic" }}>
            Aperçu 3D à titre indicatif — le rendu réel de la gravure peut légèrement varier.
          </span>
        </>
      )}
    </div>
  );
}
