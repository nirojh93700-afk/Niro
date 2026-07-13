"""
NIRO — Outils disponibles pour l'assistant
"""

import asyncio
import json
import os
import subprocess
import tempfile
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import Any
import httpx

# ─── Définitions des outils (envoyées à Ollama) ───────────────────────────────

TOOLS_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "browse_url",
            "description": "Visite une URL et retourne le contenu textuel de la page. Utilise pour vérifier un site web, lire un article, surveiller la boutique, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "URL complète (avec https://)"}
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Recherche sur internet via DuckDuckGo et retourne les résultats",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Requête de recherche"},
                    "max_results": {"type": "integer", "description": "Nombre de résultats (défaut 5)"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Donne la météo actuelle (température, ressenti, vent, min/max du jour). Utilise cet outil pour TOUTE question météo/température. Ne PAS chercher la météo sur internet, utilise cet outil.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "Ville (optionnel, défaut = Val-d'Oise où habite Nirojh)"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "take_screenshot",
            "description": "Prend une capture d'écran du Mac et retourne une description de ce qui est affiché",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_boutique",
            "description": "Vérifie l'état de la boutique nivcreation.fr : disponibilité, temps de réponse, pages principales",
            "parameters": {
                "type": "object",
                "properties": {
                    "deep": {"type": "boolean", "description": "Si true, vérifie toutes les pages clés"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Envoie un email. Utilise les paramètres SMTP configurés.",
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {"type": "string", "description": "Adresse du destinataire"},
                    "subject": {"type": "string", "description": "Sujet"},
                    "body": {"type": "string", "description": "Corps du message"}
                },
                "required": ["to", "subject", "body"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "mac_applescript",
            "description": "Exécute un script AppleScript pour contrôler le Mac : ouvrir des apps, gérer des fenêtres, des fichiers, des notifications, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "script": {"type": "string", "description": "Code AppleScript à exécuter"},
                    "description": {"type": "string", "description": "Ce que fait ce script"}
                },
                "required": ["script", "description"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "mac_shell",
            "description": "Exécute une commande shell sur le Mac pour des opérations système (lister des fichiers, obtenir des infos, etc.)",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Commande shell à exécuter"},
                    "description": {"type": "string", "description": "Ce que fait cette commande"}
                },
                "required": ["command", "description"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Lit le contenu d'un fichier texte sur le Mac",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Chemin complet du fichier"}
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Écrit du contenu dans un fichier sur le Mac",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Chemin complet du fichier"},
                    "content": {"type": "string", "description": "Contenu à écrire"},
                    "append": {"type": "boolean", "description": "Si true, ajoute à la fin du fichier"}
                },
                "required": ["path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": "Liste les fichiers d'un dossier",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Chemin du dossier"},
                    "pattern": {"type": "string", "description": "Filtre (ex: *.pdf)"}
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_system_info",
            "description": "Obtient des informations sur le Mac : batterie, CPU, mémoire, espace disque, processus en cours",
            "parameters": {
                "type": "object",
                "properties": {
                    "info_type": {
                        "type": "string",
                        "enum": ["battery", "cpu", "memory", "disk", "network", "processes", "all"],
                        "description": "Type d'information"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "set_reminder",
            "description": "Crée un rappel ou une alarme sur le Mac",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Message du rappel"},
                    "minutes": {"type": "integer", "description": "Dans combien de minutes (optionnel)"},
                    "time": {"type": "string", "description": "Heure précise HH:MM (optionnel)"}
                },
                "required": ["message"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "blender_run_script",
            "description": "Exécute un script Python dans Blender en arrière-plan. Utilise pour créer des objets 3D, modifier une scène, appliquer des matériaux, exporter un fichier, corriger une erreur Blender, automatiser une tâche 3D. Blender doit être installé sur le Mac.",
            "parameters": {
                "type": "object",
                "properties": {
                    "script": {"type": "string", "description": "Script Python Blender (bpy) à exécuter"},
                    "blend_file": {"type": "string", "description": "Chemin vers le fichier .blend à ouvrir (optionnel, laisse vide pour une scène vide)"},
                    "output_file": {"type": "string", "description": "Chemin de sortie pour sauvegarder le résultat .blend (optionnel)"},
                    "description": {"type": "string", "description": "Ce que fait ce script"}
                },
                "required": ["script", "description"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "blender_render",
            "description": "Lance un rendu Blender d'un fichier .blend et sauvegarde l'image résultante",
            "parameters": {
                "type": "object",
                "properties": {
                    "blend_file": {"type": "string", "description": "Chemin vers le fichier .blend"},
                    "output_path": {"type": "string", "description": "Chemin de sortie de l'image (ex: /Users/nirojh/Desktop/rendu.png)"},
                    "frame": {"type": "integer", "description": "Numéro de frame à rendre (défaut 1)"}
                },
                "required": ["blend_file", "output_path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "Effectue des calculs mathématiques ou financiers",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Expression à calculer (Python)"}
                },
                "required": ["expression"]
            }
        }
    },
]

# ─── Implémentation des outils ──────────────────────────────────────────────

async def browse_url(url: str) -> str:
    """Visite une URL et extrait le texte."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            r = await client.get(url, headers=headers)
            content_type = r.headers.get("content-type", "")

            if "text/html" in content_type or "text" in content_type:
                text = r.text
                # Extraction basique du texte (retirer les balises HTML)
                import re
                text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL)
                text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
                text = re.sub(r'<[^>]+>', ' ', text)
                text = re.sub(r'\s+', ' ', text).strip()
                return f"[{r.status_code}] {url}\n\n{text[:3000]}"
            else:
                return f"[{r.status_code}] Contenu binaire ({content_type})"
    except Exception as e:
        return f"Erreur lors de la navigation : {e}"


async def search_web(query: str, max_results: int = 5) -> str:
    """Recherche DuckDuckGo (via l'API lite)."""
    try:
        from urllib.parse import quote_plus
        url = f"https://api.duckduckgo.com/?q={quote_plus(query)}&format=json&no_html=1&skip_disambig=1"
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url)
            data = r.json()

        results = []
        if data.get("AbstractText"):
            results.append(f"RÉSUMÉ: {data['AbstractText']}")

        for topic in data.get("RelatedTopics", [])[:max_results]:
            if "Text" in topic:
                results.append(f"- {topic['Text']}")

        if not results:
            # Fallback : recherche HTML
            url2 = f"https://duckduckgo.com/html/?q={query}"
            headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                r2 = await client.get(url2, headers=headers)
            import re
            snippets = re.findall(r'class="result__snippet"[^>]*>(.*?)</a>', r2.text, re.DOTALL)
            results = [re.sub(r'<[^>]+>', '', s).strip() for s in snippets[:max_results]]

        return "\n".join(results) if results else "Aucun résultat trouvé."
    except Exception as e:
        return f"Erreur de recherche : {e}"


async def take_screenshot() -> str:
    """Prend une capture d'écran (macOS)."""
    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    tmp.close()
    try:
        result = subprocess.run(
            ["screencapture", "-x", tmp.name],
            capture_output=True, timeout=10
        )
        if result.returncode == 0:
            size = os.path.getsize(tmp.name)
            return f"Capture d'écran prise ({size // 1024} Ko). Fichier disponible pour analyse."
        else:
            return "Impossible de prendre la capture d'écran."
    except Exception as e:
        return f"Erreur screenshot : {e}"
    finally:
        try: os.unlink(tmp.name)
        except Exception: pass


async def check_boutique(deep: bool = False) -> str:
    """Vérifie l'état de nivcreation.fr."""
    pages = ["https://nivcreation.fr"]
    if deep:
        pages += [
            "https://nivcreation.fr/boutique",
            "https://nivcreation.fr/api/health",
        ]

    results = []
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        for url in pages:
            try:
                import time
                start = time.time()
                r = await client.get(url)
                elapsed = round((time.time() - start) * 1000)
                results.append(f"✓ {url} → {r.status_code} ({elapsed}ms)")
            except Exception as e:
                results.append(f"✗ {url} → ERREUR: {e}")

    return "\n".join(results)


async def send_email(to: str, subject: str, body: str) -> str:
    """Envoie un email via SMTP (config dans ~/.niro/email.json)."""
    config_path = Path.home() / ".niro" / "email.json"
    if not config_path.exists():
        return (
            "Configuration email manquante. "
            "Créez ~/.niro/email.json avec : "
            '{"smtp": "smtp.gmail.com", "port": 587, "user": "...", "password": "...", "from": "..."}'
        )
    try:
        with open(config_path) as f:
            cfg = json.load(f)

        msg = MIMEMultipart()
        msg["From"] = cfg.get("from", cfg["user"])
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))

        with smtplib.SMTP(cfg["smtp"], cfg.get("port", 587)) as server:
            server.starttls()
            server.login(cfg["user"], cfg["password"])
            server.send_message(msg)

        return f"Email envoyé à {to} avec le sujet « {subject} »."
    except Exception as e:
        return f"Erreur envoi email : {e}"


async def mac_applescript(script: str, description: str) -> str:
    """Exécute un script AppleScript."""
    try:
        result = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            output = result.stdout.strip()
            return f"OK ({description})" + (f" → {output}" if output else "")
        else:
            return f"Erreur AppleScript : {result.stderr.strip()}"
    except Exception as e:
        return f"Erreur : {e}"


async def mac_shell(command: str, description: str) -> str:
    """Exécute une commande shell."""
    # Commandes dangereuses bloquées
    BLOCKED = ["rm -rf /", "mkfs", "dd if=/dev/zero", ":(){ :|:& };:"]
    for blocked in BLOCKED:
        if blocked in command:
            return f"Commande bloquée pour sécurité : {blocked}"
    try:
        result = subprocess.run(
            command, shell=True, capture_output=True, text=True, timeout=30
        )
        output = (result.stdout + result.stderr).strip()
        return output[:2000] if output else "Commande exécutée (pas de sortie)."
    except subprocess.TimeoutExpired:
        return "Timeout : la commande a pris trop de temps."
    except Exception as e:
        return f"Erreur : {e}"


async def read_file(path: str) -> str:
    """Lit un fichier."""
    try:
        p = Path(path).expanduser()
        if not p.exists():
            return f"Fichier introuvable : {path}"
        if p.stat().st_size > 500_000:
            return "Fichier trop volumineux (> 500 Ko). Précise une section."
        return p.read_text(encoding="utf-8", errors="replace")[:5000]
    except Exception as e:
        return f"Erreur lecture : {e}"


async def write_file(path: str, content: str, append: bool = False) -> str:
    """Écrit dans un fichier."""
    try:
        p = Path(path).expanduser()
        p.parent.mkdir(parents=True, exist_ok=True)
        mode = "a" if append else "w"
        with open(p, mode, encoding="utf-8") as f:
            f.write(content)
        return f"Fichier {'mis à jour' if append else 'créé/écrit'} : {path}"
    except Exception as e:
        return f"Erreur écriture : {e}"


async def list_files(path: str, pattern: str = "*") -> str:
    """Liste les fichiers d'un dossier."""
    try:
        p = Path(path).expanduser()
        if not p.exists():
            return f"Dossier introuvable : {path}"
        files = sorted(p.glob(pattern))
        lines = []
        for f in files[:50]:
            stat = f.stat()
            size = stat.st_size
            size_str = f"{size // 1024} Ko" if size >= 1024 else f"{size} o"
            lines.append(f"{'📁' if f.is_dir() else '📄'} {f.name} ({size_str})")
        return "\n".join(lines) if lines else "Dossier vide."
    except Exception as e:
        return f"Erreur : {e}"


async def get_system_info(info_type: str = "all") -> str:
    """Infos système Mac."""
    results = []
    try:
        if info_type in ("cpu", "all"):
            r = subprocess.run(["top", "-l", "1", "-n", "0"], capture_output=True, text=True, timeout=5)
            lines = [l for l in r.stdout.split("\n") if "CPU" in l or "Load" in l]
            results.append("CPU: " + " | ".join(lines[:2]))

        if info_type in ("memory", "all"):
            r = subprocess.run(["vm_stat"], capture_output=True, text=True, timeout=5)
            results.append("Mémoire:\n" + r.stdout[:300])

        if info_type in ("disk", "all"):
            r = subprocess.run(["df", "-h", "/"], capture_output=True, text=True, timeout=5)
            results.append("Disque:\n" + r.stdout)

        if info_type in ("network", "all"):
            r = subprocess.run(["ifconfig", "en0"], capture_output=True, text=True, timeout=5)
            results.append("Réseau:\n" + r.stdout[:300])

        if info_type in ("processes", "all"):
            r = subprocess.run(
                ["ps", "aux", "-r"],
                capture_output=True, text=True, timeout=5
            )
            lines = r.stdout.split("\n")[:11]
            results.append("Processus (top CPU):\n" + "\n".join(lines))

    except Exception as e:
        results.append(f"Erreur : {e}")

    return "\n\n".join(results)


async def set_reminder(message: str, minutes: int = None, time: str = None) -> str:
    """Crée un rappel via AppleScript."""
    safe_msg = message.replace("\\", "\\\\").replace('"', '\\"')
    if minutes:
        script = f'delay {int(minutes) * 60}\ndisplay notification "{safe_msg}" with title "Jarvis" sound name "Glass"'
        subprocess.Popen(["osascript", "-e", script])
        return f"Rappel programmé dans {minutes} minute(s) : {message}"
    else:
        script = f'display notification "{safe_msg}" with title "Jarvis" sound name "Glass"'
        subprocess.Popen(["osascript", "-e", script])
        return f"Notification envoyée : {message}"


async def blender_run_script(script: str, description: str, blend_file: str = "", output_file: str = "") -> str:
    """Exécute un script Python dans Blender en arrière-plan."""
    # Chercher Blender
    blender_paths = [
        "/Applications/Blender.app/Contents/MacOS/Blender",
        "/usr/local/bin/blender",
        "/opt/homebrew/bin/blender",
    ]
    blender = None
    for p in blender_paths:
        if os.path.exists(p):
            blender = p
            break
    if not blender:
        # Essayer via shell
        r = subprocess.run(["which", "blender"], capture_output=True, text=True)
        if r.returncode == 0:
            blender = r.stdout.strip()
    if not blender:
        return "Blender introuvable. Assurez-vous que Blender est installé dans /Applications/Blender.app"

    # Écrire le script dans un fichier temporaire
    tmp_script = tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w")

    # Ajouter la sauvegarde automatique si output_file est précisé
    full_script = script
    if output_file:
        full_script += f"\nimport bpy\nbpy.ops.wm.save_as_mainfile(filepath='{output_file}')\nprint('Fichier sauvegardé : {output_file}')"

    tmp_script.write(full_script)
    tmp_script.close()

    try:
        cmd = [blender, "--background"]
        if blend_file and os.path.exists(os.path.expanduser(blend_file)):
            cmd += [os.path.expanduser(blend_file)]
        cmd += ["--python", tmp_script.name]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        output = (result.stdout + result.stderr).strip()

        # Filtrer les lignes Blender inutiles pour garder ce qui est pertinent
        lines = [l for l in output.split("\n") if l.strip() and not l.startswith("Blender") and "Warning" not in l]
        clean_output = "\n".join(lines[-20:])  # Garder les 20 dernières lignes

        if result.returncode == 0:
            return f"✓ Script Blender exécuté ({description})\n{clean_output}"
        else:
            return f"Erreur Blender (code {result.returncode}) :\n{clean_output}"
    except subprocess.TimeoutExpired:
        return "Timeout : le script Blender a pris trop de temps (> 2 min)."
    except Exception as e:
        return f"Erreur : {e}"
    finally:
        os.unlink(tmp_script.name)


async def blender_render(blend_file: str, output_path: str, frame: int = 1) -> str:
    """Lance un rendu Blender."""
    blender_paths = [
        "/Applications/Blender.app/Contents/MacOS/Blender",
        "/usr/local/bin/blender",
        "/opt/homebrew/bin/blender",
    ]
    blender = None
    for p in blender_paths:
        if os.path.exists(p):
            blender = p
            break
    if not blender:
        return "Blender introuvable."

    blend_expanded = os.path.expanduser(blend_file)
    output_expanded = os.path.expanduser(output_path)

    if not os.path.exists(blend_expanded):
        return f"Fichier .blend introuvable : {blend_file}"

    try:
        cmd = [blender, "--background", blend_expanded, "--render-output", output_expanded,
               "--render-frame", str(frame), "--render-format", "PNG"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        output = (result.stdout + result.stderr).strip()
        lines = [l for l in output.split("\n") if "Saved" in l or "Error" in l or "Fra:" in l]
        if result.returncode == 0:
            return f"✓ Rendu terminé → {output_path}\n" + "\n".join(lines[-5:])
        else:
            return f"Erreur rendu : {chr(10).join(lines[-10:])}"
    except subprocess.TimeoutExpired:
        return "Timeout rendu (> 5 min)."
    except Exception as e:
        return f"Erreur : {e}"


async def calculate(expression: str) -> str:
    """Calcul mathématique sécurisé."""
    import math
    allowed_names = {k: v for k, v in math.__dict__.items() if not k.startswith("_")}
    allowed_names.update({"abs": abs, "round": round, "min": min, "max": max, "sum": sum})
    try:
        result = eval(expression, {"__builtins__": {}}, allowed_names)
        return f"{expression} = {result}"
    except Exception as e:
        return f"Erreur de calcul : {e}"


async def get_weather(city: str = "") -> str:
    """Météo actuelle via open-meteo (gratuit, sans clé)."""
    try:
        lat, lon, loc = 49.0, 2.1, city or "Val-d'Oise"
        # Géocoder la ville si précisée
        if city:
            async with httpx.AsyncClient(timeout=8.0) as client:
                g = await client.get(
                    "https://geocoding-api.open-meteo.com/v1/search",
                    params={"name": city, "count": 1, "language": "fr"},
                )
                gd = g.json()
                if gd.get("results"):
                    r0 = gd["results"][0]
                    lat, lon, loc = r0["latitude"], r0["longitude"], r0["name"]
        async with httpx.AsyncClient(timeout=8.0) as client:
            w = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat, "longitude": lon,
                    "current": "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
                    "daily": "temperature_2m_max,temperature_2m_min",
                    "timezone": "auto",
                },
            )
            wd = w.json()
        cur = wd.get("current", {})
        daily = wd.get("daily", {})
        codes = {0: "ciel clair", 1: "peu nuageux", 2: "nuageux", 3: "couvert",
                 45: "brouillard", 51: "bruine", 61: "pluie", 63: "pluie",
                 65: "forte pluie", 71: "neige", 80: "averses", 95: "orage"}
        desc = codes.get(cur.get("weather_code"), "variable")
        t = cur.get("temperature_2m")
        ress = cur.get("apparent_temperature")
        tmax = daily.get("temperature_2m_max", [None])[0]
        tmin = daily.get("temperature_2m_min", [None])[0]
        return (f"Météo à {loc} : {t}°C ({desc}), ressenti {ress}°C, "
                f"vent {cur.get('wind_speed_10m')} km/h. "
                f"Aujourd'hui min {tmin}°C / max {tmax}°C.")
    except Exception as e:
        return f"Impossible de récupérer la météo : {e}"


# ─── Dispatcher ─────────────────────────────────────────────────────────────

TOOL_MAP = {
    "browse_url": browse_url,
    "search_web": search_web,
    "get_weather": get_weather,
    "take_screenshot": take_screenshot,
    "check_boutique": check_boutique,
    "send_email": send_email,
    "mac_applescript": mac_applescript,
    "mac_shell": mac_shell,
    "read_file": read_file,
    "write_file": write_file,
    "list_files": list_files,
    "get_system_info": get_system_info,
    "set_reminder": set_reminder,
    "calculate": calculate,
    "blender_run_script": blender_run_script,
    "blender_render": blender_render,
}


async def execute_tool(name: str, args: dict) -> Any:
    """Exécute un outil par son nom."""
    fn = TOOL_MAP.get(name)
    if not fn:
        return f"Outil inconnu : {name}"
    try:
        return await fn(**args)
    except TypeError as e:
        return f"Erreur d'arguments pour {name} : {e}"
    except Exception as e:
        return f"Erreur dans {name} : {e}"
