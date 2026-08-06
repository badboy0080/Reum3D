# AGENTS

## Agent skills

### Issue tracker

Issues live as local markdown under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

### Animation stack

- Playback (page transitions, text enter/exit): **GSAP**
- Editor micro-interactions: **Motion / Amicro** (and other UI animation libraries as needed)
- Do not mix responsibilities; domain language in `CONTEXT.md`
