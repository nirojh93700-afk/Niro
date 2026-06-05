"use client";

import { useEffect, useRef } from "react";

// Affiche un vrai fichier 3D (.glb / .gltf) : éclairage studio, rotation auto,
// rotation au doigt/souris. Réutilisable pour n'importe quel produit en fournissant
// `src` (chemin du fichier, ex. "/models/bague.glb").
export default function Model3D({ src, height = 380, showHint = true }) {
  const mountRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
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
      const camera = new THREE.PerspectiveCamera(35, width / height, 0.01, 100);

      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.add(new THREE.AmbientLight(0xffffff, 0.25));
      const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(3, 6, 5); scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-4, 1, 2); scene.add(fill);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.8;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;

      let raf;
      const loader = new GLTFLoader();
      loader.load(
        src,
        (gltf) => {
          if (disposed) return;
          const model = gltf.scene;
          // Centre le modèle et ajuste la caméra à sa taille.
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);
          scene.add(model);
          const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;
          const dist = radius / Math.tan((camera.fov * Math.PI) / 360);
          camera.position.set(0, radius * 0.2, dist * 1.6);
          controls.target.set(0, 0, 0);
          controls.update();
        },
        undefined,
        () => { /* erreur de chargement : on laisse la zone vide */ }
      );

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
            mm.forEach((m) => { for (const k in m) { if (m[k]?.isTexture) m[k].dispose(); } m.dispose?.(); });
          }
        });
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    })();

    return () => { disposed = true; cleanup(); };
  }, [src, height]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div ref={mountRef} style={{ width: "100%", height, cursor: "grab", touchAction: "pan-y" }} />
      {showHint && (
        <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>↔ Tournez le bijou en 3D</span>
      )}
    </div>
  );
}
