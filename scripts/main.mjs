import {MODULE_ID,SETTINGS,DEFAULT_CAMPAIGN,campaign} from "./data.mjs";
import {openLanding,closeLanding,renderLanding,installLauncher,refreshLauncher,receiveSocket,setEditorHandler,landingIsOpen,mountSceneOverlay} from "./landing.mjs";
import {openEditor} from "./editor.mjs";
import {ensureLandingScene,syncLandingBackground,viewLandingScene,viewingLandingScene} from "./scene.mjs";

Hooks.once("init",()=>{
  game.settings.register(MODULE_ID,SETTINGS.campaign,{
    name:"Campaign Content",scope:"world",config:false,type:Object,default:structuredClone(DEFAULT_CAMPAIGN)
  });
  game.settings.register(MODULE_ID,SETTINGS.sessionOpen,{
    name:"Landing Session Open",scope:"world",config:false,type:Boolean,default:true
  });
  game.settings.register(MODULE_ID,SETTINGS.clientVolume,{name:"Landing Music Volume",scope:"client",config:false,type:Number,default:0.35});
  game.settings.register(MODULE_ID,SETTINGS.openOnJoin,{
    name:"Open active Averis scene on join",hint:"Open the real Foundry Landing Scene when it is active. Does not create a modal window.",
    scope:"world",config:true,type:Boolean,default:true
  });
  game.settings.register(MODULE_ID,SETTINGS.showLauncher,{
    name:"Show quick scene launcher",hint:"Optional shortcut to view the Averis Scene. The real Scene also appears in scene navigation.",
    scope:"world",config:true,type:Boolean,default:false
  });
});

Hooks.once("ready",async()=>{
  setEditorHandler(openEditor);
  game.socket.on(`module.${MODULE_ID}`,receiveSocket);
  installLauncher();
  const module=game.modules.get(MODULE_ID);
  if(module) module.api=Object.freeze({
    open:openLanding,close:closeLanding,editor:openEditor,
    ensureScene:ensureLandingScene,
    show:()=>viewLandingScene({activate:true})
  });
  if(game.user.isGM) {
    try { await ensureLandingScene(); await syncLandingBackground(campaign().backgroundImage); }
    catch(error){console.error("Averis Landing | Could not create scene",error);ui.notifications?.error("Averis: Could not create the Landing Scene. Check the console.");}
  }
  if(viewingLandingScene()) mountSceneOverlay();
  else if(game.settings.get(MODULE_ID,SETTINGS.openOnJoin) &&
          game.settings.get(MODULE_ID,SETTINGS.sessionOpen) &&
          game.scenes?.active?.getFlag?.(MODULE_ID,"landingScene")) {
    void openLanding();
  }
  console.info("Averis Landing | 0.4.0 world tree edition initialized for Foundry VTT v14");
});

Hooks.on("canvasReady",()=>mountSceneOverlay());
Hooks.on("canvasTearDown",()=>void closeLanding());
Hooks.on("updateSetting",setting=>{
  if(!game.ready || !setting?.key?.startsWith(`${MODULE_ID}.`))return;
  const key=setting.key.substring(MODULE_ID.length+1);
  if(key===SETTINGS.campaign && landingIsOpen())renderLanding();
  if(key===SETTINGS.showLauncher)refreshLauncher();
});
Hooks.on("updateActor",()=>{if(landingIsOpen())renderLanding();});
