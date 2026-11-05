#!/usr/bin/env python3
"""VERROU D'ENVOI (05/11/2026, après l'envoi du devis DEV-1544 sans l'accord du gérant).

Deux usages :
  verrou-envoi.py message  -> lancé à chaque message du gérant (UserPromptSubmit).
       Ouvre le verrou SEULEMENT si le message est un ordre d'envoi court et clair
       (« envoie », « envoie-le », « oui envoie »…) ; sinon le referme.
  verrou-envoi.py outil    -> lancé avant chaque commande (PreToolUse).
       Toute commande qui envoie quelque chose à un client est BLOQUÉE si le verrou est fermé.
       Après un envoi autorisé, le verrou se referme (un « envoie » = un envoi).
Les envois Gmail (send / reply / forward) sont toujours bloqués : les mails clients passent par le site.
"""
import json, os, re, sys

FLAG = os.path.join(os.environ.get("CLAUDE_PROJECT_DIR", "."), ".claude", ".envoi-autorise")

ENVOIS = [
    r"send-client-email", r"action\W{0,4}:\W{0,4}send", r"/api/reply/", r"/api/admin/scheduled",
    r"/api/admin/bat", r"/api/admin/newsletter", r"envoyer-tous", r"send-now", r"/api/admin/offre-gravure",
    r"/api/admin/restock-alerts", r"/api/admin/refund",
]
ECRIT = re.compile(r"(-X\s*POST|--data|\s-d\s|\s-d['\"@{]|fetch\(|requests\.post|method\W{0,4}POST)", re.I)

def ordre_envoi(texte):
    t = re.sub(r"\s+", " ", (texte or "").strip().lower())
    if not t or len(t) > 60:
        return False
    if re.search(r"\b(pas|rien|jamais|montre|attends|attend|non)\b", t):
        return False
    return bool(re.search(r"\b(envoie|envoies|envoie-le|envoie-la|envoie-les|envoyez|vas-y envoie)\b", t))

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}
    if mode == "message":
        if ordre_envoi(data.get("prompt", "")):
            open(FLAG, "w").write("1")
        elif os.path.exists(FLAG):
            os.remove(FLAG)
        return 0
    if mode == "outil":
        nom = data.get("tool_name", "")
        if re.search(r"mcp__Gmail__(send_message|reply|forward)", nom):
            print("BLOQUÉ : aucun mail client par Gmail, uniquement par le site.", file=sys.stderr)
            return 2
        cmd = (data.get("tool_input") or {}).get("command", "")
        if not cmd or not ECRIT.search(cmd):
            return 0
        if not any(re.search(p, cmd, re.I) for p in ENVOIS):
            return 0
        if os.path.exists(FLAG):
            os.remove(FLAG)  # un « envoie » = un seul envoi
            return 0
        print("BLOQUÉ PAR LE VERROU D'ENVOI : le gérant n'a pas écrit « envoie ». "
              "Montre-lui le mail et attends son « envoie » (message court, sans « pas »/« montre »).", file=sys.stderr)
        return 2
    return 0

sys.exit(main())
