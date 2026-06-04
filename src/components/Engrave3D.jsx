"use client";

import { useEffect, useRef } from "react";

// Aperçu 3D photo-réaliste d'un bijou à forme simple (barre / plaque).
// Vraie 3D WebGL (Three.js) : métal, reflets de studio, gravure sur 4 faces.
// Le client fait pivoter le bijou et voit son texte en direct. Aucune photo requise.

const FINISH = {
  silver: { base: "#d7d7d7", ink: "rgba(40,38,34,0.92)" },
  gold:   { base: "#d4af37", ink: "rgba(60,42,8,0.92)" },
  rose:   { base: "#dba8a1", ink: "rgba(70,34,30,0.92)" },
  black:  { base: "#2d2d2d", ink: "rgba(222,222,222,0.95)" },
  rainbow:{ base: "#cfd6dd", ink: "rgba(40,35,40,0.9)" },
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

// Dessine une face : fond métal + texte gravé (lettres empilées verticalement).
function faceCanvas(text, finishKey, fontKey, wPx, hPx) {
  const f = FINISH[finishKey] || FINISH.silver;
  const c = document.createElement("canvas");
  c.width = wPx; c.height = hPx;
  const ctx = c.getContext("2d");
  if (finishKey === "rainbow") {
    const g = ctx.createLinearGradient(0, 0, 0, hPx);
    g.addColorStop(0, "#ff9ec4"); g.addColorStop(0.34, "#9ec9ff");
    g.addColorStop(0.67, "#9effc0"); g.addColorStop(1, "#ffd89e");
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = f.base;
  }
  ctx.fillRect(0, 0, wPx, hPx);

  const chars = (text || "").trim().split("");
  if (chars.length) {
    const fontFamily = FONT_MAP[fontKey] || FONT_MAP.playfair;
    const n = chars.length;
    const fontSize = Math.min(wPx * 0.6, (hPx * 0.9) / n);
    ctx.font = `600 ${fontSize}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const step = hPx / (n + 1);
    for (let i = 0; i < n; i++) {
      const y = step * (i + 1);
      ctx.fillStyle = "rgba(255,255,255,0.22)"; // léger relief clair
      ctx.fillText(chars[i], wPx / 2 + 1.2, y + 1.2);
      ctx.fillStyle = f.ink;                     // texte gravé foncé
      ctx.fillText(chars[i], wPx / 2, y);
    }
  }
  return c;
}

export default function Engrave3D({ faces = [], finish = "silver", fontKey = "playfair" }) {
  const mountRef = useRef(null);
  const matsRef = useRef([]); // matériaux des 4 faces (pour mise à jour du texte)
  const threeRef = useRef(null);

  // --- Mise en place de la scène (une seule fois) ---
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
      const height = 340;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
      camera.position.set(0, 0, 6.2);

      // Reflets de studio (gratuit, sans fichier HDRI)
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envMap;

      scene.add(new THREE.AmbientLight(0xffffff, 0.25));
      const key = new THREE.DirectionalLight(0xffffff, 1.1);
      key.position.set(3, 5, 4);
      scene.add(key);

      // Géométrie barre (croix carrée), 6 faces.
      const W = 0.58, H = 2.7, D = 0.58;
      const geo = new THREE.BoxGeometry(W, H, D);
      const wPx = 170, hPx = Math.round(wPx * (H / W));

      const f = FINISH[finish] || FINISH.silver;
      const makeMat = (text) => {
        const tex = new THREE.CanvasTexture(faceCanvas(text, finish, fontKey, wPx, hPx));
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshStandardMaterial({
          map: tex, color: 0xffffff, metalness: 1.0, roughness: 0.32, envMapIntensity: 1.15,
        });
      };
      const plainMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(f.base), metalness: 1.0, roughness: 0.3, envMapIntensity: 1.15,
      });

      // Ordre BoxGeometry : +x, -x, +y, -y, +z, -z
      const mRight = makeMat(faces[2]); // face 3
      const mLeft = makeMat(faces[3]);  // face 4
      const mFront = makeMat(faces[0]); // face 1
      const mBack = makeMat(faces[1]);  // face 2
      const materials = [mRight, mLeft, plainMat, plainMat, mFront, mBack];
      matsRef.current = [mFront, mBack, mRight, mLeft]; // ordre faces 1..4

      const mesh = new THREE.Mesh(geo, materials);
      scene.add(mesh);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2.2;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minPolarAngle = Math.PI / 2.6;
      controls.maxPolarAngle = Math.PI / 1.7;

      threeRef.current = { THREE, renderer, scene, materials, geo, envMap, pmrem };

      let raf;
      const animate = () => {
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      animate();

      const onResize = () => {
        const w = mount.clientWidth || 320;
        renderer.setSize(w, height);
        camera.aspect = w / height;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        controls.dispose();
        materials.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
        geo.dispose();
        envMap.dispose();
        pmrem.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    })();

    return () => { disposed = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Mise à jour des textes / police sur les faces (sans recréer la scène) ---
  useEffect(() => {
    const ctx = threeRef.current;
    const mats = matsRef.current;
    if (!ctx || !mats.length) return;
    const { THREE } = ctx;
    const W = 0.58, wPx = 170, hPx = Math.round(wPx * (2.7 / W));
    const order = [faces[0], faces[1], faces[2], faces[3]];
    mats.forEach((mat, i) => {
      const old = mat.map;
      const tex = new THREE.CanvasTexture(faceCanvas(order[i], finish, fontKey, wPx, hPx));
      tex.anisotropy = ctx.renderer.capabilities.getMaxAnisotropy();
      tex.colorSpace = THREE.SRGBColorSpace;
      mat.map = tex;
      mat.needsUpdate = true;
      if (old) old.dispose();
    });
  }, [faces, finish, fontKey]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, margin: "8px 0 4px" }}>
      <div
        ref={mountRef}
        style={{ width: "100%", height: 340, cursor: "grab", touchAction: "pan-y" }}
      />
      <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
        ↔ Faites pivoter le bijou pour voir vos 4 faces gravées
      </span>
    </div>
  );
}
