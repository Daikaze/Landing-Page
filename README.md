# Averis Landing Page 0.2.0

Classic D&D landing page for Foundry VTT **v14** with D&D 5e **5.3.3**. This build does not require other modules.

## Installation

**Install from GitHub manifest:** In Foundry Setup → Add-on Modules → Install Module, paste `https://raw.githubusercontent.com/Daikaze/Landing-Page/main/module.json` into Manifest URL. The package is downloaded from the stable `averis-landing.zip` in this repository.

**Manual installation:**

1. Extract the `averis-landing` folder to your **Foundry User Data/Data/modules/** directory. Folder name MUST be `averis-landing` (same as `module.json` ID).
2. Restart Foundry (or refresh Setup), launch your world, and enable **Averis Landing Page** in **Manage Modules**.
3. Log in as GM. With the world session open, the landing page opens automatically (configurable).
4. Press **GM Editor** at the bottom-left of the landing page to open the **GM Editor**. Alternately run `game.modules.get("averis-landing").api.editor()` in browser console or a GM Script Macro.
5. In **Overview**, configure your campaign art and official world map. Use **World Map** to add and place markers. In **Cinematic & Audio**, choose your own audio files and a destination Foundry Scene.

## Included

- **Landing:** Only the **Averis** header above a framed, centered world map and three icon buttons on each side. No website-style navbar. Add the real map in GM Editor; a fictional illustration is bundled until then.
- **Heroes:** GM-created cards, optional links to Foundry Actor ID, read-only HP on actors the current user can inspect.
- **World Map:** A persistent center-stage map with zoom, discovered/hidden pins, place descriptions and click-to-open Scene (when permitted).
- **Quest Board:** Category filtering, progress indicators, public description, optional linked Journal UUID (only opens if user has permission).
- **Chronicles:** Session recap entries selectable by players.
- **Music & Effects:** Right-side menu opens audio/particle overview; optional looping ambient music requires a user click to satisfy browser autoplay policies. Cinematic music plays when the GM starts the session.
- **Cinematic Start:** GM broadcasts a cinematic title card to connected players and activates the chosen scene after it finishes.
- **GM Editor:** Modern ApplicationV2 window with CRUD for entries, file browsers, map pin placement, import/export backup.
- **GM synchronization:** A setting tracks whether a session is open, so late arrivals do not automatically reopen the landing page after the GM has started.
- **Launcher:** A small unobtrusive compass button opens the landing page at any time. Can be disabled in module settings.

## Helpful API

```js
game.modules.get("averis-landing").api.open("quests");
game.modules.get("averis-landing").api.close();
game.modules.get("averis-landing").api.editor();
// GM only: publish landing page to connected players
game.modules.get("averis-landing").api.show();
```

## Permissions and isolation

- Entries marked not visible are filtered for players. Undiscovered map locations are GM-only.
- Actor details and Journals are opened only when Foundry document permissions allow it.
- This module does not modify player documents, Foundry Core styles, or any external module.
- All styling is scoped to dedicated Averis roots. Other Foundry modules (including Monk's) need not be modified.
- Only an original decorative, non-canon SVG fantasy map placeholder is bundled; no copyrighted images or music. Add your own assets using GM Editor.
- World settings are player-readable, so **never put GM secrets in public descriptions or hidden entries**. The `visible` and `discovered` flags only hide UI, not underlying settings data. For truly secret notes, keep them in private GM Journals outside this module.

## Known limitations / next version

- Map is an image with percentage pins, not a full hex atlas or synchronized fog-of-war.
- World data starts with a small Averis roster and sample quests/recap; review entries before making them visible to players.
- Only basic linked-actor HP is displayed; item inventories and combat sheet controls stay in Foundry.
- Cinematic socket messages are cosmetic; they do not grant GM permissions. A malicious client with devtools could forge a cosmetic message; GM world settings remain protected by Foundry.
- Tested by syntax and mock browser checks, **not verified inside the user's Foundry installation**; test in a backup world before live use.

## Source and updates

Canonical repository: https://github.com/Daikaze/Landing-Page

The root directory contains the module source. The attached `averis-landing.zip` install package is regenerated alongside new updates. Update `version` in `module.json` for each release.
