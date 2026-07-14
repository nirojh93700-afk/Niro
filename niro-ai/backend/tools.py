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
            "name": "read_emails",
            "description": "Lit les derniers emails REÇUS dans les boîtes mail de Nirojh (boutique et perso). Utilise cet outil quand on te demande de lire, consulter, vérifier ou résumer les emails/mails reçus.",
            "parameters": {
                "type": "object",
                "properties": {
                    "count": {"type": "integer", "description": "Nombre d'emails à lire (défaut 5, max 15)"},
                    "account": {"type": "string", "description": "Filtrer sur une boîte précise (ex: 'boutique', 'perso', ou une adresse). Vide = toutes les boîtes."},
                    "unread_only": {"type": "boolean", "description": "Si true, seulement les emails non lus"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Envoie un email. N'utilise QUE si Nirojh donne une vraie adresse de destinataire.",
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
    {
        "type": "function",
        "function": {
            "name": "generate_image",
            "description": "Génère une image à partir d'une description texte (gratuit). Utilise pour créer une illustration, un visuel, une image de produit, un dessin. Renvoie l'URL de l'image — INCLUS cette URL dans ta réponse pour qu'elle s'affiche.",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "Description détaillée de l'image à générer (en anglais de préférence pour un meilleur résultat)"},
                    "save": {"type": "boolean", "description": "Si true, télécharge aussi l'image dans le dossier Images du Mac"}
                },
                "required": ["prompt"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "download_file",
            "description": "Télécharge un fichier depuis une URL vers le dossier Téléchargements du Mac. Utilise quand Nirojh demande de télécharger quelque chose.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "URL complète du fichier à télécharger"},
                    "filename": {"type": "string", "description": "Nom du fichier (optionnel)"}
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calendar_add",
            "description": "Ajoute un événement au calendrier du Mac (app Calendrier/Agenda). Utilise pour noter un rendez-vous, une réunion, une tâche datée.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Titre de l'événement"},
                    "date": {"type": "string", "description": "Date et heure de début, format 'YYYY-MM-DD HH:MM'"},
                    "duration_min": {"type": "integer", "description": "Durée en minutes (défaut 60)"},
                    "notes": {"type": "string", "description": "Notes (optionnel)"}
                },
                "required": ["title", "date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calendar_list",
            "description": "Liste les prochains événements du calendrier du Mac.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Nombre de jours à venir à afficher (défaut 7)"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "play_music",
            "description": "Joue de la musique sur le Mac (app Musique/Apple Music, ou Spotify). Utilise pour lancer une chanson, un artiste, une playlist, ou mettre en pause.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Ce qu'il faut jouer (artiste, chanson, playlist), ou 'pause'/'play'/'suivant'/'précédent'"},
                    "app": {"type": "string", "enum": ["music", "spotify"], "description": "Application à utiliser (défaut music = Apple Music)"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_news",
            "description": "Récupère les dernières actualités (titres du jour). Utilise pour donner les infos, l'actualité, les news.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "Sujet (optionnel : 'france', 'monde', 'tech', 'sport'…). Vide = actualités générales."},
                    "count": {"type": "integer", "description": "Nombre de titres (défaut 6)"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "open_app",
            "description": "Ouvre une application ou un site web sur le Mac. Utilise pour lancer une app (Safari, Notes, Photos…) ou ouvrir un site.",
            "parameters": {
                "type": "object",
                "properties": {
                    "target": {"type": "string", "description": "Nom de l'app (ex: 'Safari', 'Notes') OU une URL de site (ex: 'https://youtube.com')"}
                },
                "required": ["target"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_document",
            "description": "Lit et résume le contenu d'un document (PDF, texte, Word) présent sur le Mac.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Chemin complet du fichier"}
                },
                "required": ["path"]
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


async def read_emails(count: int = 5, account: str = "", unread_only: bool = False) -> str:
    """Lit les derniers emails reçus via IMAP (comptes dans ~/.niro/email_accounts.json)."""
    import imaplib, email as email_mod
    from email.header import decode_header

    config_path = Path.home() / ".niro" / "email_accounts.json"
    if not config_path.exists():
        return ("Aucune boîte mail connectée. Créez ~/.niro/email_accounts.json avec la liste des comptes "
                "(user, password = mot de passe d'application Gmail, imap).")
    try:
        accounts = json.loads(config_path.read_text())
    except Exception as e:
        return f"Erreur lecture config email : {e}"
    if isinstance(accounts, dict):
        accounts = [accounts]

    def _decode(s):
        if not s:
            return ""
        parts = decode_header(s)
        out = ""
        for txt, enc in parts:
            if isinstance(txt, bytes):
                try: out += txt.decode(enc or "utf-8", errors="replace")
                except Exception: out += txt.decode("utf-8", errors="replace")
            else:
                out += txt
        return out

    count = max(1, min(int(count), 15))
    results = []
    for acc in accounts:
        name = acc.get("name", acc.get("user", "?"))
        if account and account.lower() not in name.lower() and account.lower() not in acc.get("user", "").lower():
            continue
        try:
            M = imaplib.IMAP4_SSL(acc.get("imap", "imap.gmail.com"))
            M.login(acc["user"], acc["password"])
            M.select("INBOX")
            crit = "UNSEEN" if unread_only else "ALL"
            typ, data = M.search(None, crit)
            ids = data[0].split()
            latest = ids[-count:][::-1]
            results.append(f"── Boîte {name} ({len(ids)} messages, {len(latest)} affichés) ──")
            for i in latest:
                typ, msg_data = M.fetch(i, "(RFC822.HEADER)")
                msg = email_mod.message_from_bytes(msg_data[0][1])
                frm = _decode(msg.get("From", ""))
                subj = _decode(msg.get("Subject", "(sans objet)"))
                date = msg.get("Date", "")
                results.append(f"• De : {frm}\n  Objet : {subj}\n  Date : {date}")
            M.logout()
        except Exception as e:
            results.append(f"── Boîte {name} : erreur de connexion ({e}) ──")
    return "\n".join(results) if results else "Aucun email trouvé."


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


async def generate_image(prompt: str, save: bool = False) -> str:
    """Génère une image via Pollinations (gratuit, sans clé)."""
    from urllib.parse import quote
    seed = abs(hash(prompt)) % 100000
    url = f"https://image.pollinations.ai/prompt/{quote(prompt)}?width=1024&height=1024&nologo=true&seed={seed}"
    saved_msg = ""
    if save:
        try:
            dest_dir = Path.home() / "Pictures" / "Jarvis"
            dest_dir.mkdir(parents=True, exist_ok=True)
            safe = "".join(c for c in prompt[:40] if c.isalnum() or c in " -_").strip().replace(" ", "_")
            dest = dest_dir / f"{safe or 'image'}_{seed}.jpg"
            async with httpx.AsyncClient(timeout=60.0) as client:
                r = await client.get(url)
                dest.write_bytes(r.content)
            saved_msg = f" (enregistrée dans {dest})"
        except Exception as e:
            saved_msg = f" (échec enregistrement : {e})"
    return f"Image générée{saved_msg}. URL à afficher : {url}"


async def download_file(url: str, filename: str = "") -> str:
    """Télécharge un fichier dans le dossier Téléchargements du Mac."""
    try:
        dest_dir = Path.home() / "Downloads"
        dest_dir.mkdir(parents=True, exist_ok=True)
        if not filename:
            filename = url.split("/")[-1].split("?")[0] or "fichier"
        dest = dest_dir / filename
        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            async with client.stream("GET", url) as r:
                if r.status_code != 200:
                    return f"Échec du téléchargement (code {r.status_code})."
                with open(dest, "wb") as f:
                    async for chunk in r.aiter_bytes():
                        f.write(chunk)
        size = dest.stat().st_size
        return f"✓ Téléchargé : {dest} ({size // 1024} Ko)"
    except Exception as e:
        return f"Erreur téléchargement : {e}"


async def calendar_add(title: str, date: str, duration_min: int = 60, notes: str = "") -> str:
    """Ajoute un événement au calendrier via AppleScript."""
    import datetime
    try:
        dt = datetime.datetime.strptime(date.strip(), "%Y-%m-%d %H:%M")
    except Exception:
        try:
            dt = datetime.datetime.strptime(date.strip(), "%Y-%m-%d")
        except Exception:
            return "Date invalide. Format attendu : AAAA-MM-JJ HH:MM."
    end = dt + datetime.timedelta(minutes=int(duration_min or 60))
    def _as_date(d):
        return (f'(current date) - (get (current date)) + '
                f'(date "{d.day:02d}/{d.month:02d}/{d.year} {d.hour:02d}:{d.minute:02d}:00")')
    safe_title = title.replace('"', '\\"')
    safe_notes = (notes or "").replace('"', '\\"')
    script = f'''
    set startDate to (current date)
    set year of startDate to {dt.year}
    set month of startDate to {dt.month}
    set day of startDate to {dt.day}
    set hours of startDate to {dt.hour}
    set minutes of startDate to {dt.minute}
    set seconds of startDate to 0
    set endDate to startDate + ({int(duration_min or 60)} * minutes)
    tell application "Calendar"
      tell calendar 1
        make new event with properties {{summary:"{safe_title}", start date:startDate, end date:endDate, description:"{safe_notes}"}}
      end tell
    end tell
    return "ok"
    '''
    try:
        r = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=20)
        if r.returncode == 0:
            return f"✓ Événement ajouté au calendrier : « {title} » le {dt.strftime('%d/%m/%Y à %H:%M')}."
        return f"Erreur calendrier : {r.stderr.strip()}"
    except Exception as e:
        return f"Erreur : {e}"


async def calendar_list(days: int = 7) -> str:
    """Liste les événements à venir via AppleScript."""
    script = f'''
    set output to ""
    set today to current date
    set laterDate to today + ({int(days or 7)} * days)
    tell application "Calendar"
      repeat with cal in calendars
        set evts to (every event of cal whose start date ≥ today and start date ≤ laterDate)
        repeat with e in evts
          set output to output & (summary of e) & " — " & (start date of e as string) & linefeed
        end repeat
      end repeat
    end tell
    return output
    '''
    try:
        r = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=25)
        if r.returncode == 0:
            out = r.stdout.strip()
            return f"Événements des {days} prochains jours :\n{out}" if out else "Aucun événement à venir."
        return f"Erreur calendrier : {r.stderr.strip()}"
    except Exception as e:
        return f"Erreur : {e}"


async def play_music(query: str, app: str = "music") -> str:
    """Contrôle la musique via AppleScript (Apple Music ou Spotify)."""
    q = query.strip().lower()
    app_name = "Spotify" if app == "spotify" else "Music"
    controls = {
        "pause": "pause", "stop": "pause", "play": "play", "lecture": "play",
        "suivant": "next track", "next": "next track",
        "précédent": "previous track", "precedent": "previous track", "previous": "previous track",
    }
    try:
        if q in controls:
            script = f'tell application "{app_name}" to {controls[q]}'
        else:
            safe = query.replace('"', '\\"')
            if app == "spotify":
                script = f'tell application "Spotify" to play'
            else:
                script = f'''
                tell application "Music"
                  set results to (every track whose name contains "{safe}" or artist contains "{safe}")
                  if results is not {{}} then
                    play item 1 of results
                    return "Lecture : " & (name of item 1 of results) & " — " & (artist of item 1 of results)
                  else
                    return "Rien trouvé pour {safe} dans la bibliothèque."
                  end if
                end tell
                '''
        r = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=20)
        if r.returncode == 0:
            return r.stdout.strip() or f"✓ {app_name} : {query}"
        return f"Erreur musique : {r.stderr.strip()}"
    except Exception as e:
        return f"Erreur : {e}"


async def get_news(topic: str = "", count: int = 6) -> str:
    """Récupère les actualités via le flux RSS Google Actualités (gratuit)."""
    from urllib.parse import quote_plus
    import re as _re
    try:
        if topic:
            url = f"https://news.google.com/rss/search?q={quote_plus(topic)}&hl=fr&gl=FR&ceid=FR:fr"
        else:
            url = "https://news.google.com/rss?hl=fr&gl=FR&ceid=FR:fr"
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
            r = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
        # On ne prend que les titres des <item> (pas le titre du flux lui-même)
        items = _re.findall(r"<item>(.*?)</item>", r.text, _re.DOTALL)
        titles = []
        for it in items:
            m = _re.search(r"<title>(.*?)</title>", it, _re.DOTALL)
            if m:
                t = m.group(1).replace("<![CDATA[", "").replace("]]>", "").strip()
                if t and "Google Actualités" not in t:
                    titles.append(t)
        titles = titles[:int(count or 6)]
        if not titles:
            return "Aucune actualité trouvée."
        head = f"Actualités{' — ' + topic if topic else ''} :"
        return head + "\n" + "\n".join(f"• {t}" for t in titles)
    except Exception as e:
        return f"Erreur actualités : {e}"


async def open_app(target: str) -> str:
    """Ouvre une app ou un site web sur le Mac."""
    try:
        t = target.strip()
        if t.startswith("http://") or t.startswith("https://") or "." in t.split()[0]:
            url = t if t.startswith("http") else "https://" + t
            subprocess.run(["open", url], timeout=10)
            return f"✓ Ouvert : {url}"
        else:
            r = subprocess.run(["open", "-a", t], capture_output=True, text=True, timeout=10)
            if r.returncode == 0:
                return f"✓ Application ouverte : {t}"
            return f"Impossible d'ouvrir « {t} » : {r.stderr.strip()}"
    except Exception as e:
        return f"Erreur : {e}"


async def read_document(path: str) -> str:
    """Lit un document (PDF, texte, Word) et retourne son contenu."""
    try:
        p = Path(path).expanduser()
        if not p.exists():
            return f"Fichier introuvable : {path}"
        suffix = p.suffix.lower()
        if suffix == ".pdf":
            # Extraire le texte du PDF via pdftotext (souvent présent) sinon fallback
            try:
                r = subprocess.run(["pdftotext", str(p), "-"], capture_output=True, text=True, timeout=30)
                text = r.stdout
            except FileNotFoundError:
                try:
                    from pypdf import PdfReader
                    text = "\n".join((pg.extract_text() or "") for pg in PdfReader(str(p)).pages)
                except Exception:
                    return "Pour lire les PDF, installez l'outil : brew install poppler (ou pip install pypdf)."
        elif suffix in (".txt", ".md", ".csv", ".json", ".log"):
            text = p.read_text(encoding="utf-8", errors="replace")
        elif suffix in (".docx",):
            try:
                import zipfile, re as _re
                with zipfile.ZipFile(str(p)) as z:
                    xml = z.read("word/document.xml").decode("utf-8", "replace")
                text = _re.sub(r"<[^>]+>", " ", xml.replace("</w:p>", "\n"))
            except Exception as e:
                return f"Impossible de lire ce Word : {e}"
        else:
            return f"Type de fichier non pris en charge : {suffix}"
        text = text.strip()
        if not text:
            return "Le document semble vide ou illisible (peut-être scanné/image)."
        return f"Contenu de {p.name} ({len(text)} caractères) :\n\n{text[:6000]}"
    except Exception as e:
        return f"Erreur lecture document : {e}"


# ─── Dispatcher ─────────────────────────────────────────────────────────────

TOOL_MAP = {
    "browse_url": browse_url,
    "search_web": search_web,
    "get_weather": get_weather,
    "take_screenshot": take_screenshot,
    "check_boutique": check_boutique,
    "read_emails": read_emails,
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
    "generate_image": generate_image,
    "download_file": download_file,
    "calendar_add": calendar_add,
    "calendar_list": calendar_list,
    "play_music": play_music,
    "get_news": get_news,
    "open_app": open_app,
    "read_document": read_document,
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
