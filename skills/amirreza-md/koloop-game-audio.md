# Koloop game audio

In all Koloop/GameBox chats and future agent tasks, run games in muted browser
tabs. Mute before launching or interacting with a game, keep the tab muted
throughout testing and after reloads or navigation, and apply this to existing
and newly opened game tabs. Pass this requirement to delegated agents.
Use browser tab muting or an equivalent browser-level audio suppression when
tab muting is unavailable. Unmute only when the user explicitly requests it.

## Promotional video covers

Whenever ADMIN requests a promotional video, also deliver a matching cover poster automatically. Use the approved October 24, 2026 cover style: original game artwork over its blurred backdrop, blue-black fade, large English title, short neon-blue Persian hook, Nunito/Vazir, and restrained Koloop branding. In GameBox, `.claude/skills/instagram-publisher/SKILL.md` is the canonical repo-local workflow: deliver a reel, cover and conversational Persian Instagram caption per game. The global `koloop-promo-video` skill remains a fallback; GameBox's `docs/tools/koloop-reel-covers.ts` reproduces the covers.
