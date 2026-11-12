"""Maquette « arbre de vie » (12/11/2026) : les tracés du générateur « Family Tree / Life Tree » d'Atomm (xTool).

Le gérant veut le même outil que https://www.atomm.com/creativetools/community/generator/family-tree-life-tree-generator/
(18 cm, 6 prénoms au maximum, pas de photo). L'outil charge depuis
https://family-tree-life-tree-generator.generator.atommapps.com/templates/ :
  availability.json  la liste des modèles (9 arbres × base / cœurs / cercles / prénoms seuls × 1 à 10 prénoms) ;
  <modèle>.svg       un seul tracé (fill nonzero), canevas 300 × 300 mm, cœurs déjà creusés dans le feuillage ;
  <modèle>.svg.patch.json  certains modèles = un autre modèle + des commandes de tracé recopiées / insérées
                     (« copy » [a, b] = commandes a à b du tracé source) ; empreintes sha256 vérifiées comme leur code ;
  <modèle>.json      les emplacements (slots) : contour du cœur, trou, cadre du prénom (textBoxMm).

  python3 tools/maquettes/arbre-atomm-donnees.py <dossier téléchargé> <availability.json> <sortie>
  (dossier téléchargé = chaque fichier sous le nom de son chemin, « / » remplacé par « __ »)
→ <sortie>/arbres/<arbre>-<forme>-<n>.txt (le tracé arrondi au 1/100 mm) et <sortie>/arbres.json (emplacements).
"""
import hashlib, json, os, posixpath, re, sys

DL, AV, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
MAX = 6


def lire(url):
    return open(os.path.join(DL, url.replace("/", "__")), encoding="utf-8").read()


cache = {}


def svg_de(url):
    if url in cache:
        return cache[url]
    if not url.endswith(".patch.json"):
        s = lire(url)
    else:
        m = json.loads(lire(url))
        src = posixpath.normpath(posixpath.join(posixpath.dirname(url), m["source"]))
        base = svg_de(src)
        toks = re.findall(r"[MmLlCcQqHhVvSsTtAaZz][^MmLlCcQqHhVvSsTtAaZz]*", re.search(r'\bd="([^"]+)"', base).group(1))
        out = [("".join(toks[o["copy"][0]:o["copy"][1]]) if "copy" in o else o["insert"]) for o in m["ops"]]
        s = m["prefix"] + "".join(out) + m["suffix"]
        if hashlib.sha256(s.encode()).hexdigest() != m["targetSha256"]:
            raise SystemExit("empreinte fausse : " + url)
    cache[url] = s
    return s


def arrondi(d):
    return re.sub(r"-?\d+\.\d+", lambda m: ("%.2f" % float(m.group())).rstrip("0").rstrip("."), d)


a = json.load(open(AV))
os.makedirs(os.path.join(OUT, "arbres"), exist_ok=True)
noms = {d["id"]: d["label"] for d in a["designs"]}
data = {"arbres": [{"id": d["id"], "nom": d["label"]} for d in a["designs"]], "slots": {}}
taille = 0
for t in a["templates"]:
    if t["capacity"] > MAX or t["shape"] == "names":
        continue
    s = svg_de(t["svg"]["url"])
    if hashlib.sha256(s.encode()).hexdigest() != t["svg"]["sha256"]:
        raise SystemExit("modèle différent : " + t["svg"]["url"])
    ds = re.findall(r'\bd="([^"]+)"', s)
    assert len(ds) == 1, t["svg"]["url"]
    nom = "%s-%s-%d" % (t["designId"], t["shape"], t["capacity"])
    txt = arrondi(ds[0])
    open(os.path.join(OUT, "arbres", nom + ".txt"), "w").write(txt)
    taille += len(txt)
    if t["capacity"]:
        m = json.loads(lire(t["metadata"]["url"]))
        data["slots"][nom] = [{"c": sl["centerMm"], "o": arrondi(sl["outerPathD"]), "h": arrondi(sl["holePathD"]),
                               "t": [round(sl["textBoxMm"][k], 2) for k in ("x", "y", "width", "height")]} for sl in m["slots"]]
json.dump(data, open(os.path.join(OUT, "arbres.json"), "w"), ensure_ascii=False, separators=(",", ":"))
print(len(os.listdir(os.path.join(OUT, "arbres"))), "tracés ·", taille // 1024, "Ko")
