import {MODULE_ID,SETTINGS,DEFAULT_CAMPAIGN} from "./data.mjs";
import {openLanding,closeLanding,renderLanding,installLauncher,refreshLauncher,receiveSocket,setEditorHandler,landingIsOpen} from "./landing.mjs";
import {openEditor} from "./editor.mjs";

Hooks.once("init",()=>{
  game.settings.register(MODULE_ID,SETTINGS.campaign,{
    name:"Campaign Content",scope:"world",config:false,type:Object,default:structuredClone(DEFAULT_CAMPAIGN)
  });
  game.settings.register(MODULE_ID,SETTINGS.sessionOpen,{
    name:"Landing Session Open",scope:"world",config:false,type:Boolean,default:true
  });
  game.settings.register(MODULE_ID,SETTINGS.openOnJoin,{
    name:"AVERIS_LANDING.OpenOnJoin",hint:"AVERIS_LANDING.OpenOnJoinHint",
    scope:"world",config:true,type:Boolean,default:true
  });
  game.settings.register(MODULE_ID,SETTINGS.showLauncher,{
    name:"AVERIS_LANDING.ShowLauncher",hint:"AVERIS_LANDING.ShowLauncherHint",
    scope:"world",config:true,type:Boolean,default:true
  });
});

Hooks.once("ready",()=>{
  setEditorHandler(openEditor);
  game.socket.on(`module.${MODULE_ID}`,receiveSocket);
  installLauncher();
  const module=game.modules.get(MODULE_ID);
  if(module) module.api=Object.freeze({
    open:openLanding,close:closeLanding,editor:openEditor,
    show:async()=>{
      if(!game.user.isGM)return;
      await game.settings.set(MODULE_ID,SETTINGS.sessionOpen,true);
      game.socket.emit(`module.${MODULE_ID}`,{type:"show",gmId:game.user.id});
    }
  });
  if(game.settings.get(MODULE_ID,SETTINGS.openOnJoin) && game.settings.get(MODULE_ID,SETTINGS.sessionOpen)) {
    setTimeout(()=>openLanding("home"),450);
  }
  console.info("Averis Landing | 0.1.0 initialized for Foundry VTT v14");
});

Hooks.on("updateSetting",(setting)=>{
  if(!game.ready || !setting?.key?.startsWith(`${MODULE_ID}.`))return;
  const key=setting.key.substring(MODULE_ID.length+1);
  if(key===SETTINGS.campaign && landingIsOpen())renderLanding();
  if(key===SETTINGS.showLauncher)refreshLauncher();
  if(key===SETTINGS.sessionOpen && game.settings.get(MODULE_ID,SETTINGS.sessionOpen) && game.settings.get(MODULE_ID,SETTINGS.openOnJoin) && !landingIsOpen())openLanding("home");
});
