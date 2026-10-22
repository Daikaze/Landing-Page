import {MODULE_ID} from "./data.mjs";

const LANDING_FLAG = "landingScene";
const BACKGROUND = `modules/${MODULE_ID}/assets/landing-board.svg`;
let creatingScene = null;

export function landingScene() {
  return game.scenes?.contents?.find(scene => scene.getFlag?.(MODULE_ID, LANDING_FLAG) === true) ?? null;
}

export function viewingLandingScene() {
  const scene = globalThis.canvas?.scene;
  return Boolean(scene && scene.getFlag?.(MODULE_ID, LANDING_FLAG) === true);
}

// Create a real Foundry Scene, never a popup pretending to be a scene.
export async function ensureLandingScene() {
  const existing = landingScene();
  if (existing) return existing;
  if (!game.user?.isGM) return null;
  if (creatingScene) return creatingScene;
  creatingScene = (async () => {
    // Check again after an await: ready hooks and GM clients may both request this.
    const sceneClass = globalThis.CONFIG?.Scene?.documentClass ?? game.scenes?.documentClass ?? globalThis.Scene;
    if(!sceneClass?.create)throw new Error("Foundry Scene document class was not available.");
    const levelId=foundry.utils?.randomID?.() ?? "AVERISLANDING001";
    const scene = await sceneClass.create({
      name: "Averis Landing",
      navigation: true,
      navName: "Averis",
      width: 1920,
      height: 1080,
      padding: 0,
      grid: {type: 0, size: 100},
      tokenVision: false,
      backgroundColor: "#21160c",
      levels: [{_id:levelId,name:"Landing",background:{src:BACKGROUND},elevation:{bottom:0,top:10}}],
      initialLevel: levelId,
      ownership: {default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER},
      flags: {[MODULE_ID]: {[LANDING_FLAG]: true}}
    });
    return scene;
  })().finally(() => { creatingScene = null; });
  return creatingScene;
}

export async function viewLandingScene({activate = false} = {}) {
  const scene = landingScene() ?? await ensureLandingScene();
  if (!scene) {
    ui.notifications?.warn("Averis: The GM needs to initialize the Landing Scene first.");
    return null;
  }
  if (activate) {
    if (!game.user?.isGM) return null;
    await scene.activate({pullUsers: true});
  } else await scene.view();
  return scene;
}
