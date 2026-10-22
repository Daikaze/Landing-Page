# Changelog

## 0.4.0 — World Tree Edition

- Rebuilt the landing as a transparent native-Scene RPG menu with three equally-spaced interactive buttons per side, styled after the user reference.
- Installed the user-supplied World Tree Ascendant art as the actual Scene Level background, not a separate window, preserving its embedded AVERIS logo.
- Automatically migrate only the legacy `landing-board.svg` scene background, retaining custom scene artwork.
- Added bundled original audible 32-second fantasy ambient OGG loop; first music click plays a track immediately.
- Reworked Music & Effects with source picker, Play/Stop, error status, per-client volume slider and valid Foundry v14 AudioHelper/Sound API usage.
- Ensure starting/stopping sounds is race-resistant; stop when leaving the Landing Scene or during cinematics.
- Adjusted modal menus to open within the scene while keeping the background visible.
- Fixed a cross-client cinematic socket race: a client can receive the GM event before the world setting replicates.
- Added smoke coverage for map, quests, characters, recap, audio source, volume, editor, cinematic start, background upgrade and small-screen layout.
- Client-side browser tests pass. Live Foundry v14 integration still requires confirmation in the user's world.

# Changelog

## 0.2.0 — Atlas landing layout

- Replaced the website-like header, navigation and hero page with a full-screen Classic D&D atlas.
- The **Averis** title is the only text in the header.
- World map always visible in the center; six icon menu buttons in two vertical groups of three.
- Added an ornamental, explicitly non-canon map illustration as the default placeholder. Replace it with your real world map in GM Editor.
- Side controls for Character Showcase, Quest Board, Cinematic Start, Interactive World Map, Session Recap, Music & Effects.
- Overlaid parchment detail dialogs keep the map-based landing visually consistent.
- Kept GM-only Editor and Show to Players controls at the bottom; removed website-style bars and stats.
- Embedded line icons are bundled as SVG markup instead of depending solely on a font.
- Responsive compact layout on narrower windows.
- Updated browser smoke tests for navigation, map positioning, editor saving, cinematic and narrow screens.

## 0.1.0 — Initial GitHub version

- Classic D&D landing page with hero cards, interactive image-based world map, quest board, session recaps, cinematic intro, ambient music, GM editor.
- Added direct GitHub manifest installation and persistent install ZIP URL.
- Basic mock-browser and syntax tests passed; needs in-world Foundry v14 verification.
- Player-hidden UI items are not confidential server-side data.

## v0.3.0 — Native Scene Edition (2026-10-22)

- Rebuild as a real navigable, activatable Foundry v14 Scene flagged to the module. No fullscreen web-style popup or separate tab.
- Add v14 Level background, canvasReady/canvasTearDown view lifecycle, and responsive canvas-bound controls.
- Classic D&D wood frame, left Players / Dead / Stats panel, central world map, three left and three right buttons, seasonal thumbnails.
- Fix major button interactions and cinematic guard when destination scene is missing; start session now activates destination Scene.
- Add day and month settings, fallen character status, Actor auto-lookup and Import PCs functionality.
- Preserve previous world campaign records; upgrade package and Foundry-installable manifest ZIP.
- Verify Javascript syntax, Chromium GM/editor/scene smoke tests on wide and narrow viewports; pending validation in real Foundry v14.

## v0.3.1 — Screenshot map (2026-10-22)

- Use the campaign world map cropped from the supplied landing-page screenshot as the default atlas background, without the surrounding Foundry UI. Set the fresh-install Players roster to the nine names shown in the example. High-resolution original remains configurable by GM.
