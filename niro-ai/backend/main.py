"""
NIRO — Assistant IA Personnel
Backend FastAPI + Ollama + Outils
"""

import asyncio
import json
import os
import subprocess
import base64
import tempfile
from pathlib import Path
from typing import Optional
import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

from tools import execute_tool, TOOLS_DEFINITIONS

app = FastAPI(title="NIRO AI")

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

OLLAMA_BASE = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Modèles par ordre de préférence (selon ce qui est installé)
PREFERRED_MODELS = [
    "qwen2.5:72b",
    "llama3.3:70b",
    "qwen2.5:32b",
    "mistral-large:latest",
    "qwen2.5:14b",
    "llama3.1:8b",
]

SYSTEM_PROMPT = """Tu es NIRO, l'assistant IA personnel de Nirojh. Tu es intelligent, polyvalent, réactif et tu parles en français naturellement — comme un vrai collaborateur de confiance, pas un robot.

Tu as accès à des outils puissants : naviguer sur internet, analyser des images et des vidéos, envoyer des emails, surveiller la boutique nivcreation.fr, contrôler le Mac, gérer des fichiers, diagnostiquer des problèmes.

Règles de comportement :
- Tu réponds de façon directe, concise, naturelle. Pas de formules robotiques.
- Quand tu utilises un outil, tu l'exécutes PUIS tu résumes le résultat clairement.
- Si quelque chose n'est pas clair, tu poses UNE question précise.
- Tu peux tout faire : technique, créatif, analyse, action, recherche.
- Tu connais la boutique nivcreation.fr (gravure personnalisée, artisanat français).
- Si on te montre une photo d'un objet/problème, tu analyses et tu expliques ce que tu vois.
- Tu ne refuses pas les demandes légitimes. Tu trouves toujours un moyen."""


async def get_best_model() -> str:
    """Retourne le meilleur modèle disponible dans Ollama."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"{OLLAMA_BASE}/api/tags")
            if r.status_code == 200:
                installed = {m["name"] for m in r.json().get("models", [])}
                for model in PREFERRED_MODELS:
                    if model in installed:
                        return model
                # Si aucun préféré, prendre le premier disponible
                if installed:
                    return next(iter(installed))
    except Exception:
        pass
    return PREFERRED_MODELS[0]


async def speak(text: str):
    """Voix Mac (Thomas = voix française naturelle)."""
    # Nettoyage du texte pour la synthèse
    clean = text.replace("*", "").replace("#", "").replace("`", "").replace("_", " ")
    # Limiter à 500 chars pour la fluidité
    if len(clean) > 500:
        clean = clean[:497] + "..."
    subprocess.Popen(
        ["say", "-v", "Thomas", "-r", "180", clean],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


async def chat_with_ollama(messages: list, model: str, ws: WebSocket):
    """
    Boucle agentique : Ollama → outils → Ollama → réponse finale.
    Stream les tokens vers le WebSocket en temps réel.
    """
    current_messages = list(messages)
    max_iterations = 10

    for iteration in range(max_iterations):
        # Appel Ollama avec streaming
        payload = {
            "model": model,
            "messages": current_messages,
            "tools": TOOLS_DEFINITIONS,
            "stream": True,
            "options": {
                "temperature": 0.7,
                "num_ctx": 8192,
            }
        }

        tool_calls_buffer = []
        content_buffer = ""
        current_tool_call = None

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_BASE}/api/chat",
                json=payload,
            ) as response:

                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    msg = chunk.get("message", {})
                    done = chunk.get("done", False)

                    # Contenu texte → stream vers le client
                    content_piece = msg.get("content", "")
                    if content_piece:
                        content_buffer += content_piece
                        await ws.send_json({
                            "type": "token",
                            "content": content_piece
                        })

                    # Appels d'outils
                    tool_calls = msg.get("tool_calls", [])
                    if tool_calls:
                        tool_calls_buffer.extend(tool_calls)

                    if done:
                        break

        # Pas d'appels d'outils → réponse finale
        if not tool_calls_buffer:
            await ws.send_json({"type": "done", "content": content_buffer})
            # Voix
            if content_buffer.strip():
                await speak(content_buffer)
            return content_buffer

        # Il y a des appels d'outils → les exécuter
        # Ajouter le message assistant avec les tool_calls
        current_messages.append({
            "role": "assistant",
            "content": content_buffer,
            "tool_calls": tool_calls_buffer
        })

        # Exécuter chaque outil
        for tc in tool_calls_buffer:
            fn = tc.get("function", {})
            tool_name = fn.get("name", "")
            tool_args = fn.get("arguments", {})
            if isinstance(tool_args, str):
                try:
                    tool_args = json.loads(tool_args)
                except Exception:
                    tool_args = {}

            # Notifier l'UI de l'outil en cours
            await ws.send_json({
                "type": "tool_start",
                "tool": tool_name,
                "args": tool_args
            })

            # Exécuter l'outil
            result = await execute_tool(tool_name, tool_args)

            await ws.send_json({
                "type": "tool_done",
                "tool": tool_name,
                "result": str(result)[:500]
            })

            # Ajouter le résultat dans l'historique
            current_messages.append({
                "role": "tool",
                "content": str(result)
            })

    # Sécurité : si on dépasse max_iterations
    await ws.send_json({"type": "done", "content": "J'ai atteint la limite d'itérations."})


@app.get("/")
async def root():
    return FileResponse(str(FRONTEND_DIR / "index.html"))


@app.get("/api/status")
async def status():
    model = await get_best_model()
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{OLLAMA_BASE}/api/tags")
            ollama_ok = r.status_code == 200
    except Exception:
        ollama_ok = False
    return {"status": "ok", "model": model, "ollama": ollama_ok}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    model = await get_best_model()

    # Envoyer le modèle actif au client
    await ws.send_json({"type": "init", "model": model})

    conversation: list = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]

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
                    await ws.send_json({
                        "type": "error",
                        "content": f"Erreur : {str(e)}"
                    })

            elif msg_type == "image":
                # Image envoyée depuis l'UI (base64)
                image_data = data.get("data", "")
                question = data.get("question", "Qu'est-ce que tu vois sur cette image ?")

                # Sauvegarder temporairement
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
                conversation = [{"role": "system", "content": SYSTEM_PROMPT}]
                await ws.send_json({"type": "cleared"})

            elif msg_type == "stop_voice":
                subprocess.run(["killall", "say"], capture_output=True)

    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=7777, reload=False)
