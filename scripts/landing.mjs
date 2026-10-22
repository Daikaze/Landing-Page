import {campaign, publicEntries, MODULE_ID, SETTINGS} from "./data.mjs";
import {esc, icon, safeAsset, clamp, makeTextParagraphs} from "./utils.mjs";
import {audioPlaying, startAmbient, stopAmbient, playCinematicMusic, stopCinematicMusic} from "./audio.mjs";

let activeTab = "home";
let selectedLocation = null;
let selectedRecap = null;
let filterQuests = "All";
let mapZoom = 1;
let editorHandler = null;
let cinematicRunning = false;
let cutsceneTimeout = null;
let transitionSerial = 0;
const SECTION_NAMES = {home:"Averis", characters:"Character Showcase", map:"Interactive World Map", quests:"Quest Board", recaps:"Session Recap", audio:"Music & Effects"};

export function setEditorHandler(callback) { editorHandler = callback; }
export function landingIsOpen() { return !!document.getElementById("averis-landing-root"); }

export function installLauncher() {
  if (document.getElementById("averis-landing-launcher")) return;
  const button = document.createElement("button");
  button.id = "averis-landing-launcher";
  button.type = "button";
  button.title = "Open Averis Landing Page";
  button.setAttribute("aria-label","Open Averis Landing Page");
  button.innerHTML = `${icon("compass")}<span>Averis</span>`;
  button.addEventListener("click", () => openLanding());
  document.body.append(button);
  refreshLauncher();
}
export function refreshLauncher() {
  const button = document.getElementById("averis-landing-launcher");
  if (!button) return;
  button.hidden = !game.settings.get(MODULE_ID, SETTINGS.showLauncher) || landingIsOpen();
}
export function openLanding(tab = "home") {
  if (cinematicRunning) return;
  if (!(tab in SECTION_NAMES)) tab = "home";
  activeTab = tab;
  if (!landingIsOpen()) {
    const root = document.createElement("section");
    root.id = "averis-landing-root";
    root.setAttribute("role","dialog");
    root.setAttribute("aria-label","Averis campaign landing page");
    root.addEventListener("click", onClick);
    document.body.append(root);
  }
  renderLanding();
  refreshLauncher();
}
export async function closeLanding() {
  document.getElementById("averis-landing-root")?.remove();
  await stopAmbient();
  refreshLauncher();
}

