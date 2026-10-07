"""Coquille du VRAI site pour les maquettes (07/10/2026).

À partir d'une capture HTML d'une page du site servie par `next start` (`curl localhost:3140/<page>`),
renvoie l'en-tête et le pied de page réels (scripts retirés, liens neutralisés, logo à son adresse
source — jamais copié), les 2 feuilles de style du site avec les polices latines intégrées, et la
classe de l'<html> (variables des polices). Seul le contenu de <main> est à fournir par la maquette.
Prérequis : `npm run build` (le dossier .next contient les feuilles de style et les polices).
"""
import base64, io, os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUB = os.path.join(ROOT, "public")


def uri(path, w=700, q=76):
    """Photo réduite en JPEG data: URI."""
    im = Image.open(path).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def raw_uri(path):
    ext = path.rsplit(".", 1)[-1].lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp",
            "svg": "image/svg+xml", "woff2": "font/woff2"}.get(ext, "application/octet-stream")
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


def coquille(capture_path):
    """→ dict(header, footer, css, html_class)"""
    src = open(capture_path, encoding="utf-8").read()
    src = re.sub(r"<script\b.*?</script>", "", src, flags=re.S)
    src = re.sub(r'<link[^>]+rel="(?:preload|modulepreload|preconnect|dns-prefetch)"[^>]*>', "", src)
    body_start = src.find(">", src.find("<body")) + 1
    i_main, j_main = src.find("<main"), src.find("</main>") + len("</main>")
    header, footer = src[body_start:i_main], src[j_main:src.rfind("</body>")]
    html_class = re.search(r'<html[^>]*class="([^"]*)"', src).group(1)

    css = ""
    for href in re.findall(r'<link rel="stylesheet" href="([^"]+)"', src):
        css += open(os.path.join(ROOT, ".next", href.replace("/_next/", "", 1)), encoding="utf-8").read() + "\n"

    def font_face(m):  # seules les polices latines (unicode-range u+00??) sont intégrées
        bloc = m.group(0)
        garder = "unicode-range:u+00??" in bloc.lower() or not re.search(r"unicode-range", bloc)
        def url(u):
            if garder:
                return f"url({raw_uri(os.path.join(ROOT, '.next', 'static', 'media', u.group(1)))})"
            return "url(data:font/woff2;base64,)"
        return re.sub(r"url\(/_next/static/media/([\w.-]+)\)", url, bloc)
    css = re.sub(r"@font-face\{[^}]*\}", font_face, css)
    css += ":root{" + ";".join(re.findall(r"\.__variable_[0-9a-f]+\{([^}]*)\}", css)) + "}\n"

    def local_src(m):  # images locales (QR Instagram…) ; le logo garde son adresse source
        p = os.path.join(PUB, m.group(2).lstrip("/"))
        return f'{m.group(1)}="{raw_uri(p)}"' if os.path.exists(p) else m.group(0)
    out = []
    for part in (header, footer):
        part = re.sub(r'(src)="(/[^"]+)"', local_src, part)
        for pat in (r'<button[^>]*>💬 Une question \?</button>', r'<a[^>]*href="/boutique">🛍️ La boutique</a>'):
            part = re.sub(pat, "", part)
        out.append(re.sub(r'href="/[^"]*"', 'href="#"', part))
    return {"header": out[0], "footer": out[1], "css": css, "html_class": html_class}


# Petit script commun : logo indisponible dans l'aperçu → case masquée (sur le site il s'affiche).
LOGO_JS = ("[].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){"
           "function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});")
