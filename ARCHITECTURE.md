# Averis Landing Scene — design v0.3.0

## Lifecycle

1. `scripts/main.mjs` registers world settings and hooks.
2. GM ready → `scripts/scene.mjs#ensureLandingScene()` locates or creates a real Foundry Scene flagged `flags.averis-landing.landingScene=true`, configured as gridless with one v14 Scene Level and an SVG table backdrop. The Scene is not automatically activated, to avoid dragging players from their current game.
3. `canvasReady` checks `canvas.scene.getFlag()`. Only if it matches the Landing Scene does `mountSceneOverlay()` add the isolated UI to the canvas rectangle. No new tabs/windows for the player layout. `canvasTearDown` removes it and stops audio.
4. `#board` (or `#canvas`) DOM rect and `#sidebar` bounds determine UI positioning. Buttons are scoped to the scene-specific root and no global Foundry UI styles are touched.
5. `game.modules.get('averis-landing').api.show()` activates the native Scene with `pullUsers:true`. The GM may instead use the normal Scene navigation.
6. GM Editor stays a Foundry ApplicationV2 as native editing interface, while the landing dashboard is scene-bound.

## Modules

- `data.mjs`: world config, seed roster, CRUD schema, safe public entry filters
- `scene.mjs`: Scene lifecycle, player/GM navigation and permissions
- `landing.mjs`: roster, atlas/quest/recap views, button delegation, cinematic and socket controls
- `editor.mjs`: ApplicationV2 editor with map position picker, Actor linking, save/import/export
- `audio.mjs`: local ambient and cinematic audio
- `styles/landing.css`: legacy feature/detail/editor styles, all scoped
- `styles/scene.css`: redesigned frame, parchment panels, balanced responsive scene controls
- `assets/landing-board.svg`: underlying Foundry v14 Scene Level background
- `assets/averis-map-placeholder.svg`: deliberately non-canon placeholder until GM selects map

## Scene vs modal

The module's primary UI exists only while the Foundry **Averis Landing** Scene is being viewed. Detail panels appear over the map within the Scene and can be closed with `×` or the related close control. Changing to any other Scene removes the entire overlay. It is not a website dashboard and does not change general Foundry UI.

## Data / permissions

Save world configuration as a Foundry world setting, retaining existing v0.2 records. GM-only controls check `game.user.isGM`, linked Actor sheets and linked Journals check Foundry permissions. Quest status and map discovery are not a security boundary because world settings are readable.

## Testing

`tests/scene-test.py` runs a local Chromium smoke test with mocked Foundry v14 world, Scene creation, Scene viewing, UI, ApplicationV2 and socket operations; tests wide and narrow viewport, major buttons, hero/dead, stats, season, zoom, GM Editor, cinematic and leaving Scene. This is **not** a real Foundry integration test.
