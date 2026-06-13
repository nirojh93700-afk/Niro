# Kit Agents — installation sur un autre projet (ex : Crafia.fr)

Système multi-agents IA réutilisable, extrait de Niv Création. Pensé pour une app
**Next.js (App Router)** — ce qui est le cas des apps créées avec Claude + Firebase App Hosting.

> But : dans la session Claude Code du projet cible (Crafia), dire « ajoute l'équipe
> d'agents » ; Claude suit ce README, copie les 3 fichiers et adapte la CONFIG. Quelques minutes.

## Contenu du kit
| Fichier du kit | À copier vers (dans le projet cible) |
|---|---|
| `registry.js` | `src/lib/agents/registry.js` — le moteur (agents + cerveau) |
| `api-agents-route.js` | `src/app/api/admin/agents/route.js` — l'API |
| `AgentsCenter.jsx` | `src/app/admin/agents/page.jsx` — l'interface (page admin) |

## Pré-requis
1. `npm i @anthropic-ai/sdk`
2. Variables d'environnement : `ANTHROPIC_API_KEY` (obligatoire), `ANTHROPIC_MODEL` (option),
   `ADMIN_KEY` (mot de passe admin pour protéger la page/API — ou réutilise l'auth existante).

## Étapes
1. **Copier** les 3 fichiers aux emplacements indiqués.
2. **Adapter la CONFIG** en haut de `registry.js` :
   - `BRAND_RULES` : identité + ton + règles fermes de l'app (Crafia).
   - `CONTEXT.catalog()` / `CONTEXT.sales()` : brancher sur les vraies données (BDD/Firestore)
     pour que les agents répondent juste et que l'agent rapport ait de vrais chiffres.
3. **Adapter l'authentification** :
   - dans `api-agents-route.js` (fonction `isAdmin`) et dans `AgentsCenter.jsx` (nom de la clé
     `admin-key`) → utilise plutôt le système d'auth admin déjà en place dans le projet cible.
4. **Choisir les agents** dans `registry.js` (objet `AGENTS`) : garde/retire/ajoute selon le
   métier de l'app. Universels : `chef`, `email`, `technicien`, `rapport`. Spécifiques e-commerce
   (avis, newsletter, marketing) : à recopier depuis Niv Création si pertinent.
5. **Vérifier** que ça compile (`npm run build`) puis déployer.

## Autonomie e-mail (optionnel mais recommandé)
Pour que l'agent réponde seul aux messages simples du **formulaire de contact** :
- dans la route du formulaire de contact de l'app, appeler `triageIncomingEmail({ name, email, subject, message })` ;
- si `ok && !needsValidation` → envoyer la réponse au client (via l'outil d'e-mail de l'app) ;
- sinon → transmettre au gérant « à valider ».
- Protéger derrière un interrupteur (réglage), désactivé par défaut.

## Notes
- Le **vrai développement / corrections de bugs** se fait par Claude Code dans la session du projet
  (un agent dev autonome ne vit pas DANS l'app, pour des raisons de sécurité).
- Pour la **génération d'images/vidéos/3D**, Claude le fait à la demande avec ses outils.
- Pour **publier sur les réseaux** automatiquement : intégration séparée (jeton API Meta/TikTok).
