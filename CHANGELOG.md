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
