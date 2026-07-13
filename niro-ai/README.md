# NIRO — Assistant IA Personnel (Serveur Central)

Le Mac Studio M4 Max est le **cerveau central**. Tous vos appareils s'y connectent.

```
Mac Studio M4 Max 48Go
        │
        ├── 🖥️ Ce Mac         → http://localhost:7777
        ├── 📱 iPhone          → http://192.168.x.x:7777
        ├── 📱 iPad            → http://192.168.x.x:7777
        └── 💻 MacBook Pro     → http://192.168.x.x:7777
```

---

## Installation (une seule fois sur le Mac Studio)

```bash
cd niro-ai
chmod +x install.sh start.sh
./install.sh
```

Durée : 30-60 min (téléchargement du modèle 70B = 40 Go).

---

## Lancement

```bash
./start.sh
```

Le terminal affiche les URLs d'accès pour chaque appareil.

---

## Accès depuis les autres appareils

### Sur le même WiFi (domicile / bureau)

Ouvrez simplement dans un navigateur :
- **http://niro.local:7777** (si le Mac est allumé)
- ou l'IP affichée au démarrage : **http://192.168.x.x:7777**

Fonctionne sur : iPhone Safari, iPad Safari, MacBook Chrome/Safari, Android Chrome.

### Depuis n'importe où dans le monde (Tailscale)

Tailscale crée un réseau privé entre vos appareils — comme si vous étiez toujours chez vous.

**Sur le Mac Studio :**
```bash
brew install tailscale
sudo tailscale up
```

**Sur chaque autre appareil :**
- iPhone/iPad : App Store → "Tailscale" → Se connecter avec le même compte
- MacBook : brew install tailscale

Une fois connecté, NIRO est accessible via l'IP Tailscale du Mac Studio (affichée dans `./start.sh`).

---

## Ce que NIRO peut faire

| Capacité | Détail |
|----------|--------|
| 💬 Conversation | Réponses naturelles en français, voix Thomas |
| 🌐 Web | Navigue, recherche, résume n'importe quelle page |
| 🛍️ Boutique | Surveille nivcreation.fr, détecte les problèmes |
| 📧 Email | Envoie des emails (après config ~/.niro/email.json) |
| 🖥️ Mac | Contrôle le Mac via AppleScript et Terminal |
| 📁 Fichiers | Lit, écrit, liste, organise |
| 📷 Vision | Analyse les photos que vous lui montrez |
| 💻 Système | CPU, mémoire, disque, réseau, processus |
| ⏰ Rappels | Notifications Mac à l'heure choisie |
| 🔢 Calculs | Maths, finance, conversions |

---

## Architecture technique

```
Mac Studio (serveur)
├── Ollama          → cerveau IA (qwen2.5:72b, 100% local)
├── FastAPI         → serveur web + WebSocket
├── tools.py        → 13 outils connectés
└── frontend/       → interface JARVIS (n'importe quel navigateur)
```

Chaque appareil connecté a sa propre **conversation indépendante**.
Le cerveau IA (Ollama) est partagé : il traite les demandes une par une.

---

## Configuration email

`~/.niro/email.json` :
```json
{
  "smtp": "smtp.gmail.com",
  "port": 587,
  "user": "votre@gmail.com",
  "password": "mot-de-passe-application",
  "from": "NIRO <votre@gmail.com>"
}
```

Gmail : Compte Google → Sécurité → Mots de passe des applications → Créer.
