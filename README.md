# Averis Landing Page — v0.3.0 (Scene Edition)

A **native Foundry VTT v14 Scene-based** Classic D&D dashboard for the Averis campaign. Works independently of other modules and is designed for D&D 5e 5.3.3. All existing campaign settings from v0.2 are preserved.

## Upgrade / install

In **Foundry Setup → Add-on Modules → Install Module**, enter the stable manifest:

`https://raw.githubusercontent.com/Daikaze/Landing-Page/main/module.json`

The manifest downloads `averis-landing.zip`, which contains the **module files at the ZIP root**, as Foundry's installer expects. For a manual installation, put the ZIP contents into `FoundryVTT/Data/modules/averis-landing/` and restart Foundry.

### First time after upgrade

1. Activate **Averis Landing Page** in Manage Modules and enter your world **as GM**.
2. The module creates a normal Scene named **Averis Landing**, with a v14 Scene Level and artwork background, if it doesn't already exist. Look for **Averis** in the Scene navigation or the Scenes directory.
3. **View** the scene to use the landing page yourself. **Activate** it to display it to all connected players. GM may also click **Show Scene to Players** from the landing page.
4. **GM Editor** is located in the bottom strip. Set your world map, character portraits/Actors, calendar day/month/year, quests, recaps, audio and destination scene.
5. The default world map is a non-canon illustration, because a standalone image of the official Averis world map was not supplied. Replace it using **GM Editor → Overview → World Map Image**.

**This version no longer opens a fullscreen pop-up or separate tab.** Its controls appear only while viewing its real Foundry Scene. The overlay automatically disappears upon switching to another Scene and reappears when you return. Sidebar windows remain Foundry UI and are not modified.

## Layout

- **Left parchment column:** Players grid (portrait or linked Actor art), Dead grid and Stats (day/month/year). The `Fallen` option in a character entry moves that card to Dead.
- **Center:** Framed Averis map, GM-managed discovery pins, zoom and four client-side seasonal color presets. Map is editable from GM Editor.
- **Left three buttons:** Character Showcase, Quest Board, Cinematic Start.
- **Right three buttons:** Interactive World Map, Session Recap, Music & Effects.
- **Bottom:** GM Editor, Show Scene to Players, ambient music toggle.

Each button has a click handler. The **GM-only** Cinematic Start requires a destination Scene configured in **GM Editor → Cinematic & Audio**. If none is selected, the module shows a warning and opens the editor, rather than silently doing nothing. Map locations with linked Scene IDs can open their Scenes if the current user has access.

### Character portraits / Actors

Enter portrait paths individually or assign Actors from the **Foundry Character Actor** dropdown. The module also auto-matches character Actors by exact name (or unambiguous first-name prefix) if no Actor ID is provided. In **GM Editor → Characters**, click **Import PCs** to add missing character Actors and link existing same-name characters to their Actors. Imported characters default to living and visible; their Dead checkbox can be edited later.

### Music

Set a landing ambience audio path and a cinematic music path in GM Editor. Browser audio autoplay restrictions usually require players to click Music to begin sound. Music is stopped when the landing scene is left.

### Helpful script API

```js
await game.modules.get("averis-landing").api.open();         // view native Scene
await game.modules.get("averis-landing").api.ensureScene();  // GM: create if missing
await game.modules.get("averis-landing").api.show();         // GM: activate for all
await game.modules.get("averis-landing").api.editor();       // GM Editor
```

## Permissions, compatibility, limitations

- UI and CSS selectors are isolated with `averis-landing` / `av-` names. The module does **not** recolor Foundry or Monk's interface.
- Only the GM can create scenes, edit settings or trigger the synchronized cinematic. Player-only views respect Actor and Journal permissions.
- Do not store unrevealed GM secrets in campaign setting fields: Foundry world settings are readable by connected users. `Visible`/`Discovered` fields are **UI filters**, not secure secret storage.
- Pins and seasonal effects are HTML overlays tied to the Landing Scene, not placeable tiles. This is intentional to keep the dashboard balanced on different screen sizes. The underlying document is a **real Foundry Scene** and can be navigated to and activated normally.
- Requires a usable canvas. Game tests use mocked APIs; **real Foundry v14.5.3.3 integration and the user's exact screen resolution still need in-client validation**. Back up your world before enabling a new custom module.

Source and all future updates: https://github.com/Daikaze/Landing-Page
