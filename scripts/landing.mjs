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
const SECTION_NAMES = {home:"Hall", characters:"Heroes", map:"World Map", quests:"Quest Board", recaps:"Chronicles"};

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

function background(data) {
  const bg = safeAsset(data.backgroundImage);
  return `<div class="av-bg" aria-hidden="true">${bg ? `<img src="${esc(bg)}" alt="">` : ""}</div>`;
}
function nav(data) {
  const tabs = Object.entries(SECTION_NAMES).map(([id, name]) => `<button type="button" class="av-nav-item ${id===activeTab?"av-selected":""}" data-av-tab="${id}" aria-current="${id===activeTab?"page":"false"}">${icon({home:"fa-landmark",characters:"heroes",map:"map",quests:"quests",recaps:"recaps"}[id])}<span>${name}</span></button>`).join("");
  return `<header class="av-topbar"><div class="av-brand">${icon("compass")}<span>${esc(data.title)}</span><small>EST. ${esc(data.worldYear)}</small></div><nav aria-label="Campaign navigation">${tabs}</nav><div class="av-header-buttons">${game.user.isGM?`<button type="button" class="av-icon-btn" title="GM Editor" data-av-action="editor">${icon("gear")}</button>`:""}<button type="button" class="av-icon-btn" title="Close landing page" data-av-action="close">${icon("close")}</button></div></header>`;
}
function hero(data) {
  const c = publicEntries(data.characters);
  const currentQuests = publicEntries(data.quests).filter(q=>q.status === "Active");
  return `<section class="av-home">
    <div class="av-ornament">✦ <span>THE CHRONICLES OF AVERIS</span> ✦</div>
    <div class="av-home-sigil" aria-hidden="true">⚜</div>
    <h1>${esc(data.title)}</h1><h2>${esc(data.subtitle)}</h2>
    <p class="av-home-intro">${esc(data.introduction)}</p>
    <div class="av-home-divider"><span>◆</span></div>
    <div class="av-home-actions"><button type="button" class="av-gold-button" data-av-tab="characters">${icon("heroes")} Meet the Heroes</button><button type="button" class="av-outline-button" data-av-tab="map">${icon("map")} Explore the World</button></div>
    <div class="av-home-stats"><span>${icon("heroes")} ${c.length} Heroes</span><span>${icon("quests")} ${currentQuests.length} Active Quests</span><span>${icon("recaps")} ${publicEntries(data.recaps).length} Chronicles</span></div>
    </section>`;
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
function footer(data) {
  const disabled = !safeAsset(data.landingMusic);
  return `<footer class="av-bottom"><div class="av-bottom-world">${icon("compass")} THE WORLD OF AVERIS <span>•</span> YEAR ${esc(data.worldYear)}</div><div class="av-bottom-controls"><button type="button" data-av-action="audio" class="av-audio" ${disabled?"disabled title='Configure music in GM Editor'":""}>${icon(audioPlaying()?"audioOn":"audioOff")} ${audioPlaying()?"Mute Ambience":"Play Ambience"}</button>${game.user.isGM?`<button type="button" class="av-gold-button av-start" data-av-action="start">${icon("play")} Start Session</button><button type="button" class="av-text-button" data-av-action="show-all">Show to Players</button>`:""}</div></footer>`;
}
export function renderLanding() {
  const root = document.getElementById("averis-landing-root");
  if (!root) return;
  const data = campaign();
  const content = {home:hero, characters:charactersPage, map:mapPage, quests:questPage, recaps:recapsPage}[activeTab](data);
  root.innerHTML = `${background(data)}<div class="av-shell ${data.particles ? "av-particles":""}">${nav(data)}<main class="av-main">${content}</main>${footer(data)}</div>`;
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
  if (button.dataset.avLocation) {selectedLocation=button.dataset.avLocation;renderLanding();return;}
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
