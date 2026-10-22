export const MODULE_ID = "averis-landing";
export const SETTINGS = { campaign: "campaign", sessionOpen: "sessionOpen", openOnJoin: "openOnJoin", showLauncher: "showLauncher" };

// These are editable campaign starting points, not authoritative world geography.
export const DEFAULT_CAMPAIGN = {
  title: "AVERIS",
  subtitle: "Chronicles of the Fractured Barriers",
  worldYear: "1024",
  worldDay: "18",
  worldMonth: "02",
  introduction: "Four barriers guard the realms. Across Averis, forgotten guardians and ancient secrets are beginning to awaken.",
  backgroundImage: "",
  mapImage: "",
  chapterTitle: "The Story Continues",
  chapterSubtitle: "Previously on Averis...",
  landingMusic: "",
  cinematicMusic: "",
  volume: 0.30,
  cinematicSeconds: 5,
  targetSceneId: "",
  particles: true,
  characters: [
    {id:"char-rashira",name:"Rashira",subtitle:"Sorcerer · House Krat",portrait:"",description:"",actorId:"",visible:true,dead:false},
    {id:"char-alyona",name:"Alyona",subtitle:"Adventurer",portrait:"",description:"",actorId:"",visible:true,dead:false},
    {id:"char-noctis",name:"Noctis",subtitle:"Adventurer",portrait:"",description:"",actorId:"",visible:true,dead:false},
    {id:"char-heinrich",name:"Heinrich",subtitle:"Adventurer",portrait:"",description:"",actorId:"",visible:true,dead:false},
    {id:"char-sindy",name:"Sindy",subtitle:"Half-Dragon",portrait:"",description:"",actorId:"",visible:true,dead:false},
    {id:"char-dimir",name:"Dimir",subtitle:"Paladin",portrait:"",description:"",actorId:"",visible:true,dead:false},
    {id:"char-sunless",name:"Sunless",subtitle:"Adventurer",portrait:"",description:"",actorId:"",visible:true,dead:false},
    {id:"char-yuma",name:"Yuma",subtitle:"Adventurer",portrait:"",description:"",actorId:"",visible:true,dead:false},
    {id:"char-yuki",name:"Yuki",subtitle:"Adventurer",portrait:"",description:"",actorId:"",visible:true,dead:false}
  ],
  quests: [
    {id:"q-barrier",title:"The Broken Barrier",category:"Main",status:"Active",progress:80,description:"Uncover the secret of the barriers and Yggsadril.",journalUuid:"",visible:true},
    {id:"q-war",title:"War of North and South",category:"Main",status:"Active",progress:60,description:"Follow the growing conflict and Radev's leads.",journalUuid:"",visible:true},
    {id:"q-soldier",title:"The Missing Soldier",category:"Side",status:"Active",progress:40,description:"Investigate the missing soldier.",journalUuid:"",visible:true},
    {id:"q-ash",title:"The Ash Devourer",category:"Side",status:"On Hold",progress:20,description:"An ominous rumor still unanswered.",journalUuid:"",visible:true},
    {id:"q-krat",title:"Legacy of House Krat",category:"Character",status:"Active",progress:0,description:"Explore the mysteries surrounding Rashira's family.",journalUuid:"",visible:true}
  ],
  recaps: [
    {id:"recap-22",session:"22",title:"A Road to the Cave",date:"",summary:"The party traveled toward the cave, rescued Bori, encountered Black Iron, and faced two Fire Elementals. Visions and messages hinted at greater conflicts ahead.",visible:true}
  ],
  locations: []
};

export const ENTRY_TYPES = {
  characters: {
    singular: "Character", titleField: "name",
    fields: [
      {name:"name",label:"Character Name",kind:"text",required:true},
      {name:"subtitle",label:"Class / Subtitle",kind:"text"},
      {name:"portrait",label:"Portrait (image path)",kind:"image"},
      {name:"actorId",label:"Foundry Actor ID (optional)",kind:"text"},
      {name:"description",label:"Public Description",kind:"textarea"},
      {name:"visible",label:"Visible to players",kind:"checkbox"},
      {name:"dead",label:"Fallen / move to Dead panel",kind:"checkbox"}
    ]
  },
  quests: {
    singular: "Quest", titleField: "title",
    fields: [
      {name:"title",label:"Quest Title",kind:"text",required:true},
      {name:"category",label:"Category",kind:"select",values:["Main","Side","Character"]},
      {name:"status",label:"Status",kind:"select",values:["Active","On Hold","Completed","Failed"]},
      {name:"progress",label:"Progress (%)",kind:"number",min:0,max:100},
      {name:"description",label:"Public Description",kind:"textarea"},
      {name:"journalUuid",label:"Journal UUID (optional)",kind:"text"},
      {name:"visible",label:"Visible to players",kind:"checkbox"}
    ]
  },
  recaps: {
    singular: "Session Recap", titleField: "title",
    fields: [
      {name:"session",label:"Session Number",kind:"text",required:true},
      {name:"title",label:"Title",kind:"text",required:true},
      {name:"date",label:"In-game or Real Date",kind:"text"},
      {name:"summary",label:"Summary",kind:"textarea"},
      {name:"visible",label:"Visible to players",kind:"checkbox"}
    ]
  },
  locations: {
    singular: "Map Location", titleField: "name",
    fields: [
      {name:"name",label:"Location Name",kind:"text",required:true},
      {name:"description",label:"Public Description",kind:"textarea"},
      {name:"x",label:"Map X (%)",kind:"number",min:0,max:100},
      {name:"y",label:"Map Y (%)",kind:"number",min:0,max:100},
      {name:"sceneId",label:"Foundry Scene ID (optional)",kind:"text"},
      {name:"discovered",label:"Discovered by players",kind:"checkbox"}
    ]
  }
};

export function campaign() {
  const saved = game.settings.get(MODULE_ID, SETTINGS.campaign);
  // Add future fields without dropping existing custom data.
  const seed = structuredClone(DEFAULT_CAMPAIGN);
  return {...seed, ...(saved ?? {}), ...Object.fromEntries(["characters","quests","recaps","locations"].map(k => [k, Array.isArray(saved?.[k]) ? saved[k] : seed[k]]))};
}
export async function saveCampaign(updated) {
  if (!game.user.isGM) throw new Error("GM permission is required to edit the landing page.");
  await game.settings.set(MODULE_ID, SETTINGS.campaign, structuredClone(updated));
}
export function publicEntries(items) {
  return (items ?? []).filter(entry => game.user.isGM || entry.visible !== false && entry.discovered !== false);
}
export function newId() {
  return globalThis.crypto?.randomUUID?.() || `av-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
