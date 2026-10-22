# Averis Landing Page — v0.4.0 (World Tree Edition)

A **native Foundry VTT v14 Scene-based** Classic D&D dashboard for the Averis campaign. Works independently of other modules and is designed for D&D 5e 5.3.3. All existing campaign settings from v0.2 are preserved; the default roster for new installations follows your nine-character reference screenshot.

## Upgrade / install

In **Foundry Setup → Add-on Modules → Install Module**, enter the stable manifest:

`https://raw.githubusercontent.com/Daikaze/Landing-Page/main/module.json`

The manifest downloads `averis-landing.zip`, which contains the **module files at the ZIP root**, as Foundry's installer expects. For a manual installation, put the ZIP contents into `FoundryVTT/Data/modules/averis-landing/` and restart Foundry.

### First time after upgrade

1. Activate **Averis Landing Page** in Manage Modules and enter your world **as GM**.
2. The module creates a normal Scene named **Averis Landing**, with a v14 Scene Level and artwork background, if it doesn't already exist. Look for **Averis** in the Scene navigation or the Scenes directory.
3. **View** the scene to use the landing page yourself. **Activate** it to display it to all connected players. GM may also click **Show Scene to Players** from the landing page.
4. **GM Editor** is located in the bottom strip. Set your world map, character portraits/Actors, calendar day/month/year, quests, recaps, audio and destination scene.
5. The default map is a **cropped reference from the screenshot you provided**. This is lower resolution than the original map artwork; replace it anytime with the original full-resolution map via **GM Editor → Overview → World Map Image**.

**This version no longer opens a fullscreen pop-up or separate tab.** Its controls appear only while viewing its real Foundry Scene. The overlay automatically disappears upon switching to another Scene and reappears when you return. Sidebar windows remain Foundry UI and are not modified.

## In-game World Tree menu (v0.4)

- The actual Foundry **Averis Landing** Scene has the user-supplied World Tree Ascendant art as its scene-level background (`assets/world-tree-ascendant.webp`). This is not a browser tab, modal or scene-imitating image.
- The immersive navigation draws six equally balanced gold-and-blue RPG buttons on top of the native canvas art. The "AVERIS" title is part of the background artwork, so it isn't duplicated.
- **Left:** Character Showcase, Quest Board, Cinematic Start (GM only).
- **Right:** Interactive World Map, Session Recap, Music & Effects.
- The detailed pages open as in-scene overlays and are dismissed with `×`; clicking a linked Actor or Journal opens the native Foundry sheet where permissions allow it.
- **Bottom:** world date, local music control, GM Editor and Activate Scene for Players.
- World Map is a true secondary menu with GM-managed map markers, linked scenes and zoom. Changing the map through the editor does not overwrite the World Tree landing background.

### Existing scenes and saved data

When upgrading from v0.3.x, the module will replace the old *auto-generated* `landing-board.svg` background on the flagged **Averis Landing** Scene with the new art while preserving custom backgrounds you set manually. It does not delete the Scene or recreate your content. Open **GM Editor → Overview** if you want to set an alternative Landing Scene background explicitly; use an empty field to restore the included artwork.

### Character portraits / Actors

Enter portrait paths individually or assign Actors from the **Foundry Character Actor** dropdown. The module also auto-matches character Actors by exact name (or unambiguous first-name prefix) if no Actor ID is provided. In **GM Editor → Characters**, click **Import PCs** to add missing character Actors and link existing same-name characters to their Actors. Imported characters default to living and visible; their Dead checkbox can be edited later.

### Music & sound fixes (v0.4)

A bundled original 32-second `assets/averis-ambient.ogg` loop is included. The **Music & Effects** menu starts playback on click, then provides a Play/Stop button, Default Theme / Custom Track selection (when one is configured), and a **per-player 0–100% volume slider**. The small Music button in the footer is also an on/off toggle. The loop plays through Foundry v14's `game.audio.create({context:game.audio.music})` and `Sound.play({loop,volume})` API and stops when you leave the Scene. The ambient loop is also the fallback for campaigns whose old `landingMusic` was empty.

A custom audio path can be specified in **GM Editor → Cinematic & Audio**. Paths must point to readable files served by Foundry. No automatic browser autoplay is attempted before a user click. If the audio is globally muted in Foundry, the module explicitly reports that; check Foundry's audio settings / music channel if you still hear nothing. The music slider stores a local client preference; it does not adjust other players' volume.

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
