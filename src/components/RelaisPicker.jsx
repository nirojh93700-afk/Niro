"use client";

import { useEffect, useRef, useState } from "react";
import { pointRelaisPriceByWeight } from "@/lib/shipping";

const euro = (n) => `${Number(n).toFixed(2).replace(".", ",")} €`;
const samePoint = (a, b) => a && b && a.code === b.code && a.carrier === b.carrier;

// Carte + liste des points relais (Mondial Relay via Boxtal). La cliente tape
// son code postal, la carte s'ouvre avec les points relais autour d'elle, elle
// en choisit un. Tout est facultatif côté technique : si la carte ou l'API ne
// répond pas, une saisie manuelle prend le relais (le paiement ne casse jamais).

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// Charge Leaflet (carte) depuis le CDN, une seule fois.
function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.L) return resolve(window.L);
    if (!document.querySelector("link[data-leaflet]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      link.setAttribute("data-leaflet", "1");
      document.head.appendChild(link);
    }
    let s = document.querySelector("script[data-leaflet]");
    if (s && window.L) return resolve(window.L);
    if (!s) {
      s = document.createElement("script");
      s.src = LEAFLET_JS;
      s.setAttribute("data-leaflet", "1");
      document.body.appendChild(s);
    }
    s.addEventListener("load", () => resolve(window.L));
    s.addEventListener("error", () => reject(new Error("leaflet load failed")));
    // au cas où le script était déjà chargé entre-temps
    setTimeout(() => window.L && resolve(window.L), 1500);
  });
}

