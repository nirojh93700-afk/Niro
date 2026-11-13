#!/usr/bin/env python3
"""Les réglages communs des trois outils de l'atelier (support, arbre, décoration) — 13/11/2026.

Le gérant, le 13/11 : « oui pour le 1 et le 2 » = dans les outils de Gestion déjà en ligne, le bouton « OK ✓ » des champs
et le support de téléphone rangé pour une zone de 180 mm (fichier grand : 179 × 169 mm au lieu de 186 × 175).

  python3 tools/maquettes/atelier_patchs.py public/atelier-outils

Chaque réglage ne s'applique qu'UNE fois (il se reconnaît lui-même) : on peut relancer sans risque. Les mêmes fonctions
servent à retouche-site.py (qui fabrique ces pages), editeur-demo.py et atelier-unique.py.

  ok(t)           le bouton « OK ✓ » au bout de chaque champ (valider-champ.js)
  support_180(t)  support : marges de 2 mm au lieu de 5, 3 mm entre le dossier et le pied
  marges(t)       fabrique.js : 2 mm de marge autour des pièces dans chaque fichier fabriqué (au lieu de 5)
  pont(t)         le pont de messages : la page « L'atelier » demande les fichiers à l'outil ouvert dans son cadre
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib import import_module
VAL = import_module('ajouter-valider')

def ok(t):
    return VAL.ajouter(t)[0]

def _remplacer(t, paires, quoi):
    faits = [b in t for _, b in paires]
    if all(faits): return t
    assert not any(faits), quoi + " : réglage à moitié appliqué"
    for a, b in paires:
        assert t.count(a) == 1, quoi + " : " + a
        t = t.replace(a, b)
    return t

SUPPORT_180 = [
    ("function X(v){return ((v-ox())/3+5).toFixed(2)} function Y(v){return ((v-oy())/3+5).toFixed(2)}", "function X(v){return ((v-ox())/3+2).toFixed(2)} function Y(v){return ((v-oy())/3+2).toFixed(2)}"),
    ("F.setAttribute('viewBox','0 0 '+t0.lw+' '+lh);", "F.setAttribute('viewBox','0 0 '+(t0.lw-7)+' '+(lh-6));"),
    ('<clipPath id="fclip"><path transform="translate(5 5)"', '<clipPath id="fclip"><path transform="translate(2 2)"'),
    ("+'<g transform=\"translate(5 5)\"><path '+R+' d=\"'+b.dos+fentesD(b)+trous()+'\"/></g>'", "+'<g transform=\"translate(2 2)\"><path '+R+' d=\"'+b.dos+fentesD(b)+trous()+'\"/></g>'"),
    ("+'<g transform=\"translate('+t0.piedX+' 5)\">", "+'<g transform=\"translate('+(t0.piedX-4)+' 2)\">"),
    (".svg · '+t0.lw+' × '+lh+' mm · bois 3 mm';", ".svg · '+(t0.lw-7)+' × '+(lh-6)+' mm · bois 3 mm';"),
]
def support_180(t):
    return _remplacer(t, SUPPORT_180, "support 180")

MARGES = [
    ("W = r2(tb.width + 10), H = r2(tb.height + 10);", "W = r2(tb.width + 4), H = r2(tb.height + 4);"),
    ("'translate(' + r2(5 - tb.x) + ' ' + r2(5 - tb.y) + ')'", "'translate(' + r2(2 - tb.x) + ' ' + r2(2 - tb.y) + ')'"),
]
def marges(t):
    return _remplacer(t, MARGES, "marges des fichiers")

MARQUE_PONT = "<!-- niv-pont -->"
PONT = MARQUE_PONT + r"""<script>
(function(){
 if(window.parent===window)return;
 function dire(m){try{parent.postMessage(m,'*')}catch(_){}}
 window.addEventListener('message',function(ev){var d=ev.data||{};if(ev.source!==window.parent||d.type!=='niv-fabriquer'||!window.nivAtelier||!nivAtelier.pret)return;
  nivAtelier.fabriquer(function(f,t){dire({type:'niv-progres',fait:f,total:t})}).then(function(F){var al='';try{al=nivAtelier.alerte()||''}catch(_){}
   dire({type:'niv-fichiers',alerte:al,policesKo:[].slice.call(F.policesKo||[]),fichiers:[].map.call(F,function(f){return{nom:f.nom,svg:f.svg,w:f.w,h:f.h,titre:f.titre,matiere:f.matiere,note:f.note}})})
  }).catch(function(e){dire({type:'niv-erreur',message:String(e&&e.message||e)})})});
 var t=setInterval(function(){if(window.nivAtelier&&nivAtelier.pret){clearInterval(t);dire({type:'niv-pret'})}},300);
})();
</script>"""
def pont(t):
    if MARQUE_PONT in t: return t
    assert t.count("</body></html>") == 1, "pont"
    return t.replace("</body></html>", PONT + "</body></html>")

def outil(t, nom):
    """Tout ce qu'un outil de l'atelier reçoit, dans l'ordre."""
    if nom == "atelier-support.html": t = support_180(t)
    return pont(ok(t))

OUTILS = ("atelier-support.html", "atelier-arbre.html", "atelier-decoration.html")

if __name__ == "__main__":
    d = sys.argv[1]
    for n in OUTILS + ("fabrique.js",):
        p = os.path.join(d, n)
        t = open(p, encoding="utf-8").read()
        u = marges(t) if n == "fabrique.js" else outil(t, n)
        if u != t: open(p, "w", encoding="utf-8").write(u)
        print(n, "mis à jour" if u != t else "déjà à jour")