// Full-screen campaign table, not a website-style navbar. The reference layout
// uses three unobtrusive icon controls on each side of the central map.
const PLACEHOLDER_MAP = "modules/averis-landing/assets/averis-map-placeholder.svg";
function stageIcon(name) {
  const art={
    heroes:'<circle cx="8.5" cy="8" r="2.8"/><circle cx="16.8" cy="9" r="2.3"/><path d="M2.5 19c0-4 2.4-6 6-6s6 2 6 6M14.6 14c3 0 5.3 1.8 5.3 5"/>',
    quests:'<path d="M6 3h12v15a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h11M7 8h8M7 12h8M7 16h5"/>',
    play:'<path d="M6 3h12l3 4v13H3V7l3-4Zm-2 5h16M8 3l3 5m3-5 3 5"/><path d="m10 10 6 4-6 4z"/>',
    map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15"/>',
    recaps:'<path d="M12 5c-2.5-1.5-6.4-2.2-9-1v15c3.3-1.2 6.9-.5 9 1.2C14.2 18.5 18 18 21 19V4c-3-1.2-6.5-.5-9 1Zm0 0v15"/>',
    music:'<path d="M9 18V6l12-3v12M9 8l12-3"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="18" cy="15" rx="3" ry="2"/>'
  };
  return `<svg viewBox="0 0 24 24" width="29" height="29" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${art[name]??art.map}</svg>`;
}
function stageButton(label, symbol, action, side) {
  const isTab = ["characters","map","quests","recaps"].includes(action);
  const disabled = action === "start" && !game.user.isGM;
  const isActive = isTab && activeTab === action;
  const attribute = isTab ? `data-av-tab="${action}"` : `data-av-action="${action}"`;
  return `<button type="button" class="av-rail-button ${isActive?"av-rail-active":""}" ${attribute} ${disabled?'disabled title="Only the GM can start a session"':''} aria-label="${esc(label)}" aria-pressed="${isActive}">
    <span class="av-rail-icon">${stageIcon(symbol)}</span><span class="av-rail-caption">${esc(label)}</span></button>`;
}
function stageMap(data) {
  const src = safeAsset(data.mapImage) || PLACEHOLDER_MAP;
  const isDemo = !safeAsset(data.mapImage);
  const places=publicEntries(data.locations).filter(l=>game.user.isGM || l.discovered !== false);
  const pins=places.map(l=>`<button type="button" class="av-stage-pin ${selectedLocation===l.id?"av-pin-active":""}" title="${esc(l.name)}" style="left:${clamp(l.x,0,100)}%;top:${clamp(l.y,0,100)}%" data-av-location="${esc(l.id)}" aria-label="${esc(l.name)}"><span class="av-stage-pin-gem">✦</span><span class="av-stage-pin-name">${esc(l.name)}</span></button>`).join("");
  return `<div class="av-stage-center" aria-label="Map of Averis">
      <div class="av-map-frame"><div class="av-stage-map-viewport">
        <div class="av-stage-map-content" style="transform:scale(${mapZoom})"><img src="${esc(src)}" alt="${isDemo?"Decorative fantasy map placeholder":"Averis world map"}" draggable="false">${isDemo?"":pins}</div>
      </div><span class="av-corner av-corner-tl"></span><span class="av-corner av-corner-tr"></span><span class="av-corner av-corner-bl"></span><span class="av-corner av-corner-br"></span></div>
      ${isDemo?`<div class="av-map-hint">Illustrative map — ${game.user.isGM?"select the actual map in GM Editor":"map will be revealed by your GM"}</div>`:""}
      <div class="av-stage-zoom"><button type="button" data-av-action="zoom-out" aria-label="Zoom map out">−</button><span>${Math.round(mapZoom*100)}%</span><button type="button" data-av-action="zoom-in" aria-label="Zoom map in">+</button></div>
    </div>`;
}
function mapLocationsPanel(data) {
  const places=publicEntries(data.locations).filter(l=>game.user.isGM || l.discovered !== false);
  const active=places.find(l=>l.id===selectedLocation) ?? null;
  return `<div class="av-stage-info av-map-info"><div class="av-stage-info-heading"><span>WORLD ATLAS</span><button type="button" data-av-action="home" aria-label="Close map details">×</button></div>
    ${active?`<h3>${esc(active.name)}</h3><p>${esc(active.description)}</p>${active.sceneId?`<button type="button" class="av-small-button" data-av-scene="${esc(active.sceneId)}">View Scene →</button>`:""}<button type="button" class="av-inline-link" data-av-action="map-list">← All locations</button>`:
       `<h3>Discovered Locations</h3>${places.length ? `<div class="av-stage-locations">${places.map(l=>`<button type="button" data-av-location="${esc(l.id)}">${icon("flag")} ${esc(l.name)}</button>`).join("")}</div>`:`<p>No locations discovered. ${game.user.isGM?"Add markers in GM Editor.":"Explore the world to unlock places."}</p>`}`}
    </div>`;
}
function audioPanel(data) {
  const hasMusic=!!safeAsset(data.landingMusic);
  return `<div class="av-stage-dialog" role="dialog" aria-label="Music and effects"><div class="av-stage-dialog-heading"><span>THE SOUNDS OF AVERIS</span><button type="button" data-av-action="home" aria-label="Close music panel">×</button></div><div class="av-audio-chapter">
    <div class="av-audio-emblem">${icon("music")}</div><h2>Music & Effects</h2><p>Set the atmosphere before the adventure begins.</p>
    <button type="button" class="av-gold-button" data-av-action="audio" ${hasMusic?"":"disabled"}>${icon(audioPlaying()?"audioOn":"audioOff")} ${hasMusic?(audioPlaying()?"Stop Ambience":"Play Ambience"):"No track configured"}</button>
    <small>Ambient particles: ${data.particles?"Enabled":"Disabled"}</small>${game.user.isGM?`<button type="button" class="av-inline-link" data-av-action="editor">Manage music in GM Editor →</button>`:""}
    </div></div>`;
}
function personCard(entry) {
  // Linked Actor information is used only when this user has at least OBSERVER permission.
  const actor = entry.actorId ? game.actors.get(entry.actorId) : null;
  const canInspect = !!actor && actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER);
  const src = safeAsset(entry.portrait) || (canInspect ? safeAsset(actor.img) : "");
  const hp = canInspect ? actor.system?.attributes?.hp : null;
  const current = Number(hp?.value);
  const max = Number(hp?.max);
  const health = Number.isFinite(current) && Number.isFinite(max) && max > 0 ? `<span class="av-hp">${esc(current)} / ${esc(max)} HP</span>` : "";
  return `<article class="av-person"><div class="av-portrait">${src?`<img loading="lazy" src="${esc(src)}" alt="${esc(entry.name)} portrait">`:`<span class="av-monogram">${esc((entry.name||"?").charAt(0))}</span>`}</div><div class="av-person-copy"><h3>${esc(entry.name)}</h3><span class="av-kicker">${esc(entry.subtitle)}</span>${entry.description?`<p>${esc(entry.description)}</p>`:""}${health}${canInspect?`<button type="button" class="av-inline-link" data-av-actor="${esc(entry.actorId)}">Open Character Sheet →</button>`:""}</div></article>`;
}
function charactersPage(data) {
  const entries = publicEntries(data.characters);
  return `<section class="av-page"><div class="av-page-heading"><span>THE ADVENTURERS</span><h2>Heroes of Averis</h2><p>The lives and legacies shaping the tale.</p></div><div class="av-characters">${entries.length ? entries.map(personCard).join("") : `<div class="av-empty">No characters have been published yet.</div>`}</div></section>`;
}
function mapPage(data) {
  const places = publicEntries(data.locations).filter(l=>game.user.isGM || l.discovered !== false);
  const src = safeAsset(data.mapImage);
  const active = places.find(l=>l.id===selectedLocation) ?? null;
  const pins = places.map(l => `<button type="button" class="av-map-marker ${l.id===selectedLocation?"av-pin-active":""}" title="${esc(l.name)}" style="left:${clamp(l.x,0,100)}%;top:${clamp(l.y,0,100)}%" data-av-location="${esc(l.id)}"><span>✦</span><span class="av-pin-label">${esc(l.name)}</span></button>`).join("");
  return `<section class="av-page av-map-page"><div class="av-page-heading"><span>THE LANDS OF AVERIS</span><h2>World Atlas</h2><p>Discover places as the story unfolds.</p></div><div class="av-map-layout"><div class="av-map-surface"><div class="av-map-viewport"><div class="av-map-transform" style="transform:scale(${mapZoom})">${src?`<img class="av-map-image" src="${esc(src)}" alt="Map of Averis">`:`<div class="av-map-placeholder"><span>⚜</span><strong>THE KNOWN WORLD</strong><em>Upload your campaign map in GM Editor</em></div>`}${pins}</div></div><div class="av-map-zoom"><button type="button" data-av-action="zoom-in" aria-label="Zoom in">+</button><span>${Math.round(mapZoom*100)}%</span><button type="button" data-av-action="zoom-out" aria-label="Zoom out">−</button></div></div><aside class="av-map-places"><h3>${active?esc(active.name):"Discovered Locations"}</h3>${active?`<p>${esc(active.description)}</p>${active.sceneId?`<button type="button" class="av-small-button" data-av-scene="${esc(active.sceneId)}">View Scene →</button>`:""}<button type="button" class="av-inline-link" data-av-action="map-list">← All locations</button>`: places.length?places.map(l=>`<button type="button" class="av-place-entry" data-av-location="${esc(l.id)}">${icon("flag")} ${esc(l.name)}</button>`).join(""):`<div class="av-empty">No locations discovered yet. The GM can add markers in the editor.</div>`}</aside></div></section>`;
}
function questPage(data) {
  const all = publicEntries(data.quests);
  const quests = filterQuests === "All"?all:all.filter(q=>q.category===filterQuests);
  return `<section class="av-page"><div class="av-page-heading"><span>THE PATHS THAT LIE AHEAD</span><h2>Quest Board</h2><p>Every decision becomes a part of history.</p></div><div class="av-filters">${["All","Main","Side","Character"].map(cat=>`<button type="button" data-av-filter="${cat}" class="${filterQuests===cat?"is-active":""}">${cat}</button>`).join("")}</div><div class="av-quest-grid">${quests.length?quests.map(q=>{const p=clamp(q.progress,0,100);return `<article class="av-quest"><div class="av-quest-top"><span>${esc(q.category || "Quest")}</span><span class="av-status">${esc(q.status)}</span></div><h3>${esc(q.title)}</h3><p>${esc(q.description)}</p><div class="av-progress"><div style="width:${p}%"></div></div><footer><span>${p}% complete</span>${q.journalUuid?`<button type="button" class="av-inline-link" data-av-journal="${esc(q.journalUuid)}">Journal →</button>`:""}</footer></article>`}).join(""):`<div class="av-empty">No quests in this category.</div>`}</div></section>`;
}
function recapsPage(data) {
  const entries = publicEntries(data.recaps).slice().sort((a,b)=>Number(b.session||0)-Number(a.session||0));
  const chosen = entries.find(r=>r.id===selectedRecap) ?? entries[0];
  return `<section class="av-page"><div class="av-page-heading"><span>TALES OF THOSE WHO CAME BEFORE</span><h2>Session Chronicles</h2><p>Previously on Averis...</p></div><div class="av-recaps"><div class="av-recap-list">${entries.map(r=>`<button type="button" class="av-recap-entry ${chosen?.id===r.id?"av-current":""}" data-av-recap="${esc(r.id)}"><span>SESSION ${esc(r.session)}</span><strong>${esc(r.title)}</strong></button>`).join("")}</div><article class="av-recap-copy">${chosen?`<span class="av-kicker">CHRONICLE ${esc(chosen.session)} ${chosen.date?"• "+esc(chosen.date):""}</span><h3>${esc(chosen.title)}</h3><div class="av-recap-prose">${makeTextParagraphs(chosen.summary)}</div>`:`<div class="av-empty">No recaps have been published yet.</div>`}</article></div></section>`;
}
export function renderLanding() {
  const root=document.getElementById("averis-landing-root");
  if(!root)return;
  const data=campaign();
  const detail=activeTab==="map"?mapLocationsPanel(data)
     :activeTab==="audio"?audioPanel(data)
     :["characters","quests","recaps"].includes(activeTab)
       ?`<div class="av-stage-dialog av-book-dialog" role="dialog" aria-label="${esc(SECTION_NAMES[activeTab])}"><div class="av-stage-dialog-heading"><span>AVERIS CHRONICLES</span><button type="button" data-av-action="home" aria-label="Return to map">×</button></div><main class="av-main">${{characters:charactersPage,quests:questPage,recaps:recapsPage}[activeTab](data)}</main></div>`
       :"";
  root.innerHTML=`<div class="av-backdrop" aria-hidden="true">${safeAsset(data.backgroundImage)?`<img src="${esc(safeAsset(data.backgroundImage))}" alt="">`:""}</div>
    <div class="av-campaign-stage ${data.particles?"av-particles":""}">
      <header class="av-stage-title"><h1>Averis</h1><button type="button" class="av-stage-close" data-av-action="close" aria-label="Close landing page" title="Close">×</button></header>
      <div class="av-stage-layout">
        <nav class="av-rail av-rail-left" aria-label="Campaign sections">
          ${stageButton("Character Showcase","heroes","characters","left")}
          ${stageButton("Quest Board","quests","quests","left")}
          ${stageButton("Cinematic Start","play","start","left")}
        </nav>
        ${stageMap(data)}
        <nav class="av-rail av-rail-right" aria-label="World and media">
          ${stageButton("Interactive World Map","map","map","right")}
          ${stageButton("Session Recap","recaps","recaps","right")}
          ${stageButton("Music & Effects","music","music","right")}
        </nav>
      </div>
      <footer class="av-stage-footer">
        <div class="av-gm-controls">${game.user.isGM?`<button type="button" class="av-footer-link" data-av-action="editor">${icon("gear")} GM Editor</button><button type="button" class="av-footer-link" data-av-action="show-all">${icon("heroes")} Show to Players</button>`:""}</div>
        <span class="av-footer-ornament" aria-hidden="true">✦ ─── ◆ ─── ✦</span>
        <button type="button" class="av-footer-link" data-av-action="audio" ${!safeAsset(data.landingMusic)?"disabled":""} aria-label="${audioPlaying()?"Mute ambience":"Play ambience"}">${icon(audioPlaying()?"audioOn":"audioOff")}</button>
      </footer>
      ${detail}
    </div>`;
}

