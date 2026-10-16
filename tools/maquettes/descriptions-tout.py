#!/usr/bin/env python3
"""Maquette « même présentation des descriptions sur tout le site » (16/10/2026).

Gérant : « tu changes juste l'apparence comme pour le verre de vin pour les autres, mais tu ne changes pas les textes »
puis « pour les bijoux c'est différent, tu laisses comme ça ».
Règle : les fiches à longue description découpée en sections (<h3>) ET hors bijoux prennent la présentation du verre à vin ;
les bijoux et les fiches courtes sans section ne changent pas. Les MOTS ne changent jamais : seule la mise en forme change.
  · liste dont chaque point commence par « Libellé : » sous Caractéristiques / Spécifications / Dimensions, ou plus de 4 points
      → tableau (libellé à gauche) ;
  · liste « Libellé : » de 4 points au plus ailleurs → cartes ;
  · liste sans libellé → encadré avec une coche dorée par point ;
  · paragraphes inchangés (le premier en accroche).

Usage : python3 tools/maquettes/descriptions-tout.py <produits.json> <dossier css du site> <sortie.html>
(produits.json = export du catalogue : slug, name, category, image, desc)
"""
import base64, html, io, json, os, re, sys
from PIL import Image

SRC, CSSDIR, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
PUB = os.path.join(os.path.dirname(__file__), "..", "..", "public")
TABLEAU = re.compile(r"^(caractéristiques|spécifications|dimensions)", re.I)

def vignette(src):
    if not src.startswith("/produits/"): return ""
    p = os.path.join(PUB, src.lstrip("/"))
    try:
        im = Image.open(p).convert("RGB"); im.thumbnail((160, 160))
        b = io.BytesIO(); im.save(b, "JPEG", quality=72)
        return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
    except Exception:
        return ""

def libelle(li):
    """(libellé, valeur) si le point commence par « <strong>Libellé :</strong> » ou « <strong>Libellé</strong> : », sinon None."""
    m = re.match(r"\s*<strong>(.*?)</strong>\s*(.*)$", li, re.S)
    if not m: return None
    lab, reste = m.group(1).strip(), m.group(2).strip()
    if lab.endswith(":"): return lab[:-1].strip(), reste
    if reste.startswith(":"): return lab, reste[1:].strip()
    return None

def transformer(desc):
    out, titre, vu_p = [], "", False
    for tag, inner in re.findall(r"<(p|h3|ul)>(.*?)</\1>", desc, re.S):
        if tag == "p":
            out.append('<p class="%s">%s</p>' % ("pd2-lead" if not vu_p else "pd2-p", inner.strip())); vu_p = True
        elif tag == "h3":
            titre = re.sub(r"<[^>]+>", "", inner).strip(); out.append("<h3>%s</h3>" % inner.strip())
        else:
            pts = [x.strip() for x in re.findall(r"<li>(.*?)</li>", inner, re.S)]
            labs = [libelle(x) for x in pts]
            if pts and all(labs) and len(pts) <= 4 and not TABLEAU.match(titre):
                out.append('<div class="pd2-cards">' + "".join(
                    '<div class="pd2-card"><b>%s</b><span>%s</span></div>' % (l, v) for l, v in labs) + "</div>")
            elif pts and any(labs):
                rows = []
                for x, l in zip(pts, labs):
                    rows.append("<tr><th>%s</th><td>%s</td></tr>" % l if l else '<tr><td colspan="2">%s</td></tr>' % x)
                out.append('<table class="pd2-spec"><tbody>%s</tbody></table>' % "".join(rows))
            else:
                out.append('<ul class="pd2-list">%s</ul>' % "".join("<li>%s</li>" % x for x in pts))
    return '<div class="product-desc pd2">%s</div>' % "".join(out)

