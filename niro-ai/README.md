# NIRO — Assistant IA Personnel

Assistant IA local style JARVIS pour Mac Studio M4 Max.
100% local, 0 cloud, 0 abonnement.

## Installation (une seule fois)

```bash
cd niro-ai
chmod +x install.sh start.sh
./install.sh
```

Le script installe automatiquement :
- Ollama (moteur IA local)
- Qwen 2.5 72B (le cerveau — 40 Go, meilleur modèle open source)
- LLaVA 13B (vision — pour analyser les images)
- FastAPI (le serveur)

## Lancement

```bash
./start.sh
```

Puis ouvrir : **http://localhost:7777**

## Ce que NIRO peut faire

- Répondre à tout en français, naturellement
- Naviguer sur internet et vous résumer ce qu'il trouve
- Surveiller votre boutique nivcreation.fr
- Envoyer des emails (après config)
- Contrôler votre Mac (ouvrir des apps, gérer des fichiers)
- Analyser des images (montrez-lui une photo d'un problème)
- Gérer vos fichiers
- Lire les infos système (CPU, mémoire, disque)
- Créer des rappels
- Faire des calculs

## Configuration email (optionnel)

Créez `~/.niro/email.json` :
```json
{
  "smtp": "smtp.gmail.com",
  "port": 587,
  "user": "votre@gmail.com",
  "password": "mot-de-passe-application-google",
  "from": "NIRO <votre@gmail.com>"
}
```

Pour Gmail : Compte Google → Sécurité → Mots de passe des applications.

## Utilisation

- **Texte** : écrivez dans la zone en bas + Entrée
- **Voix** : cliquez sur 🎙️, parlez, NIRO répond à voix haute (Thomas, voix française)
- **Image** : cliquez sur 📎, choisissez une image, posez votre question
- **Effacer** : bouton EFFACER en haut à droite

## Modèles compatibles (par ordre de préférence)

| Modèle | RAM requise | Qualité |
|--------|------------|---------|
| qwen2.5:72b | 45 Go | ★★★★★ Recommandé pour M4 Max 48Go |
| llama3.3:70b | 43 Go | ★★★★★ Alternatif |
| qwen2.5:32b | 20 Go | ★★★★☆ |
| qwen2.5:14b | 9 Go | ★★★☆☆ |

Pour changer : `ollama pull <nom-du-modèle>`
