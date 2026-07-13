"""
Jarvis — Mémoire persistante
Sauvegarde automatiquement ce que Jarvis apprend sur l'utilisateur.
"""

import json
import time
from pathlib import Path

MEMORY_FILE = Path.home() / ".niro" / "memory.json"

DEFAULT_MEMORY = {
    "user": {
        "name": "Nirojh",
        "preferences": [],
        "dislikes": [],
        "routines": [],
        "projects": [],
        "important_info": [],
    },
    "facts": [],
    "last_updated": None,
}


def load_memory() -> dict:
    try:
        data = json.loads(MEMORY_FILE.read_text())
        for key, val in DEFAULT_MEMORY.items():
            if key not in data:
                data[key] = val
            elif isinstance(val, dict) and isinstance(data[key], dict):
                for subkey, subval in val.items():
                    if subkey not in data[key]:
                        data[key][subkey] = subval
        return data
    except Exception:
        return dict(DEFAULT_MEMORY)


def save_memory(memory: dict):
    memory["last_updated"] = time.strftime("%Y-%m-%d %H:%M")
    MEMORY_FILE.write_text(json.dumps(memory, ensure_ascii=False, indent=2))
    MEMORY_FILE.chmod(0o600)


def memory_to_prompt(memory: dict) -> str:
    """Convertit la mémoire en texte pour le system prompt."""
    lines = ["## Ce que tu sais sur Nirojh (mémoire persistante) :"]

    user = memory.get("user", {})
    if user.get("preferences"):
        lines.append("Préférences : " + ", ".join(user["preferences"]))
    if user.get("dislikes"):
        lines.append("N'aime pas : " + ", ".join(user["dislikes"]))
    if user.get("routines"):
        lines.append("Routines : " + " | ".join(user["routines"]))
    if user.get("projects"):
        lines.append("Projets en cours : " + " | ".join(user["projects"]))
    if user.get("important_info"):
        lines.append("Infos importantes : " + " | ".join(user["important_info"]))

    facts = memory.get("facts", [])
    if facts:
        recent = facts[-20:]  # Les 20 derniers faits
        lines.append("Faits mémorisés :")
        for f in recent:
            # Robuste : un fait mal formé ne doit jamais faire crasher la connexion
            if isinstance(f, dict):
                lines.append(f"  - {f.get('content', '?')} (mémorisé le {f.get('date', '?')})")
            else:
                lines.append(f"  - {f}")

    if len(lines) == 1:
        return ""
    return "\n".join(lines)


def add_fact(content: str):
    """Ajoute un fait à la mémoire."""
    memory = load_memory()
    facts = memory.get("facts", [])
    # Éviter les doublons exacts
    existing = [f["content"] for f in facts]
    if content not in existing:
        facts.append({"content": content, "date": time.strftime("%d/%m/%Y")})
        memory["facts"] = facts[-200:]  # Garder les 200 derniers max
        save_memory(memory)


def update_user_info(field: str, value: str, action: str = "add"):
    """Met à jour les infos utilisateur (préférences, projets, etc.)"""
    memory = load_memory()
    user = memory.get("user", {})
    if field not in user:
        return
    if isinstance(user[field], list):
        if action == "add" and value not in user[field]:
            user[field].append(value)
        elif action == "remove" and value in user[field]:
            user[field].remove(value)
    else:
        user[field] = value
    memory["user"] = user
    save_memory(memory)


MEMORY_TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "save_to_memory",
        "description": "Sauvegarde une information importante dans la mémoire persistante de Jarvis. Utilise cet outil quand tu apprends quelque chose d'important sur Nirojh : préférences, habitudes, projets, infos personnelles, décisions prises. Cette information sera disponible dans toutes les conversations futures.",
        "parameters": {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                    "enum": ["fact", "preference", "dislike", "routine", "project", "important_info"],
                    "description": "Type d'information : fact (fait général), preference (ce qu'il aime), dislike (ce qu'il n'aime pas), routine (habitude régulière), project (projet en cours), important_info (info critique à retenir)"
                },
                "content": {
                    "type": "string",
                    "description": "L'information à mémoriser, formulée clairement et concisément."
                }
            },
            "required": ["type", "content"]
        }
    }
}


def execute_memory_tool(args: dict) -> str:
    info_type = args.get("type", "fact")
    content = args.get("content", "").strip()
    if not content:
        return "Erreur : contenu vide."

    if info_type == "fact":
        add_fact(content)
    elif info_type in ("preference", "dislike", "routine", "project", "important_info"):
        field_map = {
            "preference": "preferences",
            "dislike": "dislikes",
            "routine": "routines",
            "project": "projects",
            "important_info": "important_info",
        }
        update_user_info(field_map[info_type], content)
    else:
        add_fact(content)

    return f"Mémorisé : {content}"
