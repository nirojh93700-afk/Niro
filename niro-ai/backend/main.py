"""
NIRO — Assistant IA Personnel
Backend FastAPI + Ollama + Outils + Sécurité (PIN + sessions)
"""

import asyncio
import json
import os
import secrets
import hashlib
import subprocess
import base64
import tempfile
import time
from pathlib import Path
from typing import Optional
import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Response, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from tools import execute_tool, TOOLS_DEFINITIONS
from memory import load_memory, memory_to_prompt, execute_memory_tool, MEMORY_TOOL_DEFINITION

# ── Sécurité ────────────────────────────────────────────────────────────────

CONFIG_DIR = Path.home() / ".niro"
CONFIG_DIR.mkdir(exist_ok=True)
PIN_FILE = CONFIG_DIR / "pin.hash"
SESSION_FILE = CONFIG_DIR / "sessions.json"

def _load_sessions() -> dict:
    try:
        return json.loads(SESSION_FILE.read_text())
    except Exception:
        return {}

def _save_sessions(sessions: dict):
    SESSION_FILE.write_text(json.dumps(sessions))

def get_pin_hash() -> Optional[str]:
    try:
        return PIN_FILE.read_text().strip()
    except Exception:
        return None

def set_pin(pin: str):
    h = hashlib.sha256(pin.encode()).hexdigest()
    PIN_FILE.write_text(h)
    PIN_FILE.chmod(0o600)

def check_pin(pin: str) -> bool:
    stored = get_pin_hash()
    if not stored:
        return False
    return hashlib.sha256(pin.encode()).hexdigest() == stored

def create_session() -> str:
    token = secrets.token_urlsafe(32)
    sessions = _load_sessions()
    sessions[token] = {"created": time.time(), "last_used": time.time()}
    _save_sessions(sessions)
    return token

def is_valid_session(token: str) -> bool:
    if not token:
        return False
    sessions = _load_sessions()
    if token not in sessions:
        return False
    # Session valide 30 jours
    s = sessions[token]
    if time.time() - s["created"] > 30 * 86400:
        del sessions[token]
        _save_sessions(sessions)
        return False
    # Mettre à jour last_used
    sessions[token]["last_used"] = time.time()
    _save_sessions(sessions)
    return True

def revoke_all_sessions():
    _save_sessions({})

def get_session_token(request: Request) -> Optional[str]:
    # Chercher dans le cookie ou le header Authorization
    token = request.cookies.get("niro_session")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    return token

def require_auth(request: Request):
    """Lève une exception si non authentifié."""
    token = get_session_token(request)
    if not is_valid_session(token):
        raise HTTPException(status_code=401, detail="Non authentifié")

# Si aucun PIN n'est configuré, en créer un par défaut au démarrage
def ensure_pin():
    if not get_pin_hash():
        default_pin = "".join([str(secrets.randbelow(10)) for _ in range(6)])
        set_pin(default_pin)
        print(f"\n{'═'*50}")
        print(f"  🔐 NIRO — CODE PIN : {default_pin}")
        print(f"  Utilisez ce code pour vous connecter.")
        print(f"  Changeable dans Réglages → Sécurité")
        print(f"{'═'*50}\n")
        return default_pin
    return None

# ── Rate limiting (anti-brute-force) ────────────────────────────────────────
_attempts: dict = {}   # ip → {count, first_attempt}
MAX_ATTEMPTS = 5
LOCKOUT_SECONDS = 300  # 5 minutes

def check_rate_limit(ip: str) -> bool:
    """Retourne False si l'IP est bloquée."""
    now = time.time()
    a = _attempts.get(ip, {"count": 0, "first": now})
    if now - a["first"] > LOCKOUT_SECONDS:
        _attempts[ip] = {"count": 0, "first": now}
        return True
    if a["count"] >= MAX_ATTEMPTS:
        return False
    return True

def record_attempt(ip: str, success: bool):
    now = time.time()
    if success:
        _attempts.pop(ip, None)
        return
    a = _attempts.get(ip, {"count": 0, "first": now})
    a["count"] += 1
    _attempts[ip] = a

# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="NIRO AI")

# CORS — restreint aux origines locales (pas wildcard en prod)
ALLOWED_ORIGINS = [
    "http://localhost:7777",
    "http://niro.local:7777",
]
# Ajouter l'IP locale si disponible
_local_ip = os.getenv("NIRO_LOCAL_IP", "")
if _local_ip:
    ALLOWED_ORIGINS.append(f"http://{_local_ip}:7777")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
OLLAMA_BASE = os.getenv("OLLAMA_HOST", "http://localhost:11434")

PREFERRED_MODELS = [
    "qwen2.5:72b", "llama3.3:70b", "qwen2.5:32b",
    "mistral-large:latest", "qwen2.5:14b", "llama3.1:8b",
]

BASE_SYSTEM_PROMPT = """Tu es NIRO, l'assistant IA personnel de Nirojh. Tu es intelligent, polyvalent, réactif et tu parles en français naturellement — comme un vrai collaborateur de confiance, pas un robot.

Tu as accès à des outils puissants : naviguer sur internet, analyser des images et des vidéos, envoyer des emails, surveiller la boutique nivcreation.fr, contrôler le Mac, gérer des fichiers, diagnostiquer des problèmes.

Tu as aussi une MÉMOIRE PERSISTANTE. Quand tu apprends quelque chose d'important sur Nirojh (préférences, habitudes, projets, infos personnelles), utilise l'outil save_to_memory pour le mémoriser. Cette info sera disponible dans toutes les conversations futures.

Règles de comportement :
- Tu réponds de façon directe, concise, naturelle. Pas de formules robotiques.
- Quand tu utilises un outil, tu l'exécutes PUIS tu résumes le résultat clairement.
- Si quelque chose n'est pas clair, tu poses UNE question précise.
- Tu peux tout faire : technique, créatif, analyse, action, recherche.
- Tu connais la boutique nivcreation.fr (gravure personnalisée, artisanat français).
- Si on te montre une photo d'un objet/problème, tu analyses et tu expliques ce que tu vois.
- Tu ne refuses pas les demandes légitimes. Tu trouves toujours un moyen.
- Mémorise proactivement les infos utiles sans attendre qu'on te le demande."""


def build_system_prompt() -> str:
    memory = load_memory()
    memory_text = memory_to_prompt(memory)
    if memory_text:
        return BASE_SYSTEM_PROMPT + "\n\n" + memory_text
    return BASE_SYSTEM_PROMPT

# Clients WebSocket connectés
connected_clients: set = set()

# ── Helpers Ollama ────────────────────────────────────────────────────────────

async def get_best_model() -> str:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"{OLLAMA_BASE}/api/tags")
            if r.status_code == 200:
                installed = {m["name"] for m in r.json().get("models", [])}
                for model in PREFERRED_MODELS:
                    if model in installed:
                        return model
                if installed:
                    return next(iter(installed))
    except Exception:
        pass
    return PREFERRED_MODELS[0]