function pinIcon(L, active) {
  return L.divIcon({
    className: "relais-pin",
    html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35));${active ? "transform:scale(1.25);" : ""}">${active ? "📌" : "📍"}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}

export default function RelaisPicker({ country = "FR", selected, onSelect, weightGrams = 0 }) {
  // Prix estimé pour un point selon son transporteur et le poids du panier.
  const priceFor = (p) => pointRelaisPriceByWeight(weightGrams, p?.carrier);
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [manual, setManual] = useState("");

  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const LRef = useRef(null);

  async function search(e) {
    e?.preventDefault();
    setError("");
    const cp = zip.replace(/\D/g, "");
    if (cp.length < 4) { setError("Entrez un code postal valide."); return; }
    setLoading(true);
    setSearched(true);
    try {
      const qs = new URLSearchParams({ zip: cp, country });
      if (city.trim()) qs.set("city", city.trim());
      const r = await fetch(`/api/relais?${qs.toString()}`);
      const d = await r.json();
      const list = Array.isArray(d.points) ? d.points : [];
      setPoints(list);
      if (!list.length) setError(d.error || "Aucun point relais trouvé près de ce code postal.");
    } catch {
      setPoints([]);
      setError("Recherche momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  }

  // Initialise / met à jour la carte quand la liste des points change.
  useEffect(() => {
    const withCoords = points.filter((p) => p.lat != null && p.lng != null);
    if (!withCoords.length || !mapEl.current) return;
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current) return;
        LRef.current = L;
        if (!mapRef.current) {
          mapRef.current = L.map(mapEl.current, { scrollWheelZoom: false });
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap",
            maxZoom: 19,
          }).addTo(mapRef.current);
        }
        // efface les anciens marqueurs
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        const bounds = [];
        withCoords.forEach((p) => {
          const active = samePoint(selected, p);
          const m = L.marker([p.lat, p.lng], { icon: pinIcon(L, active) }).addTo(mapRef.current);
          m.bindPopup(`<strong>${p.name}</strong><br>${p.street}<br>${p.zipCode} ${p.city}<br><em>${p.carrierName || ""} — ${euro(priceFor(p))}</em>`);
          m.on("click", () => onSelect && onSelect(p));
          markersRef.current.push(m);
          bounds.push([p.lat, p.lng]);
        });
        if (bounds.length) mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
        setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 100);
      })
      .catch(() => {/* la liste reste utilisable sans la carte */});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  // Rafraîchit l'icône du point sélectionné (sans reconstruire la carte).
  useEffect(() => {
    const L = LRef.current;
    if (!L || !mapRef.current) return;
    const withCoords = points.filter((p) => p.lat != null && p.lng != null);
    markersRef.current.forEach((m, i) => {
      const p = withCoords[i];
      if (!p) return;
      m.setIcon(pinIcon(L, samePoint(selected, p)));
    });
  }, [selected, points]);

  function chooseFromList(p) {
    onSelect && onSelect(p);
    const L = LRef.current;
    if (L && mapRef.current && p.lat != null && p.lng != null) {
      mapRef.current.setView([p.lat, p.lng], 15);
    }
  }

  function chooseManual() {
    const label = manual.trim();
    if (label.length < 3) { setError("Indiquez le nom et la ville du point relais."); return; }
    onSelect && onSelect({ code: "manual:" + label.slice(0, 40), name: label.slice(0, 80), manual: true, city: "", street: "", zipCode: zip, carrier: "MONR", carrierName: "Mondial Relay", offer: "MONR-CpourToi" });
  }

  return (
    <div className="relais-picker" style={{ marginTop: 12 }}>
      <form onSubmit={search} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="text"
          inputMode="numeric"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Code postal (ex. 95350)"
          style={{ flex: "1 1 140px", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }}
        />
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville (facultatif)"
          style={{ flex: "1 1 140px", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }}
        />
        <button type="submit" className="btn btn-outline" disabled={loading}>
          {loading ? "Recherche…" : "Voir la carte"}
        </button>
      </form>

      {error && searched && (
        <p style={{ fontSize: "0.84rem", color: "#b4452f", margin: "10px 0 0" }}>{error}</p>
      )}

      {points.some((p) => p.lat != null && p.lng != null) && (
        <div
          ref={mapEl}
          style={{ height: 280, borderRadius: 12, marginTop: 12, overflow: "hidden", border: "1px solid var(--line)", zIndex: 0 }}
        />
      )}

      {points.length > 0 && (
        <div style={{ marginTop: 12, maxHeight: 240, overflowY: "auto", display: "grid", gap: 8 }}>
          {points.map((p) => {
            const active = samePoint(selected, p);
            return (
              <button
                type="button"
                key={`${p.carrier}:${p.code}`}
                onClick={() => chooseFromList(p)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  border: `1.5px solid ${active ? "var(--gold-dark, #b8860b)" : "var(--line)"}`,
                  background: active ? "rgba(184,134,11,.08)" : "#fff",
                  borderRadius: 10,
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                  <strong style={{ fontSize: "0.95rem" }}>{active ? "✓ " : "📍 "}{p.name}</strong>
                  <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--gold-dark, #a98935)", whiteSpace: "nowrap" }}>{euro(priceFor(p))}</span>
                </div>
                <div style={{ fontSize: "0.84rem", color: "var(--ink-soft)" }}>
                  {p.street} — {p.zipCode} {p.city}
                </div>
                {p.carrierName && (
                  <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)", marginTop: 2 }}>via {p.carrierName}</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Repli : si la recherche ne donne rien, la cliente saisit son point relais préféré. */}
      {searched && !loading && points.length === 0 && (
        <div style={{ marginTop: 10 }}>
          <label style={{ display: "block", fontSize: "0.86rem", marginBottom: 6 }}>
            Indiquez le point relais où vous souhaitez être livré(e) (nom + ville) :
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="text"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Ex. Tabac de la Gare, Saint-Brice"
              style={{ flex: "1 1 200px", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }}
            />
            <button type="button" className="btn btn-outline" onClick={chooseManual}>Valider ce point relais</button>
          </div>
        </div>
      )}

      {selected && (
        <p style={{ marginTop: 12, fontSize: "0.9rem", color: "#256b34", fontWeight: 600 }}>
          ✓ Point relais choisi : {selected.name}{selected.city ? ` — ${selected.zipCode} ${selected.city}` : ""}
          {selected.carrierName ? ` (${selected.carrierName} — ${euro(priceFor(selected))})` : ""}
        </p>
      )}
    </div>
  );
}
