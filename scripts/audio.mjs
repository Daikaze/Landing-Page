import {campaign, MODULE_ID, SETTINGS} from "./data.mjs";
import {safeAsset, clamp} from "./utils.mjs";

export const DEFAULT_AMBIENCE = `modules/${MODULE_ID}/assets/averis-ambient.ogg`;
let ambientSound = null;
let cinematicSound = null;
let selectedSource = "default";
let playbackRevision = 0;
let starting = false;
let confirmedPlaying = false;
let lastAudioError = "";

export function audioPlaying() { return Boolean(ambientSound && (ambientSound.playing ?? confirmedPlaying)) || starting; }
export function audioSourceChoice() { return selectedSource; }
export function audioError() { return lastAudioError; }
export function getClientVolume() {
  try { return clamp(game.settings.get(MODULE_ID, SETTINGS.clientVolume), 0, 1); }
  catch { return clamp(campaign().volume ?? 0.35, 0, 1); }
}
export async function setClientVolume(value) {
  const volume=clamp(value,0,1);
  await game.settings.set(MODULE_ID, SETTINGS.clientVolume, volume);
  if (ambientSound?.playing && typeof ambientSound.fade === "function") {
    await ambientSound.fade(volume, {duration: 90});
  }
}
export async function stopAmbient() {
  playbackRevision++;
  starting=false;
  confirmedPlaying=false;
  const old=ambientSound;
  ambientSound=null;
  if(old) try { await old.stop({fade:250}); } catch(error) { console.warn("Averis Landing | Audio stop:",error); }
}
export async function startAmbient({source=selectedSource}={}) {
  const cfg=campaign();
  selectedSource=(source==="custom" && safeAsset(cfg.landingMusic))?"custom":"default";
  const src=selectedSource==="custom"?safeAsset(cfg.landingMusic):DEFAULT_AMBIENCE;
  const revision=++playbackRevision;
  const prior=ambientSound;
  ambientSound=null;
  starting=true;
  confirmedPlaying=false;
  lastAudioError="";
  if(prior)try {await prior.stop({fade:120});}catch(_){}
  try {
    // AudioHelper.create is Foundry v14's supported Sound factory. Playback
    // starts from the player's actual click, complying with browser audio policy.
    const audio=game.audio;
    if(!audio?.create)throw new Error("Foundry audio is unavailable");
    if(audio.globalMute)throw new Error("Foundry global audio mute is enabled");
    const sound=audio.create({src,context:audio.music,singleton:false});
    await sound.play({loop:true,volume:getClientVolume(),fade:250});
    if(revision!==playbackRevision){await sound.stop();return false;}
    ambientSound=sound;
    starting=false;
    confirmedPlaying=true;
    if(sound.failed)throw new Error("The configured audio could not be loaded");
    return true;
  } catch(error) {
    if(revision!==playbackRevision)return false;
    ambientSound=null;
    starting=false;
    confirmedPlaying=false;
    lastAudioError=error?.message || String(error);
    console.error("Averis Landing | Ambient audio failed:",error);
    ui.notifications?.error(`Averis music could not start: ${lastAudioError}`);
    return false;
  }
}
export async function playCinematicMusic() {
  const cfg=campaign();
  const src=safeAsset(cfg.cinematicMusic);
  if(!src)return;
  await stopCinematicMusic();
  try {
    cinematicSound=game.audio.create({src,context:game.audio.music,singleton:false});
    await cinematicSound.play({loop:false,volume:getClientVolume(),fade:250});
  } catch(error){console.warn("Averis Landing | Cinematic audio failed:",error);ui.notifications?.warn("Averis: Cinematic audio could not be played.");}
}
export async function stopCinematicMusic(){
  const prior=cinematicSound;
  cinematicSound=null;
  if(prior)try{await prior.stop({fade:200});}catch(_){}
}
