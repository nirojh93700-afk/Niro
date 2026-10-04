#!/bin/bash
# Réinstalle les skills de design/vidéo à chaque nouvelle session cloud.
# Les skills (.agents/skills, .claude/skills) ne sont pas versionnés : seule la
# liste l'est (skills-lock.json). Idempotent, jamais bloquant pour la session.
set -uo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

# 1. Skills listés dans skills-lock.json (HyperFrames, Impeccable, UI UX Pro Max,
#    Taste Skill, Vercel, Playwright CLI)
attendus=$(python3 -c "import json;print(len(json.load(open('skills-lock.json'))['skills']))" 2>/dev/null || echo 0)
presents=$(ls .agents/skills 2>/dev/null | wc -l)
if [ "$presents" -lt "$attendus" ]; then
  timeout 600 npx -y skills experimental_install -y < /dev/null > /tmp/skills-install.log 2>&1 || echo "skills : installation incomplète (voir /tmp/skills-install.log)" >&2
fi

# 1 bis. Marketing Skills (non listés dans skills-lock.json) : seulement ceux utiles à la boutique
for n in seo-audit schema product-marketing ai-seo copywriting copy-editing cro emails content-strategy analytics popups pricing offers social launch referrals lead-magnets site-architecture cold-email ads ad-creative ab-testing competitors competitor-profiling customer-research community-marketing influencer-marketing free-tools events attribution image; do
  [ -d ".agents/skills/$n" ] || { timeout 300 npx -y skills add coreyhaines31/marketingskills -y --skill $n < /dev/null > /tmp/skills-mkt.log 2>&1 || true; }
done

# 2. Chaque skill visible par Claude Code (lien dans .claude/skills)
mkdir -p .claude/skills
for d in .agents/skills/*/; do
  n=$(basename "$d")
  [ -e ".claude/skills/$n" ] || ln -s "../../.agents/skills/$n" ".claude/skills/$n"
done

# 3. Collection Awesome DESIGN.md (fiches de style, pas un skill)
if [ ! -d .agents/awesome-design-md ]; then
  timeout 120 git clone -q --depth 1 https://github.com/VoltAgent/awesome-design-md .agents/awesome-design-md 2>/dev/null || true
fi

# 3 bis. Composants Magic UI (le site magicui.design est bloqué : on lit le code sur GitHub)
if [ ! -d .agents/magicui ]; then
  timeout 200 git clone -q --depth 1 https://github.com/magicuidesign/magicui .agents/magicui 2>/dev/null && rm -rf .agents/magicui/.git || true
fi

# 4. Commande playwright-cli (réglée sur le Chromium de l'environnement : .playwright/cli.config.json)
if ! command -v playwright-cli >/dev/null 2>&1; then
  timeout 180 npm i -g @playwright/cli > /dev/null 2>&1 || true
fi

exit 0