async def speak(text: str):
    clean = text.replace("*", "").replace("#", "").replace("`", "").replace("_", " ")
    if len(clean) > 500:
        clean = clean[:497] + "..."
    subprocess.Popen(["say", "-v", "Thomas", "-r", "180", clean],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

async def chat_with_ollama(messages: list, model: str, ws: WebSocket):
    current_messages = list(messages)
    for _ in range(10):
        payload = {
            "model": model,
            "messages": current_messages,
            "tools": TOOLS_DEFINITIONS + [MEMORY_TOOL_DEFINITION],
            "stream": True,
            "options": {"temperature": 0.7, "num_ctx": 8192},
        }
        tool_calls_buffer = []
        content_buffer = ""

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", f"{OLLAMA_BASE}/api/chat", json=payload) as response:
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    msg = chunk.get("message", {})
                    content_piece = msg.get("content", "")
                    if content_piece:
                        content_buffer += content_piece
                        await ws.send_json({"type": "token", "content": content_piece})
                    tool_calls = msg.get("tool_calls", [])
                    if tool_calls:
                        tool_calls_buffer.extend(tool_calls)
                    if chunk.get("done", False):
                        break

        if not tool_calls_buffer:
            await ws.send_json({"type": "done", "content": content_buffer})
            if content_buffer.strip():
                await speak(content_buffer)
            return content_buffer

        current_messages.append({
            "role": "assistant",
            "content": content_buffer,
            "tool_calls": tool_calls_buffer,
        })

        for tc in tool_calls_buffer:
            fn = tc.get("function", {})
            tool_name = fn.get("name", "")
            tool_args = fn.get("arguments", {})
            if isinstance(tool_args, str):
                try:
                    tool_args = json.loads(tool_args)
                except Exception:
                    tool_args = {}
            await ws.send_json({"type": "tool_start", "tool": tool_name, "args": tool_args})
            if tool_name == "save_to_memory":
                result = execute_memory_tool(tool_args)
            else:
                result = await execute_tool(tool_name, tool_args)
            await ws.send_json({"type": "tool_done", "tool": tool_name, "result": str(result)[:500]})
            current_messages.append({"role": "tool", "content": str(result)})

    await ws.send_json({"type": "done", "content": "Limite d'itérations atteinte."})

# ── Routes statiques (toujours accessibles) ───────────────────────────────────

@app.get("/manifest.json")
async def manifest():
    return FileResponse(str(FRONTEND_DIR / "manifest.json"))

@app.get("/sw.js")
async def service_worker():
    return FileResponse(str(FRONTEND_DIR / "sw.js"), media_type="application/javascript")

@app.get("/offline.html")
async def offline():
    return FileResponse(str(FRONTEND_DIR / "offline.html"))

@app.get("/icons/{name}")
async def icon(name: str):
    p = FRONTEND_DIR / "icons" / name
    if not p.exists() or not p.suffix in ('.png', '.ico', '.svg'):
        raise HTTPException(404)
    return FileResponse(str(p))

# ── Authentification ──────────────────────────────────────────────────────────

@app.get("/login")
async def login_page():
    return FileResponse(str(FRONTEND_DIR / "login.html"))

@app.post("/api/auth/login")
async def login(request: Request, response: Response):
    ip = request.client.host
    if not check_rate_limit(ip):
        remaining = int(LOCKOUT_SECONDS - (time.time() - _attempts.get(ip, {}).get("first", 0)))
        raise HTTPException(429, f"Trop de tentatives. Réessayez dans {remaining//60} min.")

    body = await request.json()
    pin = str(body.get("pin", "")).strip()

    if not check_pin(pin):
        record_attempt(ip, success=False)
        attempts_left = MAX_ATTEMPTS - _attempts.get(ip, {}).get("count", 0)
        raise HTTPException(401, f"Code PIN incorrect. {attempts_left} tentative(s) restante(s).")

    record_attempt(ip, success=True)
    token = create_session()
    response.set_cookie(
        key="niro_session",
        value=token,
        max_age=30 * 86400,
        httponly=True,
        samesite="strict",
    )
    return {"ok": True, "token": token}

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    token = get_session_token(request)
    if token:
        sessions = _load_sessions()
        sessions.pop(token, None)
        _save_sessions(sessions)
    response.delete_cookie("niro_session")
    return {"ok": True}

@app.post("/api/auth/change-pin")
async def change_pin(request: Request):
    require_auth(request)
    body = await request.json()
    old_pin = str(body.get("old_pin", "")).strip()
    new_pin = str(body.get("new_pin", "")).strip()
    if not check_pin(old_pin):
        raise HTTPException(401, "Ancien PIN incorrect.")
    if len(new_pin) < 4:
        raise HTTPException(400, "Le nouveau PIN doit faire au moins 4 chiffres.")
    set_pin(new_pin)
    revoke_all_sessions()
    return {"ok": True, "message": "PIN changé. Reconnectez-vous sur tous vos appareils."}

@app.get("/api/auth/check")
async def auth_check(request: Request):
    token = get_session_token(request)
    return {"authenticated": is_valid_session(token)}

# ── Routes protégées ──────────────────────────────────────────────────────────

@app.get("/")
async def root(request: Request):
    token = get_session_token(request)
    if not is_valid_session(token):
        return FileResponse(str(FRONTEND_DIR / "login.html"))
    return FileResponse(str(FRONTEND_DIR / "index.html"))

@app.get("/api/status")
async def status(request: Request):
    require_auth(request)
    model = await get_best_model()
    local_ip = os.getenv("NIRO_LOCAL_IP", "")
    port = os.getenv("NIRO_PORT", "7777")
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{OLLAMA_BASE}/api/tags")
            ollama_ok = r.status_code == 200
    except Exception:
        ollama_ok = False
    return {
        "status": "ok",
        "model": model,
        "ollama": ollama_ok,
        "local_ip": local_ip,
        "port": port,
        "network_url": f"http://{local_ip}:{port}" if local_ip else None,
    }

@app.get("/api/clients")
async def clients_count(request: Request):
    require_auth(request)
    return {"count": len(connected_clients)}

@app.get("/api/memory")
async def get_memory(request: Request):
    require_auth(request)
    return load_memory()

@app.post("/api/memory/fact")
async def add_memory_fact(request: Request):
    require_auth(request)
    body = await request.json()
    content = body.get("content", "").strip()
    if not content:
        raise HTTPException(400, "Contenu vide")
    from memory import add_fact
    add_fact(content)
    return {"ok": True}

@app.delete("/api/memory/fact")
async def delete_memory_fact(request: Request):
    require_auth(request)
    body = await request.json()
    content = body.get("content", "").strip()
    mem = load_memory()
    mem["facts"] = [f for f in mem.get("facts", []) if f["content"] != content]
    from memory import save_memory
    save_memory(mem)
    return {"ok": True}

@app.get("/api/qr")
async def qr_code(request: Request):
    require_auth(request)
    local_ip = os.getenv("NIRO_LOCAL_IP", "")
    port = os.getenv("NIRO_PORT", "7777")
    url = f"http://{local_ip}:{port}" if local_ip else f"http://niro.local:{port}"
    return {"url": url}

# ── WebSocket (protégé par token en query param) ──────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = ""):
    # Vérifier l'authentification avant d'accepter
    if not is_valid_session(token):
        await ws.close(code=4401, reason="Non authentifié")
        return

    await ws.accept()
    connected_clients.add(id(ws))
    model = await get_best_model()
    await ws.send_json({"type": "init", "model": model})

    conversation: list = [{"role": "system", "content": build_system_prompt()}]

    try:
        while True:
            data = await ws.receive_json()
            msg_type = data.get("type", "message")

            if msg_type == "message":
                user_text = data.get("content", "").strip()
                if not user_text:
                    continue
                conversation.append({"role": "user", "content": user_text})
                await ws.send_json({"type": "thinking"})
                try:
                    response = await chat_with_ollama(conversation, model, ws)
                    if response:
                        conversation.append({"role": "assistant", "content": response})
                except Exception as e:
                    await ws.send_json({"type": "error", "content": f"Erreur : {str(e)}"})

            elif msg_type == "image":
                image_data = data.get("data", "")
                question = data.get("question", "Qu\'est-ce que tu vois sur cette image ?")
                tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
                tmp.write(base64.b64decode(image_data))
                tmp.close()
                conversation.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": question},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
                    ]
                })
                await ws.send_json({"type": "thinking"})
                try:
                    response = await chat_with_ollama(conversation, model, ws)
                    if response:
                        conversation.append({"role": "assistant", "content": response})
                except Exception as e:
                    await ws.send_json({"type": "error", "content": str(e)})
                os.unlink(tmp.name)

            elif msg_type == "clear":
                conversation = [{"role": "system", "content": build_system_prompt()}]
                await ws.send_json({"type": "cleared"})

            elif msg_type == "stop_voice":
                subprocess.run(["killall", "say"], capture_output=True)

    except WebSocketDisconnect:
        pass
    finally:
        connected_clients.discard(id(ws))


if __name__ == "__main__":
    ensure_pin()
    uvicorn.run("main:app", host="0.0.0.0", port=7777, reload=False)