data = json.load(open(SRC, encoding="utf-8"))
cats = {c["slug"]: c.get("short") or c["label"] for c in data["cats"]}
sel = [p for p in data["products"] if p["category"] != "bijoux" and "<h3>" in p["desc"]]
css = "".join(open(os.path.join(CSSDIR, f), encoding="utf-8").read() for f in sorted(os.listdir(CSSDIR)) if f.endswith(".css"))
MQ = r'''
body{background:var(--cream)}
.dt-top{position:sticky;top:0;z-index:20;background:#1a1206;color:#f3e8d3;padding:10px 16px;display:flex;flex-direction:column;gap:8px}
.dt-top p{margin:0;font:500 .85rem/1.4 system-ui,sans-serif}
.dt-row{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.dt-row button{flex:none;border:1px solid #c9a24b;background:transparent;color:#f3e8d3;border-radius:999px;padding:6px 12px;font:600 .82rem system-ui,sans-serif;cursor:pointer}
.dt-row button.on{background:#c9a24b;color:#1a1206}
.dt-list{max-width:640px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:18px}
.dt-p{background:var(--paper);border:1px solid var(--line);border-radius:18px;padding:16px}
.dt-h{display:flex;gap:12px;align-items:center;margin:0 0 6px}
.dt-h img{width:56px;height:56px;border-radius:10px;object-fit:cover;flex:none;background:var(--cream-2)}
.dt-h b{font-family:var(--font-display,serif);font-size:1.05rem;line-height:1.25}
.dt-h small{display:block;color:var(--ink-soft);font-size:.8rem}
.dt-avant{display:none}
body.avant .dt-avant{display:block}body.avant .dt-apres{display:none}
.pd2 h3{margin:20px 0 10px}
.pd2-lead{margin:0 0 6px}.pd2-p{margin:0 0 8px;color:var(--ink-soft)}
.pd2-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.pd2-card{background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);padding:12px 14px;display:flex;flex-direction:column;gap:4px;min-width:0}
.pd2-card b{font-size:.98rem}.pd2-card span{font-size:.9rem;color:var(--ink-soft);line-height:1.45}
.pd2-spec{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;background:var(--paper);font-size:.93rem}
.pd2-spec th{width:34%;text-align:left;font-weight:600;color:var(--ink);background:var(--cream-2);padding:10px 14px;vertical-align:top}
.pd2-spec td{padding:10px 14px;color:var(--ink-soft);line-height:1.5}
.pd2-spec td[colspan]{color:var(--ink)}
.pd2-spec tr+tr th,.pd2-spec tr+tr td{border-top:1px solid var(--line)}
.pd2-list{list-style:none;margin:0;padding:4px 14px;border:1px solid var(--line);border-radius:var(--radius);background:var(--paper)}
.pd2-list li{position:relative;padding:9px 0 9px 26px;line-height:1.45;font-size:.93rem}
.pd2-list li+li{border-top:1px solid var(--line)}
.pd2-list li::before{content:"";position:absolute;left:2px;top:13px;width:12px;height:7px;border-left:2px solid var(--gold-dark);border-bottom:2px solid var(--gold-dark);transform:rotate(-45deg)}
@media (max-width:480px){.pd2-cards{grid-template-columns:1fr 1fr}.pd2-card{padding:10px 12px}.pd2-spec th{width:36%;padding:9px 11px}.pd2-spec td{padding:9px 11px}}
'''
ordre = []
for p in sel:
    if p["category"] not in ordre: ordre.append(p["category"])
filtres = '<button type="button" class="on" data-c="">Toutes (%d)</button>' % len(sel) + "".join(
    '<button type="button" data-c="%s">%s (%d)</button>' % (c, html.escape(cats.get(c, c)), sum(1 for p in sel if p["category"] == c)) for c in ordre)
cartes = "".join(
    '<article class="dt-p" data-c="%s"><div class="dt-h">%s<div><b>%s</b><small>%s</small></div></div>'
    '<div class="dt-apres">%s</div><div class="dt-avant product-desc">%s</div></article>' % (
        p["category"], ('<img src="%s" alt="">' % vignette(p["image"])) if vignette(p["image"]) else "",
        html.escape(p["name"]), html.escape(cats.get(p["category"], p["category"])), transformer(p["desc"]), p["desc"])
    for p in sel)
top = ('<div class="dt-top"><p>Descriptions de %d fiches, textes inchangés. Les bijoux et les fiches courtes gardent leur présentation actuelle.</p>'
       '<div class="dt-row">%s</div><div class="dt-row"><button type="button" class="dt-vue on" data-v="apres">Nouvelle présentation</button>'
       '<button type="button" class="dt-vue" data-v="avant">Présentation actuelle</button></div></div>') % (len(sel), filtres)
JS = r'''<script>(function(){
document.querySelectorAll(".dt-row button[data-c]").forEach(function(b){b.onclick=function(){document.querySelectorAll(".dt-row button[data-c]").forEach(function(x){x.classList.toggle("on",x===b)});document.querySelectorAll(".dt-p").forEach(function(a){a.hidden=!!b.dataset.c&&a.dataset.c!==b.dataset.c});window.scrollTo(0,0)}});
document.querySelectorAll(".dt-vue").forEach(function(b){b.onclick=function(){document.querySelectorAll(".dt-vue").forEach(function(x){x.classList.toggle("on",x===b)});document.body.classList.toggle("avant",b.dataset.v==="avant")}});
})();</script>'''
doc = "<title>Descriptions, même présentation</title><style>%s%s[hidden]{display:none!important}</style>%s<main class=\"dt-list\">%s</main>%s" % (css, MQ, top, cartes, JS)
open(OUT, "w", encoding="utf-8").write(doc)
print("ok", OUT, len(sel), "fiches", round(len(doc) / 1024), "Ko")