async function showDocumentFromUuid(uuid) {
  try {
    const doc = await fromUuid(uuid);
    if (!doc || !doc.testUserPermission?.(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      ui.notifications?.warn("Averis Landing: This journal is not available to you."); return;
    }
    doc.sheet?.render({force:true});
  } catch (error) { console.warn("Averis Landing | Journal:",error); }
}
async function onClick(event) {
  const button = event.target.closest("button");
  if (!button || !event.currentTarget.contains(button)) return;
  if (button.dataset.avTab) { activeTab=button.dataset.avTab; renderLanding(); return; }
  if (button.dataset.avFilter) {filterQuests=button.dataset.avFilter;renderLanding();return;}
  if (button.dataset.avLocation) {selectedLocation=button.dataset.avLocation;activeTab="map";renderLanding();return;}
  if (button.dataset.avRecap) {selectedRecap=button.dataset.avRecap;renderLanding();return;}
  if (button.dataset.avJournal) {await showDocumentFromUuid(button.dataset.avJournal); return;}
  if (button.dataset.avActor) {
    const actor=game.actors.get(button.dataset.avActor);
    if (actor?.testUserPermission(game.user,CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) actor.sheet?.render({force:true});
    return;
  }
  if (button.dataset.avScene) {
    const scene=game.scenes.get(button.dataset.avScene);
    if (scene?.testUserPermission(game.user,CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      await closeLanding(); await scene.view();
    } else ui.notifications?.warn("Averis Landing: Scene is not available to you.");
    return;
  }
  switch(button.dataset.avAction) {
    case "close": await closeLanding(); break;
    case "home": activeTab="home";selectedLocation=null;renderLanding();break;
    case "music": activeTab="audio";renderLanding();break;
    case "editor": if(game.user.isGM){await closeLanding();editorHandler?.();} break;
    case "zoom-in":mapZoom=clamp(mapZoom+0.25,1,2.5);renderLanding();break;
    case "zoom-out":mapZoom=clamp(mapZoom-0.25,1,2.5);renderLanding();break;
    case "map-list": selectedLocation=null;renderLanding();break;
    case "audio": if(audioPlaying())await stopAmbient(); else await startAmbient(); renderLanding();break;
    case "start": if(game.user.isGM) await startSession();break;
    case "show-all": if(game.user.isGM) await showAllPlayers();break;
  }
}

async function showAllPlayers() {
  await game.settings.set(MODULE_ID, SETTINGS.sessionOpen, true);
  game.socket.emit(`module.${MODULE_ID}`,{type:"show", gmId:game.user.id});
  ui.notifications?.info("Averis Landing: Landing page sent to connected players.");
}
export function receiveSocket(payload) {
  if(!payload || !["show","start"].includes(payload.type)) return;
  // Only accept visual broadcasts that claim the active GM (server-side settings remain permission-protected).
  const actorUser=game.users.get(payload.gmId);
  if (!actorUser?.isGM || !actorUser.active) return;
  if(payload.type === "show") { if(!game.user.isGM) openLanding("home"); }
  if(payload.type === "start") { if(!game.user.isGM) void performCinematic(); }
}
async function startSession() {
  if(cinematicRunning || !game.user.isGM) return;
  const data=campaign();
  // Persistent state prevents late joiners from receiving the closed welcome screen.
  await game.settings.set(MODULE_ID, SETTINGS.sessionOpen, false);
  game.socket.emit(`module.${MODULE_ID}`,{type:"start",gmId:game.user.id});
  await performCinematic();
  const scene=data.targetSceneId ? game.scenes.get(data.targetSceneId) : null;
  if(scene && game.user.isGM) {
    try { await scene.activate(); } catch(error) { console.warn("Averis Landing | Scene activation failed",error);ui.notifications?.warn("Could not activate the selected scene."); }
  }
}
export async function performCinematic() {
  if(cinematicRunning) return;
  cinematicRunning=true;
  const serial=++transitionSerial;
  const data=campaign();
  const ms=clamp(data.cinematicSeconds,2,20)*1000;
  await stopAmbient();
  document.getElementById("averis-cinematic")?.remove();
  const scene=document.createElement("div");
  scene.id="averis-cinematic";
  const art=safeAsset(data.backgroundImage);
  scene.innerHTML=`${art?`<img class="av-cinematic-bg" src="${esc(art)}" alt="">`:""}<div class="av-cinematic-content"><div class="av-cinematic-emblem">✦</div><span>THE CHRONICLES OF AVERIS</span><h1>${esc(data.chapterTitle || "The Story Continues")}</h1><h2>${esc(data.chapterSubtitle)}</h2><div class="av-cinematic-line"></div></div><button type="button" class="av-cinematic-skip" aria-label="Skip cinematic">Skip »</button>`;
  document.body.append(scene);
  return await new Promise((resolve) => {
  const finish = async () => {
    if(serial !== transitionSerial) return;
    transitionSerial++;
    if(cutsceneTimeout) clearTimeout(cutsceneTimeout);
    cutsceneTimeout=null;
    scene.classList.add("av-cinematic-out");
    await new Promise(resolve=>setTimeout(resolve,600));
    scene.remove();
    cinematicRunning=false;
    await stopCinematicMusic();
    await closeLanding();
    resolve();
  };
  scene.querySelector(".av-cinematic-skip").addEventListener("click",()=>void finish(),{once:true});
  void playCinematicMusic();
  cutsceneTimeout=setTimeout(()=>void finish(),ms);
  });
}
