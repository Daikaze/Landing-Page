# Averis Landing — Architecture

## Supported runtime
- Foundry VTT v14, D&D 5e 5.3.3 (and other systems for basic features).
- ES Modules; modern ApplicationV2 GM editor; no third-party dependencies.

## Modules
| File | Responsibility |
| --- | --- |
| `scripts/main.mjs` | Register settings/hooks, API, startup and socket channel. |
| `scripts/data.mjs` | Campaign schema, editable seed data, settings persistence. |
| `scripts/landing.mjs` | Player home screen, map/quest/recap UI, start cinematic, launch button. |
| `scripts/editor.mjs` | GM-only ApplicationV2 editing, CRUD, map pin picker, import/export. |
| `scripts/audio.mjs` | Local ambient and one-shot cinematic sound lifecycle. |
| `scripts/utils.mjs` | Escape helpers and data normalization. |
| `styles/landing.css` | Strictly scoped dark-leather, gilded-frame and parchment styles. |
| `templates/editor.hbs` | GM ApplicationV2 render template. |

## Data management

The `averis-landing.campaign` world setting is an editable object with these main collections:

```json
{
  "characters": [{"id":"...","name":"...","subtitle":"...","portrait":"...","actorId":"...","visible":true}],
  "locations": [{"id":"...","name":"...","x":50,"y":50,"discovered":true,"sceneId":"..."}],
  "quests": [{"id":"...","title":"...","category":"Main","status":"Active","progress":0,"journalUuid":"...","visible":true}],
  "recaps": [{"id":"...","session":"23","title":"...","summary":"...","visible":true}]
}
```

The world setting is readable by players. The GM-only editor filters hidden entries in UI but **does not secure the underlying setting data**. To keep true spoilers secret, use GM-only Foundry Journals and only put non-secret summaries in the landing data. Future versions may use a server-side private store with filtered published snapshots.

## Start Session flow

1. GM presses Start Session.
2. Persist `sessionOpen = false` so newly connected players will not receive a stale landing page.
3. Broadcast `{type:"start", gmId: ...}` using the Foundry module socket channel.
4. Each online client renders their own local cinematic overlay and plays locally configured audio (subject to browser autoplay restrictions).
5. After the GM's cinematic finishes (or GM skips it), the GM activates the configured Foundry Scene. Foundry handles scene navigation.
6. Overlays are cleaned up independently for each client; all local audio instances are stopped.

`game.modules.get('averis-landing').api` exposes `open(tab)`, `close()`, `editor()` and GM-only `show()`.

## Compatibility principles

- `#averis-landing-root`, `#averis-cinematic`, `.averis-editor-window` and `#averis-landing-launcher` are the *only* CSS roots.
- No overrides of `body`, sidebar classes, canvas or other module global styles.
- No actor updates, chat mutations or token modifications.
- GM-only save and editor checks.
- UI escaping in all user-editable strings; image/audio sources reject scripting schemes.
- Browser-level smoke testing and Node syntax checks are supplied in `tests/` in the development folder, but tests are excluded from the install ZIP.

## Next milestones

1. Preview the module in the real Foundry v14 environment and resolve any UI integration issues.
2. Add a module dashboard sidebar button and optional GM Help integration (journals, session journal source, quests).
3. Add a configurable panel layout with drag/drop and multiple Classic D&D skins.
4. Implement true GM-private source storage with separately published player snapshots.
5. Enhance map interaction: pan, location categories, scene thumbnails, fog-of-war and discovery cues.
