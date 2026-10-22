import {campaign} from "./data.mjs";
import {safeAsset, clamp} from "./utils.mjs";

let ambientSound = null;
let cinematicSound = null;
let isPlaying = false;
export function audioPlaying() { return isPlaying; }
export async function stopAmbient() {
  const old = ambientSound;
  ambientSound = null;
  isPlaying = false;
  if (old) try { await old.stop(); } catch (error) { console.warn("Averis Landing | Audio stop:", error); }
}
export async function startAmbient() {
  const settings = campaign();
  const src = safeAsset(settings.landingMusic);
  if (!src) { ui.notifications?.info("Averis Landing: Set a background music file in GM Editor first."); return false; }
  if (isPlaying) return true;
  try {
    const sound = game.audio.create({src, context:game.audio.music, singleton:false});
    ambientSound = sound;
    await sound.play({loop:true, volume:clamp(settings.volume,0,1), fade:500});
    isPlaying = true;
    return true;
  } catch (error) {
    console.error("Averis Landing | Ambient audio error:", error);
    ambientSound = null;
    isPlaying = false;
    ui.notifications?.warn("Averis Landing: Could not play that music file.");
    return false;
  }
}
export async function playCinematicMusic() {
  const settings = campaign();
  const src = safeAsset(settings.cinematicMusic);
  if (!src) return;
  try {
    await stopCinematicMusic();
    cinematicSound = game.audio.create({src, context:game.audio.music, singleton:false});
    await cinematicSound.play({loop:false, volume:clamp(settings.volume,0,1), fade:250});
  } catch (error) { console.warn("Averis Landing | Cinematic audio failed:", error); }
}
export async function stopCinematicMusic() {
  const prior = cinematicSound;
  cinematicSound = null;
  if (prior) try { await prior.stop(); } catch (_) { /* already ended */ }
}
