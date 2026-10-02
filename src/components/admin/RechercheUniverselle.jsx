"use client";

// RECHERCHE UNIVERSELLE de Gestion (02/10/2026) — Ctrl+K / ⌘K, la touche « / », la case du
// haut ou la loupe du téléphone. Une seule case qui trouve un écran, une commande, une
// cliente, un produit ou un devis (comme la recherche de Shopify). Lecture seule.
import { useEffect, useMemo, useRef, useState } from "react";
import { chargerAvecCache } from "./adminCache";

const sansAccent = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const euro = (n) => (Number(n) || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const STATUTS = { a_preparer: "À préparer", en_gravure: "En gravure", expediee: "Expédiée", livree: "Livrée", annulee: "Annulée", remise_main_propre: "Remise en main propre" };

export default function RechercheUniverselle({ ouvert, onFermer, ecrans, onAller }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [donnees, setDonnees] = useState({ orders: [], rows: [], quotes: [] });
  const input = useRef(null);
  const liste = useRef(null);

  // Données chargées à la 1re ouverture (et rafraîchies à chaque ouverture), via la
  // mémoire partagée : affichage immédiat si l'écran les a déjà chargées.
  useEffect(() => {
    if (!ouvert) return;
    setQ(""); setSel(0);
    setTimeout(() => input.current?.focus(), 30);
    const key = sessionStorage.getItem("niv-admin-key") || "";
    if (!key) return;
    chargerAvecCache("/api/admin/orders", key, (d) => setDonnees((x) => ({ ...x, orders: d.orders || [] })));
    chargerAvecCache("/api/admin/products", key, (d) => setDonnees((x) => ({ ...x, rows: d.rows || [] })));
    chargerAvecCache("/api/admin/quotes", key, (d) => setDonnees((x) => ({ ...x, quotes: d.quotes || [] })));
  }, [ouvert]);

  const resultats = useMemo(() => {
    const s = sansAccent(q.trim());
    const out = [];
    const ok = (...champs) => !s || champs.some((c) => sansAccent(c).includes(s));
    // Écrans
    for (const e of ecrans) {
      if (ok(e.text, e.group)) out.push({ groupe: "Écrans", icone: e.icon, titre: e.text, sous: e.group, href: e.href });
    }
    if (s) {
      // Commandes
      const orders = donnees.orders.filter((o) => !o.test);
      for (const o of orders) {
        const articles = (o.items || []).map((i) => i.name).join(" · ");
        if (ok(o.ref, o.customerName, o.customerEmail, articles)) {
          out.push({ groupe: "Commandes", icone: "▣", titre: `#${o.ref || o.id?.slice(-6)} — ${o.customerName || o.customerEmail || "Cliente"}`, sous: `${STATUTS[o.status || "a_preparer"] || o.status} · ${euro(o.total)} · ${articles.slice(0, 70)}`, href: `/gestion/commandes?q=${encodeURIComponent(o.ref || "")}` });
        }
      }
      // Clientes (regroupées par adresse)
      const clientes = new Map();
      for (const o of orders) {
        const e = String(o.customerEmail || "").toLowerCase();
        if (!e) continue;
        const c = clientes.get(e) || { email: e, nom: o.customerName || "", n: 0, total: 0 };
        c.n += 1; c.total += Number(o.total) || 0; if (!c.nom && o.customerName) c.nom = o.customerName;
        clientes.set(e, c);
      }
      for (const c of clientes.values()) {
        if (ok(c.nom, c.email)) out.push({ groupe: "Clientes", icone: "◉", titre: c.nom || c.email, sous: `${c.email} · ${c.n} commande${c.n > 1 ? "s" : ""} · ${euro(c.total)}`, href: `/gestion/crm?q=${encodeURIComponent(c.email)}` });
      }
      // Produits (un par fiche)
      const vus = new Set();
      for (const r of donnees.rows) {
        if (vus.has(r.productSlug)) continue;
        if (ok(r.productName, r.productSlug, r.category)) {
          vus.add(r.productSlug);
          out.push({ groupe: "Produits", icone: "◧", titre: r.productName, sous: `${r.category || ""} · ${euro(r.salePrice || r.price)}`, href: "/gestion/produits" });
        }
      }
      // Devis
      for (const d of donnees.quotes) {
        if (ok(d.number, d.client?.name, d.client?.email, (d.items || []).map((i) => i.name).join(" "))) {
          out.push({ groupe: "Devis", icone: "▥", titre: `${d.number || "Devis"} — ${d.client?.name || "Client"}`, sous: `${euro(d.total)} · ${d.status || ""}`, href: "/gestion/devis" });
        }
      }
    }
    // 8 au plus par famille, pour rester lisible.
    const compte = {};
    return out.filter((r) => (compte[r.groupe] = (compte[r.groupe] || 0) + 1) <= (s ? 8 : 40));
  }, [q, donnees, ecrans]);

  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => {
    liste.current?.querySelector(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  if (!ouvert) return null;

  function clavier(e) {
    if (e.key === "Escape") { e.preventDefault(); onFermer(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setSel((i) => Math.min(resultats.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); const r = resultats[sel]; if (r) onAller(r.href); }
  }

  let dernier = "";
  return (
    <div className="ru-fond" onMouseDown={(e) => { if (e.target === e.currentTarget) onFermer(); }}>
      <div className="ru" role="dialog" aria-label="Recherche dans la gestion">
        <div className="ru-case">
          <span aria-hidden>⌕</span>
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={clavier}
            placeholder="Commande, cliente, produit, devis ou écran…" aria-label="Rechercher" />
          <button type="button" className="ru-esc" onClick={onFermer} aria-label="Fermer">Échap</button>
        </div>
        <div className="ru-liste" ref={liste}>
          {resultats.length === 0 ? (
            <p className="ru-vide">Aucun résultat pour « {q} ».</p>
          ) : resultats.map((r, i) => {
            const titreGroupe = r.groupe !== dernier ? r.groupe : null;
            dernier = r.groupe;
            return (
              <div key={i}>
                {titreGroupe ? <div className="ru-groupe">{titreGroupe}</div> : null}
                <button type="button" data-i={i} className={`ru-item${i === sel ? " on" : ""}`}
                  onMouseEnter={() => setSel(i)} onClick={() => onAller(r.href)}>
                  <span className="ru-ico" aria-hidden>{r.icone}</span>
                  <span className="ru-txt"><b>{r.titre}</b>{r.sous ? <small>{r.sous}</small> : null}</span>
                  <span className="ru-go" aria-hidden>↵</span>
                </button>
              </div>
            );
          })}
        </div>
        <div className="ru-pied"><span>↑ ↓ pour choisir · Entrée pour ouvrir</span><span>Ctrl K</span></div>
      </div>
    </div>
  );
}
